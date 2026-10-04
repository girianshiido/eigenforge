import { INSTRUMENTS, PRESTIGE_SCALE, invariantProductionMultiplier, matrixWorkshopCostMultiplier } from "../app/game-balance.ts";
import { simulateProgression } from "./simulate-progression.mjs";

const ceilingTargets = Array.from({ length: 80 }, (_, i) => 2 ** i);
const scenarios = [
  { name: "Plafond, jusqu’au dernier atelier", options: { runTargets: ceilingTargets, stopAtLastWorkshop: true } },
  { name: "Plafond, 80 changements dont après le dernier atelier", options: { runTargets: ceilingTargets } },
  { name: "Sans changement de base", options: { runTargets: [Infinity], stopAtLastWorkshop: true, maximumSeconds: 48 * 3600 } },
  { name: "Actif : 5 clics/s, résonance et maîtrise maximales", options: { runTargets: [Infinity], stopAtLastWorkshop: true, maximumSeconds: 48 * 3600, clickRate: 5, resonanceMultiplier: 3, masteryBonus: 0.9, questionInterval: 65 } },
  { name: "Passif : rares clics, aucune réponse aux anomalies", options: { runTargets: ceilingTargets, stopAtLastWorkshop: true, maximumSeconds: 7 * 86400, clickRate: 0.05, questionInterval: Infinity } },
  { name: "Redémarrage au plus tôt : 120 gains de 1 invariant", options: { runTargets: Array(120).fill(1) } },
  { name: "Sans redémarrage, une seconde par achat", options: { runTargets: [Infinity], stopAtLastWorkshop: true, maximumSeconds: 7 * 86400, actionDelay: 1 } },
  { name: "Contrôle sans remises des ateliers", options: { runTargets: [Infinity], stopAtLastWorkshop: true, maximumSeconds: 7 * 86400, costSynergies: false } },
  { name: "Contrôle sans synergies de production", options: { runTargets: [Infinity], stopAtLastWorkshop: true, maximumSeconds: 7 * 86400, productionSynergies: false } },
];

function summarize(report) {
  const firstUnlocks = report.unlocks.filter((u, i, all) => all.findIndex(other => other.instrument === u.instrument) === i);
  const cycleTimes = Array.from({ length: 17 }, (_, i) => {
    const first = firstUnlocks.find(u => u.cycle === i + 1);
    return { cycle: i + 1, hours: first ? first.seconds / 3600 : null };
  });
  const durations = report.changes.map(c => c.runDuration / 60);
  return {
    completed: report.completed,
    stopReason: report.stopReason,
    hours: report.elapsed / 3600,
    workshopsReached: firstUnlocks.length,
    highestWorkshop: Math.max(-1, ...firstUnlocks.map(u => u.instrument)) + 1,
    lastWorkshopHour: firstUnlocks.find(u => u.instrument === INSTRUMENTS.length - 1)?.seconds / 3600 ?? null,
    basisChanges: report.changes.length,
    firstRunsMinutes: durations.slice(0, 5),
    lastRunsMinutes: durations.slice(-5),
    minimumRunMinutes: durations.length ? Math.min(...durations) : null,
    invariantMultiplier: invariantProductionMultiplier(report.totalInvariants),
    totalInvariants: report.totalInvariants,
    firstUnsafeInvariantCount: report.firstUnsafeInvariantCount,
    maximumProduction: report.maximumProduction,
    highestLevel: Math.max(...report.final.instruments, ...report.changes.map(c => c.highestLevel)),
    highestMastery: Math.max(...report.final.masteries, ...report.changes.map(c => c.highestMastery)),
    cycles: cycleTimes,
    allNumbersFinite: [report.elapsed, report.allTime, report.maximumProduction, report.final.passiveProduction, report.totalInvariants].every(Number.isFinite),
    actionCount: report.actionCount,
  };
}

const requestedScenario = process.argv.find(arg => arg.startsWith("--scenario="))?.split("=")[1];
for (const [index, scenario] of scenarios.entries()) {
  if (requestedScenario && Number(requestedScenario) !== index + 1) continue;
  const start = performance.now();
  const report = simulateProgression(scenario.options);
  console.log(JSON.stringify({ name: scenario.name, ...summarize(report), executionSeconds: (performance.now() - start) / 1000 }));
}

// A small exhaustive stress sweep exposes the combined effect of discount workshops.
const costReducers = ["gauss-inverter", "triangularizer", "characteristic-decomposer", "positivity-analyzer", "orthogonal-chamber"];
console.log(JSON.stringify({
  name: "Bornes numériques et remises cumulées",
  invariantPrecisionExample: { total: 2 ** 53, plusOne: 2 ** 53 + 1, unchanged: 2 ** 53 === 2 ** 53 + 1 },
  invariantThresholdAtLastWorkshop: Math.ceil(Math.sqrt(INSTRUMENTS.at(-1).unlock / PRESTIGE_SCALE)),
  reductionAt100Each: matrixWorkshopCostMultiplier(INSTRUMENTS.map(w => costReducers.includes(w.id) ? 100 : 0)),
  reductionAt500Each: matrixWorkshopCostMultiplier(INSTRUMENTS.map(w => costReducers.includes(w.id) ? 500 : 0)),
}));
