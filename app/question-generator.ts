export type Sector = "vectors" | "bases" | "applications" | "matrices";

export type Question = {
  id: string;
  sector: Sector;
  eyebrow: string;
  prompt: string;
  formula: string;
  choices: Array<{ text: string; correct: boolean }>;
  explanation: string;
  geometry: string;
  trap: string;
};

export type ExerciseFamily = {
  id: string;
  sector: Sector;
  program: "MPSI" | "MP";
  minInstrument: number;
  label: string;
  description: string;
  generate: (spaceDimension: number) => Question;
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]) {
  return items[randomInt(0, items.length - 1)];
}

function nonZero() {
  return pick([-3, -2, -1, 1, 2, 3]);
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = randomInt(0, index);
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function sample<T>(items: readonly T[], count: number) {
  return shuffle([...items]).slice(0, count);
}

function vector(values: readonly number[]) {
  return `(${values.join(" ; ")})`;
}

function matrix(rows: readonly (readonly number[])[]) {
  return `⟦${rows.map((row) => row.join(",")).join(";")}⟧`;
}

function columnVector(values: readonly number[]) {
  return `⟪${values.join(",")}⟫`;
}

function zeroVector(dimension: number) {
  return Array.from({ length: dimension }, () => 0);
}

function randomVector(dimension: number) {
  let result = zeroVector(dimension);
  while (result.every((coordinate) => coordinate === 0)) {
    result = Array.from(
      { length: dimension },
      () => randomInt(-3, 3),
    );
  }
  return result;
}

function scaleVector(coefficient: number, value: readonly number[]) {
  return value.map((coordinate) => coefficient * coordinate);
}

function combineVectors(
  alpha: number,
  first: readonly number[],
  beta: number,
  second: readonly number[],
) {
  return first.map(
    (coordinate, index) => alpha * coordinate + beta * second[index],
  );
}

function multiplyMatrices(
  first: readonly (readonly number[])[],
  second: readonly (readonly number[])[],
) {
  return first.map((row) =>
    second[0].map((_, columnIndex) =>
      row.reduce(
        (sum, value, index) =>
          sum + value * second[index][columnIndex],
        0,
      ),
    ),
  );
}

function crossProduct(
  first: readonly number[],
  second: readonly number[],
) {
  return [
    first[1] * second[2] - first[2] * second[1],
    first[2] * second[0] - first[0] * second[2],
    first[0] * second[1] - first[1] * second[0],
  ];
}

function lineOutsider(
  generator: readonly number[],
  scalar: number,
  variant: number,
) {
  const result = scaleVector(scalar, generator);
  const zeroCoordinate = generator.findIndex(
    (coordinate) => coordinate === 0,
  );
  const changedIndex =
    zeroCoordinate >= 0 ? zeroCoordinate : variant % generator.length;
  result[changedIndex] += variant % 2 === 0 ? 1 : -1;
  return result;
}

function formatLinearExpression(terms: Array<[number, string]>) {
  const visibleTerms = terms.filter(([coefficient]) => coefficient !== 0);
  if (visibleTerms.length === 0) return "0";

  return visibleTerms
    .map(([coefficient, variable], index) => {
      const absoluteValue = Math.abs(coefficient);
      const magnitude = absoluteValue === 1 ? "" : `${absoluteValue}`;
      const sign =
        index === 0
          ? coefficient < 0
            ? "−"
            : ""
          : coefficient < 0
            ? " − "
            : " + ";
      return `${sign}${magnitude}${variable}`;
    })
    .join("");
}

function factor(value: number) {
  return value < 0 ? `(${value})` : `${value}`;
}

function characteristicPolynomial2(trace: number, determinant: number) {
  let result = "X²";
  if (trace !== 0) {
    const magnitude = Math.abs(trace) === 1 ? "" : `${Math.abs(trace)}`;
    result += trace > 0 ? ` − ${magnitude}X` : ` + ${magnitude}X`;
  }
  if (determinant !== 0) {
    result +=
      determinant > 0
        ? ` + ${determinant}`
        : ` − ${Math.abs(determinant)}`;
  }
  return result;
}

function polynomialRootFactor(root: number) {
  return root > 0 ? `(X − ${root})` : `(X + ${Math.abs(root)})`;
}

function shiftedMatrix(root: number) {
  const magnitude = Math.abs(root) === 1 ? "" : `${Math.abs(root)}`;
  return root > 0 ? `A − ${magnitude}I` : `A + ${magnitude}I`;
}

function choices(correct: string, distractors: string[]) {
  const unique = Array.from(new Set([correct, ...distractors]));
  let offset = 1;
  while (unique.length < 4) {
    const numeric = Number(correct);
    const coordinateMatch = correct.match(/^\((-?\d+(?: ; -?\d+)+)\)$/);
    let fallback: string;
    if (Number.isFinite(numeric)) {
      fallback = `${numeric + offset}`;
    } else if (coordinateMatch) {
      const coordinates = coordinateMatch[1]
        .split(" ; ")
        .map(Number);
      coordinates[0] += offset;
      coordinates[coordinates.length - 1] -= offset;
      fallback = vector(coordinates);
    } else {
      fallback = `Autre proposition (${offset})`;
    }
    if (!unique.includes(fallback)) unique.push(fallback);
    offset += 1;
  }
  return shuffle(
    unique.slice(0, 4).map((text) => ({ text, correct: text === correct })),
  );
}

function balancedCoordinateDistractors(
  correct: readonly number[],
  errorVectors: readonly (readonly number[])[],
) {
  const wrongCoordinates = correct.map((value, coordinateIndex) => {
    const plausibleValues = Array.from(
      new Set(
        errorVectors
          .map((candidate) => candidate[coordinateIndex])
          .filter((candidate) => candidate !== value),
      ),
    );
    return plausibleValues.length > 0
      ? pick(plausibleValues)
      : value + (value >= 0 ? 1 : -1);
  });

  const distractors = correct.map((_, preservedCoordinate) =>
    correct.map((value, coordinateIndex) =>
      coordinateIndex === preservedCoordinate
        ? value
        : wrongCoordinates[coordinateIndex],
    ),
  );

  if (correct.length === 2) {
    distractors.push(wrongCoordinates);
  }

  return distractors.slice(0, 3);
}

function ambientDimension(spaceDimension: number) {
  return spaceDimension >= 3 && Math.random() < 0.55 ? 3 : 2;
}

export function combinationQuestion(dimension: 2 | 3): Question {
  const coefficientPairs = [
    [1, 1],
    [1, -1],
    [2, 1],
    [1, -3],
    [-2, 1],
    [3, -2],
  ] as const;
  const [alpha, beta] = pick(coefficientPairs);
  const first = randomVector(dimension);
  const second = randomVector(dimension);
  const result = combineVectors(alpha, first, beta, second);
  const combination = formatLinearExpression([
    [alpha, "u"],
    [beta, "v"],
  ]);
  const wrongSign = combineVectors(alpha, first, -beta, second);
  const swapped = combineVectors(beta, first, alpha, second);
  const coordinateSum = first.map(
    (coordinate, index) => coordinate + second[index],
  );
  const distractors = balancedCoordinateDistractors(result, [
    wrongSign,
    swapped,
    coordinateSum,
  ]);

  return {
    id: `V-COMB-${Date.now()}-${randomInt(100, 999)}`,
    sector: "vectors",
    eyebrow: "Combinaison linéaire",
    prompt: `Quelles sont les coordonnées de ${combination} ?`,
    formula: `u = ${vector(first)}   et   v = ${vector(second)}`,
    choices: choices(
      vector(result),
      distractors.map((candidate) => vector(candidate)),
    ),
    explanation: `On applique les coefficients coordonnée par coordonnée : ${combination} = ${vector(result)}.`,
    geometry:
      "Une combinaison linéaire additionne des vecteurs après les avoir étirés, contractés ou retournés.",
    trap:
      "Le même coefficient agit sur toutes les coordonnées du vecteur concerné.",
  };
}

export function spanQuestion(dimension: 2 | 3): Question {
  if (dimension === 3 && Math.random() < 0.5) {
    const [first, second] = independentPair(3);
    const normal = crossProduct(first, second);
    const askForMember = Math.random() < 0.5;
    const memberPairs = [
      [1, 1],
      [2, -1],
      [-1, 2],
    ] as const;
    const members = memberPairs.map(([alpha, beta]) =>
      combineVectors(alpha, first, beta, second),
    );
    const outsiders = members.map((member, index) =>
      member.map(
        (coordinate, coordinateIndex) =>
          coordinate + (index + 1) * normal[coordinateIndex],
      ),
    );
    const correct = askForMember ? members[0] : outsiders[0];
    const distractors = askForMember ? outsiders : members;

    return {
      id: `V-PLANE-${askForMember ? "IN" : "OUT"}-${Date.now()}-${randomInt(100, 999)}`,
      sector: "vectors",
      eyebrow: "Sous-espace engendré",
      prompt: `Quel vecteur ${askForMember ? "appartient" : "n’appartient pas"} à Vect(${vector(first)}, ${vector(second)}) ?`,
      formula: "",
      choices: choices(
        vector(correct),
        distractors.map((item) => vector(item)),
      ),
      explanation: askForMember
        ? `${vector(correct)} est une combinaison linéaire des deux vecteurs générateurs.`
        : `${vector(correct)} possède une composante non nulle dans la direction normale au plan engendré ; il n’appartient donc pas à ce plan vectoriel.`,
      geometry:
        "Dans ℝ³, deux vecteurs indépendants engendrent un plan passant par l’origine.",
      trap:
        "Un vecteur de ℝ³ n’appartient pas automatiquement au plan engendré par deux autres vecteurs.",
    };
  }

  const generator = randomVector(dimension);
  const askForMember = Math.random() < 0.5;
  const multiples = [2, -2, 3].map((scalar) =>
    scaleVector(scalar, generator),
  );
  const outsiders = [
    lineOutsider(generator, 2, 0),
    lineOutsider(generator, -2, 1),
    lineOutsider(generator, 3, 2),
  ];
  const answer = askForMember ? multiples[0] : outsiders[0];

  return {
    id: `V-VECT-${askForMember ? "IN" : "OUT"}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "vectors",
    eyebrow: "Sous-espace engendré",
    prompt: `Quel vecteur ${askForMember ? "appartient" : "n’appartient pas"} à Vect(${vector(generator)}) ?`,
    formula: "",
    choices: choices(
      vector(answer),
      (askForMember ? outsiders : multiples).map((item) => vector(item)),
    ),
    explanation: askForMember
      ? `${vector(answer)} = 2 × ${vector(generator)}. Il s’agit donc bien d’un multiple scalaire du vecteur générateur.`
      : `${vector(answer)} n’est pas proportionnel à ${vector(generator)} : il n’appartient donc pas à la droite engendrée.`,
    geometry:
      "Tous les vecteurs de Vect(u) sont portés par la même droite vectorielle que u.",
    trap:
      "Modifier une seule coordonnée ne conserve généralement pas la direction.",
  };
}

type SetCandidate = {
  text: string;
  reason: string;
};

function subspaceCandidates(dimension: 2 | 3) {
  const coefficients = randomVector(dimension);
  const variables = ["x", "y", "z"].slice(0, dimension);
  const linearForm = formatLinearExpression(
    coefficients.map(
      (coefficient, index) =>
        [coefficient, variables[index]] as [number, string],
    ),
  );
  const coordinates = dimension === 2 ? "(x ; y)" : "(x ; y ; z)";
  const field = dimension === 2 ? "ℝ²" : "ℝ³";
  const zero = vector(zeroVector(dimension));
  const generator = vector(randomVector(dimension));

  const subspaces: SetCandidate[] = [
    {
      text: `{${zero}}`,
      reason:
        "Le singleton constitué du vecteur nul est stable par combinaison linéaire.",
    },
    {
      text: field,
      reason:
        "L’espace ambiant tout entier est lui-même un sous-espace vectoriel.",
    },
    {
      text: `Vect(${generator})`,
      reason:
        "Un ensemble engendré par une famille de vecteurs est toujours un sous-espace vectoriel.",
    },
    {
      text: `{${coordinates} ∈ ${field} | ${linearForm} = 0}`,
      reason:
        "Une équation linéaire homogène définit le noyau d’une forme linéaire, donc un sous-espace vectoriel.",
    },
    dimension === 2
      ? {
          text: "{(x ; y) ∈ ℝ² | x = y}",
          reason:
            "La condition x = y est linéaire et homogène ; elle décrit une droite vectorielle.",
        }
      : {
          text: "{(x ; y ; z) ∈ ℝ³ | x = y et z = 0}",
          reason:
            "Ces deux conditions sont linéaires et homogènes ; leur ensemble de solutions est un sous-espace.",
        },
  ];

  const nonSubspaces: SetCandidate[] = [
    {
      text: `{${coordinates} ∈ ${field} | ${linearForm} = ${pick([1, 2, -1])}}`,
      reason:
        "Cette équation est affine et non homogène : le vecteur nul ne la vérifie pas.",
    },
    {
      text:
        dimension === 2
          ? "{(x ; y) ∈ ℝ² | x ≥ 0}"
          : "{(x ; y ; z) ∈ ℝ³ | x ≥ 0}",
      reason:
        "Cet ensemble n’est pas stable par multiplication par un scalaire négatif.",
    },
    {
      text:
        dimension === 2
          ? "{(x ; y) ∈ ℝ² | xy = 0}"
          : "{(x ; y ; z) ∈ ℝ³ | xy = 0}",
      reason:
        "L’union de deux plans ou axes n’est généralement pas stable par addition.",
    },
    {
      text:
        dimension === 2
          ? "{(x ; y) ∈ ℝ² | x² + y² = 1}"
          : "{(x ; y ; z) ∈ ℝ³ | x² + y² + z² = 1}",
      reason:
        "La sphère unité ne contient pas le vecteur nul et n’est pas stable par homothétie.",
    },
    {
      text: `{${generator}}`,
      reason:
        "Un singleton constitué d’un vecteur non nul ne contient pas le vecteur nul.",
    },
    dimension === 2
      ? {
          text: "{(x ; y) ∈ ℝ² | x + y ≥ 0}",
          reason:
            "Ce demi-plan n’est pas stable par multiplication par un scalaire négatif.",
        }
      : {
          text: "{(x ; y ; z) ∈ ℝ³ | z = 1}",
          reason:
            "Ce plan affine ne passe pas par l’origine.",
        },
  ];

  return { subspaces, nonSubspaces, field };
}

export function subspaceQuestion(dimension: 2 | 3): Question {
  const { subspaces, nonSubspaces, field } =
    subspaceCandidates(dimension);
  const askForSubspace = Math.random() < 0.5;
  const correct = pick(askForSubspace ? subspaces : nonSubspaces);
  const distractors = sample(
    askForSubspace ? nonSubspaces : subspaces,
    3,
  );

  return {
    id: `V-SEV-${askForSubspace ? "OUI" : "NON"}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "vectors",
    eyebrow: "Sous-espace vectoriel",
    prompt: askForSubspace
      ? `Lequel de ces ensembles est un sous-espace vectoriel de ${field} ?`
      : `Lequel de ces ensembles n’est pas un sous-espace vectoriel de ${field} ?`,
    formula: askForSubspace
      ? "Chercher un ensemble contenant 0 et stable par combinaison linéaire."
      : "Chercher un échec : absence de 0 ou défaut de stabilité.",
    choices: choices(
      correct.text,
      distractors.map((candidate) => candidate.text),
    ),
    explanation: correct.reason,
    geometry:
      dimension === 2
        ? "Dans ℝ², les sous-espaces sont {0}, les droites passant par l’origine et ℝ²."
        : "Dans ℝ³, les sous-espaces peuvent être {0}, une droite, un plan passant par l’origine ou ℝ³.",
    trap:
      "Passer par l’origine est nécessaire, mais il faut aussi vérifier les deux stabilités.",
  };
}

export function vectorQuestion(
  spaceDimension: number,
  forcedTemplate?: 0 | 1 | 2,
): Question {
  const dimension = ambientDimension(spaceDimension);
  const template = forcedTemplate ?? randomInt(0, 2);
  if (template === 0) return combinationQuestion(dimension);
  if (template === 1) return spanQuestion(dimension);
  return subspaceQuestion(dimension);
}

function determinant2(
  first: readonly number[],
  second: readonly number[],
) {
  return first[0] * second[1] - first[1] * second[0];
}

function determinant3(matrix: readonly (readonly number[])[]) {
  const [first, second, third] = matrix;
  return (
    first[0] * (second[1] * third[2] - second[2] * third[1]) -
    first[1] * (second[0] * third[2] - second[2] * third[0]) +
    first[2] * (second[0] * third[1] - second[1] * third[0])
  );
}

function independentPair(dimension: 2 | 3) {
  let first = randomVector(dimension);
  let second = randomVector(dimension);
  const independent = () =>
    dimension === 2
      ? determinant2(first, second) !== 0
      : first[0] * second[1] - first[1] * second[0] !== 0 ||
        first[0] * second[2] - first[2] * second[0] !== 0 ||
        first[1] * second[2] - first[2] * second[1] !== 0;
  while (!independent()) {
    first = randomVector(dimension);
    second = randomVector(dimension);
  }
  return [first, second] as const;
}

function independentTriple() {
  let vectors = [
    randomVector(3),
    randomVector(3),
    randomVector(3),
  ];
  while (determinant3(vectors) === 0) {
    vectors = [
      randomVector(3),
      randomVector(3),
      randomVector(3),
    ];
  }
  return vectors;
}

export function familyRankQuestion(dimension: 2 | 3): Question {
  const possibleRanks =
    dimension === 2
      ? [0, 1, 1, 2, 2, 2]
      : [0, 1, 1, 2, 2, 3, 3];
  const rank = pick(possibleRanks);
  let family: number[][];
  let explanation: string;

  if (rank === 0) {
    family = [
      zeroVector(dimension),
      zeroVector(dimension),
      zeroVector(dimension),
    ];
    explanation =
      "Les trois vecteurs sont nuls : la famille engendre seulement {0}, donc son rang vaut 0.";
  } else if (rank === 1) {
    const generator = randomVector(dimension);
    const firstScalar = pick([-3, -2, 2, 3]);
    const secondScalar = pick([-2, -1, 1, 2]);
    family = [
      generator,
      scaleVector(firstScalar, generator),
      scaleVector(secondScalar, generator),
    ];
    explanation =
      "Les trois vecteurs sont colinéaires et au moins l’un est non nul : ils engendrent une droite, donc le rang vaut 1.";
  } else if (rank === 2) {
    const [first, second] = independentPair(dimension);
    const alpha = pick([-2, -1, 1, 2]);
    const beta = pick([-2, -1, 1, 2]);
    family = [
      first,
      second,
      combineVectors(alpha, first, beta, second),
    ];
    explanation =
      "Les deux premiers vecteurs sont indépendants, tandis que le troisième est leur combinaison linéaire. Le rang vaut donc 2.";
  } else {
    family = independentTriple();
    const determinant = determinant3(family);
    explanation = `Le déterminant des trois vecteurs vaut ${determinant}, qui est non nul. La famille est libre dans ℝ³ et son rang vaut 3.`;
  }

  const field = dimension === 2 ? "ℝ²" : "ℝ³";
  return {
    id: `B-DIM-R${rank}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "bases",
    eyebrow: "Rang d’une famille",
    prompt: `Quel est le rang de cette famille de trois vecteurs de ${field} ?`,
    formula: `F = (${family.map((item) => vector(item)).join(", ")})`,
    choices: choices(`${rank}`, ["0", "1", "2", "3"]),
    explanation,
    geometry:
      "Le rang est le nombre de directions indépendantes effectivement engendrées.",
    trap:
      "Le rang ne compte pas les vecteurs écrits : il compte seulement les directions indépendantes.",
  };
}

export function basisQuestion(
  spaceDimension: number,
  forcedTemplate?: 0 | 1 | 2,
): Question {
  const template = forcedTemplate ?? randomInt(0, 2);

  if (template === 0) {
    let first = randomVector(2);
    let second = randomVector(2);
    while (determinant2(first, second) === 0) {
      first = randomVector(2);
      second = randomVector(2);
    }
    const determinant = determinant2(first, second);
    return {
      id: `B-DET-${Date.now()}-${randomInt(100, 999)}`,
      sector: "bases",
      eyebrow: "Famille libre",
      prompt: "Quel est le déterminant de la famille (u, v) ?",
      formula: `u = ${vector(first)}   et   v = ${vector(second)}`,
      choices: choices(`${determinant}`, [
        `${first[0] * second[0] - first[1] * second[1]}`,
        `${first[0] * second[1] + first[1] * second[0]}`,
        `${first[1] * second[0] - first[0] * second[1]}`,
      ]),
      explanation: `det(u, v) = ${factor(first[0])} × ${factor(second[1])} − ${factor(first[1])} × ${factor(second[0])} = ${determinant}. Comme ce nombre est non nul, (u, v) est une base de ℝ².`,
      geometry:
        "La valeur absolue du déterminant mesure l’aire du parallélogramme construit sur u et v.",
      trap:
        "Le produit croisé se soustrait : ad − bc, et non ad + bc.",
    };
  }

  if (template === 1) {
    const p = nonZero();
    const alpha = nonZero();
    const beta = nonZero();
    const canonicalX = alpha + p * beta;
    const answer = vector([alpha, beta]);
    const coordinateEquation = formatLinearExpression([
      [1, "λ"],
      [p, "μ"],
    ]);
    const distractors = balancedCoordinateDistractors(
      [alpha, beta],
      [
        [canonicalX, beta],
        [beta, alpha],
        [alpha + p, beta],
      ],
    );
    return {
      id: `B-COORD-${Date.now()}-${randomInt(100, 999)}`,
      sector: "bases",
      eyebrow: "Coordonnées dans une base",
      prompt:
        "Quelles sont les coordonnées de x dans la base B = (e₁, e₂) ?",
      formula: `e₁ = ${vector([1, 0])}, e₂ = ${vector([p, 1])} et x = ${vector([canonicalX, beta])}`,
      choices: choices(
        answer,
        distractors.map((candidate) => vector(candidate)),
      ),
      explanation: `On cherche x = λe₁ + μe₂. La seconde coordonnée donne μ = ${beta}, puis ${coordinateEquation} = ${canonicalX}, donc λ = ${alpha}. Ainsi [x]ᴮ = ${answer}.`,
      geometry:
        "Changer de base ne déplace pas le vecteur : seules les coordonnées utilisées pour le décrire changent.",
      trap:
        "Les coordonnées canoniques de x ne sont pas automatiquement ses coordonnées dans B.",
    };
  }

  const dimension = ambientDimension(spaceDimension);
  return familyRankQuestion(dimension);
}

function kernelQuestion(): Question {
  const a = nonZero();
  const b = nonZero();
  const answer = vector([b, -a]);
  const linearForm = formatLinearExpression([
    [a, "x"],
    [b, "y"],
  ]);
  return {
    id: `A-KER-${Date.now()}-${randomInt(100, 999)}`,
    sector: "applications",
    eyebrow: "Noyau",
    prompt: "Quel vecteur appartient au noyau de f ?",
    formula: `f : ℝ² → ℝ,   f(x, y) = ${linearForm}`,
    choices: choices(answer, [
      vector([a, b]),
      vector([b, a]),
      vector([-b, -a]),
    ]),
    explanation: `En posant (x ; y) = ${answer}, on obtient f(x, y) = ab + b(−a) = 0. Ce vecteur appartient donc à Ker(f).`,
    geometry:
      "Le noyau rassemble toutes les directions que l’application écrase sur le vecteur nul.",
    trap:
      "Un vecteur fixe par f et un vecteur envoyé sur 0 sont deux notions différentes.",
  };
}

export function rankTheoremQuestion(): Question {
  const dimension = randomInt(3, 7);
  const kernel = randomInt(0, dimension);
  const rank = dimension - kernel;
  const unknown = pick(["rank", "kernel", "domain"] as const);
  const prompt =
    unknown === "rank"
      ? "Quel est le rang de f ?"
      : unknown === "kernel"
        ? "Quelle est la dimension de Ker(f) ?"
        : "Quelle est la dimension de E ?";
  const formula =
    unknown === "rank"
      ? `dim(E) = ${dimension}   et   dim(Ker f) = ${kernel}`
      : unknown === "kernel"
        ? `dim(E) = ${dimension}   et   rg(f) = ${rank}`
        : `dim(Ker f) = ${kernel}   et   rg(f) = ${rank}`;
  const answer =
    unknown === "rank" ? rank : unknown === "kernel" ? kernel : dimension;
  const explanation =
    unknown === "rank"
      ? `Le théorème du rang donne dim(E) = dim(Ker f) + rg(f). Ainsi rg(f) = ${dimension} − ${kernel} = ${rank}.`
      : unknown === "kernel"
        ? `Le théorème du rang donne dim(E) = dim(Ker f) + rg(f). Ainsi dim(Ker f) = ${dimension} − ${rank} = ${kernel}.`
        : `Le théorème du rang donne dim(E) = dim(Ker f) + rg(f). Ainsi dim(E) = ${kernel} + ${rank} = ${dimension}.`;
  return {
    id: `A-RANK-${Date.now()}-${randomInt(100, 999)}`,
    sector: "applications",
    eyebrow: "Théorème du rang",
    prompt,
    formula,
    choices: choices(`${answer}`, [
      `${kernel}`,
      `${rank}`,
      `${dimension}`,
    ]),
    explanation,
    geometry:
      "La dimension de départ se partage entre les directions écrasées et les directions encore visibles dans l’image.",
    trap:
      "Repère d’abord la grandeur inconnue avant de choisir entre addition et soustraction.",
  };
}

export function explicitMapRankQuestion(dimension: 2 | 3): Question {
  const rank = randomInt(0, dimension);
  const variables = ["x", "y", "z"].slice(0, dimension);
  let coordinates: string[];

  if (rank === 0) {
    coordinates = Array.from({ length: dimension }, () => "0");
  } else if (rank === 1) {
    if (dimension === 2 && Math.random() < 0.5) {
      const a = nonZero();
      const b = nonZero();
      coordinates = [
        formatLinearExpression([[a, "x"]]),
        formatLinearExpression([[b, "x"]]),
      ];
    } else {
      const row = variables.map(
        (variable) =>
          [nonZero(), variable] as [number, string],
      );
      coordinates = [
        formatLinearExpression(row),
        ...Array.from({ length: dimension - 1 }, () => "0"),
      ];
    }
  } else if (rank === 2 && dimension === 2) {
    const a = nonZero();
    const b = nonZero();
    const c = nonZero();
    coordinates = [
      formatLinearExpression([
        [a, "x"],
        [b, "y"],
      ]),
      formatLinearExpression([[c, "y"]]),
    ];
  } else if (rank === 2) {
    const a = nonZero();
    const b = nonZero();
    const c = nonZero();
    const d = nonZero();
    coordinates = [
      formatLinearExpression([
        [a, "x"],
        [b, "y"],
      ]),
      formatLinearExpression([
        [c, "y"],
        [d, "z"],
      ]),
      "0",
    ];
  } else {
    const a = nonZero();
    const b = nonZero();
    const c = nonZero();
    const d = nonZero();
    const e = nonZero();
    coordinates = [
      formatLinearExpression([
        [a, "x"],
        [b, "y"],
      ]),
      formatLinearExpression([
        [c, "y"],
        [d, "z"],
      ]),
      formatLinearExpression([[e, "z"]]),
    ];
  }

  const field = dimension === 2 ? "ℝ²" : "ℝ³";
  return {
    id: `A-IMAGE-R${rank}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "applications",
    eyebrow: "Image et rang",
    prompt: "Quel est le rang de cette application linéaire ?",
    formula: `f : ${field} → ${field},   f(${variables.join(", ")}) = (${coordinates.join(" ; ")})`,
    choices: choices(`${rank}`, ["0", "1", "2", "3"]),
    explanation:
      rank === 0
        ? "L’application est nulle : son image est {0}, donc son rang vaut 0."
        : `Les formes coordonnées font apparaître exactement ${rank} direction${rank > 1 ? "s" : ""} indépendante${rank > 1 ? "s" : ""}. Le rang vaut donc ${rank}.`,
    geometry:
      rank === dimension
        ? `L’image occupe tout ${field}.`
        : `L’image est un sous-espace de dimension ${rank} dans ${field}.`,
    trap:
      "Le rang compte les directions indépendantes dans l’image, pas le nombre de coefficients non nuls.",
  };
}

function sameLine(
  first: readonly number[],
  second: readonly number[],
) {
  const pivot = first.findIndex((coordinate) => coordinate !== 0);
  if (pivot < 0) return second.every((coordinate) => coordinate === 0);
  return first.every(
    (coordinate, index) =>
      coordinate * second[pivot] === second[index] * first[pivot],
  );
}

function basisVectorLabel(index: number) {
  return `e${["₁", "₂", "₃"][index]}`;
}

function canonicalSpan(indices: readonly number[], dimension: number) {
  if (indices.length === 0) return "{0}";
  if (indices.length === dimension) return `ℝ${dimension === 2 ? "²" : "³"}`;
  return `Vect(${indices.map(basisVectorLabel).join(", ")})`;
}

export function imageQuestion(dimension: 2 | 3): Question {
  const variables = ["x", "y", "z"].slice(0, dimension);
  const field = dimension === 2 ? "ℝ²" : "ℝ³";

  if (Math.random() < 0.55) {
    const rank = randomInt(0, dimension);
    const activeIndices = sample(
      Array.from({ length: dimension }, (_, index) => index),
      rank,
    ).sort((left, right) => left - right);
    const activeSet = new Set(activeIndices);
    const coordinates = variables.map((variable, index) =>
      activeSet.has(index)
        ? formatLinearExpression([[nonZero(), variable]])
        : "0",
    );
    const possibleImages = [
      ...Array.from(
        { length: 2 ** dimension },
        (_, mask) =>
          Array.from({ length: dimension }, (_, index) => index).filter(
            (index) => mask & (1 << index),
          ),
      ).map((indices) => canonicalSpan(indices, dimension)),
    ];
    const answer = canonicalSpan(activeIndices, dimension);

    return {
      id: `A-IMAGE-CANONICAL-R${rank}-${Date.now()}-${randomInt(100, 999)}`,
      sector: "applications",
      eyebrow: "Image d’une application",
      prompt: "Quelle est l’image de f ?",
      formula: `f : ${field} → ${field},   f(${variables.join(", ")}) = (${coordinates.join(" ; ")})`,
      choices: choices(
        answer,
        sample(
          possibleImages.filter((candidate) => candidate !== answer),
          3,
        ),
      ),
      explanation:
        rank === 0
          ? "Toutes les coordonnées de f sont nulles : Im(f) = {0}."
          : `Les coordonnées qui peuvent varier donnent les directions ${activeIndices.map(basisVectorLabel).join(", ")}. Ainsi Im(f) = ${answer}.`,
      geometry:
        rank === dimension
          ? `L’application atteint tout ${field}.`
          : `L’image est ici un sous-espace de dimension ${rank}.`,
      trap:
        "L’image est formée des vecteurs effectivement atteints, pas des vecteurs annulés.",
    };
  }

  const direction = randomVector(dimension);
  const linearForm = variables.map(
    (variable) => [nonZero(), variable] as [number, string],
  );
  const wrongDirections: number[][] = [];
  while (wrongDirections.length < 3) {
    const candidate = randomVector(dimension);
    if (
      !sameLine(direction, candidate) &&
      !wrongDirections.some((existing) => sameLine(existing, candidate))
    ) {
      wrongDirections.push(candidate);
    }
  }
  const answer = `Vect(${vector(direction)})`;

  return {
    id: `A-IMAGE-LINE-${Date.now()}-${randomInt(100, 999)}`,
    sector: "applications",
    eyebrow: "Image d’une application",
    prompt: "Quelle est l’image de f ?",
    formula: `f : ${field} → ${field},   f(${variables.join(", ")}) = (${formatLinearExpression(linearForm)}) ${vector(direction)}`,
    choices: choices(
      answer,
      wrongDirections.map((candidate) => `Vect(${vector(candidate)})`),
    ),
    explanation: `Toutes les valeurs de f sont des multiples de ${vector(direction)}, et la forme linéaire placée devant prend toute valeur réelle. Donc Im(f) = ${answer}.`,
    geometry:
      "L’application écrase l’espace de départ sur une seule droite vectorielle.",
    trap:
      "Le facteur dépendant de x, y ou z varie ; le vecteur fixe qui le suit donne la direction de l’image.",
  };
}

function linearityQuestion(): Question {
  const a = nonZero();
  const b = nonZero();
  const c = nonZero();
  const firstCoordinate = formatLinearExpression([
    [a, "x"],
    [b, "y"],
  ]);
  const secondCoordinate = formatLinearExpression([[c, "x"]]);
  const nonlinearCoordinate = formatLinearExpression([
    [a, "x²"],
    [b, "y"],
  ]);
  const answer = `f(x, y) = (${firstCoordinate} ; ${secondCoordinate})`;
  return {
    id: `A-LIN-${Date.now()}-${randomInt(100, 999)}`,
    sector: "applications",
    eyebrow: "Linéarité",
    prompt: "Laquelle de ces applications est linéaire ?",
    formula:
      "Une application linéaire conserve les combinaisons linéaires et envoie 0 sur 0.",
    choices: choices(answer, [
      `f(x, y) = (${firstCoordinate} + 1 ; ${secondCoordinate})`,
      `f(x, y) = (${nonlinearCoordinate} ; ${secondCoordinate})`,
      `f(x, y) = (${firstCoordinate} ; ${c})`,
    ]),
    explanation:
      "Chaque coordonnée de l’application correcte est une combinaison linéaire homogène de x et y. Il n’y a ni terme constant ni produit non linéaire.",
    geometry:
      "Une transformation linéaire peut étirer, tourner, cisailler ou écraser l’espace, mais elle garde l’origine fixe.",
    trap:
      "La présence d’un terme constant non nul suffit à détruire la linéarité.",
  };
}

export function applicationQuestion(
  spaceDimension: number,
  forcedTemplate?: 0 | 1 | 2 | 3 | 4,
): Question {
  const template = forcedTemplate ?? randomInt(0, 4);
  if (template === 0) return kernelQuestion();
  if (template === 1) return rankTheoremQuestion();
  if (template === 2) {
    return explicitMapRankQuestion(ambientDimension(spaceDimension));
  }
  if (template === 3) return imageQuestion(ambientDimension(spaceDimension));
  return linearityQuestion();
}

function matrixVectorQuestion(): Question {
  let coefficients = Array.from({ length: 4 }, () => randomInt(-9, 9));
  while (coefficients.every((coefficient) => coefficient === 0)) {
    coefficients = Array.from({ length: 4 }, () => randomInt(-9, 9));
  }
  const value = randomVector(2);
  const rows = [
    [coefficients[0], coefficients[1]],
    [coefficients[2], coefficients[3]],
  ];
  const result = [
    rows[0][0] * value[0] + rows[0][1] * value[1],
    rows[1][0] * value[0] + rows[1][1] * value[1],
  ];
  const rowProduct = [
    rows[0][0] * value[0] + rows[1][0] * value[1],
    rows[0][1] * value[0] + rows[1][1] * value[1],
  ];
  const coordinateProduct = [
    rows[0][0] * value[0],
    rows[1][1] * value[1],
  ];
  const wrongSign = [
    rows[0][0] * value[0] - rows[0][1] * value[1],
    rows[1][0] * value[0] - rows[1][1] * value[1],
  ];
  const distractors = balancedCoordinateDistractors(result, [
    rowProduct,
    coordinateProduct,
    wrongSign,
  ]);

  return {
    id: `M-PROD-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "Produit matrice-vecteur",
    prompt: "Quel est le vecteur Au ?",
    formula: `A = ${matrix(rows)}   et   u = ${columnVector(value)}`,
    choices: choices(
      columnVector(result),
      distractors.map((candidate) => columnVector(candidate)),
    ),
    explanation: `Chaque coordonnée de Au est le produit d’une ligne de A par la colonne u. On obtient Au = ${columnVector(result)}.`,
    geometry:
      "La matrice décrit comment l’application transforme les vecteurs de la base, puis toutes leurs combinaisons linéaires.",
    trap:
      "La première ligne produit la première coordonnée et la seconde ligne produit la seconde.",
  };
}

export function determinant2MatrixQuestion(): Question {
  let rows = [
    [randomInt(-9, 9), randomInt(-9, 9)],
    [randomInt(-9, 9), randomInt(-9, 9)],
  ];
  while (rows.flat().every((coefficient) => coefficient === 0)) {
    rows = [
      [randomInt(-9, 9), randomInt(-9, 9)],
      [randomInt(-9, 9), randomInt(-9, 9)],
    ];
  }
  const [first, second] = rows;
  const determinant = determinant2(first, second);

  return {
    id: `M-DET2-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "Déterminant d’ordre 2",
    prompt: "Quel est le déterminant de cette matrice ?",
    formula: `A = ${matrix(rows)}`,
    choices: choices(`${determinant}`, [
      `${first[0] * second[1] + first[1] * second[0]}`,
      `${first[0] * second[0] - first[1] * second[1]}`,
      `${-determinant}`,
    ]),
    explanation: `det(A) = ${factor(first[0])} × ${factor(second[1])} − ${factor(first[1])} × ${factor(second[0])} = ${determinant}.`,
    geometry:
      "La valeur absolue du déterminant est le facteur par lequel A multiplie les aires.",
    trap:
      "Pour une matrice 2×2, les produits croisés se soustraient : ad − bc.",
  };
}

export function matrixProductQuestion(): Question {
  let first: number[][] = [];
  let second: number[][] = [];
  let result: number[][] = [];
  let distractors: number[][][] = [];

  do {
    first = Array.from({ length: 2 }, () =>
      Array.from({ length: 2 }, () => randomInt(-3, 3)),
    );
    second = Array.from({ length: 2 }, () =>
      Array.from({ length: 2 }, () => randomInt(-3, 3)),
    );
    result = multiplyMatrices(first, second);
    distractors = [
      multiplyMatrices(second, first),
      first.map((row, rowIndex) =>
        row.map(
          (value, columnIndex) =>
            value * second[rowIndex][columnIndex],
        ),
      ),
      multiplyMatrices(first, [
        [second[0][0], second[1][0]],
        [second[0][1], second[1][1]],
      ]),
    ];
  } while (
    new Set([
      matrix(result),
      ...distractors.map((candidate) => matrix(candidate)),
    ]).size < 4
  );

  return {
    id: `M-MATMUL-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "Produit de matrices",
    prompt: "Quel est le produit AB ?",
    formula: `A = ${matrix(first)}   et   B = ${matrix(second)}`,
    choices: choices(
      matrix(result),
      distractors.map((candidate) => matrix(candidate)),
    ),
    explanation: `Chaque coefficient de AB est obtenu par le produit d’une ligne de A avec une colonne de B. On trouve AB = ${matrix(result)}.`,
    geometry:
      "Le produit AB représente la composition où B agit d’abord, puis A.",
    trap:
      "Le produit matriciel n’est ni terme à terme ni commutatif : AB et BA sont généralement différents.",
  };
}

function representationMatrixQuestion(): Question {
  let a = nonZero();
  let b = nonZero();
  let c = nonZero();
  let d = nonZero();
  let answer = "";
  let distractors: string[] = [];
  do {
    a = nonZero();
    b = nonZero();
    c = nonZero();
    d = nonZero();
    answer = matrix([
      [a, b],
      [c, d],
    ]);
    distractors = [
      matrix([
        [a, c],
        [b, d],
      ]),
      matrix([
        [b, a],
        [d, c],
      ]),
      matrix([
        [a, -b],
        [c, -d],
      ]),
    ];
  } while (new Set([answer, ...distractors]).size < 4);

  const firstCoordinate = formatLinearExpression([
    [a, "x"],
    [b, "y"],
  ]);
  const secondCoordinate = formatLinearExpression([
    [c, "x"],
    [d, "y"],
  ]);

  return {
    id: `M-REP-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "Matrice d’une application",
    prompt: "Quelle est la matrice de f dans la base canonique ?",
    formula: `f(x, y) = (${firstCoordinate} ; ${secondCoordinate})`,
    choices: choices(answer, distractors),
    explanation: `Les colonnes sont f(e₁) = ${columnVector([a, c])} et f(e₂) = ${columnVector([b, d])}. La matrice est donc ${answer}.`,
    geometry:
      "Chaque colonne enregistre l’image d’un vecteur de la base de départ.",
    trap:
      "Les coordonnées de f(e₁) et f(e₂) forment des colonnes, pas des lignes.",
  };
}

function invertibleMatrixQuestion(): Question {
  let invertible = [
    randomVector(2),
    randomVector(2),
  ];
  while (determinant2(invertible[0], invertible[1]) === 0) {
    invertible = [randomVector(2), randomVector(2)];
  }
  const singular: number[][][] = [];
  while (singular.length < 3) {
    const row = randomVector(2);
    const scalar = pick([0, 2, -1]);
    const candidate = [row, scaleVector(scalar, row)];
    const candidateText = matrix(candidate);
    if (
      candidateText !== matrix(invertible) &&
      !singular.some((item) => matrix(item) === candidateText)
    ) {
      singular.push(candidate);
    }
  }
  const determinant = determinant2(invertible[0], invertible[1]);

  return {
    id: `M-INV-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "Inversibilité",
    prompt: "Laquelle de ces matrices est inversible ?",
    formula: "Une matrice carrée est inversible si et seulement si son déterminant est non nul.",
    choices: choices(
      matrix(invertible),
      singular.map((candidate) => matrix(candidate)),
    ),
    explanation: `Le déterminant de ${matrix(invertible)} vaut ${determinant}, qui est non nul. Les autres matrices ont deux lignes proportionnelles.`,
    geometry:
      "Une matrice inversible ne détruit aucune direction : elle transforme une base en une base.",
    trap:
      "Des coefficients tous non nuls ne garantissent pas l’inversibilité ; seule l’indépendance des lignes ou des colonnes compte.",
  };
}

function eigenvalueQuestion(): Question {
  const values = sample([-3, -2, 2, 3], 2);
  const [firstEigenvalue, secondEigenvalue] = values;
  const upperCoefficient = nonZero();
  const answer = pick(values);
  const trace = firstEigenvalue + secondEigenvalue;
  const determinant = firstEigenvalue * secondEigenvalue;

  return {
    id: `M-SPEC-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Valeurs propres",
    prompt: "Lequel de ces nombres est une valeur propre de A ?",
    formula: `A = ${matrix([
      [firstEigenvalue, upperCoefficient],
      [0, secondEigenvalue],
    ])}`,
    choices: choices(`${answer}`, [
      `${trace}`,
      `${determinant}`,
      `${-answer}`,
    ]),
    explanation: `A est triangulaire : ses valeurs propres sont les coefficients de sa diagonale, ${firstEigenvalue} et ${secondEigenvalue}.`,
    geometry:
      "Une direction propre est conservée par la transformation, à un facteur multiplicatif près.",
    trap:
      "La trace et le déterminant combinent les valeurs propres, mais ne sont pas en général eux-mêmes des valeurs propres.",
  };
}

export function characteristicPolynomialQuestion(): Question {
  let eigenvalues = sample([-4, -3, -2, -1, 1, 2, 3, 4], 2);
  while (eigenvalues[0] + eigenvalues[1] === 0) {
    eigenvalues = sample([-4, -3, -2, -1, 1, 2, 3, 4], 2);
  }
  const [firstEigenvalue, secondEigenvalue] = eigenvalues;
  const upperCoefficient = nonZero();
  const trace = firstEigenvalue + secondEigenvalue;
  const determinant = firstEigenvalue * secondEigenvalue;
  const answer = characteristicPolynomial2(trace, determinant);

  return {
    id: `M-CHARPOLY-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Polynôme caractéristique",
    prompt: "Quel est le polynôme caractéristique χ_A(X) = det(XI − A) ?",
    formula: `A = ${matrix([
      [firstEigenvalue, upperCoefficient],
      [0, secondEigenvalue],
    ])}`,
    choices: choices(answer, [
      characteristicPolynomial2(-trace, determinant),
      characteristicPolynomial2(trace, -determinant),
      characteristicPolynomial2(trace, determinant + 1),
    ]),
    explanation: `A est triangulaire, donc χ_A(X) = ${polynomialRootFactor(firstEigenvalue)}${polynomialRootFactor(secondEigenvalue)} = ${answer}.`,
    geometry:
      "Les racines du polynôme caractéristique sont les valeurs propres, comptées avec leur multiplicité.",
    trap:
      "Avec la convention det(XI − A), le coefficient de X est l’opposé de la trace.",
  };
}

function inverseUnimodular2(value: readonly (readonly number[])[]) {
  const determinant = determinant2(value[0], value[1]);
  return [
    [value[1][1] / determinant, -value[0][1] / determinant],
    [-value[1][0] / determinant, value[0][0] / determinant],
  ];
}

export function eigenvectorQuestion(): Question {
  const changeOfBasis = pick([
    [[1, 1], [0, 1]],
    [[1, 0], [1, 1]],
    [[1, -1], [1, 0]],
    [[0, 1], [-1, 1]],
  ] as const);
  const eigenvalues = sample([-4, -3, -2, -1, 1, 2, 3, 4], 2);
  const diagonal = [
    [eigenvalues[0], 0],
    [0, eigenvalues[1]],
  ];
  const value = multiplyMatrices(
    multiplyMatrices(changeOfBasis, diagonal),
    inverseUnimodular2(changeOfBasis),
  );
  const selectedIndex = randomInt(0, 1);
  const eigenvector = [
    changeOfBasis[0][selectedIndex],
    changeOfBasis[1][selectedIndex],
  ];
  const otherEigenvector = [
    changeOfBasis[0][1 - selectedIndex],
    changeOfBasis[1][1 - selectedIndex],
  ];
  const mixedVector = [
    eigenvector[0] + otherEigenvector[0],
    eigenvector[1] + otherEigenvector[1],
  ];
  const selectedEigenvalue = eigenvalues[selectedIndex];

  return {
    id: `M-EIGENVECTOR-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Espace propre",
    prompt: `Quel vecteur est un vecteur propre de A pour la valeur propre ${selectedEigenvalue} ?`,
    formula: `A = ${matrix(value)}`,
    choices: choices(columnVector(eigenvector), [
      columnVector(otherEigenvector),
      columnVector(mixedVector),
      columnVector([0, 0]),
    ]),
    explanation: `On vérifie que A ${columnVector(eigenvector)} = ${selectedEigenvalue} ${columnVector(eigenvector)}. Le vecteur est non nul : il appartient donc à l’espace propre E_${selectedEigenvalue}.`,
    geometry:
      "Une direction propre est conservée par l’application ; seule sa longueur ou son orientation peut changer.",
    trap:
      "Le vecteur nul vérifie formellement Av = λv, mais il n’est jamais un vecteur propre.",
  };
}

export function diagonalizabilityQuestion(): Question {
  const template = randomInt(0, 2);
  if (template === 1) {
    const eigenvalues = sample([-4, -3, -2, -1, 1, 2, 3, 4], 2);
    const changeOfBasis = pick([
      [[1, 1], [0, 1]],
      [[1, 0], [1, 1]],
      [[1, -1], [1, 0]],
    ] as const);
    const diagonal = [
      [eigenvalues[0], 0],
      [0, eigenvalues[1]],
    ];
    const value = multiplyMatrices(
      multiplyMatrices(changeOfBasis, diagonal),
      inverseUnimodular2(changeOfBasis),
    );
    return {
      id: `M-DIAGONAL-SPECTRUM-${Date.now()}-${randomInt(100, 999)}`,
      sector: "matrices",
      eyebrow: "MP · Diagonalisation",
      prompt: "Quelle conclusion est certaine ?",
      formula: `A = ${matrix(value)},   Sp(A) = {${eigenvalues.join(" ; ")}}`,
      choices: choices(
        "A est diagonalisable car elle possède deux valeurs propres distinctes.",
        [
          "A n’est pas diagonalisable car elle n’est pas diagonale.",
          "A est seulement trigonalisable car ses coefficients hors diagonale sont non nuls.",
          "On ne peut conclure qu’après avoir calculé A².",
        ],
      ),
      explanation:
        "Dans un espace de dimension 2, deux valeurs propres distinctes fournissent deux directions propres indépendantes, donc une base de vecteurs propres.",
      geometry:
        "Les deux directions propres donnent les deux axes de la base qui diagonalise A.",
      trap:
        "Une matrice diagonalisable n’est pas nécessairement déjà diagonale dans la base canonique.",
    };
  }

  if (template === 2) {
    const [firstEigenvalue, secondEigenvalue] = sample(
      [-4, -3, -2, -1, 1, 2, 3, 4],
      2,
    );
    const answer = matrix([
      [firstEigenvalue, 0],
      [0, secondEigenvalue],
    ]);
    return {
      id: `M-DIAGONAL-BASIS-${Date.now()}-${randomInt(100, 999)}`,
      sector: "matrices",
      eyebrow: "MP · Diagonalisation",
      prompt: "Quelle est la matrice de u dans la base B = (v₁, v₂) ?",
      formula: `u(v₁) = ${formatLinearExpression([[firstEigenvalue, "v₁"]])},   u(v₂) = ${formatLinearExpression([[secondEigenvalue, "v₂"]])},   B est une base de E`,
      choices: choices(answer, [
        matrix([
          [secondEigenvalue, 0],
          [0, firstEigenvalue],
        ]),
        matrix([
          [firstEigenvalue, secondEigenvalue],
          [0, 0],
        ]),
        matrix([
          [0, firstEigenvalue],
          [secondEigenvalue, 0],
        ]),
      ]),
      explanation: `Les vecteurs de B sont propres. Les colonnes des coordonnées de u(v₁) et u(v₂) donnent donc la matrice diagonale ${answer}.`,
      geometry:
        "Dans une base propre, chaque axe est simplement multiplié par sa valeur propre.",
      trap:
        "L’ordre des valeurs propres sur la diagonale doit suivre l’ordre des vecteurs de la base.",
    };
  }

  const eigenvalues = sample([-3, -2, -1, 1, 2, 3], 2);
  const [repeatedEigenvalue, simpleEigenvalue] = eigenvalues;
  const diagonalizable = Math.random() < 0.5;
  const repeatedEigenspaceDimension = diagonalizable ? 2 : 1;
  const totalEigenspaceDimension = repeatedEigenspaceDimension + 1;
  const answer = diagonalizable
    ? `u est diagonalisable : ${repeatedEigenspaceDimension} + 1 = 3.`
    : `u n’est pas diagonalisable : ${repeatedEigenspaceDimension} + 1 < 3.`;

  return {
    id: `M-DIAGONAL-${diagonalizable ? "YES" : "NO"}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Diagonalisation",
    prompt: "Quelle conclusion est correcte ?",
    formula: `χ_u(X) = ${polynomialRootFactor(repeatedEigenvalue)}²${polynomialRootFactor(simpleEigenvalue)},   dim(E_${repeatedEigenvalue}) = ${repeatedEigenspaceDimension},   dim(E_${simpleEigenvalue}) = 1`,
    choices: choices(answer, [
      "u est diagonalisable car son polynôme caractéristique est de degré 3.",
      "u n’est pas diagonalisable car il possède exactement deux valeurs propres.",
      "On ne peut rien conclure sans calculer det(u).",
    ]),
    explanation: diagonalizable
      ? "La somme des dimensions des sous-espaces propres vaut 3, qui est la dimension de l’espace. Une base de vecteurs propres existe."
      : "La somme des dimensions des sous-espaces propres vaut seulement 2. Il manque une direction propre pour former une base.",
    geometry:
      "Diagonaliser consiste à trouver une base entièrement formée de directions propres.",
    trap:
      "Un polynôme caractéristique scindé ne suffit pas à garantir la diagonalisabilité.",
  };
}

export function triangularizationQuestion(): Question {
  const template = randomInt(0, 2);
  if (template === 1) {
    const realEigenvalue = nonZero();
    return {
      id: `M-TRIANGULAR-FIELD-${Date.now()}-${randomInt(100, 999)}`,
      sector: "matrices",
      eyebrow: "MP · Trigonalisation",
      prompt: "Quelle affirmation est correcte sur ℝ ?",
      formula: `u ∈ L(E),   χ_u(X) = (X² + 1)${polynomialRootFactor(realEigenvalue)}`,
      choices: choices(
        "u n’est pas trigonalisable sur ℝ car χ_u n’est pas scindé sur ℝ.",
        [
          "u est diagonalisable sur ℝ car χ_u possède une racine réelle.",
          "u est trigonalisable sur ℝ car χ_u est de degré 3.",
          "u est nilpotent car 0 n’est pas valeur propre.",
        ],
      ),
      explanation:
        "Un endomorphisme est trigonalisable sur le corps de base si et seulement si son polynôme caractéristique y est scindé. Le facteur X² + 1 ne se scinde pas sur ℝ.",
      geometry:
        "Sur ℝ, il manque deux directions spectrales réelles pour construire un drapeau stable complet.",
      trap:
        "Posséder une valeur propre réelle ne suffit pas : toutes les racines doivent appartenir au corps de base.",
    };
  }

  if (template === 2) {
    const eigenvalue = nonZero();
    return {
      id: `M-TRIANGULAR-BASIS-${Date.now()}-${randomInt(100, 999)}`,
      sector: "matrices",
      eyebrow: "MP · Trigonalisation",
      prompt: "Quelle conclusion décrit u dans la base B = (v₁, v₂) ?",
      formula: `u(v₁) = ${formatLinearExpression([[eigenvalue, "v₁"]])},   u(v₂) = ${formatLinearExpression([[1, "v₁"], [eigenvalue, "v₂"]])},   B est une base de E`,
      choices: choices(
        "La matrice de u est triangulaire, mais u n’est pas diagonalisable.",
        [
          "La matrice de u est diagonale.",
          "u n’est pas trigonalisable.",
          "u possède deux valeurs propres distinctes.",
        ],
      ),
      explanation: `Dans B, la matrice est ${matrix([
        [eigenvalue, 1],
        [0, eigenvalue],
      ])}. Elle est triangulaire. Son unique espace propre est engendré par v₁, donc il ne fournit pas une base propre.`,
      geometry:
        "Le terme v₁ dans u(v₂) crée un cisaillement le long de l’unique direction propre.",
      trap:
        "Une matrice triangulaire n’est diagonale que si ses coefficients hors diagonale sont nuls.",
    };
  }

  let eigenvalues = sample([-4, -3, -2, -1, 1, 2, 3, 4], 2);
  while (eigenvalues[0] + eigenvalues[1] === 0) {
    eigenvalues = sample([-4, -3, -2, -1, 1, 2, 3, 4], 2);
  }
  const [repeatedEigenvalue, simpleEigenvalue] = eigenvalues;
  const extraValue = repeatedEigenvalue + simpleEigenvalue;
  const answer = `{${repeatedEigenvalue} ; ${repeatedEigenvalue} ; ${simpleEigenvalue}}`;

  return {
    id: `M-TRIANGULAR-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Trigonalisation",
    prompt: "À l’ordre près, quels sont les coefficients diagonaux d’une forme triangulaire de u ?",
    formula: `χ_u(X) = ${polynomialRootFactor(repeatedEigenvalue)}²${polynomialRootFactor(simpleEigenvalue)}`,
    choices: choices(answer, [
      `{${repeatedEigenvalue} ; ${simpleEigenvalue} ; ${simpleEigenvalue}}`,
      `{${repeatedEigenvalue} ; ${simpleEigenvalue} ; ${extraValue}}`,
      `{0 ; ${repeatedEigenvalue} ; ${simpleEigenvalue}}`,
    ]),
    explanation: `Dans une matrice triangulaire, les coefficients diagonaux sont les valeurs propres comptées avec leur multiplicité. On obtient donc ${answer}, à l’ordre près.`,
    geometry:
      "La trigonalisation organise les directions généralisées tout en faisant apparaître le spectre sur la diagonale.",
    trap:
      "La multiplicité algébrique d’une valeur propre doit être conservée sur la diagonale.",
  };
}

export function annihilatingPolynomialQuestion(): Question {
  const [firstEigenvalue, secondEigenvalue] = sample(
    [-4, -3, -2, -1, 1, 2, 3, 4],
    2,
  );
  let outsider = nonZero();
  while (
    outsider === firstEigenvalue ||
    outsider === secondEigenvalue
  ) {
    outsider = nonZero();
  }
  const answer = `${polynomialRootFactor(firstEigenvalue)}${polynomialRootFactor(secondEigenvalue)}`;

  return {
    id: `M-ANNULATOR-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Polynôme annulateur",
    prompt: "Lequel de ces polynômes annule A ?",
    formula: `A = ${matrix([
      [firstEigenvalue, nonZero()],
      [0, secondEigenvalue],
    ])}`,
    choices: choices(answer, [
      polynomialRootFactor(firstEigenvalue),
      polynomialRootFactor(secondEigenvalue),
      `${polynomialRootFactor(firstEigenvalue)}${polynomialRootFactor(outsider)}`,
    ]),
    explanation: `Les valeurs propres distinctes sont ${firstEigenvalue} et ${secondEigenvalue}. La matrice est diagonalisable, donc ${answer} annule A.`,
    geometry:
      "Le polynôme annulateur s’annule sur chacune des directions propres de la transformation.",
    trap:
      "Un polynôme qui ne s’annule que sur une seule valeur propre ne peut pas annuler tout l’endomorphisme.",
  };
}

export function minimalPolynomialQuestion(): Question {
  const template = randomInt(0, 2);
  const eigenvalue = nonZero();
  let value: number[][];
  let answer: string;
  let explanation: string;

  if (template === 0) {
    value = [[eigenvalue, 0], [0, eigenvalue]];
    answer = polynomialRootFactor(eigenvalue);
    explanation =
      "A est une matrice scalaire : A − λI = 0. Le polynôme minimal est donc de degré 1.";
  } else if (template === 1) {
    value = [[eigenvalue, 1], [0, eigenvalue]];
    answer = `${polynomialRootFactor(eigenvalue)}²`;
    explanation =
      "A − λI est non nulle mais son carré est nul. Le polynôme minimal est donc (X − λ)².";
  } else {
    let secondEigenvalue = nonZero();
    while (secondEigenvalue === eigenvalue) secondEigenvalue = nonZero();
    value = [[eigenvalue, 0], [0, secondEigenvalue]];
    answer = `${polynomialRootFactor(eigenvalue)}${polynomialRootFactor(secondEigenvalue)}`;
    explanation =
      "Les deux valeurs propres distinctes doivent être racines du polynôme minimal, et leur produit annule la matrice diagonale.";
  }

  return {
    id: `M-MINIMAL-${template}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Polynôme minimal",
    prompt: "Quel est le polynôme minimal unitaire de A ?",
    formula: `A = ${matrix(value)}`,
    choices: choices(
      answer,
      [
        "X",
        polynomialRootFactor(eigenvalue),
        `${polynomialRootFactor(eigenvalue)}²`,
        `${polynomialRootFactor(eigenvalue)}³`,
      ].filter((candidate) => candidate !== answer),
    ),
    explanation,
    geometry:
      "Le polynôme minimal mesure le nombre d’itérations nécessaires pour annuler chaque composante spectrale.",
    trap:
      "Le polynôme minimal divise le polynôme caractéristique, mais il ne lui est pas toujours égal.",
  };
}

export function cayleyHamiltonQuestion(): Question {
  let eigenvalues = sample([-4, -3, -2, -1, 1, 2, 3, 4], 2);
  while (eigenvalues[0] + eigenvalues[1] === 0) {
    eigenvalues = sample([-4, -3, -2, -1, 1, 2, 3, 4], 2);
  }
  const trace = eigenvalues[0] + eigenvalues[1];
  const determinant = eigenvalues[0] * eigenvalues[1];
  const relation = (a: number, b: number) =>
    `A² = ${formatLinearExpression([[a, "A"], [b, "I"]])}`;
  const answer = relation(trace, -determinant);

  return {
    id: `M-CAYLEY-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Cayley-Hamilton",
    prompt: "Quelle relation vérifie A d’après le théorème de Cayley-Hamilton ?",
    formula: `A = ${matrix([
      [eigenvalues[0], nonZero()],
      [0, eigenvalues[1]],
    ])},   χ_A(X) = ${characteristicPolynomial2(trace, determinant)}`,
    choices: choices(answer, [
      relation(-trace, -determinant),
      relation(trace, determinant),
      relation(-trace, determinant),
    ]),
    explanation: `Cayley-Hamilton donne χ_A(A) = 0. En isolant A² dans cette relation, on obtient ${answer}.`,
    geometry:
      "Les puissances élevées de A se replient sur l’espace engendré par I et A.",
    trap:
      "Dans χ_A(A), le terme constant devient un multiple de I, pas un simple nombre.",
  };
}

export function characteristicSubspaceQuestion(): Question {
  const [repeatedEigenvalue, simpleEigenvalue] = sample(
    [-4, -3, -2, -1, 1, 2, 3, 4],
    2,
  );
  const askRepeated = Math.random() < 0.5;
  const selectedEigenvalue = askRepeated
    ? repeatedEigenvalue
    : simpleEigenvalue;
  const answer = askRepeated ? "2" : "1";

  return {
    id: `M-CHARSPACE-${askRepeated ? "DOUBLE" : "SIMPLE"}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Sous-espace caractéristique",
    prompt: `Quelle est la dimension de N_${selectedEigenvalue} = Ker((${shiftedMatrix(selectedEigenvalue)})³) ?`,
    formula: `A = ${matrix([
      [repeatedEigenvalue, 1, 0],
      [0, repeatedEigenvalue, 0],
      [0, 0, simpleEigenvalue],
    ])}`,
    choices: choices(answer, ["0", "1", "2", "3"].filter((item) => item !== answer)),
    explanation: `La dimension du sous-espace caractéristique associé à ${selectedEigenvalue} est sa multiplicité algébrique dans χ_A : elle vaut ${answer}.`,
    geometry:
      "Les sous-espaces caractéristiques regroupent les directions propres et les directions généralisées associées à une même valeur propre.",
    trap:
      "Le sous-espace caractéristique peut être plus grand que l’espace propre lorsque la matrice n’est pas diagonalisable.",
  };
}

export function determinant3Question(): Question {
  const template = randomInt(0, 2);
  let rows: number[][];
  let determinant: number;
  let explanation: string;
  let temptingDiagonal: number;

  if (template === 0) {
    const diagonal = [nonZero(), nonZero(), nonZero()];
    rows = [
      [diagonal[0], randomInt(-3, 3), randomInt(-3, 3)],
      [0, diagonal[1], randomInt(-3, 3)],
      [0, 0, diagonal[2]],
    ];
    determinant = diagonal[0] * diagonal[1] * diagonal[2];
    temptingDiagonal = diagonal.reduce((sum, value) => sum + value, 0);
    explanation = `La matrice est triangulaire : son déterminant est le produit des coefficients diagonaux, soit ${diagonal[0]} × ${diagonal[1]} × ${diagonal[2]} = ${determinant}.`;
  } else if (template === 1) {
    const a = nonZero();
    const b = nonZero();
    const c = nonZero();
    const d = nonZero();
    const e = nonZero();
    rows = [
      [a, 0, 0],
      [randomInt(-3, 3), b, c],
      [randomInt(-3, 3), d, e],
    ];
    determinant = a * (b * e - c * d);
    temptingDiagonal = a * b * e;
    explanation = `On développe selon la première ligne : det(A) = ${a} × (${b} × ${e} − ${c} × ${d}) = ${determinant}.`;
  } else {
    const a = nonZero();
    const b = nonZero();
    const c = nonZero();
    const d = nonZero();
    const e = nonZero();
    rows = [
      [a, randomInt(-3, 3), b],
      [0, c, 0],
      [d, randomInt(-3, 3), e],
    ];
    determinant = c * (a * e - b * d);
    temptingDiagonal = a * c * e;
    explanation = `On développe selon la deuxième ligne. Le signe du coefficient central est positif : det(A) = ${c} × (${a} × ${e} − ${b} × ${d}) = ${determinant}.`;
  }

  return {
    id: `M-DET3-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "Déterminant d’ordre 3",
    prompt: "Quel est le déterminant de cette matrice ?",
    formula: `A = ${matrix(rows)}`,
    choices: choices(`${determinant}`, [
      `${-determinant}`,
      `${temptingDiagonal}`,
      `${determinant + pick([-3, -2, -1, 1, 2, 3])}`,
    ]),
    explanation,
    geometry:
      "La valeur absolue du déterminant mesure le facteur de dilatation des volumes.",
    trap:
      "Le produit de la diagonale suffit seulement pour une matrice triangulaire.",
  };
}

function nonSingularBlock2() {
  let block = [
    [nonZero(), nonZero()],
    [nonZero(), nonZero()],
  ];
  while (determinant2(block[0], block[1]) === 0) {
    block = [
      [nonZero(), nonZero()],
      [nonZero(), nonZero()],
    ];
  }
  return block;
}

export function blockDeterminantQuestion(): Question {
  const order = pick([4, 5] as const);
  const firstBlock = nonSingularBlock2();
  const firstDeterminant = determinant2(firstBlock[0], firstBlock[1]);
  let rows: number[][];
  let secondDeterminant: number;
  let blockDescription: string;

  if (order === 4) {
    const secondBlock = nonSingularBlock2();
    const upperRight = Array.from({ length: 2 }, () =>
      Array.from({ length: 2 }, () => randomInt(-3, 3)),
    );
    rows = [
      [...firstBlock[0], ...upperRight[0]],
      [...firstBlock[1], ...upperRight[1]],
      [0, 0, ...secondBlock[0]],
      [0, 0, ...secondBlock[1]],
    ];
    secondDeterminant = determinant2(secondBlock[0], secondBlock[1]);
    blockDescription = "deux blocs diagonaux 2×2";
  } else {
    const diagonal = [nonZero(), nonZero(), nonZero()];
    const secondBlock = [
      [diagonal[0], randomInt(-3, 3), randomInt(-3, 3)],
      [0, diagonal[1], randomInt(-3, 3)],
      [0, 0, diagonal[2]],
    ];
    const upperRight = Array.from({ length: 2 }, () =>
      Array.from({ length: 3 }, () => randomInt(-3, 3)),
    );
    rows = [
      [...firstBlock[0], ...upperRight[0]],
      [...firstBlock[1], ...upperRight[1]],
      [0, 0, ...secondBlock[0]],
      [0, 0, ...secondBlock[1]],
      [0, 0, ...secondBlock[2]],
    ];
    secondDeterminant = diagonal[0] * diagonal[1] * diagonal[2];
    blockDescription = "un bloc 2×2 et un bloc triangulaire 3×3";
  }

  const determinant = firstDeterminant * secondDeterminant;
  const diagonalProduct = rows.reduce(
    (product, row, index) => product * row[index],
    1,
  );

  return {
    id: `M-DETBLOCK-${order}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: `MP · Déterminant par blocs · ordre ${order}`,
    prompt: "Quel est le déterminant de cette matrice triangulaire par blocs ?",
    formula: `A = ${matrix(rows)}   (${blockDescription})`,
    choices: choices(`${determinant}`, [
      `${firstDeterminant + secondDeterminant}`,
      `${diagonalProduct}`,
      `${-determinant}`,
    ]),
    explanation: `A est triangulaire par blocs : son déterminant est le produit des déterminants des blocs diagonaux. Ainsi det(A) = ${firstDeterminant} × ${secondDeterminant} = ${determinant}.`,
    geometry:
      `Dans ℝ${order}, le déterminant mesure le facteur de dilatation des volumes de dimension ${order}.`,
    trap:
      "Les blocs hors diagonale n’interviennent pas dans le déterminant d’une matrice triangulaire par blocs.",
  };
}

export function matrixQuestion(
  _spaceDimension: number,
  forcedTemplate?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15,
): Question {
  const template = forcedTemplate ?? randomInt(0, 15);
  if (template === 0) return matrixVectorQuestion();
  if (template === 1) return representationMatrixQuestion();
  if (template === 2) return invertibleMatrixQuestion();
  if (template === 3) return eigenvalueQuestion();
  if (template === 4) return determinant3Question();
  if (template === 5) return determinant2MatrixQuestion();
  if (template === 6) return matrixProductQuestion();
  if (template === 7) return blockDeterminantQuestion();
  if (template === 8) return characteristicPolynomialQuestion();
  if (template === 9) return eigenvectorQuestion();
  if (template === 10) return diagonalizabilityQuestion();
  if (template === 11) return triangularizationQuestion();
  if (template === 12) return annihilatingPolynomialQuestion();
  if (template === 13) return minimalPolynomialQuestion();
  if (template === 14) return cayleyHamiltonQuestion();
  return characteristicSubspaceQuestion();
}

export const EXERCISE_FAMILIES: readonly ExerciseFamily[] = [
  {
    id: "vector-combination",
    sector: "vectors",
    program: "MPSI",
    minInstrument: -1,
    label: "Combinaisons linéaires",
    description: "Calculer les coordonnées de αu + βv.",
    generate: (spaceDimension) => vectorQuestion(spaceDimension, 0),
  },
  {
    id: "vector-span",
    sector: "vectors",
    program: "MPSI",
    minInstrument: -1,
    label: "Appartenance à Vect",
    description: "Reconnaître les vecteurs d’une droite ou d’un plan engendré.",
    generate: (spaceDimension) => vectorQuestion(spaceDimension, 1),
  },
  {
    id: "vector-subspace",
    sector: "vectors",
    program: "MPSI",
    minInstrument: -1,
    label: "Sous-espaces vectoriels",
    description: "Distinguer sous-espaces et ensembles non stables.",
    generate: (spaceDimension) => vectorQuestion(spaceDimension, 2),
  },
  {
    id: "basis-determinant",
    sector: "bases",
    program: "MPSI",
    minInstrument: 1,
    label: "Déterminant d’une famille",
    description: "Calculer un déterminant et reconnaître une base de ℝ².",
    generate: (spaceDimension) => basisQuestion(spaceDimension, 0),
  },
  {
    id: "basis-coordinates",
    sector: "bases",
    program: "MPSI",
    minInstrument: 1,
    label: "Coordonnées dans une base",
    description: "Exprimer un vecteur dans une base non canonique.",
    generate: (spaceDimension) => basisQuestion(spaceDimension, 1),
  },
  {
    id: "basis-rank",
    sector: "bases",
    program: "MPSI",
    minInstrument: 4,
    label: "Rang d’une famille",
    description: "Déterminer le nombre de directions indépendantes.",
    generate: (spaceDimension) => basisQuestion(spaceDimension, 2),
  },
  {
    id: "application-kernel",
    sector: "applications",
    program: "MPSI",
    minInstrument: 9,
    label: "Noyau",
    description: "Identifier un vecteur envoyé sur le vecteur nul.",
    generate: (spaceDimension) => applicationQuestion(spaceDimension, 0),
  },
  {
    id: "application-rank-theorem",
    sector: "applications",
    program: "MPSI",
    minInstrument: 11,
    label: "Théorème du rang",
    description: "Relier dimension du noyau, rang et dimension de départ.",
    generate: (spaceDimension) => applicationQuestion(spaceDimension, 1),
  },
  {
    id: "application-explicit-rank",
    sector: "applications",
    program: "MPSI",
    minInstrument: 8,
    label: "Rang d’une application",
    description: "Lire le rang d’une application donnée explicitement.",
    generate: (spaceDimension) => applicationQuestion(spaceDimension, 2),
  },
  {
    id: "application-image",
    sector: "applications",
    program: "MPSI",
    minInstrument: 10,
    label: "Image d’une application",
    description: "Déterminer le sous-espace atteint par une application.",
    generate: (spaceDimension) => applicationQuestion(spaceDimension, 3),
  },
  {
    id: "application-linearity",
    sector: "applications",
    program: "MPSI",
    minInstrument: 8,
    label: "Linéarité",
    description: "Reconnaître les applications qui conservent les combinaisons linéaires.",
    generate: (spaceDimension) => applicationQuestion(spaceDimension, 4),
  },
  {
    id: "matrix-vector-product",
    sector: "matrices",
    program: "MPSI",
    minInstrument: 12,
    label: "Produit matrice-vecteur",
    description: "Appliquer une matrice à un vecteur colonne.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 0),
  },
  {
    id: "matrix-representation",
    sector: "matrices",
    program: "MPSI",
    minInstrument: 12,
    label: "Matrice d’une application",
    description: "Encoder les images des vecteurs de base dans les colonnes.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 1),
  },
  {
    id: "matrix-invertibility",
    sector: "matrices",
    program: "MPSI",
    minInstrument: 14,
    label: "Inversibilité",
    description: "Reconnaître une matrice de déterminant non nul.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 2),
  },
  {
    id: "matrix-spectrum",
    sector: "matrices",
    program: "MP",
    minInstrument: 15,
    label: "Valeurs propres",
    description: "Lire le spectre d’une matrice triangulaire.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 3),
  },
  {
    id: "matrix-determinant-2",
    sector: "matrices",
    program: "MPSI",
    minInstrument: 12,
    label: "Déterminant 2×2",
    description: "Calculer ad − bc avec des coefficients entiers.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 5),
  },
  {
    id: "matrix-determinant-3",
    sector: "matrices",
    program: "MPSI",
    minInstrument: 14,
    label: "Déterminant 3×3",
    description: "Calculer mentalement un déterminant triangulaire ou creux.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 4),
  },
  {
    id: "matrix-product",
    sector: "matrices",
    program: "MPSI",
    minInstrument: 13,
    label: "Produit de matrices 2×2",
    description: "Multiplier les lignes de A par les colonnes de B.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 6),
  },
  {
    id: "matrix-block-determinant",
    sector: "matrices",
    program: "MP",
    minInstrument: 15,
    label: "Déterminant par blocs",
    description: "Exploiter des blocs triangulaires aux ordres 4 et 5.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 7),
  },
  {
    id: "matrix-characteristic-polynomial",
    sector: "matrices",
    program: "MP",
    minInstrument: 16,
    label: "Polynôme caractéristique",
    description: "Calculer det(XI − A) et retrouver les valeurs propres.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 8),
  },
  {
    id: "matrix-eigenspace",
    sector: "matrices",
    program: "MP",
    minInstrument: 17,
    label: "Espaces propres",
    description: "Reconnaître un vecteur propre associé à une valeur propre.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 9),
  },
  {
    id: "matrix-diagonalization",
    sector: "matrices",
    program: "MP",
    minInstrument: 18,
    label: "Diagonalisation",
    description: "Décider si les sous-espaces propres forment une base.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 10),
  },
  {
    id: "matrix-triangularization",
    sector: "matrices",
    program: "MP",
    minInstrument: 19,
    label: "Trigonalisation",
    description: "Lire le spectre avec multiplicité sur une forme triangulaire.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 11),
  },
  {
    id: "matrix-annihilating-polynomial",
    sector: "matrices",
    program: "MP",
    minInstrument: 20,
    label: "Polynômes annulateurs",
    description: "Reconnaître un polynôme P tel que P(A) = 0.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 12),
  },
  {
    id: "matrix-minimal-polynomial",
    sector: "matrices",
    program: "MP",
    minInstrument: 21,
    label: "Polynôme minimal",
    description: "Déterminer le générateur unitaire de l’idéal annulateur.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 13),
  },
  {
    id: "matrix-cayley-hamilton",
    sector: "matrices",
    program: "MP",
    minInstrument: 22,
    label: "Cayley-Hamilton",
    description: "Réduire les puissances de A grâce à χ_A(A) = 0.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 14),
  },
  {
    id: "matrix-characteristic-subspace",
    sector: "matrices",
    program: "MP",
    minInstrument: 23,
    label: "Sous-espaces caractéristiques",
    description: "Lire les noyaux généralisés associés aux valeurs propres.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 15),
  },
] as const;

export function availableExerciseFamilies(
  sectors: Sector[],
  highestOwnedInstrument = 14,
) {
  return EXERCISE_FAMILIES.filter(
    (family) =>
      sectors.includes(family.sector) &&
      family.minInstrument <= highestOwnedInstrument,
  );
}

export function generateQuestion(
  sectors: Sector[],
  spaceDimension: number,
  highestOwnedInstrument = 14,
) {
  const unlockedFamilies = EXERCISE_FAMILIES.filter(
    (family) => family.minInstrument <= highestOwnedInstrument,
  );
  const availableFamilies = availableExerciseFamilies(
    sectors,
    highestOwnedInstrument,
  );
  return pick(
    availableFamilies.length > 0
      ? availableFamilies
      : unlockedFamilies,
  ).generate(spaceDimension);
}
