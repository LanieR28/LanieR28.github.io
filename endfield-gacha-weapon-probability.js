const EndfieldGachaWeaponProbability = (function () {
  const defaultRules = Object.freeze({
    sixStarRate: 0.04,
    upShareWhenSixStar: 0.25,
    // every sixStarPityAt consecutive non-6-star pulls → forced 6-star
    sixStarPityAt: 4,
    // UP pity: first at pull 8 in UP cycle, then every 16 pulls
    firstUpPityAt: 8,
    repeatUpPityEvery: 16,
  });

  function clampInteger(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, Math.floor(n)));
  }

  // State: (sinceLastSix, upCyclePull, isFirst, upsGot)
  //   sinceLastSix:  non-6-star pulls since last 6-star (0..sixStarPityAt-1)
  //   upCyclePull:   total pulls taken so far in current UP cycle (0..repeatUpPityEvery-1)
  //   isFirst:       whether this is the first UP cycle
  //   upsGot:        UP weapons obtained
  //
  // sinceLastSix >= sixStarPityAt-1  →  this pull is forced 6-star (UP pity wins if both fire)
  // upCyclePull  >= upThreshold      →  this pull is forced UP 6-star
  function calculateWeaponTargetPotentialProbability({ pulls, targetPotential, rules: customRules, minimumProbability }) {
    const rules = Object.assign({}, defaultRules, customRules || {});
    const minProb = minimumProbability != null ? minimumProbability : 1e-9;
    const target = clampInteger(targetPotential, 0, 5);
    const totalPulls = clampInteger(pulls, 0, 1000000);
    const need = target + 1;

    if (need <= 0) return { successProbability: 1 };
    if (totalPulls <= 0) return { successProbability: 0 };

    const upRate = rules.sixStarRate * rules.upShareWhenSixStar;
    const offRate = rules.sixStarRate - upRate;
    const missRate = 1 - rules.sixStarRate;
    const sixPityThreshold = rules.sixStarPityAt - 1;      // 3: at sinceLastSix==3, forced 6-star
    const firstUpThreshold = rules.firstUpPityAt - 1;      // 7: at upCyclePull==7, forced UP
    const repeatUpThreshold = rules.repeatUpPityEvery - 1; // 15

    const sinceBase = sixPityThreshold + 1;      // 4
    const upCycleBase = repeatUpThreshold + 1;   // 16
    const isFirstBase = 2;

    function encode(sinceLastSix, upCyclePull, isFirst, upsGot) {
      return sinceLastSix + upCyclePull * sinceBase + (isFirst ? 1 : 0) * sinceBase * upCycleBase + upsGot * sinceBase * upCycleBase * isFirstBase;
    }

    function addNext(map, prob, sinceLastSix, upCyclePull, isFirst, upsGot) {
      if (prob < minProb) return;
      const k = encode(sinceLastSix, upCyclePull, isFirst, upsGot);
      map.set(k, (map.get(k) || 0) + prob);
    }

    // Initial state: no pulls taken, first UP cycle
    let current = new Map([[encode(0, 0, true, 0), 1.0]]);
    let successProb = 0;

    for (let i = 0; i < totalPulls; i++) {
      const next = new Map();

      current.forEach(function (prob, key) {
        if (prob < minProb) return;

        const sinceLastSix = key % sinceBase;
        const rem1 = Math.floor(key / sinceBase);
        const upCyclePull = rem1 % upCycleBase;
        const rem2 = Math.floor(rem1 / upCycleBase);
        const isFirst = rem2 % isFirstBase === 1;
        const upsGot = Math.floor(rem2 / isFirstBase);

        const upThreshold = isFirst ? firstUpThreshold : repeatUpThreshold;
        const isUpForced = upCyclePull >= upThreshold;
        const isSixForced = sinceLastSix >= sixPityThreshold;

        if (isUpForced) {
          // Forced UP 6-star — occupies the 4-pull pity slot if also due
          const newUps = upsGot + 1;
          if (newUps >= need) {
            successProb += prob;
          } else {
            addNext(next, prob, 0, 0, false, newUps);
          }
        } else if (isSixForced) {
          // Forced 6-star from 4-pull pity; 25% UP
          const upP = rules.upShareWhenSixStar;
          const offP = 1 - upP;
          const newUps = upsGot + 1;
          if (newUps >= need) {
            successProb += prob * upP;
          } else {
            addNext(next, prob * upP, 0, 0, false, newUps);
          }
          // Off-rate: sinceLastSix resets, upCyclePull advances
          addNext(next, prob * offP, 0, upCyclePull + 1, isFirst, upsGot);
        } else {
          // Normal pull
          const newUps = upsGot + 1;
          if (newUps >= need) {
            successProb += prob * upRate;
          } else {
            addNext(next, prob * upRate, 0, 0, false, newUps);
          }
          addNext(next, prob * offRate, 0, upCyclePull + 1, isFirst, upsGot);
          addNext(next, prob * missRate, sinceLastSix + 1, upCyclePull + 1, isFirst, upsGot);
        }
      });

      current = next;
    }

    return { successProbability: Math.min(1, successProb) };
  }

  return { calculateWeaponTargetPotentialProbability };
})();
