import assert from "node:assert/strict";
import test from "node:test";
import { INSTRUMENTS, WORKSHOP_MODULES } from "../app/game-balance.ts";
import { CANDIDATE_PROTOCOL_COSTS, CANDIDATE_PROTOCOL_GATES, candidateGain } from "../scripts/economy-candidate.mjs";
import { simulateCandidateEconomy, candidatePassiveProduction, candidatePurchaseCost } from "../scripts/simulate-candidate-economy.mjs";

test("candidate event simulation is reproducible and accounts for discrete questions, boosts and resets", () => {
  const options = { maximumSeconds: 6 * 3600, seed: 123 };
  const a = simulateCandidateEconomy(options), b = simulateCandidateEconomy(options);
  assert.deepEqual(a, b);
  assert.ok(a.resets.length >= 2);
  assert.ok(a.boosts > 0 && a.correct < a.questions);
  assert.ok(a.boostSeconds <= a.boosts * 60 + 1e-6);
  assert.ok(a.boostSeconds <= a.activeTime);
  assert.ok(a.ineffectiveDebits === 0);
  assert.ok(a.sources.questions > 0 && a.sources.offline === 0);
  for (const r of a.resets) {
    assert.equal(r.gained, candidateGain(r.runTotal, r.cycle, r.repeats));
    assert.ok(r.gained <= r.cycle + 1);
  }
  assert.equal(a.totalInvariants, a.invariants + a.protocolPurchases.reduce((sum, p) => sum + p.cost, 0));
  for (const p of a.protocolPurchases) {
    assert.equal(p.cost, CANDIDATE_PROTOCOL_COSTS[p.index].costs[p.level - 1]);
    assert.ok(p.cycle >= CANDIDATE_PROTOCOL_GATES[p.index][p.level - 1]);
  }
  for (const gate of a.gates) {
    const workshop = a.unlocks.find(e => e.cycle === gate.cycle);
    if (workshop) assert.ok(gate.seconds <= workshop.seconds);
  }
});

test("without answers the candidate waits at the first educational gate and earns no question or streak money", () => {
  const r = simulateCandidateEconomy({ resetPolicy: "none", questionInterval: Infinity, maximumSeconds: 24 * 3600 });
  assert.equal(r.stopReason, "educational-gate");
  assert.equal(r.workshops, 12);
  assert.equal(r.questions, 0);
  assert.equal(r.correct, 0);
  assert.equal(r.boosts, 0);
  assert.equal(r.sources.questions, 0);
  assert.equal(r.gates.length, 0);
});

test("offline simulation caps income at two hours and never answers or purchases during absence", () => {
  const common = { resetPolicy: "none", success: 1, sessionSeconds: 1800, absenceSeconds: 11 * 3600 };
  const atCap = simulateCandidateEconomy({ ...common, maximumSeconds: 1800 + 7200 });
  const later = simulateCandidateEconomy({ ...common, maximumSeconds: 1800 + 10 * 3600 });
  assert.equal(atCap.sources.offline, later.sources.offline);
  assert.equal(atCap.questions, later.questions);
  assert.equal(atCap.manualPurchases, later.manualPurchases);
  assert.deepEqual(atCap.final.instruments, later.final.instruments);
  assert.equal(atCap.activeTime, 1800);
  assert.equal(later.activeTime, 1800);
});

test("bounded synergies remain finite at high levels and automated purchases use the same price as manual purchases", () => {
  const state = {
    units: INSTRUMENTS.map(() => 500), modules: INSTRUMENTS.map(() => WORKSHOP_MODULES.map(() => 0)),
    masteries: INSTRUMENTS.map(() => 0), protocols: [6, 6, 5, 5, 5, 3, 4, 3, 2],
    totalInvariants: 300, knowledge: [100, 100, 100, 100],
  };
  assert.ok(Number.isFinite(candidatePassiveProduction(state)));
  const a = { type: "unit", index: 40, quantity: 5 };
  assert.equal(candidatePurchaseCost(state, a), candidatePurchaseCost(state, { ...a, automatic: true }));
  assert.ok(candidatePurchaseCost(state, a) > 0);
});
