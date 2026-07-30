import assert from "node:assert/strict";
import test from "node:test";

import {
  INVARIANT_PROTOCOLS,
  INSTRUMENTS,
  WORKSHOP_MODULES,
  basePassiveProduction,
  correctAnomalyRewardMultiplier,
  inheritedStructuralWorkshops,
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
  const baseline = basePassiveProduction([
    1, 1, 1, 1,
    1, 1, 1, 1,
    0, 0, 0, 0,
  ]);
  const transformed = basePassiveProduction([
    1, 1, 1, 1,
    1, 1, 1, 1,
    1, 0, 0, 0,
  ]);
  const balanced = basePassiveProduction([
    1, 1, 1, 1,
    1, 1, 1, 1,
    1, 1, 1, 1,
  ]);

  assert.ok(transformed > baseline + INSTRUMENTS[8].baseProduction);
  assert.ok(resonanceDecayRate([0, 0, 0, 0, 0, 0, 0, 0, 0, 1]) < 8);
  assert.equal(
    correctAnomalyRewardMultiplier([
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 1,
    ]),
    1.03,
  );
  assert.ok(
    balanced >
      transformed +
        INSTRUMENTS[9].baseProduction +
        INSTRUMENTS[10].baseProduction +
        INSTRUMENTS[11].baseProduction,
  );
});

test("matrix, reduction and Euclidean cycles extend production and workshop synergies", () => {
  assert.equal(INSTRUMENTS.length, 32);
  assert.deepEqual(
    INSTRUMENTS.slice(12, 16).map((instrument) => instrument.name),
    [
      "Encodeur matriciel",
      "Composeur matriciel",
      "Inverseur de Gauss",
      "Chambre spectrale",
    ],
  );
  assert.deepEqual(
    INSTRUMENTS.slice(16, 20).map((instrument) => instrument.name),
    [
      "Traceur caractéristique",
      "Extracteur propre",
      "Diagonaliseur",
      "Trigonaliseur",
    ],
  );
  assert.deepEqual(
    INSTRUMENTS.slice(20, 24).map((instrument) => instrument.name),
    [
      "Évaluateur polynomial",
      "Extracteur minimal",
      "Forge de Cayley-Hamilton",
      "Décomposeur caractéristique",
    ],
  );
  assert.deepEqual(
    INSTRUMENTS.slice(24, 28).map((instrument) => instrument.name),
    [
      "Chambre adjointe",
      "Symétriseur spectral",
      "Diagonaliseur orthogonal",
      "Analyseur de positivité",
    ],
  );
  assert.deepEqual(
    INSTRUMENTS.slice(28).map((instrument) => instrument.name),
    [
      "Accordeur scalaire",
      "Orthogonalisateur de Schmidt",
      "Chambre orthogonale",
      "Projecteur métrique",
    ],
  );

  const applications = basePassiveProduction([
    1, 1, 1, 1,
    1, 1, 1, 1,
    1, 1, 1, 1,
    0, 0, 0, 0,
  ]);
  const matrices = basePassiveProduction([
    ...INSTRUMENTS.slice(0, 16).map(() => 1),
    0, 0, 0, 0,
  ]);
  const euclideanReduction = basePassiveProduction(
    INSTRUMENTS.map((_, index) => (index < 28 ? 1 : 0)),
  );
  const euclideanFoundations = basePassiveProduction(
    INSTRUMENTS.map(() => 1),
  );
  assert.ok(
    matrices >
      applications +
        INSTRUMENTS.slice(12, 16).reduce(
          (sum, instrument) => sum + instrument.baseProduction,
          0,
        ),
  );
  assert.ok(
    euclideanReduction >
      matrices +
        INSTRUMENTS.slice(16, 28).reduce(
          (sum, instrument) => sum + instrument.baseProduction,
          0,
        ),
  );
  assert.ok(
    euclideanFoundations >
      euclideanReduction +
        INSTRUMENTS.slice(28).reduce(
          (sum, instrument) => sum + instrument.baseProduction,
          0,
        ),
  );
  assert.ok(
    matrixWorkshopCostMultiplier(
      INSTRUMENTS.map((_, index) => (index === 23 ? 5 : 0)),
    ) < 1,
  );
  assert.equal(
    correctAnomalyRewardMultiplier(
      INSTRUMENTS.map((_, index) => (index === 21 ? 2 : 0)),
    ),
    1.04,
  );
  assert.equal(
    correctAnomalyRewardMultiplier(
      INSTRUMENTS.map((_, index) => (index === 25 ? 2 : 0)),
    ),
    1.04,
  );
  assert.ok(
    matrixWorkshopCostMultiplier(
      INSTRUMENTS.map((_, index) => (index === 27 ? 5 : 0)),
    ) < 1,
  );
  assert.ok(
    matrixWorkshopCostMultiplier(
      INSTRUMENTS.map((_, index) => (index === 30 ? 5 : 0)),
    ) < 1,
  );
  assert.equal(
    correctAnomalyRewardMultiplier(
      INSTRUMENTS.map((_, index) => (index === 31 ? 2 : 0)),
    ),
    1.04,
  );
  assert.ok(
    basePassiveProduction(
      INSTRUMENTS.map((_, index) =>
        index < 28 || index === 28 ? 1 : 0,
      ),
    ) >
      euclideanReduction + INSTRUMENTS[28].baseProduction,
  );
  assert.equal(matrixWorkshopCostMultiplier([]), 1);
  assert.ok(
    matrixWorkshopCostMultiplier([
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 5,
    ]) < 1,
  );
  assert.ok(
    matrixWorkshopCostMultiplier([
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 5,
    ]) < 1,
  );
  assert.equal(
    correctAnomalyRewardMultiplier([
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 2,
    ]),
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
  assert.ok(report.elapsed >= 4.5 * 3600);
  assert.ok(report.elapsed <= 7 * 3600);
  assert.ok(
    report.changes.every(
      (change) =>
        change.runDuration >= 30 * 60 &&
        change.runDuration <= 2 * 3600,
    ),
  );
  assert.equal(report.changes[0].highestInstrument, 2);
  assert.ok(report.changes.at(-1).highestInstrument >= 5);
});

test("the optimal long game reveals every cycle without late runaway", () => {
  const report = simulateProgression({
    runTargets: Array.from(
      { length: 32 },
      (_, index) => 2 ** index,
    ),
  });
  const eighthCycle = report.unlocks.find(
    (unlock) => unlock.cycle === 8,
  );

  assert.equal(report.completed, true);
  assert.ok(eighthCycle);
  assert.ok(eighthCycle.seconds >= 40 * 3600);
  assert.ok(eighthCycle.seconds <= 56 * 3600);
  assert.ok(report.changes.at(-1).runDuration >= 45 * 60);
  assert.ok(report.changes.at(-1).runDuration <= 2 * 3600);
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
