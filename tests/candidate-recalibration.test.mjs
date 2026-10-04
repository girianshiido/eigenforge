import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { INSTRUMENTS } from "../app/game-balance.ts";
import { revisedEconomy, REVISED_ECONOMY } from "../scripts/economy-candidate-v2.mjs";
import { simulateCandidateEconomy, creditCandidateWallet, debitCandidateWallet } from "../scripts/simulate-candidate-economy.mjs";

test("archive copies only owned units and excludes future workshops", () => {
  const model = revisedEconomy();
  const previous = INSTRUMENTS.map((_, i) => i < 12 ? i + 1 : 0);
  for (let rank = 0; rank < 4; rank++) {
    const archived = model.inheritance({ protocols: [0, 0, 0, 0, 0, rank] }, previous);
    assert.deepEqual(previous, INSTRUMENTS.map((_, i) => i < 12 ? i + 1 : 0));
    assert.ok(archived.every((n, i) => n <= previous[i]));
    assert.ok(archived.every(n => n <= [1, 2, 3, 5][rank]));
    assert.ok(archived.slice(12).every(n => n === 0));
  }
  const s = { archivedHighest: 11, protocols: [0, 0, 0, 0, 0, 0, 4] };
  assert.equal(model.reconstruction(s, 11, 0), 0.52);
  assert.equal(model.reconstruction(s, 12, 0), 1);
  assert.equal(model.reconstruction(s, 11, 10), 1);
});

test("integer wallet debits preserve tiny purchases at huge balances and fractional income", () => {
  const initial = 10n ** 40n;
  const s = { options: { economy: REVISED_ECONOMY }, wallet: Number(initial), walletInteger: initial,
    walletFraction: 0, ineffectiveDebits: 0 };
  debitCandidateWallet(s, 24);
  assert.equal(s.walletInteger, initial - 24n);
  creditCandidateWallet(s, 24.25);
  creditCandidateWallet(s, 0.75);
  assert.equal(s.walletInteger, initial + 1n);
  assert.equal(s.walletFraction, 0);
  assert.equal(s.ineffectiveDebits, 0);
  assert.throws(() => debitCandidateWallet(s, -1));
  assert.throws(() => creditCandidateWallet(s, Infinity));
  assert.throws(() => creditCandidateWallet(s, -1));
});

test("revised tariffs remain ordered, fund the smaller comfort catalogue and gate late principles", () => {
  const model = REVISED_ECONOMY;
  assert.equal(model.protocolCosts.reduce((s, p) => s + p.costs.reduce((a, b) => a + b, 0), 0), 245);
  for (let c = 0; c < 17; c++) {
    for (let j = 1; j < 4; j++) {
      assert.ok(model.prices[c * 4 + j] >= model.prices[c * 4 + j - 1]);
      assert.ok(model.outputs[c * 4 + j] > model.outputs[c * 4 + j - 1]);
    }
  }
  assert.deepEqual(model.protocolGates[7], [3, 7, 11]);
  assert.deepEqual(model.protocolGates[8], [5, 9]);
  assert.ok(model.protocolGates[0].at(-1) >= 14);
});

test("v1 simulation remains reproducible against the saved original audit", () => {
  const saved = JSON.parse(readFileSync(new URL("../SIMULATION-ECONOMIE.json", import.meta.url), "utf8"));
  const expected = saved.results.find(r => r.id === "regular");
  const actual = simulateCandidateEconomy();
  assert.ok(Math.abs(actual.elapsed / 3600 - expected.hours) < 1e-6);
  assert.equal(actual.totalInvariants, expected.invariants);
  assert.equal(actual.resets.length, expected.resets.length);
});

test("revised full path keeps reset gains bounded, restores power quickly and preserves late gaps", () => {
  const r = simulateCandidateEconomy({ economy: REVISED_ECONOMY });
  assert.equal(r.completed, true);
  assert.equal(r.workshops, 68);
  assert.equal(r.ineffectiveDebits, 0);
  assert.ok(r.elapsed / 3600 > 10 && r.elapsed / 3600 < 20);
  assert.equal(r.totalInvariants, r.invariants + r.protocolPurchases.reduce((sum, p) => sum + p.cost, 0));
  assert.equal(r.resets.filter(e => e.cycle <= 3).reduce((sum, e) => sum + e.gained, 0), 9);
  for (const change of r.resets) {
    assert.equal(change.gained, REVISED_ECONOMY.gain(change.runTotal, change.cycle, change.repeats));
    assert.ok(change.gained <= change.cycle + 1);
    assert.ok(change.powerRecoverySeconds <= 7 * 60);
  }
  for (const p of r.protocolPurchases) {
    assert.equal(p.cost, REVISED_ECONOMY.protocolCosts[p.index].costs[p.level - 1]);
    assert.ok(p.cycle >= REVISED_ECONOMY.protocolGates[p.index][p.level - 1]);
  }
  const start = r.unlocks.find(e => e.index === 48).seconds;
  assert.ok(r.elapsed - start > 3 * 3600);
  assert.ok(r.gates.every(g => g.seconds <= r.unlocks.find(e => e.cycle === g.cycle).seconds));
});
