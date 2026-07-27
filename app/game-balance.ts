export const PRESTIGE_SCALE = 750_000;
export const INSTRUMENT_MILESTONES = [10, 25, 50] as const;

export const INSTRUMENTS = [
  {
    name: "Émetteur vectoriel",
    mark: "→",
    description: "Déploie continûment de nouvelles directions dans le réseau.",
    baseCost: 24,
    baseProduction: 0.5,
    unlock: 0,
    sector: "Vecteurs",
  },
  {
    name: "Chambre des bases",
    mark: "B",
    description: "Organise les directions indépendantes en repères efficaces.",
    baseCost: 350,
    baseProduction: 3.2,
    unlock: 400,
    sector: "Bases",
  },
  {
    name: "Transformateur linéaire",
    mark: "ƒ",
    description: "Transporte le réseau sans rompre sa structure.",
    baseCost: 12_000,
    baseProduction: 16,
    unlock: 15_000,
    sector: "Applications",
  },
] as const;

export function milestoneMultiplier(owned: number) {
  const reached = INSTRUMENT_MILESTONES.filter(
    (milestone) => owned >= milestone,
  ).length;
  return Math.pow(2, reached);
}

export function instrumentCost(index: number, owned: number) {
  return Math.ceil(INSTRUMENTS[index].baseCost * Math.pow(1.18, owned));
}

export function basePassiveProduction(
  instruments: readonly [number, number, number],
) {
  return instruments.reduce(
    (sum, count, index) =>
      sum +
      count *
        INSTRUMENTS[index].baseProduction *
        milestoneMultiplier(count),
    0,
  );
}

export function invariantGain(runTotal: number) {
  return Math.floor(Math.sqrt(runTotal / PRESTIGE_SCALE));
}

export function nextInvariantThreshold(currentGain: number) {
  return PRESTIGE_SCALE * Math.pow(currentGain + 1, 2);
}
