export const PRESTIGE_SCALE = 750_000;
export const INSTRUMENT_MILESTONES = [10, 25, 50] as const;
export const STRUCTURAL_WORKSHOP_COUNT = 4;

export const INSTRUMENTS = [
  {
    name: "Générateur axial",
    mark: "e₁",
    description: "Forge e₁. Les unités suivantes densifient le flux de coordonnées sur cet axe.",
    chapter: "Construction de l’espace",
    mission: "Forger e₁",
    baseCost: 24,
    baseProduction: 0.5,
    unlock: 0,
    sector: "Dimension I",
  },
  {
    name: "Déployeur planaire",
    mark: "e₂",
    description: "Ajoute e₂, indépendante de e₁, et ouvre le plan vectoriel.",
    chapter: "Construction de l’espace",
    mission: "Déployer le plan",
    baseCost: 350,
    baseProduction: 3.2,
    unlock: 400,
    sector: "Dimension II",
  },
  {
    name: "Forge spatiale",
    mark: "e₃",
    description: "Ajoute e₃ à la base et déploie la première projection de l’espace.",
    chapter: "Construction de l’espace",
    mission: "Ouvrir la troisième dimension",
    baseCost: 12_000,
    baseProduction: 16,
    unlock: 15_000,
    sector: "Dimension III",
  },
  {
    name: "Extension dimensionnelle",
    mark: "e₄",
    description: "Ajoute e₄. La carte conserve une projection des trois premières directions.",
    chapter: "Construction de l’espace",
    mission: "Dépasser la projection",
    baseCost: 75_000,
    baseProduction: 72,
    unlock: 80_000,
    sector: "Dimension IV",
  },
  {
    name: "Assembleur de familles",
    mark: "F",
    description: "Regroupe les vecteurs en familles et amplifie de 4 % les forges directionnelles.",
    chapter: "Familles et rang",
    mission: "Assembler une famille",
    baseCost: 260_000,
    baseProduction: 180,
    unlock: 300_000,
    sector: "Familles",
  },
  {
    name: "Testeur de liberté",
    mark: "L",
    description: "Écarte les dépendances et renforce de 3 % la production du secteur Familles.",
    chapter: "Familles et rang",
    mission: "Détecter les dépendances",
    baseCost: 1_200_000,
    baseProduction: 720,
    unlock: 1_500_000,
    sector: "Liberté",
  },
  {
    name: "Extracteur de bases",
    mark: "B",
    description: "Extrait une base des familles génératrices et augmente la puissance manuelle de 5 %.",
    chapter: "Familles et rang",
    mission: "Extraire une base",
    baseCost: 6_000_000,
    baseProduction: 3_200,
    unlock: 7_500_000,
    sector: "Bases",
  },
  {
    name: "Compresseur de rang",
    mark: "rg",
    description: "Condense l’information utile et multiplie toute la production de 2 %.",
    chapter: "Familles et rang",
    mission: "Stabiliser le rang",
    baseCost: 30_000_000,
    baseProduction: 14_000,
    unlock: 40_000_000,
    sector: "Rang",
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
  instruments: readonly number[],
) {
  const outputs = INSTRUMENTS.map((instrument, index) => {
    const count = instruments[index] ?? 0;
    return count * instrument.baseProduction * milestoneMultiplier(count);
  });
  const directionalOutput = outputs
    .slice(0, STRUCTURAL_WORKSHOP_COUNT)
    .reduce((sum, output) => sum + output, 0);
  const familyOutput = outputs
    .slice(STRUCTURAL_WORKSHOP_COUNT)
    .reduce((sum, output) => sum + output, 0);
  const directionalMultiplier = 1 + (instruments[4] ?? 0) * 0.04;
  const familyMultiplier = 1 + (instruments[5] ?? 0) * 0.03;
  const rankMultiplier = 1 + (instruments[7] ?? 0) * 0.02;

  return (
    (directionalOutput * directionalMultiplier +
      familyOutput * familyMultiplier) *
    rankMultiplier
  );
}

export function invariantGain(runTotal: number) {
  return Math.floor(Math.sqrt(runTotal / PRESTIGE_SCALE));
}

export function nextInvariantThreshold(currentGain: number) {
  return PRESTIGE_SCALE * Math.pow(currentGain + 1, 2);
}
