export const PRESTIGE_SCALE = 750_000;
export const INSTRUMENT_MILESTONES = [10, 25, 50] as const;
export const STRUCTURAL_WORKSHOP_COUNT = 4;
export const MATRIX_WORKSHOP_START = 12;
export const REDUCTION_WORKSHOP_START = 16;
export const POLYNOMIAL_WORKSHOP_START = 20;

export const INVARIANT_PROTOCOLS = [
  {
    name: "Principe d’homogénéité",
    mark: "α",
    description: "Chaque niveau amplifie de 25 % les coordonnées forgées manuellement.",
    baseCost: 1,
    costStep: 1,
    maxLevel: 8,
  },
  {
    name: "Somme directe",
    mark: "⊕",
    description: "Chaque niveau augmente de 12 % toute la production passive.",
    baseCost: 2,
    costStep: 2,
    maxLevel: 8,
  },
  {
    name: "Réduction de Gauss",
    mark: "G",
    description: "Chaque niveau réduit de 5 % le prix de tous les ateliers.",
    baseCost: 3,
    costStep: 2,
    maxLevel: 6,
  },
  {
    name: "Résonance spectrale",
    mark: "ρ",
    description: "Chaque niveau augmente de 12 % la stabilité de la résonance.",
    baseCost: 2,
    costStep: 2,
    maxLevel: 6,
  },
  {
    name: "Image fidèle",
    mark: "Im",
    description: "Chaque niveau augmente de 15 % les gains des réponses justes.",
    baseCost: 3,
    costStep: 3,
    maxLevel: 6,
  },
  {
    name: "Base héritée",
    mark: "B",
    description: "Conserve un atelier dimensionnel supplémentaire après chaque changement de base.",
    baseCost: 5,
    costStep: 5,
    maxLevel: 3,
  },
] as const;

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
  {
    name: "Transformateur linéaire",
    mark: "f",
    description: "Applique f au réseau et réinjecte 4 % de la production du cycle Familles.",
    chapter: "Applications linéaires",
    mission: "Activer la transformation",
    baseCost: 120_000_000,
    baseProduction: 55_000,
    unlock: 160_000_000,
    sector: "Application",
  },
  {
    name: "Chambre du noyau",
    mark: "Ker",
    description: "Isole les directions écrasées et ralentit de 4 % la dissipation de résonance.",
    chapter: "Applications linéaires",
    mission: "Isoler le noyau",
    baseCost: 600_000_000,
    baseProduction: 230_000,
    unlock: 750_000_000,
    sector: "Noyau",
  },
  {
    name: "Forge de l’image",
    mark: "Im",
    description: "Canalise les directions atteintes et augmente de 3 % les récompenses des réponses justes.",
    chapter: "Applications linéaires",
    mission: "Forger l’image",
    baseCost: 3_000_000_000,
    baseProduction: 1_000_000,
    unlock: 3_500_000_000,
    sector: "Image",
  },
  {
    name: "Balance du rang",
    mark: "rg f",
    description: "Équilibre noyau et image selon le théorème du rang, puis amplifie toute la production de 2 %.",
    chapter: "Applications linéaires",
    mission: "Équilibrer le rang",
    baseCost: 15_000_000_000,
    baseProduction: 4_500_000,
    unlock: 18_000_000_000,
    sector: "Théorème du rang",
  },
  {
    name: "Encodeur matriciel",
    mark: "Mat",
    description: "Encode les applications dans une base et réinjecte 4 % du flux des transformateurs.",
    chapter: "Matrices et réduction",
    mission: "Encoder une application",
    baseCost: 60_000_000_000,
    baseProduction: 18_000_000,
    unlock: 75_000_000_000,
    sector: "Matrice",
  },
  {
    name: "Composeur matriciel",
    mark: "AB",
    description: "Compose les transformations et renforce de 3 % la production du cycle Applications.",
    chapter: "Matrices et réduction",
    mission: "Composer deux matrices",
    baseCost: 280_000_000_000,
    baseProduction: 75_000_000,
    unlock: 350_000_000_000,
    sector: "Produit",
  },
  {
    name: "Inverseur de Gauss",
    mark: "A⁻¹",
    description: "Automatise les opérations élémentaires et réduit de 1 % le prix de tous les ateliers.",
    chapter: "Matrices et réduction",
    mission: "Inverser la transformation",
    baseCost: 1_300_000_000_000,
    baseProduction: 330_000_000,
    unlock: 1_700_000_000_000,
    sector: "Inversibilité",
  },
  {
    name: "Chambre spectrale",
    mark: "λ",
    description: "Ouvre la partie MP — matrices par blocs et éléments propres — et amplifie de 2 % toute la production du réseau.",
    chapter: "Matrices et réduction",
    mission: "Révéler le spectre",
    baseCost: 6_000_000_000_000,
    baseProduction: 1_500_000_000,
    unlock: 8_000_000_000_000,
    sector: "Spectre",
  },
  {
    name: "Traceur caractéristique",
    mark: "χ",
    description: "Déploie χ_A et augmente de 4 % la production du cycle Matrices.",
    chapter: "Réduction spectrale · MP",
    mission: "Tracer le polynôme caractéristique",
    baseCost: 28_000_000_000_000,
    baseProduction: 6_800_000_000,
    unlock: 36_000_000_000_000,
    sector: "Polynôme caractéristique",
  },
  {
    name: "Extracteur propre",
    mark: "Eλ",
    description: "Isole les espaces propres et augmente de 2 % les récompenses des réponses justes.",
    chapter: "Réduction spectrale · MP",
    mission: "Extraire les espaces propres",
    baseCost: 130_000_000_000_000,
    baseProduction: 30_000_000_000,
    unlock: 170_000_000_000_000,
    sector: "Espaces propres",
  },
  {
    name: "Diagonaliseur",
    mark: "D",
    description: "Assemble une base de vecteurs propres et amplifie toute la production de 2 %.",
    chapter: "Réduction spectrale · MP",
    mission: "Former une base propre",
    baseCost: 610_000_000_000_000,
    baseProduction: 140_000_000_000,
    unlock: 780_000_000_000_000,
    sector: "Diagonalisation",
  },
  {
    name: "Trigonaliseur",
    mark: "T",
    description: "Stabilise les formes triangulaires et réduit de 1 % le prix de tous les ateliers.",
    chapter: "Réduction spectrale · MP",
    mission: "Achever la réduction",
    baseCost: 2_850_000_000_000_000,
    baseProduction: 650_000_000_000,
    unlock: 3_600_000_000_000_000,
    sector: "Trigonalisation",
  },
  {
    name: "Évaluateur polynomial",
    mark: "P(u)",
    description: "Évalue les polynômes en u et augmente de 4 % la production du cycle Réduction.",
    chapter: "Calcul polynomial · MP",
    mission: "Évaluer P(u)",
    baseCost: 13_500_000_000_000_000,
    baseProduction: 3_000_000_000_000,
    unlock: 17_000_000_000_000_000,
    sector: "Polynômes d’endomorphismes",
  },
  {
    name: "Extracteur minimal",
    mark: "π_u",
    description: "Isole le polynôme minimal et augmente de 2 % les récompenses des réponses justes.",
    chapter: "Calcul polynomial · MP",
    mission: "Extraire le polynôme minimal",
    baseCost: 63_000_000_000_000_000,
    baseProduction: 14_000_000_000_000,
    unlock: 80_000_000_000_000_000,
    sector: "Polynôme minimal",
  },
  {
    name: "Forge de Cayley-Hamilton",
    mark: "χ_u(u)",
    description: "Injecte χ_u(u) = 0 dans le réseau et amplifie toute la production de 2 %.",
    chapter: "Calcul polynomial · MP",
    mission: "Annuler l’endomorphisme",
    baseCost: 295_000_000_000_000_000,
    baseProduction: 65_000_000_000_000,
    unlock: 380_000_000_000_000_000,
    sector: "Cayley-Hamilton",
  },
  {
    name: "Décomposeur caractéristique",
    mark: "N_λ",
    description: "Sépare les sous-espaces caractéristiques et réduit de 1 % le prix de tous les ateliers.",
    chapter: "Calcul polynomial · MP",
    mission: "Décomposer les noyaux",
    baseCost: 1_380_000_000_000_000_000,
    baseProduction: 300_000_000_000_000,
    unlock: 1_750_000_000_000_000_000,
    sector: "Sous-espaces caractéristiques",
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

export function invariantProtocolCost(index: number, level: number) {
  const protocol = INVARIANT_PROTOCOLS[index];
  return protocol.baseCost + protocol.costStep * level;
}

export function protocolPassiveMultiplier(
  protocols: readonly number[],
) {
  return 1 + (protocols[1] ?? 0) * 0.12;
}

export function protocolManualMultiplier(
  protocols: readonly number[],
) {
  return 1 + (protocols[0] ?? 0) * 0.25;
}

export function protocolWorkshopCostMultiplier(
  protocols: readonly number[],
) {
  return Math.pow(0.95, protocols[2] ?? 0);
}

export function protocolResonanceMultiplier(
  protocols: readonly number[],
) {
  return 1 + (protocols[3] ?? 0) * 0.12;
}

export function protocolAnomalyMultiplier(
  protocols: readonly number[],
) {
  return 1 + (protocols[4] ?? 0) * 0.15;
}

export function inheritedStructuralWorkshops(
  protocols: readonly number[],
) {
  return Math.min(3, protocols[5] ?? 0);
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
    .slice(STRUCTURAL_WORKSHOP_COUNT, 8)
    .reduce((sum, output) => sum + output, 0);
  const applicationOutput = outputs
    .slice(8, MATRIX_WORKSHOP_START)
    .reduce((sum, output) => sum + output, 0);
  const matrixOutput = outputs
    .slice(MATRIX_WORKSHOP_START, REDUCTION_WORKSHOP_START)
    .reduce((sum, output) => sum + output, 0);
  const reductionOutput = outputs
    .slice(REDUCTION_WORKSHOP_START, POLYNOMIAL_WORKSHOP_START)
    .reduce((sum, output) => sum + output, 0);
  const polynomialOutput = outputs
    .slice(POLYNOMIAL_WORKSHOP_START)
    .reduce((sum, output) => sum + output, 0);
  const directionalMultiplier = 1 + (instruments[4] ?? 0) * 0.04;
  const familyMultiplier = 1 + (instruments[5] ?? 0) * 0.03;
  const rankMultiplier = 1 + (instruments[7] ?? 0) * 0.02;
  const transformationMultiplier = 1 + (instruments[8] ?? 0) * 0.04;
  const rankTheoremMultiplier = 1 + (instruments[11] ?? 0) * 0.02;
  const matrixEncodingMultiplier = 1 + (instruments[12] ?? 0) * 0.04;
  const matrixCompositionMultiplier = 1 + (instruments[13] ?? 0) * 0.03;
  const spectralMultiplier = 1 + (instruments[15] ?? 0) * 0.02;
  const characteristicMultiplier = 1 + (instruments[16] ?? 0) * 0.04;
  const diagonalMultiplier = 1 + (instruments[18] ?? 0) * 0.02;
  const polynomialMultiplier = 1 + (instruments[20] ?? 0) * 0.04;
  const cayleyHamiltonMultiplier = 1 + (instruments[22] ?? 0) * 0.02;

  return (
    (directionalOutput * directionalMultiplier +
      familyOutput * familyMultiplier * transformationMultiplier +
      applicationOutput * matrixCompositionMultiplier +
      matrixOutput * characteristicMultiplier +
      reductionOutput * polynomialMultiplier +
      polynomialOutput +
      applicationOutput * (matrixEncodingMultiplier - 1)) *
    rankMultiplier *
    rankTheoremMultiplier *
    spectralMultiplier *
    diagonalMultiplier *
    cayleyHamiltonMultiplier
  );
}

export function matrixWorkshopCostMultiplier(
  instruments: readonly number[],
) {
  return Math.pow(
    0.99,
    (instruments[14] ?? 0) +
      (instruments[19] ?? 0) +
      (instruments[23] ?? 0),
  );
}

export function resonanceDecayRate(instruments: readonly number[]) {
  return 8 / (1 + (instruments[9] ?? 0) * 0.04);
}

export function correctAnomalyRewardMultiplier(
  instruments: readonly number[],
) {
  return (
    1 +
    (instruments[10] ?? 0) * 0.03 +
    (instruments[17] ?? 0) * 0.02 +
    (instruments[21] ?? 0) * 0.02
  );
}

export function invariantGain(runTotal: number) {
  return Math.floor(Math.sqrt(runTotal / PRESTIGE_SCALE));
}

export function nextInvariantThreshold(currentGain: number) {
  return PRESTIGE_SCALE * Math.pow(currentGain + 1, 2);
}
