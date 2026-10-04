import {
  INSTRUMENTS, INVARIANT_PROTOCOLS, PRESTIGE_SCALE,
  invariantProtocolCost, invariantProductionMultiplier,
  basePassiveProduction, matrixWorkshopCostMultiplier,
  correctAnomalyRewardMultiplier, protocolAnomalyMultiplier,
  workshopOutput, WORKSHOP_MODULES,
} from "../app/game-balance.ts";
import { simulateProgression } from "./simulate-progression.mjs";

// Read-only diagnostic: no production rule or browser save is modified.
const firstTargets = Array.from({ length: 16 }, (_, i) => 2 ** i);
const scenarios = [
  { id: "ceiling", label: "16 redémarrages au plafond", options: { runTargets: firstTargets, maximumSeconds: 12 * 3600, actionDelay: 1 } },
  { id: "single", label: "Sans redémarrage, réponses justes toutes les 75 s", options: { runTargets: [Infinity], stopAtLastWorkshop: true, maximumSeconds: 48 * 3600, actionDelay: 1 } },
  { id: "passive", label: "Sans redémarrage ni réponses", options: { runTargets: [Infinity], stopAtLastWorkshop: true, maximumSeconds: 72 * 3600, questionInterval: Infinity, clickRate: 0.05, actionDelay: 1 } },
  { id: "random", label: "Sans redémarrage, 25 % de réponses justes", options: { runTargets: [Infinity], stopAtLastWorkshop: true, maximumSeconds: 72 * 3600, questionSuccessRate: 0.25, actionDelay: 1 } },
  { id: "expert", label: "Borne favorable : clics, résonance et maîtrise maximales", options: { runTargets: [Infinity], stopAtLastWorkshop: true, maximumSeconds: 48 * 3600, clickRate: 5, resonanceMultiplier: 3, masteryBonus: 0.9, questionInterval: 65, actionDelay: 1 } },
  { id: "no-discounts", label: "Contrôle sans remises entre ateliers", options: { runTargets: [Infinity], stopAtLastWorkshop: true, maximumSeconds: 72 * 3600, costSynergies: false, actionDelay: 1 } },
  { id: "no-synergies", label: "Contrôle sans synergies de production", options: { runTargets: [Infinity], stopAtLastWorkshop: true, maximumSeconds: 96 * 3600, productionSynergies: false, actionDelay: 1 } },
  { id: "immediate", label: "120 redémarrages au premier invariant", options: { runTargets: Array(120).fill(1), maximumSeconds: 12 * 3600, actionDelay: 1 } },
];

function summarize(report) {
  const first = new Map();
  for (const event of report.unlocks) if (!first.has(event.instrument)) first.set(event.instrument, event);
  const cycles = Array.from({ length: 17 }, (_, i) => {
    const events = Array.from({ length: 4 }, (_, j) => first.get(i * 4 + j));
    return {
      cycle: i + 1,
      entryMinutes: events[0] ? events[0].seconds / 60 : null,
      workshopMinutes: events.map(e => e ? e.seconds / 60 : null),
      // Includes any intervening resets, rather than pretending it is pure idle time.
      insideMinutes: events[0] && events[3] ? (events[3].seconds - events[0].seconds) / 60 : null,
      gapMinutes: events[0] && i > 0 && first.get(i * 4 - 1) ? (events[0].seconds - first.get(i * 4 - 1).seconds) / 60 : null,
    };
  });
  const protocolCompletions = INVARIANT_PROTOCOLS.map((p, index) => {
    const done = report.protocolPurchases.find(t => t.index === index && t.level === p.maxLevel);
    return { name: p.name, minutes: done ? done.seconds / 60 : null, totalInvariants: done?.totalInvariants ?? null };
  });
  const allComplete = protocolCompletions.every(p => p.minutes !== null)
    ? Math.max(...protocolCompletions.map(p => p.minutes)) : null;
  const lastProtocolWorkshop = allComplete === null ? null : Math.max(-1, ...[...first.values()].filter(e => e.seconds <= allComplete * 60).map(e => e.instrument));
  return {
    completed: report.completed,
    stopReason: report.stopReason,
    hours: report.elapsed / 3600,
    workshops: first.size,
    changes: report.changes.map(c => ({ number: c.change, minutes: c.runDuration / 60, gain: c.gained, total: c.totalInvariants, highestCycle: Math.floor(c.highestInstrument / 4) + 1 })),
    cycles, protocolCompletions, allProtocolsAtMinutes: allComplete,
    allProtocolsAtCycle: lastProtocolWorkshop === null ? null : Math.floor(lastProtocolWorkshop / 4) + 1,
    finalProtocols: report.final.protocols,
  };
}

const requested = process.argv.find(s => s.startsWith("--scenario="))?.split("=")[1];
for (const scenario of scenarios) {
  if (requested && requested !== scenario.id) continue;
  const started = performance.now();
  const report = simulateProgression(scenario.options);
  console.log(JSON.stringify({ id: scenario.id, label: scenario.label, ...summarize(report), executionSeconds: (performance.now() - started) / 1000 }));
}

const protocolCosts = INVARIANT_PROTOCOLS.map((p, i) => {
  const costs = Array.from({ length: p.maxLevel }, (_, level) => invariantProtocolCost(i, level));
  return { name: p.name, costs, total: costs.reduce((a, b) => a + b, 0) };
});
const moduleProduct = WORKSHOP_MODULES.reduce((p, m) => p * m.multiplier, 1);
const levels = [10, 100, 500].map(count => {
  const units = INSTRUMENTS.map(() => count);
  const sum = INSTRUMENTS.reduce((s, _, i) => s + workshopOutput(i, count), 0);
  const questionSeconds = 20 * correctAnomalyRewardMultiplier(units) * protocolAnomalyMultiplier(INVARIANT_PROTOCOLS.map(p => p.maxLevel));
  return { countPerWorkshop: count, productionSynergy: basePassiveProduction(units) / sum, costMultiplier: matrixWorkshopCostMultiplier(units), correctQuestionProductionSeconds: questionSeconds };
});
console.log(JSON.stringify({ id: "rules", protocolCosts,
  totalProtocolCost: protocolCosts.reduce((s, p) => s + p.total, 0),
  firstLevelTotal: protocolCosts.reduce((s, p) => s + p.costs[0], 0),
  thresholdFor44: PRESTIGE_SCALE * 44 ** 2,
  maxLifetimeAtReset: Array.from({ length: 10 }, (_, i) => 2 ** (i + 1) - 1),
  moduleProduct, levels,
  permanentMultipliers: [1, 15, 44, 300, 1000].map(n => ({ invariants: n, multiplier: invariantProductionMultiplier(n) })),
  workshops: INSTRUMENTS.map((w, index) => ({ index: index + 1, cycle: Math.floor(index / 4) + 1, name: w.name, cost: w.baseCost, unlock: w.unlock, production: w.baseProduction, basePaybackSeconds: w.baseCost / w.baseProduction })),
}));
