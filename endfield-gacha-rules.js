const endfieldSpecialGachaRules = Object.freeze({
  scope: {
    appliesTo: "特许寻访",
    titlePattern: "xxx寻访",
    excludedExamples: ["辉光庆典"],
    isSingleFeaturedSixStar: true,
  },

  baseRates: {
    sixStar: 0.008,
    fiveStar: 0.08,
    fourStar: 0.912,
    featuredShareWhenSixStar: 0.5,
  },

  pity: {
    sixStarHardPity: 80,
    sixStarSoftPityStartsAfterMisses: 65,
    sixStarSoftPityIncreasePerPull: 0.05,
    sixStarPityCarriesAcrossSpecialGacha: true,
    fiveStarOrAboveHardPity: 10,
    fiveStarPityCarriesAcrossSpecialGacha: true,
  },

  featuredGuarantee: {
    hardGuaranteePulls: 120,
    effectiveOnlyOncePerGacha: true,
    carriesAcrossGacha: false,
    resetsWhenGachaCloses: true,
    consumesSixStarPity: true,
    resetsSixStarPityAfterTriggered: true,
  },

  milestoneRewards: {
    emergencyRecruitment: {
      triggerPaidPulls: 30,
      freePulls: 10,
      onlyDuringCurrentGacha: true,
      countsTowardSixStarPity: false,
      countsTowardFeaturedGuarantee: false,
      countsTowardMilestoneRewards: false,
      guaranteesFiveStarOrAboveInTenPull: true,
      ratesFollowCurrentSpecialGachaBaseRates: true,
    },
    searchIntelBook: {
      triggerPaidPulls: 60,
      convertsToSpecialPermitsOnNextSpecialGacha: 10,
      expiresAfterCorrespondingGachaEnds: true,
    },
    featuredSixStarToken: {
      triggerPaidPulls: 240,
      tokenCount: 1,
    },
  },

  guaranteeQuota: {
    quotaPerPull: 25,
    convertedPullsCountTowardAllPity: true,
    repeatedFiveStarQuota: 10,
    repeatedSixStarQuota: 50,
    defaultOffRateSixStarQuotaChance: 5 / 7,
    defaultOffRateSixStarExpectedQuota: 36,
  },
});

