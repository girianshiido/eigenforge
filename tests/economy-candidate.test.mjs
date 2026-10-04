import assert from "node:assert/strict";
import test from "node:test";
import { INSTRUMENTS, PRESTIGE_SCALE } from "../app/game-balance.ts";
import {
  candidateGain, candidatePermanentMultiplier, candidateWorkshopCost,
  candidateWorkshopProduction, candidateCostFactor, candidateGlobalSynergy,
  candidateQuestionReward, candidateStreakMultiplier, candidateQuote,
} from "../scripts/economy-candidate.mjs";

test("proposed prestige normalizes rewards by the frontier instead of lifetime doubling", () => {
  assert.equal(candidateGain(PRESTIGE_SCALE * 44 ** 2, 3), 3);
  assert.equal(candidateGain(PRESTIGE_SCALE * 88 ** 2, 3), 4);
  for (let c = 1; c <= 17; c++) {
    let previous = 0;
    for (const ratio of [0, 1, 2, 4, 8, 32, 1000, 1e100]) {
      const reference = Math.max(PRESTIGE_SCALE, INSTRUMENTS[(c - 1) * 4].baseCost);
      const gain = candidateGain(reference * ratio, c);
      assert.ok(Number.isSafeInteger(gain) && gain >= previous && gain <= c + 1);
      previous = gain;
    }
  }
  assert.deepEqual(candidateQuote().repeated44, [3, 3, 2, 1, 0]);
});

test("proposed cycle tariffs distinguish a frontier gap from internal growth", () => {
  for (let c = 1; c < 17; c++) {
    const first = c * 4;
    for (let j = 1; j <= 3; j++) {
      assert.ok(Math.abs(candidateWorkshopCost(first + j) / candidateWorkshopCost(first + j - 1) - 2.8) < 1e-4);
      assert.ok(Math.abs(candidateWorkshopProduction(first + j) / candidateWorkshopProduction(first + j - 1) - 2.6) < 1e-8);
    }
    if (c > 1) assert.ok(candidateWorkshopCost(first) / candidateWorkshopCost(first - 1) > 15);
  }
});

test("proposed bounds prevent vanishing prices and enormous question rewards", () => {
  assert.equal(candidateCostFactor(1e-20, 1e-20), 0.35);
  assert.ok(candidateGlobalSynergy(1e100) ** 7 <= 1.25 ** 7);
  assert.equal(candidateQuestionReward(100, false, 1e9), 0);
  assert.equal(candidateQuestionReward(100, true, 1e9), 2400);
  assert.equal(candidateStreakMultiplier(3), 2);
  assert.equal(candidateStreakMultiplier(30), 2);
  assert.equal(candidateQuote().completeCost, 275);
  assert.equal(candidateQuote().fundingTotal, 275);
  assert.equal(candidateQuote().funding.slice(0, 3).reduce((s, c) => s + c.total, 0), 27);
  assert.ok(candidatePermanentMultiplier(1000) < 8);
});
