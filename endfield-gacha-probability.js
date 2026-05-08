const EndfieldGachaProbability = (function () {
  const defaultRules = Object.freeze({
    sixStarBaseRate: 0.008,
    fiveStarBaseRate: 0.08,
    featuredShareWhenSixStar: 0.5,
    sixStarHardPity: 80,
    sixStarSoftPityMisses: 65,
    sixStarSoftPityIncrease: 0.05,
    fiveStarOrAboveHardPity: 10,
    featuredGuaranteePulls: 120,
    emergencyRecruitmentTriggerPulls: 30,
    emergencyRecruitmentPulls: 10,
    featuredTokenMilestonePulls: 240,
    guaranteeQuotaPerPull: 25,
    repeatedFiveStarQuota: 10,
    offRateSixStarExpectedQuota: 36,
    repeatedFeaturedSixStarQuota: 50,
  });

  const stateBases = Object.freeze({
    paidLeft: 2048,
    countedPulls: 2048,
    sixPity: 128,
    fivePity: 16,
    quota: 32,
    upSources: 16,
    flag: 2,
  });

  const freeOutcomeCache = new Map();

  function getSixStarRate(sixPity, rules) {
    if (sixPity >= rules.sixStarHardPity - 1) {
      return 1;
    }
    if (sixPity >= rules.sixStarSoftPityMisses) {
      return Math.min(1, rules.sixStarBaseRate + (sixPity - rules.sixStarSoftPityMisses + 1) * rules.sixStarSoftPityIncrease);
    }
    return rules.sixStarBaseRate;
  }

  function clampInteger(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return min;
    }
    return Math.min(max, Math.max(min, Math.floor(number)));
  }

  function packState(state) {
    let key = state.paidLeft;
    key = key * stateBases.countedPulls + state.countedPulls;
    key = key * stateBases.sixPity + state.sixPity;
    key = key * stateBases.fivePity + state.fivePity;
    key = key * stateBases.quota + state.quota;
    key = key * stateBases.upSources + state.upSources;
    key = key * stateBases.flag + (state.hasTargetBody ? 1 : 0);
    key = key * stateBases.flag + (state.featuredGuaranteeUsed ? 1 : 0);
    key = key * stateBases.flag + (state.emergencyRecruitmentAwarded ? 1 : 0);
    key = key * stateBases.flag + (state.emergencyRecruitmentUsed ? 1 : 0);
    return key;
  }

  function unpackState(key) {
    let value = key;
    const emergencyRecruitmentUsed = value % stateBases.flag === 1;
    value = Math.floor(value / stateBases.flag);
    const emergencyRecruitmentAwarded = value % stateBases.flag === 1;
    value = Math.floor(value / stateBases.flag);
    const featuredGuaranteeUsed = value % stateBases.flag === 1;
    value = Math.floor(value / stateBases.flag);
    const hasTargetBody = value % stateBases.flag === 1;
    value = Math.floor(value / stateBases.flag);
    const upSources = value % stateBases.upSources;
    value = Math.floor(value / stateBases.upSources);
    const quota = value % stateBases.quota;
    value = Math.floor(value / stateBases.quota);
    const fivePity = value % stateBases.fivePity;
    value = Math.floor(value / stateBases.fivePity);
    const sixPity = value % stateBases.sixPity;
    value = Math.floor(value / stateBases.sixPity);
    const countedPulls = value % stateBases.countedPulls;
    value = Math.floor(value / stateBases.countedPulls);
    const paidLeft = value;
    return {
      paidLeft,
      countedPulls,
      sixPity,
      fivePity,
      quota,
      upSources,
      hasTargetBody,
      featuredGuaranteeUsed,
      emergencyRecruitmentAwarded,
      emergencyRecruitmentUsed,
    };
  }

  function addQuotaPulls(paidLeft, quota, quotaGain, rules) {
    const nextQuota = quota + quotaGain;
    return {
      paidLeft: paidLeft + Math.floor(nextQuota / rules.guaranteeQuotaPerPull),
      quota: nextQuota % rules.guaranteeQuotaPerPull,
    };
  }

  function addProbability(map, state, probability, minimumProbability) {
    if (probability <= minimumProbability) {
      return;
    }
    const key = packState(state);
    map.set(key, (map.get(key) || 0) + probability);
  }

  function buildEmergencyRecruitmentOutcomes(hasTargetBody, targetSourcesNeeded, rules) {
    const cacheKey = `${hasTargetBody ? 1 : 0}:${targetSourcesNeeded}`;
    if (freeOutcomeCache.has(cacheKey)) {
      return freeOutcomeCache.get(cacheKey);
    }

    let states = new Map();
    states.set(JSON.stringify({ fivePity: 0, upSources: 0, hasTargetBody, quota: 0 }), 1);

    for (let pullIndex = 0; pullIndex < rules.emergencyRecruitmentPulls; pullIndex += 1) {
      const nextStates = new Map();
      states.forEach((probability, rawState) => {
        const state = JSON.parse(rawState);
        const sixStarRate = rules.sixStarBaseRate;
        const fiveStarRate = state.fivePity >= rules.fiveStarOrAboveHardPity - 1 ? 1 - sixStarRate : rules.fiveStarBaseRate;
        const fourStarRate = Math.max(0, 1 - sixStarRate - fiveStarRate);
        const featuredSixStarRate = sixStarRate * rules.featuredShareWhenSixStar;
        const offRateSixStarRate = sixStarRate - featuredSixStarRate;

        const addRaw = (nextState, chance) => {
          if (chance <= 0) {
            return;
          }
          const key = JSON.stringify(nextState);
          nextStates.set(key, (nextStates.get(key) || 0) + probability * chance);
        };

        addRaw(
          {
            fivePity: 0,
            upSources: Math.min(targetSourcesNeeded, state.upSources + 1),
            hasTargetBody: true,
            quota: state.quota + (state.hasTargetBody ? rules.repeatedFeaturedSixStarQuota : 0),
          },
          featuredSixStarRate,
        );
        addRaw(
          {
            fivePity: 0,
            upSources: state.upSources,
            hasTargetBody: state.hasTargetBody,
            quota: state.quota + rules.offRateSixStarExpectedQuota,
          },
          offRateSixStarRate,
        );
        addRaw(
          {
            fivePity: 0,
            upSources: state.upSources,
            hasTargetBody: state.hasTargetBody,
            quota: state.quota + rules.repeatedFiveStarQuota,
          },
          fiveStarRate,
        );
        addRaw(
          {
            fivePity: Math.min(rules.fiveStarOrAboveHardPity - 1, state.fivePity + 1),
            upSources: state.upSources,
            hasTargetBody: state.hasTargetBody,
            quota: state.quota,
          },
          fourStarRate,
        );
      });
      states = nextStates;
    }

    const mergedOutcomes = new Map();
    states.forEach((probability, rawState) => {
      const state = JSON.parse(rawState);
      const key = JSON.stringify({
        upSources: state.upSources,
        hasTargetBody: state.hasTargetBody,
        quota: state.quota,
      });
      mergedOutcomes.set(key, (mergedOutcomes.get(key) || 0) + probability);
    });

    const outcomes = Array.from(mergedOutcomes, ([rawState, probability]) => ({
      ...JSON.parse(rawState),
      probability,
    }));
    freeOutcomeCache.set(cacheKey, outcomes);
    return outcomes;
  }

  function calculateTargetPotentialProbability(options = {}) {
    const rules = { ...defaultRules, ...(options.rules || {}) };
    const targetPotential = clampInteger(options.targetPotential ?? 0, 0, 5);
    const targetSourcesNeeded = targetPotential + 1;
    const initialOwnedSources = clampInteger(options.ownedTargetSources ?? 0, 0, targetSourcesNeeded);
    const initialCountedPulls = clampInteger(options.initialCountedPulls ?? 0, 0, stateBases.countedPulls - 1);
    const initialPaidLeft = clampInteger(options.pulls ?? 0, 0, stateBases.paidLeft - 1);
    const minimumProbability = Number.isFinite(options.minimumProbability) ? Math.max(0, options.minimumProbability) : 1e-12;
    const maxIterations = clampInteger(options.maxIterations ?? 4096, 1, 10000);

    let states = new Map();
    addProbability(
      states,
      {
        paidLeft: initialPaidLeft,
        countedPulls: initialCountedPulls,
        sixPity: clampInteger(options.sixPity ?? 0, 0, rules.sixStarHardPity - 1),
        fivePity: clampInteger(options.fivePity ?? 0, 0, rules.fiveStarOrAboveHardPity - 1),
        quota: clampInteger(options.guaranteeQuota ?? 0, 0, rules.guaranteeQuotaPerPull - 1),
        upSources: initialOwnedSources,
        hasTargetBody: Boolean(options.hasTargetBody ?? initialOwnedSources > 0),
        featuredGuaranteeUsed: Boolean(options.featuredGuaranteeUsed ?? initialOwnedSources > 0),
        emergencyRecruitmentAwarded: Boolean(options.emergencyRecruitmentAwarded ?? initialCountedPulls >= rules.emergencyRecruitmentTriggerPulls),
        emergencyRecruitmentUsed: Boolean(options.emergencyRecruitmentUsed ?? false),
      },
      1,
      minimumProbability,
    );

    let successProbability = 0;
    let failureProbability = 0;
    let expectedCountedPulls = 0;
    let expectedEmergencyPulls = 0;
    let expectedActualPulls = 0;
    let maxStateCount = states.size;
    let iterations = 0;

    while (states.size > 0 && iterations < maxIterations) {
      const nextStates = new Map();

      states.forEach((stateProbability, stateKey) => {
        const state = unpackState(stateKey);

        if (state.paidLeft <= 0) {
          if (state.emergencyRecruitmentAwarded && !state.emergencyRecruitmentUsed) {
            const outcomes = buildEmergencyRecruitmentOutcomes(state.hasTargetBody, targetSourcesNeeded, rules);
            expectedEmergencyPulls += stateProbability * rules.emergencyRecruitmentPulls;
            expectedActualPulls += stateProbability * rules.emergencyRecruitmentPulls;
            outcomes.forEach((outcome) => {
              const quotaResult = addQuotaPulls(0, state.quota, outcome.quota, rules);
              addProbability(
                nextStates,
                {
                  ...state,
                  paidLeft: quotaResult.paidLeft,
                  quota: quotaResult.quota,
                  upSources: Math.min(targetSourcesNeeded, state.upSources + outcome.upSources),
                  hasTargetBody: outcome.hasTargetBody,
                  emergencyRecruitmentUsed: true,
                },
                stateProbability * outcome.probability,
                minimumProbability,
              );
            });
            return;
          }

          if (state.hasTargetBody && state.upSources >= targetSourcesNeeded) {
            successProbability += stateProbability;
          } else {
            failureProbability += stateProbability;
          }
          return;
        }

        const nextCountedPulls = state.countedPulls + 1;
        const tokenGain =
          Math.floor(nextCountedPulls / rules.featuredTokenMilestonePulls) -
          Math.floor(state.countedPulls / rules.featuredTokenMilestonePulls);
        const baseUpSources = Math.min(targetSourcesNeeded, state.upSources + tokenGain);
        const basePaidLeft = state.paidLeft - 1;
        const emergencyRecruitmentAwarded =
          state.emergencyRecruitmentAwarded ||
          (state.countedPulls < rules.emergencyRecruitmentTriggerPulls && nextCountedPulls >= rules.emergencyRecruitmentTriggerPulls);

        expectedCountedPulls += stateProbability;
        expectedActualPulls += stateProbability;

        const emitCountedState = (paidLeft, sixPity, fivePity, quota, upSources, hasTargetBody, featuredGuaranteeUsed, probability) => {
          addProbability(
            nextStates,
            {
              paidLeft,
              countedPulls: nextCountedPulls,
              sixPity,
              fivePity,
              quota,
              upSources,
              hasTargetBody,
              featuredGuaranteeUsed,
              emergencyRecruitmentAwarded,
              emergencyRecruitmentUsed: state.emergencyRecruitmentUsed,
            },
            probability,
            minimumProbability,
          );
        };

        const forceFeatured = !state.featuredGuaranteeUsed && nextCountedPulls >= rules.featuredGuaranteePulls;
        if (forceFeatured) {
          const quotaGain = state.hasTargetBody ? rules.repeatedFeaturedSixStarQuota : 0;
          const quotaResult = addQuotaPulls(basePaidLeft, state.quota, quotaGain, rules);
          emitCountedState(
            quotaResult.paidLeft,
            0,
            0,
            quotaResult.quota,
            Math.min(targetSourcesNeeded, baseUpSources + 1),
            true,
            true,
            stateProbability,
          );
          return;
        }

        const sixStarRate = getSixStarRate(state.sixPity, rules);
        const fiveStarRate = state.fivePity >= rules.fiveStarOrAboveHardPity - 1 ? 1 - sixStarRate : rules.fiveStarBaseRate;
        const fourStarRate = Math.max(0, 1 - sixStarRate - fiveStarRate);
        const featuredSixStarRate = sixStarRate * rules.featuredShareWhenSixStar;
        const offRateSixStarRate = sixStarRate - featuredSixStarRate;

        const featuredQuotaGain = state.hasTargetBody ? rules.repeatedFeaturedSixStarQuota : 0;
        const featuredQuotaResult = addQuotaPulls(basePaidLeft, state.quota, featuredQuotaGain, rules);
        emitCountedState(
          featuredQuotaResult.paidLeft,
          0,
          0,
          featuredQuotaResult.quota,
          Math.min(targetSourcesNeeded, baseUpSources + 1),
          true,
          true,
          stateProbability * featuredSixStarRate,
        );

        const offRateQuotaResult = addQuotaPulls(basePaidLeft, state.quota, rules.offRateSixStarExpectedQuota, rules);
        emitCountedState(
          offRateQuotaResult.paidLeft,
          0,
          0,
          offRateQuotaResult.quota,
          baseUpSources,
          state.hasTargetBody,
          state.featuredGuaranteeUsed,
          stateProbability * offRateSixStarRate,
        );

        const fiveStarQuotaResult = addQuotaPulls(basePaidLeft, state.quota, rules.repeatedFiveStarQuota, rules);
        emitCountedState(
          fiveStarQuotaResult.paidLeft,
          Math.min(rules.sixStarHardPity - 1, state.sixPity + 1),
          0,
          fiveStarQuotaResult.quota,
          baseUpSources,
          state.hasTargetBody,
          state.featuredGuaranteeUsed,
          stateProbability * fiveStarRate,
        );

        emitCountedState(
          basePaidLeft,
          Math.min(rules.sixStarHardPity - 1, state.sixPity + 1),
          Math.min(rules.fiveStarOrAboveHardPity - 1, state.fivePity + 1),
          state.quota,
          baseUpSources,
          state.hasTargetBody,
          state.featuredGuaranteeUsed,
          stateProbability * fourStarRate,
        );
      });

      states = nextStates;
      maxStateCount = Math.max(maxStateCount, states.size);
      iterations += 1;
    }

    const unresolvedProbability = Array.from(states.values()).reduce((total, probability) => total + probability, 0);
    const resolvedProbability = successProbability + failureProbability;
    const normalizedSuccessProbability = resolvedProbability > 0 ? successProbability / resolvedProbability : 0;

    return {
      successProbability: normalizedSuccessProbability,
      rawSuccessProbability: successProbability,
      failureProbability,
      unresolvedProbability,
      expectedActualPulls,
      expectedCountedPulls,
      expectedEmergencyPulls,
      expectedConvertedPulls: expectedCountedPulls - initialPaidLeft,
      iterations,
      maxStateCount,
      targetSourcesNeeded,
    };
  }

  function calculateTargetPotentialProbabilityFast(options = {}) {
    const rules = { ...defaultRules, ...(options.rules || {}) };
    const targetPotential = clampInteger(options.targetPotential ?? 0, 0, 5);
    const targetSourcesNeeded = targetPotential + 1;
    const pulls = clampInteger(options.pulls ?? 0, 0, 1000);
    const initialOwnedSources = clampInteger(options.ownedTargetSources ?? 0, 0, targetSourcesNeeded);
    const initialSixPity = clampInteger(options.sixPity ?? 0, 0, rules.sixStarHardPity - 1);
    const pitySize = rules.sixStarHardPity;
    const sourceSize = targetSourcesNeeded + 1;
    const flagSize = 2;
    const stateCount = sourceSize * pitySize * flagSize;
    const indexOf = (sources, sixPity, hasTargetBody) => ((sources * pitySize + sixPity) * flagSize + (hasTargetBody ? 1 : 0));

    let states = new Float64Array(stateCount);
    states[indexOf(initialOwnedSources, initialSixPity, initialOwnedSources > 0)] = 1;

    for (let pullIndex = 1; pullIndex <= pulls; pullIndex += 1) {
      const nextStates = new Float64Array(stateCount);
      const tokenGain = pullIndex % rules.featuredTokenMilestonePulls === 0 ? 1 : 0;

      for (let sources = 0; sources <= targetSourcesNeeded; sources += 1) {
        for (let sixPity = 0; sixPity < pitySize; sixPity += 1) {
          for (let hasTargetBody = 0; hasTargetBody <= 1; hasTargetBody += 1) {
            const probability = states[indexOf(sources, sixPity, hasTargetBody)];
            if (probability === 0) {
              continue;
            }

            const baseSources = Math.min(targetSourcesNeeded, sources + tokenGain);
            const forceFeatured = hasTargetBody === 0 && pullIndex >= rules.featuredGuaranteePulls;

            if (forceFeatured) {
              nextStates[indexOf(Math.min(targetSourcesNeeded, baseSources + 1), 0, 1)] += probability;
              continue;
            }

            const sixStarRate = getSixStarRate(sixPity, rules);
            const featuredRate = sixStarRate * rules.featuredShareWhenSixStar;
            const offRate = sixStarRate - featuredRate;
            const nonSixRate = Math.max(0, 1 - sixStarRate);
            const nextSixPity = Math.min(rules.sixStarHardPity - 1, sixPity + 1);

            nextStates[indexOf(Math.min(targetSourcesNeeded, baseSources + 1), 0, 1)] += probability * featuredRate;
            nextStates[indexOf(baseSources, 0, hasTargetBody === 1)] += probability * offRate;
            nextStates[indexOf(baseSources, nextSixPity, hasTargetBody === 1)] += probability * nonSixRate;
          }
        }
      }

      states = nextStates;
    }

    let successProbability = 0;
    for (let sixPity = 0; sixPity < pitySize; sixPity += 1) {
      successProbability += states[indexOf(targetSourcesNeeded, sixPity, false)];
      successProbability += states[indexOf(targetSourcesNeeded, sixPity, true)];
    }

    return {
      successProbability: Math.min(1, Math.max(0, successProbability)),
      rawSuccessProbability: successProbability,
      failureProbability: Math.max(0, 1 - successProbability),
      unresolvedProbability: 0,
      iterations: pulls,
      maxStateCount: stateCount,
      targetSourcesNeeded,
    };
  }

  function estimateEffectivePulls(options = {}) {
    const rules = { ...defaultRules, ...(options.rules || {}) };
    let pullBudget = clampInteger(options.pulls ?? 0, 0, 1000);
    let effectivePulls = 0;
    let countedPulls = clampInteger(options.initialCountedPulls ?? 0, 0, 1000);
    let quotaCredit = clampInteger(options.guaranteeQuota ?? 0, 0, rules.guaranteeQuotaPerPull - 1);
    let states = new Map();
    states.set(`${clampInteger(options.sixPity ?? 0, 0, rules.sixStarHardPity - 1)},${clampInteger(options.fivePity ?? 0, 0, rules.fiveStarOrAboveHardPity - 1)},${options.ownedTargetSources > 0 ? 1 : 0}`, 1);
    let emergencyRecruitmentAwarded = countedPulls >= rules.emergencyRecruitmentTriggerPulls;
    let emergencyRecruitmentUsed = false;

    const applyExpectedPull = (countsTowardGacha) => {
      const nextStates = new Map();
      let quotaGain = 0;

      states.forEach((stateProbability, stateKey) => {
        const [sixPity, fivePity, hasTargetBody] = stateKey.split(",").map(Number);
        const sixStarRate = countsTowardGacha ? getSixStarRate(sixPity, rules) : rules.sixStarBaseRate;
        const fiveStarRate = countsTowardGacha && fivePity >= rules.fiveStarOrAboveHardPity - 1 ? 1 - sixStarRate : rules.fiveStarBaseRate;
        const featuredRate = sixStarRate * rules.featuredShareWhenSixStar;
        const offRate = sixStarRate - featuredRate;
        const nonSixFiveRate = Math.max(0, 1 - sixStarRate - fiveStarRate);

        quotaGain +=
          stateProbability *
          (fiveStarRate * rules.repeatedFiveStarQuota +
            offRate * rules.offRateSixStarExpectedQuota +
            featuredRate * hasTargetBody * rules.repeatedFeaturedSixStarQuota);

        const addState = (nextSixPity, nextFivePity, nextHasTargetBody, probability) => {
          if (probability <= 0) {
            return;
          }
          const nextKey = `${nextSixPity},${nextFivePity},${nextHasTargetBody}`;
          nextStates.set(nextKey, (nextStates.get(nextKey) || 0) + stateProbability * probability);
        };

        if (!countsTowardGacha) {
          addState(sixPity, fivePity, 1, featuredRate);
          addState(sixPity, fivePity, hasTargetBody, offRate + fiveStarRate + nonSixFiveRate);
          return;
        }

        addState(0, 0, 1, featuredRate);
        addState(0, 0, hasTargetBody, offRate);
        addState(Math.min(rules.sixStarHardPity - 1, sixPity + 1), 0, hasTargetBody, fiveStarRate);
        addState(
          Math.min(rules.sixStarHardPity - 1, sixPity + 1),
          Math.min(rules.fiveStarOrAboveHardPity - 1, fivePity + 1),
          hasTargetBody,
          nonSixFiveRate,
        );
      });

      states = nextStates;
      quotaCredit += quotaGain;
      pullBudget += Math.floor(quotaCredit / rules.guaranteeQuotaPerPull);
      quotaCredit %= rules.guaranteeQuotaPerPull;

      if (countsTowardGacha) {
        countedPulls += 1;
        if (countedPulls >= rules.emergencyRecruitmentTriggerPulls) {
          emergencyRecruitmentAwarded = true;
        }
      }
    };

    while (effectivePulls < 1000 && (pullBudget > 0 || (emergencyRecruitmentAwarded && !emergencyRecruitmentUsed))) {
      if (pullBudget <= 0 && emergencyRecruitmentAwarded && !emergencyRecruitmentUsed) {
        emergencyRecruitmentUsed = true;
        for (let index = 0; index < rules.emergencyRecruitmentPulls && effectivePulls < 1000; index += 1) {
          effectivePulls += 1;
          applyExpectedPull(false);
        }
        continue;
      }

      pullBudget -= 1;
      effectivePulls += 1;
      applyExpectedPull(true);
    }

    return Math.min(1000, Math.max(0, effectivePulls));
  }

  function calculateRolledTargetPotentialProbability(options = {}) {
    const effectivePulls = estimateEffectivePulls(options);
    const result = calculateTargetPotentialProbabilityFast({
      ...options,
      pulls: effectivePulls,
    });
    return {
      ...result,
      inputPulls: clampInteger(options.pulls ?? 0, 0, 1000),
      effectivePulls,
    };
  }

  return Object.freeze({
    rules: defaultRules,
    calculateTargetPotentialProbability: calculateRolledTargetPotentialProbability,
    calculateTargetPotentialProbabilityFast,
    calculateRolledTargetPotentialProbability,
    estimateEffectivePulls,
    calculateTargetPotentialProbabilityDetailed: calculateTargetPotentialProbability,
  });
})();

if (typeof window !== "undefined") {
  window.EndfieldGachaProbability = EndfieldGachaProbability;
}

if (typeof self !== "undefined") {
  self.EndfieldGachaProbability = EndfieldGachaProbability;
}
