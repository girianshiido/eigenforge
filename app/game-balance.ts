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

type WorkshopProgram = "MPSI" | "MP";

type WorkshopSeed = {
  id: string;
  name: string;
  mark: string;
  description: string;
  mission: string;
  sector: string;
};

type WorkshopCycleSeed = {
  id: string;
  title: string;
  program: WorkshopProgram;
  workshops: WorkshopSeed[];
};

function workshop(
  id: string,
  name: string,
  mark: string,
  description: string,
  mission: string,
  sector: string,
): WorkshopSeed {
  return { id, name, mark, description, mission, sector };
}

const WORKSHOP_CYCLE_SEEDS: WorkshopCycleSeed[] = [
  {
    id: "space-construction",
    title: "Construction de l’espace",
    program: "MPSI",
    workshops: [
      workshop("axis-generator", "Générateur axial", "e₁", "Forge e₁. Les unités suivantes densifient le flux sur cet axe.", "Forger e₁", "Dimension I"),
      workshop("plane-deployer", "Déployeur planaire", "e₂", "Ajoute e₂, indépendante de e₁, et ouvre le plan vectoriel.", "Déployer le plan", "Dimension II"),
      workshop("spatial-forge", "Forge spatiale", "e₃", "Ajoute e₃ à la base et déploie une projection de l’espace.", "Ouvrir la troisième dimension", "Dimension III"),
      workshop("dimension-extension", "Extension dimensionnelle", "e₄", "Ajoute e₄ tandis que la carte conserve une projection lisible.", "Dépasser la projection", "Dimension IV"),
    ],
  },
  {
    id: "families-dimension",
    title: "Familles, bases et dimension",
    program: "MPSI",
    workshops: [
      workshop("family-assembler", "Assembleur de familles", "F", "Regroupe les vecteurs en familles et amplifie les forges directionnelles.", "Assembler une famille", "Familles"),
      workshop("freedom-tester", "Testeur de liberté", "L", "Écarte les dépendances et renforce la production des familles.", "Détecter les dépendances", "Liberté"),
      workshop("basis-extractor", "Extracteur de bases", "B", "Extrait une base d’une famille génératrice et renforce l’émission manuelle.", "Extraire une base", "Bases"),
      workshop("rank-compressor", "Compresseur de rang", "rg", "Condense le nombre de directions indépendantes du réseau.", "Stabiliser le rang", "Rang"),
    ],
  },
  {
    id: "subspaces-sums",
    title: "Sous-espaces et sommes directes",
    program: "MPSI",
    workshops: [
      workshop("subspace-generator", "Générateur de sous-espaces", "Vect", "Engendre le plus petit sous-espace contenant une famille donnée.", "Engendrer un sous-espace", "Sous-espaces"),
      workshop("intersection-chamber", "Chambre d’intersection", "F∩G", "Isole les directions communes à plusieurs sous-espaces.", "Croiser deux sous-espaces", "Intersection"),
      workshop("direct-sum-splitter", "Séparateur de somme directe", "F⊕G", "Décompose chaque vecteur en composantes indépendantes et uniques.", "Rendre la somme directe", "Somme directe"),
      workshop("grassmann-balancer", "Balance de Grassmann", "dim", "Équilibre dimensions, intersections et sous-espaces supplémentaires.", "Équilibrer les dimensions", "Grassmann"),
    ],
  },
  {
    id: "linear-maps",
    title: "Applications linéaires",
    program: "MPSI",
    workshops: [
      workshop("linear-transformer", "Transformateur linéaire", "f", "Applique f au réseau et réinjecte une part de la production des familles.", "Activer la transformation", "Application"),
      workshop("kernel-chamber", "Chambre du noyau", "Ker", "Isole les directions écrasées et ralentit la dissipation de résonance.", "Isoler le noyau", "Noyau"),
      workshop("image-forge", "Forge de l’image", "Im", "Canalise les directions atteintes et renforce les réponses justes.", "Forger l’image", "Image"),
      workshop("rank-balance", "Balance du rang", "rg f", "Équilibre noyau et image selon le théorème du rang.", "Équilibrer le rang", "Théorème du rang"),
    ],
  },
  {
    id: "endomorphisms",
    title: "Endomorphismes et décompositions",
    program: "MPSI",
    workshops: [
      workshop("composition-engine", "Moteur de composition", "v∘u", "Enchaîne les applications linéaires sans supposer leur commutativité.", "Composer les applications", "Composition"),
      workshop("isomorphism-gate", "Porte d’isomorphisme", "≃", "Relie les espaces de même dimension par une transformation bijective.", "Construire un isomorphisme", "Isomorphismes"),
      workshop("projector-chamber", "Chambre projective", "p²=p", "Stabilise les projecteurs associés aux décompositions de l’espace.", "Reconnaître un projecteur", "Projecteurs"),
      workshop("symmetry-reactor", "Réacteur de symétrie", "s²=id", "Inverse deux fois la transformation pour retrouver chaque vecteur.", "Reconnaître une symétrie", "Symétries"),
    ],
  },
  {
    id: "forms-affine",
    title: "Formes, hyperplans et affine",
    program: "MPSI",
    workshops: [
      workshop("linear-form-sensor", "Capteur de formes linéaires", "φ", "Mesure une coordonnée linéaire et révèle son noyau.", "Activer une forme linéaire", "Formes linéaires"),
      workshop("hyperplane-cutter", "Découpeur d’hyperplans", "H", "Découpe l’espace par une équation linéaire homogène.", "Définir un hyperplan", "Hyperplans"),
      workshop("equation-weaver", "Tisseur d’équations", "AX=0", "Convertit paramétrisations et systèmes d’équations de sous-espaces.", "Équationner un sous-espace", "Équations"),
      workshop("affine-translator", "Translateur affine", "A+F", "Déplace un sous-espace sans perdre sa direction vectorielle.", "Translater un sous-espace", "Géométrie affine"),
    ],
  },
  {
    id: "matrix-representations",
    title: "Représentations matricielles",
    program: "MPSI",
    workshops: [
      workshop("matrix-encoder", "Encodeur matriciel", "Mat", "Encode les images d’une base dans les colonnes d’une matrice.", "Encoder une application", "Matrice"),
      workshop("matrix-composer", "Composeur matriciel", "AB", "Traduit la composition des transformations par un produit matriciel.", "Composer deux matrices", "Produit"),
      workshop("canonical-matrix-link", "Relais canonique", "X↦AX", "Associe canoniquement une application linéaire à chaque matrice.", "Relier matrice et application", "Application canonique"),
      workshop("matrix-kernel-imager", "Scanner matriciel", "Ker/Im", "Lit noyau, image et rang à travers lignes et colonnes.", "Scanner une matrice", "Noyau et image"),
    ],
  },
  {
    id: "systems-gauss",
    title: "Systèmes, Gauss et rang",
    program: "MPSI",
    workshops: [
      workshop("system-solver", "Résolveur de systèmes", "AX=B", "Distingue compatibilité, unicité et structure affine des solutions.", "Résoudre AX=B", "Systèmes"),
      workshop("gauss-inverter", "Inverseur de Gauss", "A⁻¹", "Automatise les opérations élémentaires et réduit le prix des ateliers.", "Inverser la transformation", "Inversibilité"),
      workshop("matrix-rank-reducer", "Réducteur de rang", "J_r", "Réduit une matrice à sa forme canonique d’équivalence.", "Calculer le rang", "Rang matriciel"),
      workshop("matrix-equivalence-classifier", "Classifieur d’équivalence", "PAQ", "Regroupe les matrices qui représentent la même application dans d’autres bases.", "Classer les matrices", "Équivalence"),
    ],
  },
  {
    id: "basis-changes",
    title: "Changements de bases et trace",
    program: "MPSI",
    workshops: [
      workshop("passage-matrix-forge", "Forge de passage", "P", "Construit la matrice de passage entre deux bases.", "Construire P", "Matrice de passage"),
      workshop("coordinate-transporter", "Transporteur de coordonnées", "P⁻¹X", "Transporte les coordonnées d’un vecteur d’une base à l’autre.", "Changer les coordonnées", "Changement de base"),
      workshop("similarity-chamber", "Chambre de similitude", "P⁻¹AP", "Change la base d’un endomorphisme sans changer sa nature.", "Conjuguer une matrice", "Similitude"),
      workshop("trace-observer", "Observatoire de la trace", "tr", "Mesure un invariant linéaire conservé par similitude.", "Observer la trace", "Trace"),
    ],
  },
  {
    id: "determinants",
    title: "Déterminants",
    program: "MPSI",
    workshops: [
      workshop("permutation-signature", "Signatureur de permutations", "ε(σ)", "Décompose les permutations et contrôle leur signature.", "Signer une permutation", "Groupe symétrique"),
      workshop("determinant-forge", "Forge déterminantale", "det", "Mesure l’aire, le volume et l’inversibilité d’une famille.", "Forger un déterminant", "Déterminant"),
      workshop("cofactor-expander", "Développeur de cofacteurs", "Cᵢⱼ", "Développe un déterminant suivant une ligne ou une colonne.", "Déployer les cofacteurs", "Cofacteurs"),
      workshop("vandermonde-adjugate", "Atelier de Vandermonde", "V/Com", "Relie Vandermonde, comatrice et formule de l’inverse.", "Fermer le calcul déterminantal", "Vandermonde et comatrice"),
    ],
  },
  {
    id: "euclidean-foundations",
    title: "Fondations euclidiennes · MPSI",
    program: "MPSI",
    workshops: [
      workshop("inner-product-tuner", "Accordeur scalaire", "⟨·, ·⟩", "Mesure produits scalaires, normes, distances et cas d’égalité.", "Accorder le produit scalaire", "Produit scalaire"),
      workshop("schmidt-orthogonalizer", "Orthogonalisateur de Schmidt", "ON", "Transforme les familles libres en bases orthonormées.", "Orthonormaliser une famille", "Gram–Schmidt"),
      workshop("orthogonal-chamber", "Chambre orthogonale", "F^{⊥}", "Isole les directions orthogonales à un sous-espace.", "Déployer l’orthogonal", "Orthogonal"),
      workshop("metric-projector", "Projecteur métrique", "p_F", "Projette sur le sous-espace le plus proche et calcule la distance.", "Projeter sur un sous-espace", "Projection et distance"),
    ],
  },
  {
    id: "stable-blocks",
    title: "Sous-espaces stables et blocs · MP",
    program: "MP",
    workshops: [
      workshop("finite-sum-assembler", "Assembleur de sommes finies", "⊕Eᵢ", "Étend les décompositions directes à plusieurs sous-espaces.", "Assembler une décomposition", "Sommes directes"),
      workshop("stable-subspace-chamber", "Chambre stable", "u(F)⊂F", "Isole les sous-espaces conservés par un endomorphisme.", "Stabiliser un sous-espace", "Sous-espaces stables"),
      workshop("commutation-coupler", "Coupleur de commutation", "uv=vu", "Fait agir ensemble les endomorphismes qui commutent.", "Coupler deux endomorphismes", "Commutation"),
      workshop("block-matrix-engine", "Moteur matriciel par blocs", "▦", "Compose, transpose et réduit des matrices définies par blocs.", "Assembler les blocs", "Matrices par blocs"),
    ],
  },
  {
    id: "eigen-elements",
    title: "Éléments propres · MP",
    program: "MP",
    workshops: [
      workshop("spectral-chamber", "Chambre spectrale", "λ", "Révèle les valeurs propres et le spectre de l’endomorphisme.", "Révéler le spectre", "Spectre"),
      workshop("eigenspace-extractor", "Extracteur propre", "E_λ", "Isole vecteurs propres et sous-espaces propres.", "Extraire les espaces propres", "Espaces propres"),
      workshop("characteristic-tracer", "Traceur caractéristique", "χ", "Déploie χ_A et relie ses racines au spectre.", "Tracer le polynôme caractéristique", "Polynôme caractéristique"),
      workshop("multiplicity-gauge", "Jauge de multiplicité", "m_λ", "Compare multiplicités algébriques et dimensions des espaces propres.", "Mesurer les multiplicités", "Multiplicités"),
    ],
  },
  {
    id: "matrix-reduction",
    title: "Réduction matricielle · MP",
    program: "MP",
    workshops: [
      workshop("diagonalizer", "Diagonaliseur", "D", "Assemble une base de vecteurs propres et diagonalise l’endomorphisme.", "Former une base propre", "Diagonalisation"),
      workshop("triangularizer", "Trigonaliseur", "T", "Stabilise les formes triangulaires lorsque le polynôme est scindé.", "Achever la réduction", "Trigonalisation"),
      workshop("nilpotence-chamber", "Chambre nilpotente", "u^p=0", "Mesure l’indice de nilpotence et les puissances qui s’annulent.", "Annuler une puissance", "Nilpotence"),
      workshop("spectral-invariant-balance", "Balance spectrale", "tr/det", "Relit trace et déterminant aux valeurs propres avec multiplicité.", "Équilibrer les invariants", "Trace et déterminant"),
    ],
  },
  {
    id: "polynomial-reduction",
    title: "Calcul polynomial · MP",
    program: "MP",
    workshops: [
      workshop("polynomial-evaluator", "Évaluateur polynomial", "P(u)", "Évalue les polynômes en u et explore l’algèbre K[u].", "Évaluer P(u)", "Polynômes d’endomorphismes"),
      workshop("minimal-extractor", "Extracteur minimal", "π_u", "Isole le polynôme minimal et les critères de réduction.", "Extraire le polynôme minimal", "Polynôme minimal"),
      workshop("cayley-hamilton-forge", "Forge de Cayley-Hamilton", "χ_u(u)", "Injecte χ_u(u)=0 dans le réseau et réduit les puissances.", "Annuler l’endomorphisme", "Cayley-Hamilton"),
      workshop("characteristic-decomposer", "Décomposeur caractéristique", "N_λ", "Applique le lemme des noyaux et sépare les sous-espaces caractéristiques.", "Décomposer les noyaux", "Sous-espaces caractéristiques"),
    ],
  },
  {
    id: "orthogonal-isometries",
    title: "Matrices orthogonales et isométries · MP",
    program: "MP",
    workshops: [
      workshop("orthogonal-matrix-gate", "Porte orthogonale", "O(n)", "Reconnaît les matrices dont lignes et colonnes sont orthonormées.", "Ouvrir le groupe orthogonal", "Matrices orthogonales"),
      workshop("isometry-forge", "Forge d’isométries", "u*=u⁻¹", "Conserve normes et produits scalaires dans tout l’espace.", "Forger une isométrie", "Isométries"),
      workshop("plane-rotation-engine", "Moteur de rotations planes", "SO₂", "Classe rotations et réflexions du plan euclidien orienté.", "Orienter le plan", "Rotations et réflexions"),
      workshop("isometry-reducer", "Réducteur d’isométries", "R_θ", "Réduit les isométries en blocs orthogonaux adaptés.", "Réduire une isométrie", "Réduction des isométries"),
    ],
  },
  {
    id: "euclidean-reduction",
    title: "Réduction euclidienne · MP",
    program: "MP",
    workshops: [
      workshop("adjoint-chamber", "Chambre adjointe", "u*", "Révèle l’adjoint et les règles de calcul qui le gouvernent.", "Construire l’adjoint", "Adjoint"),
      workshop("self-adjoint-symmetrizer", "Symétriseur spectral", "S(E)", "Isole les endomorphismes autoadjoints et leurs sous-espaces stables.", "Stabiliser la symétrie", "Autoadjoint"),
      workshop("orthogonal-diagonalizer", "Diagonaliseur orthogonal", "PDPᵀ", "Oriente une base propre orthonormée selon le théorème spectral.", "Orthonormaliser le spectre", "Théorème spectral"),
      workshop("positivity-analyzer", "Analyseur de positivité", "S^{++}", "Sépare positivité et positivité définie par le spectre.", "Mesurer la positivité", "Positivité"),
    ],
  },
];

function workshopEconomy(index: number) {
  if (index === 0) return { baseCost: 24, baseProduction: 0.5, unlock: 0 };
  if (index === 1) return { baseCost: 350, baseProduction: 3.2, unlock: 400 };
  if (index === 2) return { baseCost: 12_000, baseProduction: 16, unlock: 15_000 };
  if (index === 3) return { baseCost: 75_000, baseProduction: 72, unlock: 80_000 };
  const costProgression = Math.pow(4.4, index - 4);
  const productionProgression = Math.pow(4.28, index - 4);
  const baseCost = Math.round(260_000 * costProgression);
  return {
    baseCost,
    baseProduction: 180 * productionProgression,
    unlock: Math.ceil(baseCost * 1.25),
  };
}

export const WORKSHOP_CYCLES = WORKSHOP_CYCLE_SEEDS.map(
  (cycle, cycleIndex) => ({
    ...cycle,
    number: cycleIndex + 1,
    workshops: cycle.workshops.map((seed, workshopIndex) => ({
      ...seed,
      chapter: cycle.title,
      cycleId: cycle.id,
      program: cycle.program,
      ...workshopEconomy(cycleIndex * 4 + workshopIndex),
    })),
  }),
);

export const INSTRUMENTS = WORKSHOP_CYCLES.flatMap(
  (cycle) => cycle.workshops,
);

export const INSTRUMENT_INDEX_BY_ID = Object.fromEntries(
  INSTRUMENTS.map((instrument, index) => [instrument.id, index]),
) as Record<string, number>;

export function instrumentIndex(id: string) {
  return INSTRUMENT_INDEX_BY_ID[id] ?? -1;
}

export function instrumentLevel(
  instruments: readonly number[],
  id: string,
) {
  const index = instrumentIndex(id);
  return index < 0 ? 0 : instruments[index] ?? 0;
}

export const LEGACY_INSTRUMENT_IDS = [
  "axis-generator",
  "plane-deployer",
  "spatial-forge",
  "dimension-extension",
  "family-assembler",
  "freedom-tester",
  "basis-extractor",
  "rank-compressor",
  "linear-transformer",
  "kernel-chamber",
  "image-forge",
  "rank-balance",
  "matrix-encoder",
  "matrix-composer",
  "gauss-inverter",
  "spectral-chamber",
  "characteristic-tracer",
  "eigenspace-extractor",
  "diagonalizer",
  "triangularizer",
  "polynomial-evaluator",
  "minimal-extractor",
  "cayley-hamilton-forge",
  "characteristic-decomposer",
  "adjoint-chamber",
  "self-adjoint-symmetrizer",
  "orthogonal-diagonalizer",
  "positivity-analyzer",
  "inner-product-tuner",
  "schmidt-orthogonalizer",
  "orthogonal-chamber",
  "metric-projector",
] as const;

export function instrumentCost(index: number, owned: number) {
  return Math.ceil(INSTRUMENTS[index].baseCost * Math.pow(1.18, owned));
}

export function instrumentBulkCost(
  index: number,
  owned: number,
  quantity: number,
  costMultiplier = 1,
) {
  const safeQuantity = Math.max(0, Math.floor(quantity));
  let total = 0;
  for (let offset = 0; offset < safeQuantity; offset += 1) {
    const unitCost = Math.ceil(
      instrumentCost(index, owned + offset) * costMultiplier,
    );
    if (!Number.isFinite(unitCost) || total > Number.MAX_VALUE - unitCost) {
      return Number.POSITIVE_INFINITY;
    }
    total += unitCost;
  }
  return total;
}

export function maxAffordableInstrumentQuantity(
  index: number,
  owned: number,
  budget: number,
  costMultiplier = 1,
) {
  if (Number.isNaN(budget) || budget < 0) return 0;
  let quantity = 0;
  let spent = 0;
  while (quantity < 10_000) {
    const unitCost = Math.ceil(
      instrumentCost(index, owned + quantity) * costMultiplier,
    );
    if (
      !Number.isFinite(unitCost) ||
      !Number.isFinite(spent + unitCost) ||
      unitCost > budget - spent
    ) {
      break;
    }
    spent += unitCost;
    quantity += 1;
  }
  return quantity;
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

export function invariantProductionMultiplier(totalInvariants: number) {
  const total = Math.max(0, totalInvariants);
  if (total <= 7) return 1 + total * 0.15;
  return 2.05 + Math.log2((total + 1) / 8) * 0.2;
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
  const cycleOutput = (...cycleIds: string[]) =>
    INSTRUMENTS.reduce(
      (sum, instrument, index) =>
        cycleIds.includes(instrument.cycleId)
          ? sum + outputs[index]
          : sum,
      0,
    );
  const directionalOutput = cycleOutput("space-construction");
  const familyOutput = cycleOutput("families-dimension");
  const applicationOutput = cycleOutput("linear-maps");
  const matrixOutput = cycleOutput(
    "matrix-representations",
    "systems-gauss",
    "basis-changes",
    "determinants",
  );
  const reductionOutput = cycleOutput(
    "stable-blocks",
    "eigen-elements",
    "matrix-reduction",
  );
  const polynomialOutput = cycleOutput("polynomial-reduction");
  const euclideanOutput = cycleOutput(
    "euclidean-foundations",
    "orthogonal-isometries",
    "euclidean-reduction",
  );
  const remainingOutput =
    outputs.reduce((sum, output) => sum + output, 0) -
    directionalOutput -
    familyOutput -
    applicationOutput -
    matrixOutput -
    reductionOutput -
    polynomialOutput -
    euclideanOutput;
  const directionalMultiplier =
    1 + instrumentLevel(instruments, "family-assembler") * 0.04;
  const familyMultiplier =
    1 + instrumentLevel(instruments, "freedom-tester") * 0.03;
  const rankMultiplier =
    1 + instrumentLevel(instruments, "rank-compressor") * 0.02;
  const transformationMultiplier =
    1 + instrumentLevel(instruments, "linear-transformer") * 0.04;
  const rankTheoremMultiplier =
    1 + instrumentLevel(instruments, "rank-balance") * 0.02;
  const matrixEncodingMultiplier =
    1 + instrumentLevel(instruments, "matrix-encoder") * 0.04;
  const matrixCompositionMultiplier =
    1 + instrumentLevel(instruments, "matrix-composer") * 0.03;
  const spectralMultiplier =
    1 + instrumentLevel(instruments, "spectral-chamber") * 0.02;
  const characteristicMultiplier =
    1 + instrumentLevel(instruments, "characteristic-tracer") * 0.04;
  const diagonalMultiplier =
    1 + instrumentLevel(instruments, "diagonalizer") * 0.02;
  const polynomialMultiplier =
    1 + instrumentLevel(instruments, "polynomial-evaluator") * 0.04;
  const cayleyHamiltonMultiplier =
    1 + instrumentLevel(instruments, "cayley-hamilton-forge") * 0.02;
  const adjointMultiplier =
    1 + instrumentLevel(instruments, "adjoint-chamber") * 0.04;
  const orthogonalDiagonalMultiplier =
    1 + instrumentLevel(instruments, "orthogonal-diagonalizer") * 0.02;
  const innerProductMultiplier =
    1 + instrumentLevel(instruments, "inner-product-tuner") * 0.04;
  const orthonormalMultiplier =
    1 + instrumentLevel(instruments, "schmidt-orthogonalizer") * 0.02;

  return (
    (directionalOutput * directionalMultiplier +
      familyOutput * familyMultiplier * transformationMultiplier +
      applicationOutput * matrixCompositionMultiplier +
      matrixOutput * characteristicMultiplier +
      reductionOutput * polynomialMultiplier +
      polynomialOutput * adjointMultiplier +
      euclideanOutput * innerProductMultiplier +
      remainingOutput +
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
    instrumentLevel(instruments, "gauss-inverter") +
      instrumentLevel(instruments, "triangularizer") +
      instrumentLevel(instruments, "characteristic-decomposer") +
      instrumentLevel(instruments, "positivity-analyzer") +
      instrumentLevel(instruments, "orthogonal-chamber"),
  );
}

export function resonanceDecayRate(instruments: readonly number[]) {
  return (
    8 /
    (1 + instrumentLevel(instruments, "kernel-chamber") * 0.04)
  );
}

export function correctAnomalyRewardMultiplier(
  instruments: readonly number[],
) {
  return (
    1 +
    instrumentLevel(instruments, "image-forge") * 0.03 +
    instrumentLevel(instruments, "eigenspace-extractor") * 0.02 +
    instrumentLevel(instruments, "minimal-extractor") * 0.02 +
    instrumentLevel(instruments, "self-adjoint-symmetrizer") * 0.02 +
    instrumentLevel(instruments, "metric-projector") * 0.02
  );
}

export function invariantGain(runTotal: number) {
  return Math.floor(Math.sqrt(runTotal / PRESTIGE_SCALE));
}

export function basisChangeGainCap(totalInvariants: number) {
  const normalizedTotal = Number.isFinite(totalInvariants)
    ? Math.max(0, Math.floor(totalInvariants))
    : 0;
  return normalizedTotal + 1;
}

export function basisChangeGain(
  runTotal: number,
  totalInvariants: number,
) {
  return Math.min(
    invariantGain(runTotal),
    basisChangeGainCap(totalInvariants),
  );
}

export function nextInvariantThreshold(currentGain: number) {
  return PRESTIGE_SCALE * Math.pow(currentGain + 1, 2);
}
