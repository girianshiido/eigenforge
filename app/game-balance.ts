export const PRESTIGE_SCALE = 750_000;
export const WORKSHOP_MODULES = [
  {
    threshold: 5,
    name: "Calibration",
    mark: "I",
    description: "Stabilise le flux propre de l’atelier.",
    multiplier: 1.25,
    costFactor: 0.7,
  },
  {
    threshold: 10,
    name: "Amplification",
    mark: "II",
    description: "Amplifie chaque unité déjà construite.",
    multiplier: 1.6,
    costFactor: 0.7,
  },
  {
    threshold: 25,
    name: "Couplage",
    mark: "III",
    description: "Couple les unités de l’atelier en un même système.",
    multiplier: 2,
    costFactor: 0.55,
  },
  {
    threshold: 50,
    name: "Résonance",
    mark: "IV",
    description: "Accorde durablement la production de l’atelier.",
    multiplier: 2,
    costFactor: 0.4,
  },
  {
    threshold: 100,
    name: "Stabilisation",
    mark: "V",
    description: "Achève l’architecture initiale de l’atelier.",
    multiplier: 2.5,
    costFactor: 0.25,
  },
] as const;
export const FIRST_MASTERY_THRESHOLD = 200;
export const STRUCTURAL_WORKSHOP_COUNT = 4;
export const MATRIX_WORKSHOP_START = 12;
export const REDUCTION_WORKSHOP_START = 16;
export const POLYNOMIAL_WORKSHOP_START = 20;
export const EUCLIDEAN_WORKSHOP_START = 24;
export const GEOMETRY_WORKSHOP_START = 28;

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
    mark: "E_λ",
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
  {
    name: "Chambre adjointe",
    mark: "u*",
    description: "Révèle l’adjoint et augmente de 4 % la production du cycle Calcul polynomial.",
    chapter: "Réduction euclidienne · MP",
    mission: "Construire l’adjoint",
    baseCost: 6_400_000_000_000_000_000,
    baseProduction: 1_350_000_000_000_000,
    unlock: 8_000_000_000_000_000_000,
    sector: "Adjoint",
  },
  {
    name: "Symétriseur spectral",
    mark: "S(E)",
    description: "Isole les endomorphismes autoadjoints et augmente de 2 % les récompenses justes.",
    chapter: "Réduction euclidienne · MP",
    mission: "Stabiliser la symétrie",
    baseCost: 30_000_000_000_000_000_000,
    baseProduction: 6_200_000_000_000_000,
    unlock: 38_000_000_000_000_000_000,
    sector: "Autoadjoint",
  },
  {
    name: "Diagonaliseur orthogonal",
    mark: "PDPᵀ",
    description: "Oriente une base propre orthonormée et amplifie toute la production de 2 %.",
    chapter: "Réduction euclidienne · MP",
    mission: "Orthonormaliser le spectre",
    baseCost: 140_000_000_000_000_000_000,
    baseProduction: 29_000_000_000_000_000,
    unlock: 180_000_000_000_000_000_000,
    sector: "Théorème spectral",
  },
  {
    name: "Analyseur de positivité",
    mark: "S^{++}",
    description: "Sépare positivité et positivité définie, puis réduit de 1 % le prix des ateliers.",
    chapter: "Réduction euclidienne · MP",
    mission: "Mesurer la positivité",
    baseCost: 660_000_000_000_000_000_000,
    baseProduction: 135_000_000_000_000_000,
    unlock: 840_000_000_000_000_000_000,
    sector: "Positivité",
  },
  {
    name: "Accordeur scalaire",
    mark: "⟨·, ·⟩",
    description: "Mesure angles, normes et distances, puis augmente de 4 % la production du cycle Réduction euclidienne.",
    chapter: "Fondations euclidiennes · MPSI",
    mission: "Accorder le produit scalaire",
    baseCost: 3.1e21,
    baseProduction: 6.3e17,
    unlock: 4e21,
    sector: "Produit scalaire",
  },
  {
    name: "Orthogonalisateur de Schmidt",
    mark: "ON",
    description: "Transforme les familles libres en bases orthonormées et amplifie toute la production de 2 %.",
    chapter: "Fondations euclidiennes · MPSI",
    mission: "Orthonormaliser une famille",
    baseCost: 1.5e22,
    baseProduction: 3.1e18,
    unlock: 1.9e22,
    sector: "Gram–Schmidt",
  },
  {
    name: "Chambre orthogonale",
    mark: "F^{⊥}",
    description: "Isole les directions orthogonales à F et réduit de 1 % le prix de tous les ateliers.",
    chapter: "Fondations euclidiennes · MPSI",
    mission: "Déployer l’orthogonal",
    baseCost: 7.2e22,
    baseProduction: 1.5e19,
    unlock: 9.2e22,
    sector: "Orthogonal",
  },
  {
    name: "Projecteur métrique",
    mark: "p_F",
    description: "Projette sur le sous-espace le plus proche et augmente de 2 % les récompenses des réponses justes.",
    chapter: "Fondations euclidiennes · MPSI",
    mission: "Projeter sur un sous-espace",
    baseCost: 3.5e23,
    baseProduction: 7.4e19,
    unlock: 4.5e23,
    sector: "Projection et distance",
  },
] as const;

export function instrumentCost(index: number, owned: number) {
  return Math.ceil(INSTRUMENTS[index].baseCost * Math.pow(1.18, owned));
}

export function workshopModuleCost(index: number, moduleIndex: number) {
  const module = WORKSHOP_MODULES[moduleIndex];
  if (!module) return Number.POSITIVE_INFINITY;
  return Math.ceil(
    instrumentCost(index, module.threshold) * module.costFactor,
  );
}

export function workshopModuleMultiplier(
  modules: readonly number[] | undefined,
) {
  return WORKSHOP_MODULES.reduce(
    (multiplier, module, index) =>
      multiplier * ((modules?.[index] ?? 0) > 0 ? module.multiplier : 1),
    1,
  );
}

export function legacyWorkshopModules(owned: number) {
  return WORKSHOP_MODULES.map((_, moduleIndex) => {
    if (moduleIndex <= 1) return owned >= 10 ? 1 : 0;
    if (moduleIndex === 2) return owned >= 25 ? 1 : 0;
    if (moduleIndex === 3) return owned >= 50 ? 1 : 0;
    return 0;
  });
}

export function workshopMasteryThreshold(rank: number) {
  return FIRST_MASTERY_THRESHOLD * Math.pow(2, Math.max(0, rank));
}

export function workshopMasteryCost(index: number, rank: number) {
  return Math.ceil(
    instrumentCost(index, workshopMasteryThreshold(rank)) * 0.2,
  );
}

export function workshopMasteryMultiplier(rank: number) {
  return Math.pow(2, Math.max(0, rank));
}

export function workshopOutput(
  index: number,
  owned: number,
  modules?: readonly number[],
  masteryRank = 0,
) {
  return (
    owned *
    INSTRUMENTS[index].baseProduction *
    workshopModuleMultiplier(modules) *
    workshopMasteryMultiplier(masteryRank)
  );
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
  instrumentModules: readonly (readonly number[])[] = [],
  instrumentMasteries: readonly number[] = [],
) {
  const outputs = INSTRUMENTS.map((_, index) => {
    const count = instruments[index] ?? 0;
    return workshopOutput(
      index,
      count,
      instrumentModules[index],
      instrumentMasteries[index] ?? 0,
    );
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
    .slice(POLYNOMIAL_WORKSHOP_START, EUCLIDEAN_WORKSHOP_START)
    .reduce((sum, output) => sum + output, 0);
  const euclideanOutput = outputs
    .slice(EUCLIDEAN_WORKSHOP_START, GEOMETRY_WORKSHOP_START)
    .reduce((sum, output) => sum + output, 0);
  const geometryOutput = outputs
    .slice(GEOMETRY_WORKSHOP_START)
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
  const adjointMultiplier = 1 + (instruments[24] ?? 0) * 0.04;
  const orthogonalDiagonalMultiplier = 1 + (instruments[26] ?? 0) * 0.02;
  const innerProductMultiplier = 1 + (instruments[28] ?? 0) * 0.04;
  const orthonormalMultiplier = 1 + (instruments[29] ?? 0) * 0.02;

  return (
    (directionalOutput * directionalMultiplier +
      familyOutput * familyMultiplier * transformationMultiplier +
      applicationOutput * matrixCompositionMultiplier +
      matrixOutput * characteristicMultiplier +
      reductionOutput * polynomialMultiplier +
      polynomialOutput * adjointMultiplier +
      euclideanOutput * innerProductMultiplier +
      geometryOutput +
      applicationOutput * (matrixEncodingMultiplier - 1)) *
    rankMultiplier *
    rankTheoremMultiplier *
    spectralMultiplier *
    diagonalMultiplier *
    cayleyHamiltonMultiplier *
    orthogonalDiagonalMultiplier *
    orthonormalMultiplier
  );
}

export function matrixWorkshopCostMultiplier(
  instruments: readonly number[],
) {
  return Math.pow(
    0.99,
    (instruments[14] ?? 0) +
      (instruments[19] ?? 0) +
      (instruments[23] ?? 0) +
      (instruments[27] ?? 0) +
      (instruments[30] ?? 0),
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
    (instruments[21] ?? 0) * 0.02 +
    (instruments[25] ?? 0) * 0.02 +
    (instruments[31] ?? 0) * 0.02
  );
}

export function invariantGain(runTotal: number) {
  return Math.floor(Math.sqrt(runTotal / PRESTIGE_SCALE));
}

export function nextInvariantThreshold(currentGain: number) {
  return PRESTIGE_SCALE * Math.pow(currentGain + 1, 2);
}
