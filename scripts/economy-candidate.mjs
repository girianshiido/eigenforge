import { INSTRUMENTS, PRESTIGE_SCALE } from "../app/game-balance.ts";

// Audited design candidate, deliberately NOT imported by the playable game.
// These functions validate the proposed arithmetic, not the full playthrough.
export const CANDIDATE_PROTOCOL_COSTS = [
  { name: "Homogénéité", costs: [1, 2, 3, 5, 8, 12] },
  { name: "Somme directe", costs: [2, 3, 5, 8, 12, 18] },
  { name: "Gauss", costs: [2, 4, 7, 11, 16] },
  { name: "Résonance", costs: [1, 2, 4, 6, 9] },
  { name: "Image fidèle", costs: [2, 3, 5, 8, 12] },
  { name: "Base héritée", costs: [1, 3, 6] },
  { name: "Reconstruction", costs: [2, 4, 7, 11] },
  { name: "Modules automatiques", costs: [6, 12, 20] },
  { name: "Anciens ateliers automatiques", costs: [12, 20] },
];

// Concrete choices for the event simulation; still isolated from the game.
export const CANDIDATE_PROTOCOL_GATES = [
  [1, 3, 5, 8, 11, 14], [1, 3, 5, 8, 11, 14],
  [1, 3, 6, 10, 14], [1, 3, 6, 10, 14], [1, 3, 6, 10, 14],
  [2, 5, 9], [2, 5, 9, 13], [4, 8, 12], [8, 12],
];
export const CANDIDATE_EDUCATIONAL_GATES = [4, 8, 12, 15, 17];

export function candidateGain(runTotal, frontierCycle, repeatCount = 0) {
  const c = Math.max(1, Math.min(17, Math.floor(frontierCycle)));
  const reference = Math.max(PRESTIGE_SCALE, INSTRUMENTS[(c - 1) * 4].baseCost);
  const cap = c + 1;
  // Every reset that mints currency at the same frontier makes the next
  // repeated run less profitable. Opening a NEW frontier resets this count.
  const progressRatio = Math.max(0, runTotal) / reference / 2 ** Math.max(0, repeatCount);
  return Math.min(cap, Math.floor(Math.log2(1 + progressRatio)));
}

export function candidatePermanentMultiplier(total) {
  return 1 + 0.2 * Math.sqrt(Math.max(0, total));
}

export function candidateWorkshopCost(index) {
  if (index < 4) return INSTRUMENTS[index].baseCost;
  const cycleStart = Math.floor(index / 4) * 4;
  // Unchanged first-entry reference; cheaper gradual expansion inside a cycle.
  return Math.ceil(INSTRUMENTS[cycleStart].baseCost * 2.8 ** (index % 4));
}

export function candidateWorkshopProduction(index) {
  if (index < 4) return INSTRUMENTS[index].baseProduction;
  const cycleStart = Math.floor(index / 4) * 4;
  return INSTRUMENTS[cycleStart].baseProduction * 2.6 ** (index % 4);
}

export function candidateCostFactor(workshopDiscount, permanentDiscount) {
  return Math.max(0.5, workshopDiscount) * Math.max(0.7, permanentDiscount);
}

export function candidateGlobalSynergy(level) {
  return 1 + 0.25 * Math.max(0, level) / (Math.max(0, level) + 25);
}

export function candidateQuestionReward(basePassive, correct, improvementFactor = 1) {
  return correct ? Math.max(24, basePassive * 12) * Math.min(2, Math.max(1, improvementFactor)) : 0;
}

export function candidateStreakMultiplier(streak) {
  return streak >= 3 ? 2 : 1;
}

export function candidateQuote() {
  const totals = CANDIDATE_PROTOCOL_COSTS.map(p => ({ name: p.name, total: p.costs.reduce((a, b) => a + b, 0) }));
  // Financing envelope only: these nominal volumes are not a timed simulation.
  const funding = Array.from({ length: 17 }, (_, i) => {
    const c = i + 1;
    const reference = Math.max(PRESTIGE_SCALE, INSTRUMENTS[i * 4].baseCost);
    const gains = [32, 128, 512].map((ratio, r) => candidateGain(reference * ratio, c, r));
    return { cycle: c, gains, total: gains.reduce((a, b) => a + b, 0) };
  });
  return { totals, completeCost: totals.reduce((s, p) => s + p.total, 0),
    funding, fundingTotal: funding.reduce((s, c) => s + c.total, 0),
    example44: candidateGain(PRESTIGE_SCALE * 44 ** 2, 3),
    example88: candidateGain(PRESTIGE_SCALE * 88 ** 2, 3),
    repeated44: Array.from({ length: 5 }, (_, r) => candidateGain(PRESTIGE_SCALE * 44 ** 2, 3, r)),
    cycles: [1, 3, 8, 12, 17].map(c => ({ cycle: c, gainCap: c + 1 })),
    globalSynergyAt100: candidateGlobalSynergy(100) ** 7,
    minimumTotalCostFactor: candidateCostFactor(1e-12, 0.001),
    permanentMultipliers: [1, 15, 44, 300, 1000].map(n => ({ total: n, multiplier: candidatePermanentMultiplier(n) })),
  };
}
