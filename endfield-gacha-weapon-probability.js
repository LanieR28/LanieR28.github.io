const EndfieldGachaWeaponProbability = (function () {
  const defaultRules = Object.freeze({
    sixStarRate: 0.04,
    upShareWhenSixStar: 0.25,
    firstPityAt: 8,
    repeatPityEvery: 16,
  });

  function clampInteger(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, Math.floor(n)));
  }

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
    const firstThreshold = rules.firstPityAt - 1;
    const repeatThreshold = rules.repeatPityEvery - 1;

    // State encoding: sinceLastSix (0..repeatThreshold) + isFirst (0..1) * sinceBase + upsGot * sinceBase * 2
    const sinceBase = repeatThreshold + 1;

    function encode(sinceLastSix, isFirst, upsGot) {
      return sinceLastSix + (isFirst ? 1 : 0) * sinceBase + upsGot * sinceBase * 2;
    }

    let current = new Map([[encode(0, true, 0), 1.0]]);
    let successProb = 0;

    for (let i = 0; i < totalPulls; i++) {
      const next = new Map();

      current.forEach(function (prob, key) {
        if (prob < minProb) return;

        const sinceLastSix = key % sinceBase;
        const isFirst = Math.floor(key / sinceBase) % 2 === 1;
        const upsGot = Math.floor(key / (sinceBase * 2));
        const threshold = isFirst ? firstThreshold : repeatThreshold;

        if (sinceLastSix >= threshold) {
          // Guaranteed 6-star
          const newUps = upsGot + 1;
          if (newUps >= need) {
            successProb += prob * rules.upShareWhenSixStar;
          } else {
            const k = encode(0, false, newUps);
            next.set(k, (next.get(k) || 0) + prob * rules.upShareWhenSixStar);
          }
          const kOff = encode(0, false, upsGot);
          next.set(kOff, (next.get(kOff) || 0) + prob * (1 - rules.upShareWhenSixStar));
        } else {
          // UP 6-star
          const newUps = upsGot + 1;
          if (newUps >= need) {
            successProb += prob * upRate;
          } else {
            const k = encode(0, false, newUps);
            next.set(k, (next.get(k) || 0) + prob * upRate);
          }
          // Off-rate 6-star
          const kOff = encode(0, false, upsGot);
          next.set(kOff, (next.get(kOff) || 0) + prob * offRate);
          // Miss
          const kMiss = encode(sinceLastSix + 1, isFirst, upsGot);
          next.set(kMiss, (next.get(kMiss) || 0) + prob * missRate);
        }
      });

      current = next;
    }

    return { successProbability: Math.min(1, successProb) };
  }

  return { calculateWeaponTargetPotentialProbability };
})();
