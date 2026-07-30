import assert from "node:assert/strict";
import test from "node:test";

import {
  INVARIANT_PROTOCOLS,
  INSTRUMENTS,
  PRESTIGE_SCALE,
  WORKSHOP_CYCLES,
  WORKSHOP_MODULES,
  basePassiveProduction,
  basisChangeGain,
  basisChangeGainCap,
  correctAnomalyRewardMultiplier,
  inheritedStructuralWorkshops,
  instrumentIndex,
  instrumentBulkCost,
  instrumentCost,
  invariantGain,
  invariantProductionMultiplier,
  invariantProtocolCost,
  legacyWorkshopModules,
  matrixWorkshopCostMultiplier,
  maxAffordableInstrumentQuantity,
  nextInvariantThreshold,
  protocolAnomalyMultiplier,
  protocolManualMultiplier,
  protocolPassiveMultiplier,
  protocolResonanceMultiplier,
  protocolWorkshopCostMultiplier,
  resonanceDecayRate,
  workshopMasteryCost,
  workshopMasteryMultiplier,
  workshopMasteryThreshold,
  workshopModuleCost,
  workshopModuleMultiplier,
  workshopOutput,
} from "../app/game-balance.ts";
import {
  DEFAULT_RUN_TARGETS,
  simulateProgression,
} from "../scripts/simulate-progression.mjs";

function levels(entries = {}) {
  return INSTRUMENTS.map((instrument) => entries[instrument.id] ?? 0);
}

function ownedThrough(id) {
  const lastIndex = instrumentIndex(id);
  return INSTRUMENTS.map((_, index) => (index <= lastIndex ? 1 : 0));
}

test("grouped workshop purchases charge every forged unit exactly", () => {
  const multiplier = 0.83;
  const expected = Array.from(
    { length: 25 },
    (_, offset) => Math.ceil(instrumentCost(0, 37 + offset) * multiplier),
  ).reduce((sum, cost) => sum + cost, 0);

  assert.equal(instrumentBulkCost(0, 37, 25, multiplier), expected);
  assert.equal(
    maxAffordableInstrumentQuantity(0, 37, expected, multiplier),
    25,
  );
  assert.equal(
    maxAffordableInstrumentQuantity(
      0,
      37,
      expected +
        Math.ceil(instrumentCost(0, 62) * multiplier) -
        1,
      multiplier,
    ),
    25,
  );
  assert.equal(instrumentBulkCost(0, 37, 0, multiplier), 0);
  const infiniteBudgetQuantity = maxAffordableInstrumentQuantity(
    0,
    37,
    Number.POSITIVE_INFINITY,
    multiplier,
  );
  assert.ok(infiniteBudgetQuantity > 25);
  assert.ok(
    Number.isFinite(
      instrumentBulkCost(
        0,
        37,
        infiniteBudgetQuantity,
        multiplier,
      ),
    ),
  );
});

test("workshop levels unlock five purchased modules instead of automatic milestones", () => {
  assert.deepEqual(
    WORKSHOP_MODULES.map((module) => module.threshold),
    [5, 10, 25, 50, 100],
  );
  assert.equal(workshopModuleMultiplier([]), 1);
  assert.equal(workshopModuleMultiplier([1]), 1.25);
  assert.equal(workshopModuleMultiplier([1, 1]), 2);
  assert.equal(workshopModuleMultiplier([1, 1, 1]), 4);
  assert.equal(workshopModuleMultiplier([1, 1, 1, 1]), 8);
  assert.equal(workshopModuleMultiplier([1, 1, 1, 1, 1]), 20);
  assert.ok(workshopModuleCost(0, 1) > workshopModuleCost(0, 0));
  assert.deepEqual(legacyWorkshopModules(9), [0, 0, 0, 0, 0]);
  assert.deepEqual(legacyWorkshopModules(10), [1, 1, 0, 0, 0]);
  assert.deepEqual(legacyWorkshopModules(25), [1, 1, 1, 0, 0]);
  assert.deepEqual(legacyWorkshopModules(50), [1, 1, 1, 1, 0]);

  assert.equal(basePassiveProduction([10, 0, 0]), 5);
  assert.equal(
    basePassiveProduction(
      [10, 0, 0],
      [[1, 1, 0, 0, 0]],
    ),
    10,
  );
  assert.equal(
    workshopOutput(0, 100, [1, 1, 1, 1, 1]),
    1000,
  );
});

test("workshop mastery continues at doubling thresholds beyond level 100", () => {
  assert.equal(workshopMasteryThreshold(0), 200);
  assert.equal(workshopMasteryThreshold(1), 400);
  assert.equal(workshopMasteryThreshold(2), 800);
  assert.equal(workshopMasteryThreshold(3), 1600);
  assert.equal(workshopMasteryMultiplier(0), 1);
  assert.equal(workshopMasteryMultiplier(3), 8);
  assert.ok(workshopMasteryCost(0, 1) > workshopMasteryCost(0, 0));
  assert.equal(
    workshopOutput(0, 200, [1, 1, 1, 1, 1], 1),
    4000,
  );
});

test("advanced workshops add distinct family and rank synergies", () => {
  const baselineDirections = basePassiveProduction([1, 1, 1, 1, 0, 0, 0, 0]);
  const assembledDirections = basePassiveProduction([1, 1, 1, 1, 1, 0, 0, 0]);
  const testedFamilies = basePassiveProduction([1, 1, 1, 1, 1, 1, 0, 0]);
  const compressedRank = basePassiveProduction([1, 1, 1, 1, 1, 1, 1, 1]);

  assert.ok(assembledDirections > baselineDirections + INSTRUMENTS[4].baseProduction);
  assert.ok(testedFamilies > assembledDirections + INSTRUMENTS[5].baseProduction);
  assert.ok(
    compressedRank >
      testedFamilies +
        INSTRUMENTS[6].baseProduction +
        INSTRUMENTS[7].baseProduction,
  );
});

test("linear-map workshops transform production, resonance and anomaly rewards", () => {
  const baseline = basePassiveProduction(ownedThrough("grassmann-balancer"));
  const transformed = basePassiveProduction(ownedThrough("linear-transformer"));
  const balanced = basePassiveProduction(ownedThrough("rank-balance"));

  assert.ok(
    transformed >
      baseline + INSTRUMENTS[instrumentIndex("linear-transformer")].baseProduction,
  );
  assert.ok(resonanceDecayRate(levels({ "kernel-chamber": 1 })) < 8);
  assert.equal(
    correctAnomalyRewardMultiplier(levels({ "image-forge": 1 })),
    1.03,
  );
  assert.ok(
    balanced >
      transformed +
        ["kernel-chamber", "image-forge", "rank-balance"].reduce(
          (sum, id) => sum + INSTRUMENTS[instrumentIndex(id)].baseProduction,
          0,
        ),
  );
});

test("seventeen ordered cycles cover MPSI before the MP reduction path", () => {
  assert.equal(INSTRUMENTS.length, 68);
  assert.equal(WORKSHOP_CYCLES.length, 17);
  assert.equal(
    WORKSHOP_CYCLES.every((cycle) => cycle.workshops.length === 4),
    true,
  );
  assert.deepEqual(
    WORKSHOP_CYCLES.map((cycle) => cycle.title),
    [
      "Construction de l’espace",
      "Familles, bases et dimension",
      "Sous-espaces et sommes directes",
      "Applications linéaires",
      "Endomorphismes et décompositions",
      "Formes, hyperplans et affine",
      "Représentations matricielles",
      "Systèmes, Gauss et rang",
      "Changements de bases et trace",
      "Déterminants",
      "Fondations euclidiennes · MPSI",
      "Sous-espaces stables et blocs · MP",
      "Éléments propres · MP",
      "Réduction matricielle · MP",
      "Calcul polynomial · MP",
      "Matrices orthogonales et isométries · MP",
      "Réduction euclidienne · MP",
    ],
  );
  assert.deepEqual(
    WORKSHOP_CYCLES.map((cycle) => cycle.program),
    [...Array(11).fill("MPSI"), ...Array(6).fill("MP")],
  );
  assert.equal(
    INSTRUMENTS[instrumentIndex("inner-product-tuner")].cycleId,
    "euclidean-foundations",
  );
  assert.equal(
    INSTRUMENTS[instrumentIndex("finite-sum-assembler")].cycleId,
    "stable-blocks",
  );

  const beforeMatrices = basePassiveProduction(
    ownedThrough("affine-translator"),
  );
  const afterMatrices = basePassiveProduction(
    ownedThrough("matrix-kernel-imager"),
  );
  assert.ok(afterMatrices > beforeMatrices);
  assert.ok(
    INSTRUMENTS.every(
      (instrument, index) =>
        index === 0 ||
        (instrument.baseCost > INSTRUMENTS[index - 1].baseCost &&
          instrument.unlock > INSTRUMENTS[index - 1].unlock &&
          instrument.baseProduction > INSTRUMENTS[index - 1].baseProduction),
    ),
  );
});

test("late workshops retain their distinct economy and anomaly synergies", () => {
  assert.equal(matrixWorkshopCostMultiplier([]), 1);
  assert.equal(
    correctAnomalyRewardMultiplier(levels({ "minimal-extractor": 2 })),
    1.04,
  );
  assert.equal(
    correctAnomalyRewardMultiplier(
      levels({ "self-adjoint-symmetrizer": 2 }),
    ),
    1.04,
  );
  assert.ok(
    matrixWorkshopCostMultiplier(levels({ "triangularizer": 5 })) < 1,
  );
  assert.ok(
    matrixWorkshopCostMultiplier(levels({ "positivity-analyzer": 5 })) < 1,
  );
  assert.ok(
    matrixWorkshopCostMultiplier(levels({ "orthogonal-chamber": 5 })) < 1,
  );
  assert.equal(
    correctAnomalyRewardMultiplier(levels({ "metric-projector": 2 })),
    1.04,
  );
});

test("basis changes require a meaningful run and scale quadratically", () => {
  assert.equal(invariantGain(749_999), 0);
  assert.equal(invariantGain(750_000), 1);
  assert.equal(invariantGain(2_999_999), 1);
  assert.equal(invariantGain(3_000_000), 2);
  assert.equal(nextInvariantThreshold(0), 750_000);
  assert.equal(nextInvariantThreshold(1), 3_000_000);
});

test("basis change gains saturate before a run can skip the next cycle", () => {
  assert.equal(basisChangeGainCap(0), 1);
  assert.equal(basisChangeGainCap(68), 69);
  assert.equal(basisChangeGain(750_000, 0), 1);
  assert.equal(basisChangeGain(3_000_000, 1), 2);
  assert.equal(
    basisChangeGain(750_000 * 1029 ** 2, 68),
    69,
  );
});

test("invariant resonance grows by readable doubling tiers", () => {
  assert.equal(invariantProductionMultiplier(0), 1);
  assert.equal(invariantProductionMultiplier(1), 1.15);
  assert.equal(invariantProductionMultiplier(3), 1.45);
  assert.equal(invariantProductionMultiplier(7), 2.05);
  assert.equal(invariantProductionMultiplier(15), 2.25);
  assert.ok(invariantProductionMultiplier(1_000_000) < 6);
});

test("five basis changes preserve deliberate one-hour runs", () => {
  const report = simulateProgression();

  assert.equal(report.completed, true);
  assert.equal(report.changes.length, DEFAULT_RUN_TARGETS.length);
  assert.ok(report.elapsed >= 4 * 3600);
  assert.ok(report.elapsed <= 7 * 3600);
  assert.ok(
    report.changes.every(
      (change) =>
        change.runDuration >= 30 * 60 &&
        change.runDuration <= 2 * 3600,
    ),
  );
  assert.ok(report.changes[0].highestInstrument >= 2);
  assert.ok(report.changes[0].highestInstrument <= 4);
  assert.ok(report.changes.at(-1).highestInstrument >= 5);
});

test("the simulated midpoint reveals nine cycles without late runaway", () => {
  const report = simulateProgression({
    runTargets: Array.from(
      { length: 32 },
      (_, index) => 2 ** index,
    ),
  });
  const ninthCycle = report.unlocks.find(
    (unlock) => unlock.cycle === 9,
  );

  assert.equal(report.completed, true);
  assert.ok(ninthCycle);
  assert.ok(ninthCycle.seconds >= 20 * 3600);
  assert.ok(ninthCycle.seconds <= 26 * 3600);
  assert.ok(report.changes.at(-1).runDuration >= 30 * 60);
  assert.ok(report.changes.at(-1).runDuration <= 90 * 60);
  assert.ok(
    INSTRUMENTS.at(-1).unlock <
      PRESTIGE_SCALE * Math.pow(2 ** 67, 2),
  );
});

test("invariant protocols create permanent strategic upgrades", () => {
  assert.equal(INVARIANT_PROTOCOLS.length, 6);
  assert.equal(invariantProtocolCost(0, 0), 1);
  assert.equal(invariantProtocolCost(0, 3), 4);
  assert.equal(invariantProtocolCost(5, 2), 15);

  assert.equal(protocolManualMultiplier([2]), 1.5);
  assert.ok(Math.abs(protocolPassiveMultiplier([0, 3]) - 1.36) < 1e-12);
  assert.ok(protocolWorkshopCostMultiplier([0, 0, 2]) < 1);
  assert.ok(
    Math.abs(protocolResonanceMultiplier([0, 0, 0, 2]) - 1.24) < 1e-12,
  );
  assert.equal(protocolAnomalyMultiplier([0, 0, 0, 0, 2]), 1.3);
  assert.equal(inheritedStructuralWorkshops([0, 0, 0, 0, 0, 2]), 2);
  assert.equal(inheritedStructuralWorkshops([0, 0, 0, 0, 0, 8]), 3);
});

test("the active first-hour model unlocks the spatial forge before the first basis change", () => {
  const instruments = INSTRUMENTS.map(() => 0);
  const instrumentModules = INSTRUMENTS.map(() =>
    WORKSHOP_MODULES.map(() => 0),
  );
  let coordinates = 0;
  let total = 0;
  let nextQuestion = 45;
  let firstBasis = null;
  let firstApplication = null;
  let firstChange = null;

  function passiveRate() {
    return basePassiveProduction(instruments, instrumentModules);
  }

  function productionDelta(index) {
    const before = passiveRate();
    instruments[index] += 1;
    const after = passiveRate();
    instruments[index] -= 1;
    return after - before;
  }

  function moduleDelta(index, moduleIndex) {
    const before = passiveRate();
    instrumentModules[index][moduleIndex] = 1;
    const after = passiveRate();
    instrumentModules[index][moduleIndex] = 0;
    return after - before;
  }

  for (let second = 0; second <= 3600; second += 1) {
    const clicksPerSecond = second < 90 ? 2 : second < 900 ? 0.25 : 0.05;
    const clickMultiplier = second < 90 ? 2 : second < 900 ? 1.4 : 1;
    const gain = passiveRate() + clicksPerSecond * clickMultiplier;
    coordinates += gain;
    total += gain;

    if (second >= nextQuestion) {
      const questionReward = Math.max(24, passiveRate() * 20);
      coordinates += questionReward;
      total += questionReward;
      nextQuestion += 75;
    }

    let purchased = true;
    while (purchased) {
      purchased = false;
      let bestAction = null;
      let bestPayback = Number.POSITIVE_INFINITY;

      for (let index = 0; index < INSTRUMENTS.length; index += 1) {
        const cost = instrumentCost(index, instruments[index]);
        if (total >= INSTRUMENTS[index].unlock && coordinates >= cost) {
          const payback = cost / productionDelta(index);
          if (payback < bestPayback) {
            bestPayback = payback;
            bestAction = { type: "instrument", index, cost };
          }
        }

        for (
          let moduleIndex = 0;
          moduleIndex < WORKSHOP_MODULES.length;
          moduleIndex += 1
        ) {
          const module = WORKSHOP_MODULES[moduleIndex];
          const modulePrice = workshopModuleCost(index, moduleIndex);
          if (
            instruments[index] < module.threshold ||
            instrumentModules[index][moduleIndex] > 0 ||
            coordinates < modulePrice
          ) {
            continue;
          }
          const modulePayback =
            modulePrice / moduleDelta(index, moduleIndex);
          if (modulePayback < bestPayback) {
            bestPayback = modulePayback;
            bestAction = {
              type: "module",
              index,
              moduleIndex,
              cost: modulePrice,
            };
          }
        }
      }

      if (bestAction?.type === "instrument") {
        coordinates -= bestAction.cost;
        instruments[bestAction.index] += 1;
        purchased = true;
        if (bestAction.index === 1 && firstBasis === null) firstBasis = second;
        if (bestAction.index === 2 && firstApplication === null) {
          firstApplication = second;
        }
      } else if (bestAction?.type === "module") {
        coordinates -= bestAction.cost;
        instrumentModules[bestAction.index][bestAction.moduleIndex] = 1;
        purchased = true;
      }
    }

    if (invariantGain(total) >= 1 && firstChange === null) {
      firstChange = second;
      break;
    }
  }

  assert.ok(firstBasis !== null && firstBasis >= 60 && firstBasis <= 600);
  assert.ok(
    firstApplication !== null &&
      firstApplication >= 600 &&
      firstApplication <= 2400,
  );
  assert.ok(firstChange !== null && firstChange >= 1200 && firstChange <= 3600);
  assert.ok(firstBasis < firstApplication && firstApplication < firstChange);
});
