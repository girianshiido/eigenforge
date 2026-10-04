import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_STATE, restoreState } from "../app/save-state.ts";
import {
  INSTRUMENTS, PROTOCOL_COSTS, PROTOCOL_GATES, invariantReference,
  basisChangeGain, basisChangePreview, nextInvariantThreshold,
} from "../app/game-economy.ts";
import {
  restoreWallet, debitWallet, canAfford, creditIncome, production, boostedProduction,
  purchaseWorkshop, purchaseProtocol, restartEconomy, automaticPurchase,
  applyEconomicAnswer, questionReward, canOpenWorkshop, workshopGateProgress,
  exactWorkshopBulkCost, workshopBulkCost, moduleCost, masteryCost, maxAffordableWorkshopQuantity,
} from "../app/economy-state.ts";
import { REVISED_ECONOMY } from "../scripts/economy-candidate-v2.mjs";
import { candidatePassiveProduction, candidatePurchaseCost } from "../scripts/simulate-candidate-economy.mjs";

const fresh = () => structuredClone(INITIAL_STATE);
const relative = (a, b) => assert.ok(Math.abs(a - b) <= Math.max(1, b) * 1e-12, `${a} != ${b}`);
const simulatorState = s => ({ options: { economy: REVISED_ECONOMY }, units: s.instruments,
  modules: s.instrumentModules, masteries: s.instrumentMasteries, protocols: s.protocols,
  knowledge: Object.values(s.mastery), totalInvariants: s.totalInvariants, archivedHighest: s.archivedHighest });

test("playable V2 uses the simulated prices, outputs, protocol costs and gates", () => {
  assert.deepEqual(INSTRUMENTS.map(w => w.baseCost), REVISED_ECONOMY.prices);
  assert.deepEqual(INSTRUMENTS.map(w => w.baseProduction), REVISED_ECONOMY.outputs);
  assert.deepEqual(PROTOCOL_COSTS, REVISED_ECONOMY.protocolCosts.map(p => p.costs));
  assert.deepEqual(PROTOCOL_GATES, REVISED_ECONOMY.protocolGates);
  assert.equal(PROTOCOL_COSTS.flat().reduce((s, n) => s + n), 245);
  for (const frontier of [1, 3, 8, 17]) for (let repeats = 0; repeats < 4; repeats++) {
    for (const ratio of [1, 3, 7, 1000]) {
      const run = invariantReference(frontier) * ratio;
      assert.equal(basisChangeGain(run, frontier, repeats), REVISED_ECONOMY.gain(run, frontier, repeats));
    }
    assert.equal(basisChangeGain(nextInvariantThreshold(0, frontier, repeats), frontier, repeats), 1);
  }
});

test("live production and all purchase quotes match the calibrated model", () => {
  for (const count of [1, 10, 100]) {
    const s = fresh(); s.instruments.fill(count); s.archivedHighest = 63;
    s.instrumentModules.forEach((row, i) => { row[0] = i % 2; });
    s.instrumentMasteries[0] = count === 100 ? 1 : 0;
    s.protocols = [2, 3, 2, 1, 2, 3, 4, 3, 2];
    s.totalInvariants = 68; s.mastery = { vectors: 50, bases: 80, applications: 90, matrices: 20 };
    const simulated = simulatorState(s);
    relative(production(s), candidatePassiveProduction(simulated));
    for (let i = 0; i < 68; i++) {
      relative(workshopBulkCost(s, i, 1), candidatePurchaseCost(simulated, { type: "unit", index: i, quantity: 1 }));
      relative(moduleCost(s, i, 2), candidatePurchaseCost(simulated, { type: "module", index: i, moduleIndex: 2 }));
      relative(masteryCost(s, i), candidatePurchaseCost(simulated, { type: "mastery", index: i }));
    }
  }
});

test("coin ledger survives JSON and debits small prices from immense balances", () => {
  const initial = { ...fresh(), ...restoreWallet({ coordinatesWhole: (BigInt(10) ** BigInt(40)).toString(), coordinatesFraction: 0.25 }) };
  const bought = debitWallet(initial, 24);
  assert.equal(BigInt(initial.coordinatesWhole) - BigInt(bought.coordinatesWhole), BigInt(24));
  assert.equal(bought.coordinatesFraction, 0.25);
  const restored = restoreState(JSON.stringify(bought));
  assert.equal(restored.coordinatesWhole, bought.coordinatesWhole);
  assert.equal(restored.coordinatesFraction, 0.25);
  assert.equal(debitWallet(restored, Infinity), restored);
  assert.equal(debitWallet(restored, -1), restored);
  assert.equal(creditIncome(restored, NaN), restored);
  assert.equal(creditIncome(restored, 0.75).coordinatesWhole, (BigInt(bought.coordinatesWhole) + BigInt(1)).toString());
  assert.equal(canAfford({ ...restored, coordinatesWhole: "23", coordinates: 24 }, 24), false);
});

test("all bulk units are individually charged, including at enormous prices", () => {
  const s = fresh(); s.instruments.fill(10); s.archivedHighest = 66; s.protocols[6] = 4;
  const q = exactWorkshopBulkCost(s, 67, 25);
  const start = BigInt(10) ** BigInt(50);
  Object.assign(s, restoreWallet({ coordinatesWhole: start.toString() }));
  s.allTime = Number(start); s.highestWorkshop = 67;
  const result = purchaseWorkshop(s, 67, 25);
  assert.equal(start - BigInt(result.coordinatesWhole), q);
  assert.equal(result.instruments[67], 35);
  const simple = creditIncome(fresh(), 24);
  assert.equal(maxAffordableWorkshopQuantity(simple, 0), 1);
  assert.equal(purchaseWorkshop(simple, 0, 1).coordinatesWhole, "0");
  assert.equal(purchaseWorkshop(fresh(), 0, 1).instruments[0], 0);
});

test("frontier requires three successful distinct previous-cycle tasks, not cash alone", () => {
  let s = creditIncome(fresh(), 1e15); s.instruments.fill(1, 0, 12); s.highestWorkshop = 11;
  const q = { workshopId: INSTRUMENTS[8].id, taskKind: "task-a", sector: "vectors" };
  assert.equal(canOpenWorkshop(s, 12), false);
  s = applyEconomicAnswer(s, q, false, 1000);
  assert.equal(workshopGateProgress(s, 12), 0);
  s = applyEconomicAnswer(s, { ...q, workshopId: INSTRUMENTS[0].id }, true, 2000);
  assert.equal(workshopGateProgress(s, 12), 0);
  s = applyEconomicAnswer(s, q, true, 3000);
  s = applyEconomicAnswer(s, q, true, 4000);
  assert.equal(workshopGateProgress(s, 12), 1);
  s = applyEconomicAnswer(s, { ...q, taskKind: "task-b" }, true, 5000);
  s = applyEconomicAnswer(s, { ...q, taskKind: "task-c" }, true, 6000);
  assert.equal(canOpenWorkshop(s, 12), true);
  const opened = purchaseWorkshop(s, 12, 1);
  assert.equal(opened.highestWorkshop, 12);
  assert.equal(opened.frontierResets, 0);
});

test("three correct answers boost only passive income for 60 seconds without stacking", () => {
  let s = fresh(); s.instruments[0] = 1;
  const q = { sector: "vectors" };
  assert.equal(questionReward(s, false), 0);
  s = applyEconomicAnswer(s, q, true, 1000);
  s = applyEconomicAnswer(s, q, true, 2000);
  s = applyEconomicAnswer(s, q, false, 3000);
  assert.equal(s.streak, 0);
  for (const now of [4000, 5000, 6000]) s = applyEconomicAnswer(s, q, true, now);
  assert.equal(s.boostUntil, 66_000);
  assert.equal(boostedProduction(s, 65_999), production(s) * 2);
  assert.equal(boostedProduction(s, 66_000), production(s));
  s = applyEconomicAnswer(s, q, true, 7000);
  assert.equal(s.boostUntil, 66_000);
  const previous = s.coordinatesWhole;
  s = applyEconomicAnswer(s, q, false, 8000);
  assert.equal(s.coordinatesWhole, previous);
});

test("restart applies the advertised inheritance, clears modules and keeps knowledge/gates", () => {
  const s = creditIncome(fresh(), 1e15); s.instruments.fill(12, 0, 12); s.highestWorkshop = 11;
  s.instruments[1] = 2; s.protocols[5] = 3; s.protocols[6] = 4;
  s.instrumentModules[0].fill(1); s.instrumentMasteries[0] = 2;
  s.mastery.vectors = 42; s.gateValidations[4] = ["a", "b", "c"]; s.boostUntil = 100_000;
  const preview = basisChangePreview(s.runTotal, s.totalInvariants, s.protocols, s.instruments, s.highestWorkshop, s.frontierResets);
  const reset = restartEconomy(s);
  assert.deepEqual(reset.instruments, preview.instruments);
  assert.equal(reset.instruments[1], 2); assert.equal(reset.instruments[12], 0);
  assert.ok(reset.instrumentModules.flat().every(n => n === 0));
  assert.ok(reset.instrumentMasteries.every(n => n === 0));
  assert.equal(reset.coordinatesWhole, "0"); assert.equal(reset.boostUntil, 0);
  assert.equal(reset.archivedHighest, 11); assert.equal(reset.frontierResets, 1);
  assert.equal(reset.totalInvariants, 4); assert.equal(reset.mastery.vectors, 42);
  assert.deepEqual(reset.gateValidations, s.gateValidations);
  assert.equal(nextInvariantThreshold(0, 3, reset.frontierResets), invariantReference(3) * 2);
  assert.equal(restartEconomy(fresh()).totalInvariants, 0);
});

test("protocols are paid, chapter-gated and never debit earned lifetime points", () => {
  const s = fresh(); s.invariants = 100; s.totalInvariants = 100;
  assert.equal(purchaseProtocol(s, 7), s);
  s.highestWorkshop = 8;
  const bought = purchaseProtocol(s, 7);
  assert.equal(bought.protocols[7], 1); assert.equal(bought.invariants, 97);
  assert.equal(bought.totalInvariants, 100);
  assert.equal(purchaseProtocol(bought, 7), bought);
});

test("automatic purchases are paid, pausable, bounded and never create new workshops", () => {
  const s = creditIncome(fresh(), 1e9); s.allTime = 1e9;
  s.instruments[0] = 5; s.highestWorkshop = 8; s.protocols[7] = 1; s.protocols[8] = 2;
  const auto = automaticPurchase(s, 1000);
  assert.notEqual(auto, s); assert.ok(BigInt(auto.coordinatesWhole) < BigInt(s.coordinatesWhole));
  assert.equal(auto.instruments[1], 0); assert.equal(auto.nextAutomaticAt, 2000);
  assert.equal(automaticPurchase(auto, 1999), auto);
  const paused = { ...s, automationEnabled: [false, false] };
  assert.equal(automaticPurchase(paused, 3000), paused);
  const rich = { ...s, instruments: s.instruments.map((_, i) => i === 0 ? 50 : 0), instrumentModules: s.instrumentModules.map(row => row.map(() => 1)) };
  assert.equal(automaticPurchase(rich, 1000), rich);
  const poor = { ...s, ...restoreWallet({ coordinates: 50 }) };
  assert.equal(automaticPurchase(poor, 1000), poor);
});

test("old saves migrate once with exact wallet, known workshops and point refunds", () => {
  const old = { ...fresh(), saveVersion: 2, coordinates: 123.25, coordinatesWhole: undefined,
    instruments: INSTRUMENTS.map((_, i) => i < 12 ? 5 : 0), invariants: 88, totalInvariants: 500,
    protocols: [8, 8, 6, 6, 6, 3, 5], mastery: { vectors: 95 }, highestWorkshop: undefined };
  const next = restoreState(JSON.stringify(old));
  assert.equal(next.saveVersion, 3); assert.equal(next.coordinatesWhole, "123");
  assert.equal(next.coordinatesFraction, 0.25); assert.equal(next.highestWorkshop, 11);
  assert.equal(next.totalInvariants, 500); assert.ok(next.invariants > 88);
  assert.deepEqual(next.protocols, [6, 6, 5, 5, 5, 3, 4, 0, 0]);
  assert.equal(next.mastery.vectors, 95); assert.equal(next.frontierResets, 0);
  assert.equal(restoreState(JSON.stringify(next)).invariants, next.invariants);
  assert.equal(restoreState("invalid").coordinatesWhole, "0");
  const zero = restoreState(JSON.stringify({ ...fresh(), highestWorkshop: 0, archivedHighest: 0 }));
  assert.equal(zero.highestWorkshop, 0); assert.equal(zero.archivedHighest, 0);
});
