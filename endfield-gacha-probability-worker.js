importScripts("./endfield-gacha-probability.js?v=20260508-rolled-target-potential");

self.addEventListener("message", function (event) {
  const payload = event.data || {};
  if (payload.type !== "calculate-target-potential") {
    return;
  }

  try {
    const result = self.EndfieldGachaProbability.calculateTargetPotentialProbability({
      pulls: payload.pulls,
      targetPotential: payload.targetPotential,
      minimumProbability: 1e-8,
    });
    self.postMessage({
      type: "target-potential-result",
      requestId: payload.requestId,
      successProbability: result.successProbability,
    });
  } catch (error) {
    self.postMessage({
      type: "target-potential-error",
      requestId: payload.requestId,
    });
  }
});
