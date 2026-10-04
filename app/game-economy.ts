// Playable economy V2. The legacy balance remains available to reproduce audits.
import {
  INSTRUMENTS as LEGACY_INSTRUMENTS, INVARIANT_PROTOCOLS as LEGACY_PROTOCOLS,
  WORKSHOP_CYCLES as LEGACY_CYCLES, WORKSHOP_MODULES,
  instrumentLevel, workshopModuleMultiplier, workshopMasteryMultiplier,
} from "./game-balance.ts";

export const EDUCATIONAL_GATES = [4, 8, 12, 15, 17];
export const INHERITED_UNIT_CAPS = [1, 2, 3, 5];
export const PROTOCOL_COSTS = [
  [1, 2, 3, 5, 8, 12], [2, 3, 5, 8, 12, 18], [2, 4, 7, 11, 16],
  [1, 2, 4, 6, 9], [2, 3, 5, 8, 12], [1, 3, 6], [2, 4, 7, 11],
  [3, 7, 12], [6, 12],
];
export const PROTOCOL_GATES = [
  [1, 3, 5, 8, 11, 14], [1, 3, 5, 8, 11, 14], [1, 3, 6, 10, 14],
  [1, 3, 6, 10, 14], [1, 3, 6, 10, 14], [2, 5, 9], [2, 5, 9, 13],
  [3, 7, 11], [5, 9],
];

export const INSTRUMENTS = LEGACY_INSTRUMENTS.map((w, i) => {
  if (i < 4) return { ...w };
  const c = Math.floor(i / 4) + 1;
  const reference = 260_000 * 80 ** (c - 2);
  const premium = c >= 15 ? [1.2, 1.35, 1.6][c - 15] : 1;
  const baseCost = Math.ceil(reference * 2.8 ** (i % 4)
    * (i % 4 === 0 && EDUCATIONAL_GATES.includes(c) ? 2.8 : 1) * premium);
  const pace = 1 + 0.15 * Math.min(3, c - 2) + 1.2 * Math.max(0, c - 5);
  return { ...w, baseCost, baseProduction: reference / (1000 * pace) * 2.6 ** (i % 4), unlock: baseCost * 1.25 };
});
export const WORKSHOP_CYCLES = LEGACY_CYCLES.map((c, i) => ({ ...c, workshops: INSTRUMENTS.slice(i * 4, i * 4 + 4) }));
const descriptions = [
  "Chaque niveau amplifie de 15 % l’émission manuelle.",
  "Chaque niveau augmente de 8 % toute la production passive.",
  "Chaque niveau réduit les prix de 5 %, dans la limite de la remise permanente.",
  "Chaque niveau augmente de 8 % la stabilité de la résonance.",
  "Chaque niveau augmente de 10 % les gains des réponses justes. Le bonus combiné reste borné.",
  "Au prochain changement, conserve jusqu’à 2, 3 puis 5 unités de chaque atelier déjà construit. Aucun atelier inédit n’est offert.",
  "Chaque niveau réduit de 12 % le prix des dix premières unités des ateliers archivés au dernier changement de base.",
  "Achète automatiquement le premier, les trois premiers puis les cinq modules disponibles. Les achats restent payants et limités à un par seconde.",
  "Renforce automatiquement les ateliers des cycles précédents jusqu’à 25 puis 50 unités. Ne débloque jamais un atelier inédit.",
];
export const INVARIANT_PROTOCOLS = PROTOCOL_COSTS.map((costs, i) => ({
  ...(LEGACY_PROTOCOLS[i] ?? { name: i === 7 ? "Modules automatiques" : "Anciens ateliers automatiques", mark: i === 7 ? "⚙" : "↻", baseCost: costs[0], costStep: 0 }),
  maxLevel: costs.length, description: descriptions[i],
}));
export const invariantProtocolCost = (i: number, level: number) => PROTOCOL_COSTS[i]?.[level] ?? Infinity;
export const protocolUnlockCycle = (i: number, level: number) => PROTOCOL_GATES[i]?.[level] ?? Infinity;
export const invariantProductionMultiplier = (total: number) => 1 + 0.2 * Math.sqrt(Math.max(0, total));
export const protocolPassiveMultiplier = (p: readonly number[]) => 1 + 0.08 * (p[1] ?? 0);
export const protocolManualMultiplier = (p: readonly number[]) => 1 + 0.15 * (p[0] ?? 0);
export const protocolResonanceMultiplier = (p: readonly number[]) => 1 + 0.08 * (p[3] ?? 0);
export const protocolWorkshopCostMultiplier = (p: readonly number[]) => Math.max(0.7, 0.95 ** (p[2] ?? 0));
export const protocolAnomalyMultiplier = (p: readonly number[]) => 1 + 0.1 * (p[4] ?? 0);
export const cycleForIndex = (i: number) => Math.max(1, Math.floor(i / 4) + 1);
export const frontierCycle = (highest: number) => cycleForIndex(highest);
export const invariantReference = (c: number) => Math.max(100_000, INSTRUMENTS[(c - 1) * 4].baseCost);
export const basisChangeGainCap = (c: number) => c + 1;
export function invariantGain(total: number, c: number, repeats = 0) {
  return Math.floor(Math.log2(1 + Math.max(0, total) / invariantReference(c) / 2 ** repeats));
}
export function basisChangeGain(total: number, c: number, repeats = 0) {
  return Math.min(c + 1, invariantGain(total, c, repeats));
}
export function nextInvariantThreshold(gain: number, c: number, repeats = 0) {
  return invariantReference(c) * (2 ** (gain + 1) - 1) * 2 ** repeats;
}
export function reconstructionCostMultiplier(index: number, owned: number, level: number, archivedHighest = -1) {
  return index >= 0 && index <= archivedHighest && owned < 10 ? 1 - 0.12 * Math.min(4, Math.max(0, level)) : 1;
}
export function basisChangePreview(total: number, earned: number, p: readonly number[], owned: readonly number[], highest: number, repeats = 0) {
  const gained = basisChangeGain(total, frontierCycle(highest), repeats);
  const currentMultiplier = invariantProductionMultiplier(earned);
  const futureMultiplier = invariantProductionMultiplier(earned + gained);
  const unitCap = INHERITED_UNIT_CAPS[p[5] ?? 0];
  const instruments = owned.map(n => Math.min(n, unitCap));
  return { gained, currentMultiplier, futureMultiplier, unitCap, instruments,
    productionIncrease: 100 * (futureMultiplier / currentMultiplier - 1),
    retainedCount: instruments.filter(n => n > 0).length,
    reconstructionDiscount: Math.round(100 * 0.12 * (p[6] ?? 0)),
  };
}
export const instrumentCost = (i: number, owned: number) => Math.ceil(INSTRUMENTS[i].baseCost * 1.18 ** owned);
export function instrumentBulkCost(i: number, owned: number, quantity: number, factor = 1, reconstruction = 0, archived = -1) {
  let cost = 0;
  for (let k = 0; k < Math.max(0, Math.floor(quantity)); k++) {
    cost += Math.ceil(instrumentCost(i, owned + k) * factor * reconstructionCostMultiplier(i, owned + k, reconstruction, archived));
  }
  return cost;
}
export function workshopModuleCost(i: number, m: number) {
  const definition = WORKSHOP_MODULES[m];
  return definition ? Math.ceil(instrumentCost(i, definition.threshold) * definition.costFactor) : Infinity;
}
export const workshopMasteryCost = (i: number, rank: number) => Math.ceil(instrumentCost(i, 200 * 2 ** rank) * 0.2);
export function workshopOutput(i: number, owned: number, modules?: readonly number[], rank = 0) {
  return owned * INSTRUMENTS[i].baseProduction * workshopModuleMultiplier(modules) * workshopMasteryMultiplier(rank);
}
const globalIds = ["rank-compressor", "rank-balance", "spectral-chamber", "diagonalizer", "cayley-hamilton-forge", "orthogonal-diagonalizer", "schmidt-orthogonalizer"];
const discountIds = ["gauss-inverter", "triangularizer", "characteristic-decomposer", "positivity-analyzer", "orthogonal-chamber"];
const rewardIds = ["image-forge", "eigenspace-extractor", "minimal-extractor", "self-adjoint-symmetrizer", "metric-projector"];
const sumLevels = (units: readonly number[], ids: string[]) => ids.reduce((s, id) => s + instrumentLevel(units, id), 0);
export const matrixWorkshopCostMultiplier = (units: readonly number[]) => Math.max(0.5, 0.99 ** sumLevels(units, discountIds));
export const correctAnomalyRewardMultiplier = (units: readonly number[]) => {
  const n = sumLevels(units, rewardIds);
  return 1 + 0.5 * n / (n + 50);
};
export function basePassiveProduction(units: readonly number[], modules: readonly (readonly number[])[] = [], ranks: readonly number[] = []) {
  const group: Record<string, number> = {};
  INSTRUMENTS.forEach((w, i) => { group[w.cycleId] = (group[w.cycleId] ?? 0) + workshopOutput(i, units[i] ?? 0, modules[i], ranks[i] ?? 0); });
  const collect = (...ids: string[]) => ids.reduce((s, id) => s + (group[id] ?? 0), 0);
  const bound = (id: string, limit: number) => { const n = instrumentLevel(units, id); return 1 + limit * n / (n + 25); };
  const directions = collect("space-construction"), families = collect("families-dimension"), applications = collect("linear-maps");
  const matrices = collect("matrix-representations", "systems-gauss", "basis-changes", "determinants");
  const reduction = collect("stable-blocks", "eigen-elements", "matrix-reduction"), polynomial = collect("polynomial-reduction");
  const euclidean = collect("euclidean-foundations", "orthogonal-isometries", "euclidean-reduction");
  const remaining = Object.values(group).reduce((s, n) => s + n, 0) - directions - families - applications - matrices - reduction - polynomial - euclidean;
  const regional = directions * bound("family-assembler", 0.5)
    + families * bound("freedom-tester", 0.375) * bound("linear-transformer", 0.5)
    + applications * (bound("matrix-composer", 0.375) + bound("matrix-encoder", 0.5) - 1)
    + matrices * bound("characteristic-tracer", 0.5) + reduction * bound("polynomial-evaluator", 0.5)
    + polynomial * bound("adjoint-chamber", 0.5) + euclidean * bound("inner-product-tuner", 0.5) + remaining;
  return regional * globalIds.reduce((p, id) => p * bound(id, 0.25), 1);
}
