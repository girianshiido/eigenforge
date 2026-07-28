import assert from "node:assert/strict";
import test from "node:test";

import {
  INSTRUMENTS,
  basePassiveProduction,
  correctAnomalyRewardMultiplier,
  instrumentCost,
  invariantGain,
  milestoneMultiplier,
  nextInvariantThreshold,
  resonanceDecayRate,
} from "../app/game-balance.ts";

test("instrument milestones double passive production at 10, 25 and 50", () => {
  assert.equal(milestoneMultiplier(9), 1);
  assert.equal(milestoneMultiplier(10), 2);
  assert.equal(milestoneMultiplier(24), 2);
  assert.equal(milestoneMultiplier(25), 4);
  assert.equal(milestoneMultiplier(49), 4);
  assert.equal(milestoneMultiplier(50), 8);

  assert.equal(basePassiveProduction([10, 0, 0]), 10);
  assert.equal(basePassiveProduction([25, 0, 0]), 50);
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

test("basis changes require a meaningful run and scale quadratically", () => {
  assert.equal(invariantGain(749_999), 0);
  assert.equal(invariantGain(750_000), 1);
  assert.equal(invariantGain(2_999_999), 1);
  assert.equal(invariantGain(3_000_000), 2);
  assert.equal(nextInvariantThreshold(0), 750_000);
  assert.equal(nextInvariantThreshold(1), 3_000_000);
});

test("the active first-hour model unlocks the spatial forge before the first basis change", () => {
  const instruments = INSTRUMENTS.map(() => 0);
  let coordinates = 0;
  let total = 0;
  let nextQuestion = 45;
  let firstBasis = null;
  let firstApplication = null;
  let firstChange = null;

  function passiveRate() {
    return basePassiveProduction(instruments);
  }

  function productionDelta(index) {
    const before = passiveRate();
    instruments[index] += 1;
    const after = passiveRate();
    instruments[index] -= 1;
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
      let bestIndex = -1;
      let bestPayback = Number.POSITIVE_INFINITY;

      for (let index = 0; index < INSTRUMENTS.length; index += 1) {
        const cost = instrumentCost(index, instruments[index]);
        if (total < INSTRUMENTS[index].unlock || coordinates < cost) continue;
        const payback = cost / productionDelta(index);
        if (payback < bestPayback) {
          bestPayback = payback;
          bestIndex = index;
        }
      }

      if (bestIndex >= 0) {
        coordinates -= instrumentCost(bestIndex, instruments[bestIndex]);
        instruments[bestIndex] += 1;
        purchased = true;
        if (bestIndex === 1 && firstBasis === null) firstBasis = second;
        if (bestIndex === 2 && firstApplication === null) firstApplication = second;
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
