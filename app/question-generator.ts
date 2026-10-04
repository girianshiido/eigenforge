import { recallWeight, type PracticeHistory } from "./question-review.ts";
import { WORKSHOP_EXERCISE_FAMILIES } from "./workshop-exercises/index.ts";
import type { Audit } from "./workshop-exercises/core.ts";
export { WORKSHOP_EXERCISE_FAMILIES, WORKSHOP_TASKS, WORKSHOP_TASK_COUNT } from "./workshop-exercises/index.ts";

export type Sector = "vectors" | "bases" | "applications" | "matrices";

export type Question = {
  id: string;
  workshopId?: string;
  audit?: Audit;
  taskKind?: string;
  recallKey?: string;
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
  workshopId?: string;
  cycleId?: string;
  tasks?: readonly { id: string; label: string }[];
  generateTask?: (taskId: string) => Question;
  sector: Sector;
  program: "MPSI" | "MP";
  minInstrument: number;
  label: string;
  description: string;
  generate: (spaceDimension: number, history?: PracticeHistory) => Question;
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]) {
  return items[randomInt(0, items.length - 1)];
}

function weightedIndex(weights: readonly number[]) {
  let target = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < weights.length; index += 1) {
    target -= weights[index];
    if (target < 0) return index;
  }
  return weights.findLastIndex((weight) => weight > 0);
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

function columnVector(values: readonly (number | string)[]) {
  return `⟪${values.join(",")}⟫`;
}

function squareRoot(value: number | string) {
  return `√${value}`;
}

function realSpace(dimension: number) {
  const superscriptDigits: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
  };
  return `ℝ${String(dimension)
    .split("")
    .map((digit) => superscriptDigits[digit] ?? digit)
    .join("")}`;
}

function fraction(
  numerator: number | string,
  denominator: number | string,
) {
  return `⟬${numerator}¦${denominator}⟭`;
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

function dotProduct(
  first: readonly number[],
  second: readonly number[],
) {
  return first.reduce(
    (sum, coordinate, index) => sum + coordinate * second[index],
    0,
  );
}

function squaredNorm(value: readonly number[]) {
  return dotProduct(value, value);
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

function transposeMatrix(
  value: readonly (readonly number[])[],
) {
  return value[0].map((_, columnIndex) =>
    value.map((row) => row[columnIndex]),
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

function matrixRootFactor(root: number) {
  const magnitude = Math.abs(root) === 1 ? "" : `${Math.abs(root)}`;
  return root > 0 ? `(A − ${magnitude}I)` : `(A + ${magnitude}I)`;
}

function cayleyHamiltonIdentity2(trace: number, determinant: number) {
  let result = "χ_A(A) = A²";
  if (trace !== 0) {
    const magnitude = Math.abs(trace) === 1 ? "" : `${Math.abs(trace)}`;
    result += trace > 0 ? ` − ${magnitude}A` : ` + ${magnitude}A`;
  }
  if (determinant !== 0) {
    const magnitude =
      Math.abs(determinant) === 1 ? "" : `${Math.abs(determinant)}`;
    result += determinant > 0 ? ` + ${magnitude}I` : ` − ${magnitude}I`;
  }
  return `${result} = 0`;
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
      explanation: `On cherche x = λe₁ + μe₂. La seconde coordonnée donne μ = ${beta}, puis ${coordinateEquation} = ${canonicalX}, donc λ = ${alpha}. Ainsi [x]_B = ${answer}.`,
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
  if (indices.length === dimension) return realSpace(dimension);
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
    formula: `f : ${field} → ${field},   f(${variables.join(", ")}) = (${formatLinearExpression(linearForm)}) · ${columnVector(direction)}`,
    choices: choices(
      answer,
      wrongDirections.map((candidate) => `Vect(${vector(candidate)})`),
    ),
    explanation: `Toutes les valeurs de f sont des multiples de ${columnVector(direction)}, et la forme linéaire placée devant prend toute valeur réelle. Donc Im(f) = ${answer}.`,
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
  const distractorCandidates = [
    trace,
    determinant,
    -answer,
    firstEigenvalue + secondEigenvalue + 1,
    firstEigenvalue * secondEigenvalue - 1,
    0,
    -4,
    -1,
    1,
    4,
  ];
  const distractors = Array.from(
    new Set(
      distractorCandidates.filter(
        (candidate) => !values.includes(candidate),
      ),
    ),
  );
  let fallback = -8;
  while (distractors.length < 3) {
    if (!values.includes(fallback) && !distractors.includes(fallback)) {
      distractors.push(fallback);
    }
    fallback += 1;
  }

  return {
    id: `M-SPEC-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Valeurs propres",
    prompt: "Lequel de ces nombres est une valeur propre de A ?",
    formula: `A = ${matrix([
      [firstEigenvalue, upperCoefficient],
      [0, secondEigenvalue],
    ])}`,
    choices: choices(
      `${answer}`,
      distractors.slice(0, 3).map(String),
    ),
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
  const template = randomInt(0, 3);

  if (template === 2) {
    const constant = randomInt(2, 6);
    const answer = `A = A² − ${constant}I`;
    return {
      id: `M-CAYLEY-EQUIVALENT-${Date.now()}-${randomInt(100, 999)}`,
      sector: "matrices",
      eyebrow: "MP · Polynôme annulateur",
      prompt: "Quelle relation est équivalente à P(A) = 0 ?",
      formula: `P(X) = X² − X − ${constant}`,
      choices: choices(answer, [
        `A = A² + ${constant}I`,
        `A² = A − ${constant}I`,
        `A = ${constant}A² − I`,
      ]),
      explanation: `P(A) = 0 signifie A² − A − ${constant}I = 0. En isolant A, on obtient ${answer}.`,
      geometry:
        "Une relation annulative replie les puissances de A sur les puissances de degré inférieur.",
      trap:
        "Le terme constant du polynôme devient un multiple de la matrice identité.",
    };
  }

  if (template === 3) {
    const eigenvalues = sample([-4, -3, -2, -1, 1, 2, 3, 4], 3);
    let outsider = nonZero();
    while (eigenvalues.includes(outsider)) outsider = randomInt(-6, 6) || 5;
    const factors = eigenvalues.map(matrixRootFactor);
    const answer = `${factors.join("")} = 0`;
    return {
      id: `M-CAYLEY-ORDER3-${Date.now()}-${randomInt(100, 999)}`,
      sector: "matrices",
      eyebrow: "MP · Cayley-Hamilton · Dimension 3",
      prompt: "Quelle relation de Cayley-Hamilton vérifie A ?",
      formula: `A = ${matrix([
        [eigenvalues[0], nonZero(), randomInt(-3, 3)],
        [0, eigenvalues[1], nonZero()],
        [0, 0, eigenvalues[2]],
      ])}`,
      choices: choices(answer, [
        `${matrixRootFactor(-eigenvalues[0])}${factors[1]}${factors[2]} = 0`,
        `${factors[0]}${factors[1]} = 0`,
        `${factors[0]}${factors[1]}${matrixRootFactor(outsider)} = 0`,
      ]),
      explanation: `A est triangulaire, donc χ_A(X) = ${eigenvalues.map(polynomialRootFactor).join("")}. Le théorème donne χ_A(A) = ${answer}`,
      geometry:
        "En dimension 3, Cayley-Hamilton ramène toutes les puissances de A à une combinaison de I, A et A².",
      trap:
        "Chaque valeur propre doit apparaître avec sa multiplicité dans le polynôme caractéristique.",
    };
  }

  let eigenvalues = sample([-4, -3, -2, -1, 1, 2, 3, 4], 2);
  while (eigenvalues[0] + eigenvalues[1] === 0) {
    eigenvalues = sample([-4, -3, -2, -1, 1, 2, 3, 4], 2);
  }
  const trace = eigenvalues[0] + eigenvalues[1];
  const determinant = eigenvalues[0] * eigenvalues[1];
  const characteristic = characteristicPolynomial2(trace, determinant);

  if (template === 1) {
    const answer = `${polynomialRootFactor(eigenvalues[0])}${polynomialRootFactor(eigenvalues[1])}`;
    return {
      id: `M-CAYLEY-ANNULATOR-${Date.now()}-${randomInt(100, 999)}`,
      sector: "matrices",
      eyebrow: "MP · Cayley-Hamilton",
      prompt: "Lequel de ces polynômes annule A d’après Cayley-Hamilton ?",
      formula: `A = ${matrix([
        [eigenvalues[0], nonZero()],
        [0, eigenvalues[1]],
      ])}`,
      choices: choices(answer, [
        polynomialRootFactor(eigenvalues[0]),
        polynomialRootFactor(eigenvalues[1]),
        `${polynomialRootFactor(-eigenvalues[0])}${polynomialRootFactor(eigenvalues[1])}`,
      ]),
      explanation: `On calcule χ_A(X) = ${answer}. Le théorème de Cayley-Hamilton affirme alors χ_A(A) = 0.`,
      geometry:
        "Le polynôme caractéristique annule simultanément toutes les composantes spectrales.",
      trap:
        "Ici, le polynôme caractéristique doit être calculé à partir de A : il n’est pas fourni.",
    };
  }

  const answer = cayleyHamiltonIdentity2(trace, determinant);

  return {
    id: `M-CAYLEY-IDENTITY-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Cayley-Hamilton",
    prompt: "Quelle identité affirme le théorème de Cayley-Hamilton ?",
    formula: `χ_A(X) = ${characteristic}`,
    choices: choices(answer, [
      cayleyHamiltonIdentity2(-trace, determinant),
      cayleyHamiltonIdentity2(trace, -determinant),
      `χ_A(0) = ${determinant}I`,
    ]),
    explanation: `La véritable assertion du théorème est χ_A(A) = 0. En remplaçant X par A dans χ_A, on obtient ${answer}.`,
    geometry:
      "Les puissances élevées de A se replient sur l’espace engendré par I et A.",
    trap:
      "Dans χ_A(A), le terme constant devient un multiple de I, pas un simple nombre.",
  };
}

export function characteristicSubspaceQuestion(): Question {
  const order = pick([3, 4, 5]);
  const blockSize = randomInt(2, order - 1);
  const simpleCount = order - blockSize;
  const eigenvalues = sample(
    [-4, -3, -2, -1, 1, 2, 3, 4],
    simpleCount + 1,
  );
  const repeatedEigenvalue = eigenvalues[0];
  const simpleEigenvalues = eigenvalues.slice(1);
  const askRepeated = Math.random() < 0.5;
  const selectedEigenvalue = askRepeated
    ? repeatedEigenvalue
    : pick(simpleEigenvalues);
  const answer = askRepeated ? `${blockSize}` : "1";
  const coupling = pick([-3, -2, -1, 1, 2, 3]);
  const positions = shuffle(
    Array.from({ length: order }, (_, index) => index),
  );
  const blockPositions = positions.slice(0, blockSize);
  const simplePositions = positions.slice(blockSize);
  const value = Array.from(
    { length: order },
    () => Array.from({ length: order }, () => 0),
  );
  for (const position of blockPositions) {
    value[position][position] = repeatedEigenvalue;
  }
  for (let index = 0; index < simplePositions.length; index += 1) {
    const position = simplePositions[index];
    value[position][position] = simpleEigenvalues[index];
  }
  for (let index = 0; index < blockPositions.length - 1; index += 1) {
    value[blockPositions[index]][blockPositions[index + 1]] = coupling;
  }
  const exponent = order === 3 ? "³" : order === 4 ? "⁴" : "⁵";

  return {
    id: `M-CHARSPACE-O${order}-B${blockSize}-P${blockPositions.join("")}-${askRepeated ? "REPEATED" : "SIMPLE"}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Sous-espace caractéristique",
    prompt: `Quelle est la dimension de N_${selectedEigenvalue} = Ker((${shiftedMatrix(selectedEigenvalue)})${exponent}) ?`,
    formula: `A = ${matrix(value)}`,
    choices: choices(
      answer,
      Array.from({ length: order + 1 }, (_, index) => `${index}`).filter(
        (item) => item !== answer,
      ),
    ),
    explanation: `La dimension du sous-espace caractéristique associé à ${selectedEigenvalue} est sa multiplicité algébrique dans χ_A : elle vaut ${answer}.`,
    geometry:
      "Les sous-espaces caractéristiques regroupent les directions propres et les directions généralisées associées à une même valeur propre.",
    trap:
      "Le sous-espace caractéristique peut être plus grand que l’espace propre lorsque la matrice n’est pas diagonalisable.",
  };
}

export function adjointMatrixQuestion(): Question {
  const order = pick([2, 3]);
  let value: number[][];
  let transposed: number[][];
  let distractors: number[][][];

  do {
    value = Array.from({ length: order }, () =>
      Array.from({ length: order }, () => randomInt(-4, 4)),
    );
    transposed = transposeMatrix(value);
    distractors = [
      value,
      transposed.map((row) => row.map((coefficient) => -coefficient)),
      value.map((row) => row.map((coefficient) => -coefficient)),
    ];
  } while (
    new Set([matrix(transposed), ...distractors.map(matrix)]).size !== 4
  );

  return {
    id: `M-ADJOINT-O${order}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Adjoint",
    prompt: "Quelle est la matrice de l’adjoint u^{*} dans cette base ?",
    formula: `Mat(u) = ${matrix(value)},   la base est orthonormée`,
    choices: choices(matrix(transposed), distractors.map(matrix)),
    explanation: `Dans une base orthonormée d’un espace euclidien, Mat(u^{*}) = Mat(u)ᵀ. On transpose donc lignes et colonnes : ${matrix(transposed)}.`,
    geometry:
      "L’adjoint échange le rôle des deux arguments dans le produit scalaire.",
    trap:
      "La transposée représente l’adjoint seulement lorsque la base utilisée est orthonormée.",
  };
}

export function selfAdjointQuestion(): Question {
  const order = pick([2, 3]);
  const symmetric = Array.from(
    { length: order },
    () => Array.from({ length: order }, () => 0),
  );
  for (let row = 0; row < order; row += 1) {
    for (let column = row; column < order; column += 1) {
      const coefficient = randomInt(-4, 4);
      symmetric[row][column] = coefficient;
      symmetric[column][row] = coefficient;
    }
  }
  const distractors = [1, 2, 3].map((offset) => {
    const candidate = symmetric.map((row) => [...row]);
    candidate[0][1] += offset;
    return candidate;
  });

  return {
    id: `M-SELFADJOINT-O${order}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Endomorphisme autoadjoint",
    prompt: "Laquelle de ces matrices représente un endomorphisme autoadjoint dans une base orthonormée ?",
    formula: "Dans une base orthonormée, u est autoadjoint si et seulement si sa matrice est symétrique.",
    choices: choices(matrix(symmetric), distractors.map(matrix)),
    explanation: `${matrix(symmetric)} est égale à sa transposée : les coefficients symétriques par rapport à la diagonale sont égaux.`,
    geometry:
      "La symétrie matricielle traduit l’équilibre du produit scalaire entre u(x) et y.",
    trap:
      "Une matrice triangulaire ou diagonalisable n’est pas nécessairement symétrique.",
  };
}

export function spectralTheoremQuestion(history?: PracticeHistory): Question {
  if (weightedIndex([recallWeight("spectral-theorem", history), 1]) === 0) {
    return {
      id: `M-SPECTRAL-THEOREM-${Date.now()}-${randomInt(100, 999)}`,
      recallKey: "spectral-theorem",
      sector: "matrices",
      eyebrow: "MP · Théorème spectral",
      prompt: "Quelle conclusion fournit le théorème spectral réel ?",
      formula: "A ∈ M_n(ℝ),   Aᵀ = A",
      choices: choices(
        "Il existe une matrice orthogonale P et une matrice diagonale D telles que A = PDPᵀ.",
        [
          "A est diagonale dans toute base orthonormée.",
          "Toutes les valeurs propres de A sont strictement positives.",
          "Il existe une matrice inversible P telle que A = P².",
        ],
      ),
      explanation:
        "Une matrice réelle symétrique est orthogonalement diagonalisable : elle possède une base orthonormée de vecteurs propres.",
      geometry:
        "La transformation se décompose en une rotation ou réflexion orthogonale des axes, suivie d’étirements indépendants.",
      trap:
        "Le théorème garantit des valeurs propres réelles, pas nécessairement positives.",
    };
  }

  const diagonal = randomInt(-3, 3);
  const coupling = nonZero();
  const firstEigenvalue = diagonal + coupling;
  const secondEigenvalue = diagonal - coupling;
  const answer = matrix([
    [firstEigenvalue, 0],
    [0, secondEigenvalue],
  ]);

  return {
    id: `M-SPECTRAL-BASIS-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Diagonalisation orthogonale",
    prompt: "Quelle est la matrice de u dans la base orthonormée B = (v₁, v₂) ?",
    formula: `Dans la base canonique, Mat(u) = ${matrix([
      [diagonal, coupling],
      [coupling, diagonal],
    ])},\nv₁ = ${fraction(1, squareRoot(2))} ${columnVector([1, 1])}   et   v₂ = ${fraction(1, squareRoot(2))} ${columnVector([1, -1])}`,
    choices: choices(answer, [
      matrix([
        [secondEigenvalue, 0],
        [0, firstEigenvalue],
      ]),
      matrix([
        [diagonal, 0],
        [0, diagonal],
      ]),
      matrix([
        [firstEigenvalue, coupling],
        [0, secondEigenvalue],
      ]),
    ]),
    explanation: `u(v₁) = ${formatLinearExpression([[firstEigenvalue, "v₁"]])} et u(v₂) = ${formatLinearExpression([[secondEigenvalue, "v₂"]])}. Dans l’ordre de B, la matrice de u est donc ${answer}.`,
    geometry:
      "Les deux diagonales du plan deviennent les axes orthogonaux propres de la transformation.",
    trap:
      "L’ordre des coefficients diagonaux doit suivre l’ordre v₁, puis v₂.",
  };
}

export function positivityQuestion(): Question {
  const template = randomInt(0, 3);
  let selected: {
    value: number[][];
    answer: string;
    explanation: string;
    kind: "DEFINED" | "SEMIDEFINED" | "NO";
  };

  if (template === 0) {
    const firstDiagonal = randomInt(1, 5);
    const coupling = randomInt(-3, 3);
    const secondDiagonal =
      coupling * coupling + randomInt(1, 5);
    const determinant =
      firstDiagonal * secondDiagonal - coupling * coupling;
    selected = {
      value: [
        [firstDiagonal, coupling],
        [coupling, secondDiagonal],
      ],
      answer: "A est définie positive.",
      explanation: `Le premier mineur principal vaut ${firstDiagonal} > 0 et det(A) = ${determinant} > 0. Le critère de Sylvester donne donc une matrice définie positive.`,
      kind: "DEFINED",
    };
  } else if (template === 1) {
    const firstCoordinate = nonZero();
    const secondCoordinate = nonZero();
    const scale = randomInt(1, 3);
    selected = {
      value: [
        [
          scale * firstCoordinate * firstCoordinate,
          scale * firstCoordinate * secondCoordinate,
        ],
        [
          scale * firstCoordinate * secondCoordinate,
          scale * secondCoordinate * secondCoordinate,
        ],
      ],
      answer: "A est positive, mais pas définie positive.",
      explanation: `Pour x = ${columnVector(["x₁", "x₂"])}, xᵀAx = ${scale === 1 ? "" : scale}(${formatLinearExpression([
        [firstCoordinate, "x₁"],
        [secondCoordinate, "x₂"],
      ])})² ≥ 0. Mais det(A) = 0 : A n’est pas définie positive.`,
      kind: "SEMIDEFINED",
    };
  } else if (template === 2) {
    const diagonal = randomInt(0, 3);
    const coupling = diagonal + randomInt(1, 3);
    const determinant = diagonal * diagonal - coupling * coupling;
    selected = {
      value: [
        [diagonal, coupling],
        [coupling, diagonal],
      ],
      answer: "A n’est pas positive.",
      explanation: `det(A) = ${determinant} < 0 : les deux valeurs propres sont de signes opposés, donc A n’est pas positive.`,
      kind: "NO",
    };
  } else {
    const firstDiagonal = -randomInt(1, 5);
    const secondDiagonal = -randomInt(1, 5);
    selected = {
      value: [
        [firstDiagonal, 0],
        [0, secondDiagonal],
      ],
      answer: "A n’est pas positive.",
      explanation: `Avec x = ${columnVector([1, 0])}, on obtient xᵀAx = ${firstDiagonal} < 0. La matrice n’est donc pas positive.`,
      kind: "NO",
    };
  }

  return {
    id: `M-POSITIVITY-${selected.kind}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "matrices",
    eyebrow: "MP · Positivité",
    prompt: "Quelle est la nature de cette matrice symétrique réelle ?",
    formula: `A = ${matrix(selected.value)}`,
    choices: choices(selected.answer, [
      "A est définie positive.",
      "A est positive, mais pas définie positive.",
      "A n’est pas positive.",
      "On ne peut pas conclure sans connaître une base propre.",
    ].filter((candidate) => candidate !== selected.answer)),
    explanation: selected.explanation,
    geometry:
      "La positivité signifie que la forme quadratique associée ne descend jamais sous zéro.",
    trap:
      "Une matrice symétrique peut être diagonalisable sans être positive.",
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
      `Dans ${realSpace(order)}, le déterminant mesure le facteur de dilatation des volumes de dimension ${order}.`,
    trap:
      "Les blocs hors diagonale n’interviennent pas dans le déterminant d’une matrice triangulaire par blocs.",
  };
}

const PYTHAGOREAN_VECTORS = {
  2: [
    { vector: [3, 4], norm: 5 },
    { vector: [5, 12], norm: 13 },
    { vector: [8, 15], norm: 17 },
  ],
  3: [
    { vector: [1, 2, 2], norm: 3 },
    { vector: [2, 3, 6], norm: 7 },
    { vector: [2, 6, 9], norm: 11 },
  ],
} as const;

function signedVector(value: readonly number[]) {
  return value.map((coordinate) =>
    Math.random() < 0.5 ? coordinate : -coordinate,
  );
}

export function innerProductQuestion(spaceDimension = 2): Question {
  const dimension = ambientDimension(spaceDimension);
  const template = randomInt(0, 3);

  if (template === 0) {
    const first = randomVector(dimension);
    const second = randomVector(dimension);
    const result = dotProduct(first, second);
    return {
      id: `E-INNER-DOT-${dimension}-${Date.now()}-${randomInt(100, 999)}`,
      sector: "vectors",
      eyebrow: "MPSI · Produit scalaire",
      prompt: "Quelle est la valeur de ⟨u, v⟩ dans la base canonique ?",
      formula: `u = ${vector(first)} et v = ${vector(second)}`,
      choices: choices(`${result}`, [
        `${result + first[0]}`,
        `${-result}`,
        `${first.reduce((sum, value) => sum + value, 0) + second.reduce((sum, value) => sum + value, 0)}`,
      ]),
      explanation: `On multiplie les coordonnées de même rang puis on additionne : ⟨u, v⟩ = ${result}.`,
      geometry:
        "Le signe du produit scalaire distingue un angle aigu, droit ou obtus.",
      trap:
        "Il ne faut ni multiplier les sommes des coordonnées, ni croiser leurs positions.",
    };
  }

  if (template === 1) {
    const specimen = pick(PYTHAGOREAN_VECTORS[dimension] as readonly { vector: readonly number[]; norm: number }[]);
    const normVector = signedVector(specimen.vector);
    return {
      id: `E-INNER-NORM-${dimension}-${Date.now()}-${randomInt(100, 999)}`,
      sector: "vectors",
      eyebrow: "MPSI · Norme euclidienne",
      prompt: "Quelle est la norme de u ?",
      formula: `u = ${vector(normVector)}`,
      choices: choices(`${specimen.norm}`, [
        `${squaredNorm(normVector)}`,
        `${normVector.reduce((sum, coordinate) => sum + Math.abs(coordinate), 0)}`,
        `${specimen.norm + 1}`,
      ]),
      explanation: `On calcule ‖u‖² = ⟨u, u⟩ = ${squaredNorm(normVector)}, donc ‖u‖ = ${specimen.norm}.`,
      geometry:
        "La norme euclidienne est la longueur du vecteur.",
      trap:
        "La somme des carrés donne ‖u‖² ; il reste ensuite à prendre la racine carrée.",
    };
  }

  if (template === 2) {
    const specimen = pick(PYTHAGOREAN_VECTORS[dimension] as readonly { vector: readonly number[]; norm: number }[]);
    const difference = signedVector(specimen.vector);
    const first = Array.from(
      { length: dimension },
      () => randomInt(-4, 4),
    );
    const second = first.map(
      (coordinate, index) => coordinate + difference[index],
    );
    return {
      id: `E-INNER-DISTANCE-${dimension}-${Date.now()}-${randomInt(100, 999)}`,
      sector: "vectors",
      eyebrow: "MPSI · Distance euclidienne",
      prompt: "Quelle est la distance entre u et v ?",
      formula: `u = ${vector(first)} et v = ${vector(second)}`,
      choices: choices(`${specimen.norm}`, [
        `${squaredNorm(difference)}`,
        `${specimen.norm + 1}`,
        `${Math.max(1, specimen.norm - 1)}`,
      ]),
      explanation: `La différence v − u vaut ${vector(difference)}. Sa norme est ${specimen.norm}, donc d(u, v) = ${specimen.norm}.`,
      geometry:
        "La distance entre deux vecteurs est la longueur du segment qui relie leurs extrémités.",
      trap:
        "On calcule la norme de v − u, pas la différence des normes.",
    };
  }

  let first = randomVector(dimension);
  while (first.filter((coordinate) => coordinate !== 0).length < 2) {
    first = randomVector(dimension);
  }
  const scalar = pick([-3, -2, 2, 3]);
  const second = scaleVector(scalar, first);
  const wrongSeconds = [0, 1, 2].map((variant) => {
    const candidate = [...second];
    const changedIndex = variant % dimension;
    candidate[changedIndex] += variant < dimension ? 1 : -1;
    return candidate;
  });
  const correct = `u = ${vector(first)}, v = ${vector(second)}`;
  return {
    id: `E-INNER-CAUCHY-${dimension}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "vectors",
    eyebrow: "MPSI · Cauchy–Schwarz",
    prompt: "Pour quel couple y a-t-il égalité dans l’inégalité de Cauchy–Schwarz ?",
    formula: "|⟨u, v⟩| ≤ ‖u‖ ‖v‖",
    choices: choices(
      correct,
      wrongSeconds.map(
        (candidate) => `u = ${vector(first)}, v = ${vector(candidate)}`,
      ),
    ),
    explanation:
      "L’égalité a lieu exactement lorsque u et v sont colinéaires. Ici, v est un multiple non nul de u.",
    geometry:
      "L’égalité correspond à deux directions confondues ou opposées.",
    trap:
      "L’orthogonalité donne ⟨u, v⟩ = 0 ; elle ne donne pas l’égalité de Cauchy–Schwarz pour deux vecteurs non nuls.",
  };
}

export function orthonormalizationQuestion(): Question {
  const template = randomInt(0, 2);

  if (template === 0) {
    const specimen = pick(PYTHAGOREAN_VECTORS[2]);
    const value = signedVector(specimen.vector);
    const normalized = `${fraction(1, specimen.norm)}${columnVector(value)}`;
    return {
      id: `E-ON-NORMALIZE-${Date.now()}-${randomInt(100, 999)}`,
      sector: "bases",
      eyebrow: "MPSI · Normalisation",
      prompt: "Lequel de ces vecteurs est le vecteur unitaire porté par u et de même sens ?",
      formula: `u = ${columnVector(value)}`,
      choices: choices(normalized, [
        `${fraction(1, squaredNorm(value))}${columnVector(value)}`,
        `${fraction(1, specimen.norm + 1)}${columnVector(value)}`,
        `${fraction(-1, specimen.norm)}${columnVector(value)}`,
      ]),
      explanation: `Comme ‖u‖ = ${specimen.norm}, le vecteur recherché est u/‖u‖ = ${normalized}.`,
      geometry:
        "Normaliser conserve la direction et le sens, mais ramène la longueur à 1.",
      trap:
        "Il faut diviser par ‖u‖, et non par ‖u‖².",
    };
  }

  if (template === 1) {
    const first = randomVector(2);
    const correctSecond = [-first[1], first[0]];
    const correct = `u = ${vector(first)}, v = ${vector(correctSecond)}`;
    const wrongSeconds = [1, 2, -1].map((coefficient) =>
      correctSecond.map(
        (value, index) => value + coefficient * first[index],
      ),
    );
    return {
      id: `E-ON-ORTHOGONAL-${Date.now()}-${randomInt(100, 999)}`,
      sector: "bases",
      eyebrow: "MPSI · Famille orthogonale",
      prompt: "Quel couple forme une famille orthogonale ?",
      formula: "Deux vecteurs sont orthogonaux lorsque leur produit scalaire est nul.",
      choices: choices(
        correct,
        wrongSeconds.map(
          (candidate) => `u = ${vector(first)}, v = ${vector(candidate)}`,
        ),
      ),
      explanation: `On obtient ⟨u, v⟩ = ${factor(first[0])} × ${factor(correctSecond[0])} + ${factor(first[1])} × ${factor(correctSecond[1])} = 0.`,
      geometry:
        "Dans le plan, une famille de deux vecteurs non nuls orthogonaux dessine deux axes perpendiculaires.",
      trap:
        "Une famille orthogonale n’est orthonormée que si chaque vecteur est aussi de norme 1.",
    };
  }

  let firstCoordinate = randomInt(-5, 5);
  let secondCoordinate = randomInt(-5, 5);
  while (
    firstCoordinate === secondCoordinate ||
    (firstCoordinate + secondCoordinate) % 2 !== 0
  ) {
    firstCoordinate = randomInt(-5, 5);
    secondCoordinate = randomInt(-5, 5);
  }
  const coefficient = (firstCoordinate + secondCoordinate) / 2;
  const result = [
    firstCoordinate - coefficient,
    secondCoordinate - coefficient,
  ];
  const source = [firstCoordinate, secondCoordinate];
  return {
    id: `E-ON-SCHMIDT-${Date.now()}-${randomInt(100, 999)}`,
    sector: "bases",
    eyebrow: "MPSI · Procédé de Gram–Schmidt",
    prompt: "Quel vecteur obtient-on après la première étape d’orthogonalisation de v par rapport à u ?",
    formula: `u = ${vector([1, 1])}, v = ${vector(source)} et w = v − ${fraction("⟨v, u⟩", "⟨u, u⟩")}u`,
    choices: choices(vector(result), [
      vector(source),
      vector([source[0] - 2 * coefficient, source[1] - 2 * coefficient]),
      vector([result[1], result[0]]),
    ]),
    explanation: `Le coefficient de projection vaut ${fraction(firstCoordinate + secondCoordinate, 2)} = ${coefficient}. Ainsi w = ${vector(result)}, et ⟨w, u⟩ = 0.`,
    geometry:
      "Gram–Schmidt retire à v sa composante parallèle à u.",
    trap:
      "L’étape d’orthogonalisation ne normalise pas encore le vecteur obtenu.",
  };
}

export function orthogonalComplementQuestion(spaceDimension = 2): Question {
  const dimension = ambientDimension(spaceDimension);
  const template = randomInt(0, 2);

  if (template === 0) {
    if (dimension === 3) {
      const [first, second] = independentPair(3);
      const normal = crossProduct(first, second);
      return {
        id: `E-ORTHO-COMPLEMENT-3-${Date.now()}-${randomInt(100, 999)}`,
        sector: "bases",
        eyebrow: "MPSI · Orthogonal d’un sous-espace",
        prompt: "Quel vecteur non nul appartient à F^{⊥} ?",
        formula: `F = Vect(${vector(first)}, ${vector(second)})`,
        choices: choices(vector(normal), [
          vector(first),
          vector(second),
          vector(first.map((value, index) => value + second[index])),
        ]),
        explanation: `Le vecteur ${vector(normal)} a un produit scalaire nul avec chacun des deux générateurs de F. Il appartient donc à F^{⊥}.`,
        geometry:
          "L’orthogonal d’un plan de ℝ³ est la droite portée par un vecteur normal au plan.",
        trap:
          "Être extérieur à F ne suffit pas : il faut être orthogonal à tous les vecteurs de F.",
      };
    }

    const generator = randomVector(2);
    const normal = [-generator[1], generator[0]];
    return {
      id: `E-ORTHO-COMPLEMENT-2-${Date.now()}-${randomInt(100, 999)}`,
      sector: "bases",
      eyebrow: "MPSI · Orthogonal d’un sous-espace",
      prompt: "Quel vecteur non nul appartient à F^{⊥} ?",
      formula: `F = Vect(${vector(generator)})`,
      choices: choices(vector(normal), [
        vector(generator),
        vector(normal.map((value, index) => value + generator[index])),
        vector(normal.map((value, index) => value - generator[index])),
      ]),
      explanation: `Le produit scalaire de ${vector(generator)} et ${vector(normal)} vaut 0. Ce dernier vecteur appartient donc à F^{⊥}.`,
      geometry:
        "Dans le plan, l’orthogonal d’une droite est la droite perpendiculaire.",
      trap:
        "Une rotation arbitraire des coordonnées ne produit pas nécessairement un vecteur orthogonal.",
    };
  }

  if (template === 1) {
    const ambient = randomInt(3, 7);
    const subspace = randomInt(1, ambient - 1);
    const result = ambient - subspace;
    return {
      id: `E-ORTHO-DIM-${ambient}-${subspace}-${Date.now()}-${randomInt(100, 999)}`,
      sector: "bases",
      eyebrow: "MPSI · Dimension de l’orthogonal",
      prompt: "Quelle est la dimension de F^{⊥} ?",
      formula: `F est un sous-espace d’un espace euclidien E, dim(E) = ${ambient} et dim(F) = ${subspace}.`,
      choices: choices(`${result}`, [
        `${subspace}`,
        `${ambient}`,
        `${Math.abs(ambient - 2 * subspace)}`,
      ]),
      explanation: `Dans un espace euclidien de dimension finie, dim(F) + dim(F^{⊥}) = dim(E). Ainsi dim(F^{⊥}) = ${ambient} − ${subspace} = ${result}.`,
      geometry:
        "Les directions de F et celles de F^{⊥} se complètent pour former tout l’espace.",
      trap:
        "F^{⊥} n’a pas en général la même dimension que F.",
    };
  }

  const coefficients = Array.from(
    { length: dimension },
    () => nonZero(),
  );
  const coordinates = ["x", "y", "z"].slice(0, dimension);
  const equation = formatLinearExpression(
    coefficients.map(
      (coefficient, index) =>
        [coefficient, coordinates[index]] as [number, string],
    ),
  );
  const correct = vector(coefficients);
  const normalDistractors =
    dimension === 2
      ? [
          vector([coefficients[0] + 1, coefficients[1]]),
          vector([coefficients[0], coefficients[1] + 1]),
          vector([coefficients[1], -coefficients[0]]),
        ]
      : coefficients.map((_, changedIndex) =>
          vector(
            coefficients.map((value, index) =>
              index === changedIndex
                ? value + (value > 0 ? 1 : -1)
                : value,
            ),
          ),
        );
  return {
    id: `E-ORTHO-NORMAL-${dimension}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "bases",
    eyebrow: "MPSI · Vecteur normal",
    prompt: "Lequel de ces vecteurs est normal à l’hyperplan H ?",
    formula: `H = {(${coordinates.join(" ; ")}) ∈ ${realSpace(dimension)} | ${equation} = 0}`,
    choices: choices(correct, normalDistractors),
    explanation: `L’équation de H s’écrit ⟨${correct}, x⟩ = 0. Ainsi H = Vect(${correct})^{⊥} et ${correct} est un vecteur normal à H.`,
    geometry:
      "Un hyperplan est l’ensemble des vecteurs orthogonaux à une direction normale.",
    trap:
      "Les coefficients de l’équation homogène donnent les coordonnées du vecteur normal dans le même ordre.",
  };
}

export function projectionDistanceQuestion(spaceDimension = 2, history?: PracticeHistory): Question {
  const dimension = ambientDimension(spaceDimension);
  const template = weightedIndex([1, 1, recallWeight("projection-characterization", history), 1]);

  if (template === 0) {
    const direction = pick([
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ] as const);
    let point = [randomInt(-6, 6), randomInt(-6, 6)];
    while (
      dotProduct(point, direction) % squaredNorm(direction) !== 0 ||
      dotProduct(point, direction) === 0 ||
      point[0] * direction[1] === point[1] * direction[0]
    ) {
      point = [randomInt(-6, 6), randomInt(-6, 6)];
    }
    const coefficient =
      dotProduct(point, direction) / squaredNorm(direction);
    const result = scaleVector(coefficient, direction);
    const residual = point.map(
      (coordinate, index) => coordinate - result[index],
    );
    return {
      id: `E-PROJ-LINE-${Date.now()}-${randomInt(100, 999)}`,
      sector: "applications",
      eyebrow: "MPSI · Projection orthogonale",
      prompt: "Quelle est la projection orthogonale de x sur la droite F ?",
      formula: `F = Vect(${vector(direction)}) et x = ${vector(point)}`,
      choices: choices(vector(result), [
        vector(residual),
        vector(point),
        vector(result.map((value) => -value)),
      ]),
      explanation: `Le coefficient vaut ${fraction("⟨x, u⟩", "⟨u, u⟩")} = ${coefficient}. Donc p_F(x) = ${vector(result)} et x − p_F(x) = ${vector(residual)} est orthogonal à F.`,
      geometry:
        "La projection est le point de F le plus proche de x.",
      trap:
        "La composante orthogonale x − p_F(x) n’est pas la projection sur F.",
    };
  }

  if (template === 1) {
    const signs = [Math.random() < 0.5 ? 3 : -3, Math.random() < 0.5 ? 4 : -4];
    const tangent = [-signs[1], signs[0]];
    const tangentCoefficient = randomInt(-3, 3);
    const normalCoefficient = nonZero();
    const point = tangent.map(
      (value, index) =>
        tangentCoefficient * value + normalCoefficient * signs[index],
    );
    const distance = Math.abs(normalCoefficient) * 5;
    const equation = formatLinearExpression([
      [signs[0], "x"],
      [signs[1], "y"],
    ]);
    return {
      id: `E-PROJ-DISTANCE-${Date.now()}-${randomInt(100, 999)}`,
      sector: "applications",
      eyebrow: "MPSI · Distance à un sous-espace",
      prompt: "Quelle est la distance du vecteur u à la droite F ?",
      formula: `F = {(x ; y) ∈ ℝ² | ${equation} = 0} et u = ${vector(point)}`,
      choices: choices(`${distance}`, [
        `${distance * 5}`,
        `${Math.abs(normalCoefficient)}`,
        `${distance + 1}`,
      ]),
      explanation: `Un vecteur normal à F est n = ${vector(signs)}, de norme 5. La distance vaut ${fraction(`|⟨u, n⟩|`, "‖n‖")} = ${distance}.`,
      geometry:
        "La distance à F est la longueur de la composante orthogonale à F.",
      trap:
        "Il faut diviser la valeur absolue du produit scalaire par la norme du vecteur normal.",
    };
  }

  if (template === 2) {
    return {
      id: `E-PROJ-NEAREST-${Date.now()}-${randomInt(100, 999)}`,
      recallKey: "projection-characterization",
      sector: "applications",
      eyebrow: "MPSI · Meilleure approximation",
      prompt: "Quelle propriété caractérise p_F(x), la projection orthogonale de x sur F ?",
      formula: "F est un sous-espace de dimension finie d’un espace euclidien E.",
      choices: choices(
        "p_F(x) ∈ F et x − p_F(x) ∈ F^{⊥}",
        [
          "p_F(x) ∈ F^{⊥} et x − p_F(x) ∈ F",
          "p_F(x) = x pour tout x ∈ E",
          "p_F(x) est toujours le vecteur nul",
        ],
      ),
      explanation:
        "La décomposition orthogonale x = p_F(x) + (x − p_F(x)) place la première composante dans F et la seconde dans F^{⊥}.",
      geometry:
        "Parmi tous les vecteurs de F, p_F(x) est l’unique plus proche de x.",
      trap:
        "La projection appartient à F ; c’est le résidu qui appartient à F^{⊥}.",
    };
  }

  const point = Array.from(
    { length: dimension },
    () => randomInt(-5, 5),
  );
  const keptDimension = dimension - 1;
  while (
    point.slice(0, keptDimension).every((value) => value === 0) ||
    point.at(-1) === 0
  ) {
    for (let index = 0; index < dimension; index += 1) {
      point[index] = randomInt(-5, 5);
    }
  }
  const result = point.map((value, index) =>
    index < keptDimension ? value : 0,
  );
  return {
    id: `E-PROJ-ON-${dimension}-${Date.now()}-${randomInt(100, 999)}`,
    sector: "applications",
    eyebrow: "MPSI · Projection dans une base orthonormée",
    prompt: "Quelles sont les coordonnées de p_F(x) dans la base orthonormée B ?",
    formula: `B = ${dimension === 3 ? "(e₁, e₂, e₃)" : "(e₁, e₂)"}, F = Vect(e₁${dimension === 3 ? ", e₂" : ""}) et x = ${columnVector(point)}`,
    choices: choices(columnVector(result), [
      columnVector(point.map((value, index) => index < keptDimension ? 0 : value)),
      columnVector(point),
      columnVector(result.map((value) => -value)),
    ]),
    explanation: `Dans une base orthonormée adaptée à F, on conserve les ${keptDimension} première${keptDimension > 1 ? "s" : ""} coordonnée${keptDimension > 1 ? "s" : ""} et on annule la composante orthogonale. Ainsi p_F(x) = ${columnVector(result)}.`,
    geometry:
      "Une base orthonormée adaptée sépare directement les composantes parallèle et orthogonale.",
    trap:
      "Projeter sur F ne consiste pas à annuler les coordonnées appartenant à F.",
  };
}

export function matrixQuestion(
  _spaceDimension: number,
  forcedTemplate?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19,
): Question {
  const template = forcedTemplate ?? randomInt(0, 19);
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
  if (template === 15) return characteristicSubspaceQuestion();
  if (template === 16) return adjointMatrixQuestion();
  if (template === 17) return selfAdjointQuestion();
  if (template === 18) return spectralTheoremQuestion();
  return positivityQuestion();
}

const BASE_EXERCISE_FAMILIES: readonly ExerciseFamily[] = [
  {
    id: "vector-combination",
    sector: "vectors",
    program: "MPSI",
    minInstrument: -1,
    label: "Combinaisons linéaires",
    description: "Calculer une combinaison, une coordonnée ou retrouver un coefficient.",
    generate: (spaceDimension) => vectorQuestion(spaceDimension, 0),
  },
  {
    id: "vector-span",
    sector: "vectors",
    program: "MPSI",
    minInstrument: -1,
    label: "Appartenance à Vect",
    description: "Tester l’appartenance, la dimension et une équation d’un espace engendré.",
    generate: (spaceDimension) => vectorQuestion(spaceDimension, 1),
  },
  {
    id: "vector-subspace",
    sector: "vectors",
    program: "MPSI",
    minInstrument: -1,
    label: "Sous-espaces vectoriels",
    description: "Reconnaître un sous-espace, ses propriétés et sa dimension.",
    generate: (spaceDimension) => vectorQuestion(spaceDimension, 2),
  },
  {
    id: "basis-determinant",
    sector: "bases",
    program: "MPSI",
    minInstrument: 1,
    label: "Déterminant d’une famille",
    description: "Calculer un déterminant, reconnaître une base et trouver une aire.",
    generate: (spaceDimension) => basisQuestion(spaceDimension, 0),
  },
  {
    id: "basis-coordinates",
    sector: "bases",
    program: "MPSI",
    minInstrument: 1,
    label: "Coordonnées dans une base",
    description: "Changer les coordonnées dans les deux sens et construire la matrice de passage.",
    generate: (spaceDimension) => basisQuestion(spaceDimension, 1),
  },
  {
    id: "basis-rank",
    sector: "bases",
    program: "MPSI",
    minInstrument: 4,
    label: "Rang d’une famille",
    description: "Étudier rang, génération et relations de dépendance.",
    generate: (spaceDimension) => basisQuestion(spaceDimension, 2),
  },
  {
    id: "application-kernel",
    sector: "applications",
    program: "MPSI",
    minInstrument: 13,
    label: "Noyau",
    description: "Reconnaître un vecteur du noyau, une base du noyau et sa dimension.",
    generate: (spaceDimension) => applicationQuestion(spaceDimension, 0),
  },
  {
    id: "application-rank-theorem",
    sector: "applications",
    program: "MPSI",
    minInstrument: 15,
    label: "Théorème du rang",
    description: "Relier dimension du noyau, rang et dimension de départ.",
    generate: (spaceDimension) => applicationQuestion(spaceDimension, 1),
  },
  {
    id: "application-explicit-rank",
    sector: "applications",
    program: "MPSI",
    minInstrument: 12,
    label: "Rang d’une application",
    description: "Étudier rang, bijectivité et équation du noyau.",
    generate: (spaceDimension) => applicationQuestion(spaceDimension, 2),
  },
  {
    id: "application-image",
    sector: "applications",
    program: "MPSI",
    minInstrument: 14,
    label: "Image d’une application",
    description: "Déterminer l’image, sa dimension et l’appartenance d’un vecteur.",
    generate: (spaceDimension) => applicationQuestion(spaceDimension, 3),
  },
  {
    id: "application-linearity",
    sector: "applications",
    program: "MPSI",
    minInstrument: 12,
    label: "Linéarité",
    description: "Reconnaître, paramétrer et appliquer une application linéaire.",
    generate: (spaceDimension) => applicationQuestion(spaceDimension, 4),
  },
  {
    id: "matrix-vector-product",
    sector: "matrices",
    program: "MPSI",
    minInstrument: 24,
    label: "Produit matrice-vecteur",
    description: "Calculer Au, résoudre Ax = b et trouver un vecteur du noyau.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 0),
  },
  {
    id: "matrix-representation",
    sector: "matrices",
    program: "MPSI",
    minInstrument: 24,
    label: "Matrice d’une application",
    description: "Construire la matrice, appliquer f et lire son rang dans les colonnes.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 1),
  },
  {
    id: "matrix-invertibility",
    sector: "matrices",
    program: "MPSI",
    minInstrument: 29,
    label: "Inversibilité",
    description: "Reconnaître l’inversibilité, calculer une inverse et trouver un paramètre singulier.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 2),
  },
  {
    id: "matrix-spectrum",
    sector: "matrices",
    program: "MP",
    minInstrument: 48,
    label: "Valeurs propres",
    description: "Lire une valeur propre, le spectre entier et la somme avec multiplicité.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 3),
  },
  {
    id: "matrix-determinant-2",
    sector: "matrices",
    program: "MPSI",
    minInstrument: 37,
    label: "Déterminant 2×2",
    description: "Calculer un déterminant 2×2, une valeur singulière et l’orientation.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 5),
  },
  {
    id: "matrix-determinant-3",
    sector: "matrices",
    program: "MPSI",
    minInstrument: 38,
    label: "Déterminant 3×3",
    description: "Calculer un déterminant 3×3, étudier sa nullité et l’inversibilité.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 4),
  },
  {
    id: "matrix-product",
    sector: "matrices",
    program: "MPSI",
    minInstrument: 25,
    label: "Produit de matrices",
    description: "Calculer AB, déterminer la taille d’un produit et étudier un commutateur.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 6),
  },
  {
    id: "matrix-block-determinant",
    sector: "matrices",
    program: "MP",
    minInstrument: 47,
    label: "Déterminant par blocs",
    description: "Calculer un déterminant par blocs ou repérer la singularité.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 7),
  },
  {
    id: "matrix-characteristic-polynomial",
    sector: "matrices",
    program: "MP",
    minInstrument: 50,
    label: "Polynôme caractéristique",
    description: "Calculer χ, lire la dimension, la trace et le déterminant, les multiplicités et un décalage.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 8),
  },
  {
    id: "matrix-eigenspace",
    sector: "matrices",
    program: "MP",
    minInstrument: 49,
    label: "Espaces propres",
    description: "Trouver un vecteur propre, un espace propre et sa dimension.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 9),
  },
  {
    id: "matrix-diagonalization",
    sector: "matrices",
    program: "MP",
    minInstrument: 52,
    label: "Diagonalisation",
    description: "Décider si les sous-espaces propres forment une base.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 10),
  },
  {
    id: "matrix-triangularization",
    sector: "matrices",
    program: "MP",
    minInstrument: 53,
    label: "Trigonalisation",
    description: "Lire le spectre avec multiplicité sur une forme triangulaire.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 11),
  },
  {
    id: "matrix-annihilating-polynomial",
    sector: "matrices",
    program: "MP",
    minInstrument: 56,
    label: "Polynômes annulateurs",
    description: "Reconnaître un annulateur, exclure des valeurs propres et réduire les puissances.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 12),
  },
  {
    id: "matrix-minimal-polynomial",
    sector: "matrices",
    program: "MP",
    minInstrument: 57,
    label: "Polynôme minimal",
    description: "Déterminer le polynôme minimal, reconnaître ses multiples annulateurs et conclure sur la réduction.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 13),
  },
  {
    id: "matrix-cayley-hamilton",
    sector: "matrices",
    program: "MP",
    minInstrument: 58,
    label: "Cayley-Hamilton",
    description: "Réduire les puissances de A grâce à χ_A(A) = 0.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 14),
  },
  {
    id: "matrix-characteristic-subspace",
    sector: "matrices",
    program: "MP",
    minInstrument: 59,
    label: "Sous-espaces caractéristiques",
    description: "Comparer dimensions propres, multiplicité et noyaux généralisés.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 15),
  },
  {
    id: "matrix-adjoint",
    sector: "matrices",
    program: "MP",
    minInstrument: 64,
    label: "Adjoint",
    description: "Calculer l’adjoint, utiliser sa définition et composer des adjoints.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 16),
  },
  {
    id: "matrix-self-adjoint",
    sector: "matrices",
    program: "MP",
    minInstrument: 65,
    label: "Endomorphismes autoadjoints",
    description: "Reconnaître la symétrie, compléter une matrice et lire ses valeurs propres.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 17),
  },
  {
    id: "matrix-spectral-theorem",
    sector: "matrices",
    program: "MP",
    minInstrument: 66,
    label: "Théorème spectral",
    description: "Énoncer le théorème spectral, lire une valeur propre et construire une base orthonormée.",
    generate: (_spaceDimension, history) => spectralTheoremQuestion(history),
  },
  {
    id: "matrix-positivity",
    sector: "matrices",
    program: "MP",
    minInstrument: 67,
    label: "Positivité",
    description: "Étudier le signe, appliquer Sylvester et évaluer une forme quadratique.",
    generate: (spaceDimension) => matrixQuestion(spaceDimension, 19),
  },
  {
    id: "euclidean-inner-product",
    sector: "vectors",
    program: "MPSI",
    minInstrument: 40,
    label: "Produit scalaire, norme et distance",
    description: "Calculer produits scalaires, normes, distances et cas d’égalité de Cauchy–Schwarz.",
    generate: (spaceDimension) => innerProductQuestion(spaceDimension),
  },
  {
    id: "euclidean-orthonormalization",
    sector: "bases",
    program: "MPSI",
    minInstrument: 41,
    label: "Orthogonalisation",
    description: "Reconnaître, normaliser et orthogonaliser une famille par le procédé de Gram–Schmidt.",
    generate: () => orthonormalizationQuestion(),
  },
  {
    id: "euclidean-orthogonal-complement",
    sector: "bases",
    program: "MPSI",
    minInstrument: 42,
    label: "Orthogonal et hyperplans",
    description: "Déterminer F^{⊥}, sa dimension et une direction normale à un hyperplan.",
    generate: (spaceDimension) => orthogonalComplementQuestion(spaceDimension),
  },
  {
    id: "euclidean-projection-distance",
    sector: "applications",
    program: "MPSI",
    minInstrument: 43,
    label: "Projection et distance",
    description: "Projeter orthogonalement et calculer la distance à un sous-espace.",
    generate: (spaceDimension, history) => projectionDistanceQuestion(spaceDimension, history),
  },
] as const;

const RECALL_TASKS: Record<string, Record<number, string>> = {
  "vector-subspace": { 1: "subspace-zero-vector" },
  "matrix-adjoint": { 1: "adjoint-definition", 2: "adjoint-composition" },
  "matrix-self-adjoint": { 2: "self-adjoint-real-spectrum" },
  "matrix-positivity": { 1: "positive-definite-criterion-2" },
};

function variation(
  familyId: string,
  mode: number,
  prompt: string,
  formula: string,
  answer: string,
  distractors: string[],
  explanation: string,
  geometry?: string,
  trap?: string,
): Question {
  const family = BASE_EXERCISE_FAMILIES.find((item) => item.id === familyId);
  if (!family) throw new Error("Famille inconnue : " + familyId);
  const reference = family.generate(3);
  return {
    id: familyId + "-TASK-" + mode + "-" + Date.now() + "-" + randomInt(100, 999),
    taskKind: "task-" + mode,
    recallKey: RECALL_TASKS[familyId]?.[mode],
    sector: family.sector,
    eyebrow: family.program + " · " + family.label,
    prompt,
    formula,
    choices: choices(answer, distractors),
    explanation,
    geometry: geometry ?? reference.geometry,
    trap: trap ?? reference.trap,
  };
}

function numericVariation(
  familyId: string,
  mode: number,
  prompt: string,
  formula: string,
  answer: number,
  explanation: string,
) {
  return variation(
    familyId, mode, prompt, formula, String(answer),
    [String(answer + 1), String(answer - 1), String(answer + 2)],
    explanation,
  );
}

function supplementalQuestion(familyId: string, mode: number, spaceDimension: number): Question {
  const dimension = ambientDimension(spaceDimension);
  if (familyId === "vector-combination") {
    if (mode === 1) {
      const u = randomVector(dimension);
      const v = randomVector(dimension);
      const w = combineVectors(1, u, 2, v);
      return variation(familyId, mode,
        "Quel est le vecteur v qui vérifie u + 2v = w ?",
        "u = " + vector(u) + " et w = " + vector(w),
        vector(v), balancedCoordinateDistractors(v, [u, w]).map(vector),
        "On isole v : v = " + fraction("w − u", 2) + " = " + vector(v) + ".");
    }
    const alpha = nonZero();
    const beta = nonZero();
    const u = [1, 1];
    const v = [1, -1];
    const w = combineVectors(alpha, u, beta, v);
    return numericVariation(familyId, mode,
      "Quel est le coefficient β dans w = αu + βv ?",
      "u = " + vector(u) + ", v = " + vector(v) + " et w = " + vector(w),
      beta, "En soustrayant la seconde coordonnée de la première, on obtient 2β = " + (2 * beta) + ".");
  }
  if (familyId === "vector-span") {
    if (mode === 1) {
      const independent = Math.random() < 0.5;
      const u = dimension === 3 ? [1, 0, 0] : [1, 0];
      const v = independent ? (dimension === 3 ? [0, 1, 0] : [0, 1]) : scaleVector(2, u);
      const answer = independent ? 2 : 1;
      return numericVariation(familyId, mode,
        "Quelle est la dimension de Vect(u, v) ?",
        "u = " + vector(u) + " et v = " + vector(v),
        answer, independent ? "Les deux vecteurs sont indépendants : ils engendrent un plan." : "v est un multiple de u : ils engendrent une droite.");
    }
    const k = pick([2, 3]);
    return variation(familyId, mode,
      "Quelle équation décrit la droite Vect(u) dans ℝ² ?",
      "u = " + vector([1, k]),
      "y − " + k + "x = 0",
      ["y + " + k + "x = 0", "x − " + k + "y = 0", "x + " + k + "y = 0"],
      "Tout multiple de " + vector([1, k]) + " vérifie y = " + k + "x.");
  }
  if (familyId === "vector-subspace") {
    if (mode === 1) {
      return variation(familyId, mode,
        "Quelle propriété doit vérifier tout sous-espace vectoriel F de E ?",
        "F ⊂ E",
        "Le vecteur nul appartient à F.",
        ["F contient nécessairement tout E.", "F ne contient aucun vecteur non nul.", "F est toujours de dimension 1."],
        "Tout sous-espace contient le vecteur nul et est stable par combinaison linéaire.");
    }
    const type = randomInt(0, 2);
    const formula = type === 0 ? "H = {(x ; y) ∈ ℝ² | x = 0}" :
      type === 1 ? "H = {(x ; y) ∈ ℝ² | x = y = 0}" : "H = ℝ²";
    const answer = type === 0 ? 1 : type === 1 ? 0 : 2;
    return numericVariation(familyId, mode,
      "Quelle est la dimension du sous-espace H ?", formula, answer,
      "H possède exactement " + answer + " direction" + (answer > 1 ? "s" : "") + " indépendante" + (answer > 1 ? "s" : "") + ".");
  }
  if (familyId === "basis-determinant") {
    if (mode === 1) {
      const p = nonZero();
      return variation(familyId, mode,
        "Lequel de ces couples est une base de ℝ² ?",
        "Les vecteurs sont donnés dans la base canonique.",
        "(" + vector([1, 0]) + ", " + vector([p, 1]) + ")",
        ["(" + vector([1, 0]) + ", " + vector([p, 0]) + ")",
         "(" + vector([0, 1]) + ", " + vector([0, p]) + ")",
         "(" + vector([1, 1]) + ", " + vector([p, p]) + ")"],
        "Le couple (" + vector([1, 0]) + ", " + vector([p, 1]) + ") a pour déterminant 1 ; les trois autres couples sont liés.");
    }
    const a = nonZero();
    const b = nonZero();
    const area = Math.abs(a * b);
    return numericVariation(familyId, mode,
      "Quelle est l’aire du parallélogramme construit sur u et v ?",
      "u = " + vector([a, 0]) + " et v = " + vector([0, b]),
      area, "L’aire est la valeur absolue du déterminant : |" + (a * b) + "| = " + area + ".");
  }
  if (familyId === "basis-coordinates") {
    const p = pick([-3, -2, 2, 3]);
    const alpha = nonZero();
    const beta = nonZero();
    const x = [alpha + p * beta, beta];
    if (mode === 1) {
      return variation(familyId, mode,
        "Quelles sont les coordonnées canoniques de x ?",
        "B = (e₁, e₂), e₁ = " + vector([1, 0]) + ", e₂ = " + vector([p, 1]) + " et [x]_B = " + vector([alpha, beta]),
        vector(x), [vector([alpha, beta]), vector([alpha + beta, p * beta]), vector([alpha, alpha + p * beta])],
        "x = " + formatLinearExpression([[alpha, "e₁"], [beta, "e₂"]]) + " = " + vector(x) + ".");
    }
    return variation(familyId, mode,
      "Quelle matrice P vérifie [x]_{can} = P[x]_B pour tout vecteur x ?",
      "B = (e₁, e₂), e₁ = " + vector([1, 0]) + " et e₂ = " + vector([p, 1]),
      matrix([[1, p], [0, 1]]),
      [matrix([[1, 0], [p, 1]]), matrix([[1, -p], [0, 1]]), matrix([[p, 1], [1, 0]])],
      "Les colonnes de P sont les coordonnées canoniques de e₁ puis de e₂, dans cet ordre.");
  }
  if (familyId === "basis-rank") {
    if (mode === 1) {
      const generating = Math.random() < 0.5;
      const third = generating ? [0, 1] : [3, 0];
      return variation(familyId, mode,
        "Quelle affirmation décrit cette famille de trois vecteurs de ℝ² ?",
        "F = (" + vector([1, 0]) + ", " + vector([2, 0]) + ", " + vector(third) + ")",
        generating ? "F est liée et génératrice de ℝ²." : "F est liée et ne génère pas ℝ².",
        [generating ? "F est liée et ne génère pas ℝ²." : "F est liée et génératrice de ℝ².",
         "F est libre et génératrice de ℝ².", "F est libre et ne génère pas ℝ²."],
        "Les deux premiers vecteurs sont liés ; le troisième " + (generating ? "apporte une direction indépendante." : "reste sur la même droite.") );
    }
    const a = nonZero();
    let b = nonZero();
    while (a === b) b = nonZero();
    const answer = "w = " + formatLinearExpression([[a, "u"], [b, "v"]]);
    return variation(familyId, mode,
      "Quelle relation de dépendance vérifie la famille (u, v, w) ?",
      "u = " + vector([1, 0]) + ", v = " + vector([0, 1]) + " et w = " + vector([a, b]),
      answer,
      ["w = " + formatLinearExpression([[b, "u"], [a, "v"]]),
       "w = " + formatLinearExpression([[-a, "u"], [b, "v"]]),
       "w = " + formatLinearExpression([[a, "u"], [-b, "v"]])],
      "Dans la base canonique, les coefficients devant u et v sont précisément les deux coordonnées de w.");
  }
  if (familyId === "application-kernel") {
    const a = nonZero();
    if (mode === 1) {
      return variation(familyId, mode,
        "Quelle droite est le noyau de f ?",
        "f(x, y) = (" + formatLinearExpression([[1, "x"], [a, "y"]]) + " ; 0)",
        "Vect(" + vector([-a, 1]) + ")",
        ["Vect(" + vector([1, a]) + ")", "Vect(" + vector([0, 1]) + ")", "Vect(" + vector([1, 0]) + ")"],
        "f(x, y) = 0 équivaut à " + formatLinearExpression([[1, "x"], [a, "y"]]) + " = 0, donc (x ; y) est multiple de " + vector([-a, 1]) + ".");
    }
    const rank = Math.random() < 0.5 ? 1 : 2;
    return numericVariation(familyId, mode,
      "Quelle est la dimension du noyau de f ?",
      rank === 1 ? "f : ℝ³ → ℝ², f(x, y, z) = (x + y ; 0)" : "f : ℝ³ → ℝ², f(x, y, z) = (x ; y)",
      3 - rank, "Le rang vaut " + rank + " ; le théorème du rang donne dim(Ker(f)) = 3 − " + rank + ".");
  }
  if (familyId === "application-explicit-rank") {
    if (mode === 1) {
      const invertible = Math.random() < 0.5;
      return variation(familyId, mode,
        "Quelles propriétés possède f : ℝ² → ℝ² ?",
        invertible ? "f(x, y) = (x + y ; y)" : "f(x, y) = (x + y ; 0)",
        invertible ? "f est injective et surjective." : "f n’est ni injective ni surjective.",
        [invertible ? "f n’est ni injective ni surjective." : "f est injective et surjective.",
         "f est injective mais non surjective.", "f est surjective mais non injective."],
        "En dimension finie égale au départ et à l’arrivée, injectivité et surjectivité sont équivalentes ; ici le rang vaut " + (invertible ? 2 : 1) + ".");
    }
    const a = nonZero();
    return variation(familyId, mode,
      "Quelle équation caractérise le noyau de f ?",
      "f(x, y) = (" + formatLinearExpression([[1, "x"], [a, "y"]]) + " ; 0)",
      formatLinearExpression([[1, "x"], [a, "y"]]) + " = 0",
      [formatLinearExpression([[1, "x"], [-a, "y"]]) + " = 0", "y = 0", "x = 0"],
      "Le noyau contient exactement les couples annulant la première coordonnée de f.");
  }
  if (familyId === "application-image") {
    const a = pick([2, 3, -2, -3]);
    if (mode === 1) {
      return numericVariation(familyId, mode,
        "Quelle est la dimension de Im(f) ?",
        "f : ℝ² → ℝ², f(x, y) = (x + y ; " + a + "(x + y))",
        1, "Toutes les images sont multiples de " + vector([1, a]) + " : Im(f) est une droite.");
    }
    return variation(familyId, mode,
      "Quel vecteur appartient à Im(f) ?",
      "f : ℝ² → ℝ², f(x, y) = (x + y ; " + a + "(x + y))",
      vector([1, a]),
      [vector([1, a + 1]), vector([1, a - 1]), vector([0, 1])],
      "Im(f) = Vect(" + vector([1, a]) + ") : les coordonnées de tout vecteur image sont proportionnelles.");
  }
  if (familyId === "application-linearity") {
    if (mode === 1) {
      const a = nonZero();
      return numericVariation(familyId, mode,
        "Quelle valeur de c rend f linéaire ?",
        "f(x, y) = (" + formatLinearExpression([[a, "x"]]) + " + c ; y)",
        0, "Une application linéaire vérifie f(0, 0) = (0 ; 0), ce qui impose c = 0.");
    }
    const a = nonZero();
    const b = nonZero();
    const u = randomVector(2);
    const v = randomVector(2);
    const sum = combineVectors(1, u, 1, v);
    const result = [a * sum[0] + b * sum[1], sum[1]];
    return variation(familyId, mode,
      "Quel vecteur vaut f(u + v) ?",
      "f(x, y) = (" + formatLinearExpression([[a, "x"], [b, "y"]]) + " ; y), u = " + vector(u) + " et v = " + vector(v),
      vector(result),
      balancedCoordinateDistractors(result, [u, v, sum]).map(vector),
      "On additionne d’abord u et v, puis on applique f ; la linéarité donne aussi f(u + v) = f(u) + f(v).");
  }
  return supplementalMatrixQuestion(familyId, mode);
}

function supplementalMatrixQuestion(familyId: string, mode: number): Question {
  if (familyId === "matrix-vector-product") {
    const a = pick([-3, -2, 2, 3]);
    const b = pick([-3, -2, 2, 3]);
    if (mode === 1) {
      const x = randomVector(2);
      const image = [a * x[0], b * x[1]];
      return variation(familyId, mode,
        "Quel vecteur x vérifie Ax = b ?",
        "A = " + matrix([[a, 0], [0, b]]) + " et b = " + columnVector(image),
        columnVector(x),
        balancedCoordinateDistractors(x, [[image[0], image[1]], [x[1], x[0]]]).map(columnVector),
        "La matrice est diagonale : on divise la première coordonnée par " + a + " et la seconde par " + b + ".");
    }
    const k = pick([-3, -2, 2, 3]);
    return variation(familyId, mode,
      "Quel vecteur non nul appartient au noyau de A ?",
      "A = " + matrix([[1, k], [0, 0]]),
      columnVector([-k, 1]),
      [columnVector([k, 1]), columnVector([-k + 1, 1]), columnVector([1, 0])],
      "Le produit Au est nul exactement lorsque la première coordonnée de u vaut " + (-k) + " fois la seconde.");
  }
  if (familyId === "matrix-representation") {
    const u = randomVector(2);
    let v = randomVector(2);
    const independent = Math.random() < 0.5;
    if (independent) {
      while (determinant2(u, v) === 0) v = randomVector(2);
    } else {
      v = scaleVector(2, u);
    }
    if (mode === 1) {
      const image = combineVectors(1, u, 1, v);
      return variation(familyId, mode,
        "Quelle est l’image du vecteur e₁ + e₂ par f ?",
        "f(e₁) = " + columnVector(u) + " et f(e₂) = " + columnVector(v),
        columnVector(image),
        balancedCoordinateDistractors(image, [u, v]).map(columnVector),
        "Par linéarité, f(e₁ + e₂) = f(e₁) + f(e₂) = " + columnVector(image) + ".");
    }
    return numericVariation(familyId, mode,
      "Quel est le rang de la matrice de f dans la base canonique ?",
      "f(e₁) = " + columnVector(u) + " et f(e₂) = " + columnVector(v),
      independent ? 2 : 1,
      independent ? "Les deux colonnes sont indépendantes : le rang vaut 2." : "La seconde colonne est le double de la première : le rang vaut 1.");
  }
  if (familyId === "matrix-invertibility") {
    const k = pick([-3, -2, 2, 3]);
    if (mode === 1) {
      return variation(familyId, mode,
        "Quelle est la matrice inverse de A ?",
        "A = " + matrix([[1, k], [0, 1]]),
        matrix([[1, -k], [0, 1]]),
        [matrix([[1, k], [0, 1]]), matrix([[1, 0], [-k, 1]]), matrix([[1, -k], [1, 1]])],
        "Le produit des deux matrices triangulaires vaut I₂ : les coefficients hors diagonale se compensent.");
    }
    return numericVariation(familyId, mode,
      "Quelle valeur de t rend A non inversible ?",
      "A = ⟦t," + k + ";1,1⟧",
      k, "Le déterminant vaut t − " + k + " ; il s’annule pour t = " + k + ".",
    );
  }
  if (familyId === "matrix-spectrum") {
    const a = pick([-3, -2, 1, 2]);
    let b = a + pick([2, 3]);
    if (b === 0) b += 1;
    const A = matrix([[a, 1], [0, b]]);
    if (mode === 1) {
      return variation(familyId, mode,
        "Quel est le spectre de A ?",
        "A = " + A,
        "{" + a + " ; " + b + "}",
        ["{" + (a + 1) + " ; " + b + "}", "{" + a + " ; " + (b + 1) + "}", "{0 ; " + b + "}"],
        "A est triangulaire ; son spectre est l’ensemble des coefficients diagonaux.");
    }
    return numericVariation(familyId, mode,
      "Quelle est la somme des valeurs propres de A, avec multiplicité ?",
      "A = " + A, a + b,
      "Cette somme est la trace de A : " + a + " + " + b + " = " + (a + b) + ".");
  }
  if (familyId === "matrix-determinant-2") {
    const k = pick([-3, -2, 2, 3]);
    if (mode === 1) {
      return numericVariation(familyId, mode,
        "Quelle valeur de t annule le déterminant de A ?",
        "A = ⟦t," + k + ";1,1⟧",
        k, "Le déterminant est t − " + k + ", donc il s’annule pour t = " + k + ".");
    }
    const positive = Math.random() < 0.5;
    const A = matrix([[positive ? 2 : -2, k], [0, 1]]);
    return variation(familyId, mode,
      "Quel est l’effet de A sur l’orientation du plan ?",
      "A = " + A,
      positive ? "A préserve l’orientation." : "A renverse l’orientation.",
      [positive ? "A renverse l’orientation." : "A préserve l’orientation.",
       "A écrase le plan sur une droite.", "A n’est pas une application linéaire."],
      "Le signe du déterminant, " + (positive ? "positif" : "négatif") + ", détermine l’orientation.");
  }
  if (familyId === "matrix-determinant-3") {
    const a = pick([-3, -2, 2, 3]);
    if (mode === 1) {
      return numericVariation(familyId, mode,
        "Quelle valeur de t rend cette matrice singulière ?",
        "A = ⟦1," + a + ",0;0,1,2;0,0,t⟧",
        0, "A est triangulaire : son déterminant vaut le produit 1 × 1 × t = t.");
    }
    const invertible = Math.random() < 0.5;
    return variation(familyId, mode,
      "Quelle propriété de A peut-on déduire de son déterminant ?",
      "A = " + matrix([[1, 2, 0], [0, invertible ? a : 0, 1], [0, 0, 1]]),
      invertible ? "A est inversible." : "A n’est pas inversible.",
      [invertible ? "A n’est pas inversible." : "A est inversible.",
       "A n’est pas carrée.", "A est nécessairement diagonale."],
      "Le déterminant est " + (invertible ? String(a) + ", non nul." : "nul.") );
  }
  if (familyId === "matrix-product") {
    const a = pick([-3, -2, -1, 1, 3]);
    let b = nonZero();
    while (b === a) b = nonZero();
    if (mode === 1) {
      const [rows, shared, columns] = sample([2, 3, 4], 3);
      return variation(familyId, mode,
        "Quelles sont les dimensions du produit AB ?",
        "A possède " + rows + " lignes et " + shared + " colonnes ; B possède " + shared + " lignes et " + columns + " colonnes.",
        rows + " lignes et " + columns + " colonnes",
        [rows + " lignes et " + shared + " colonnes", shared + " lignes et " + columns + " colonnes", columns + " lignes et " + rows + " colonnes"],
        "Les dimensions intérieures coïncident ; AB conserve les lignes de A et les colonnes de B.");
    }
    const A = [[a, 0], [0, b]];
    const B = [[0, 1], [1, 0]];
    const AB = multiplyMatrices(A, B);
    const BA = multiplyMatrices(B, A);
    const entry = AB[0][1] - BA[0][1];
    return numericVariation(familyId, mode,
      "Quelle est l’entrée en première ligne, seconde colonne de AB − BA ?",
      "A = " + matrix(A) + " et B = " + matrix(B),
      entry, "Dans AB, cette entrée vaut " + a + " ; dans BA, elle vaut " + b + ". La différence vaut " + entry + ".");
  }
  if (familyId === "matrix-block-determinant") {
    const a = pick([-3, -2, 2, 3]);
    if (mode === 1) {
      return numericVariation(familyId, mode,
        "Quelle valeur de t rend cette matrice triangulaire par blocs singulière ?",
        "A = ⟦1," + a + ",0,0;0,1,0,0;0,0,t," + a + ";0,0,0,1⟧",
        0, "Le premier bloc a pour déterminant 1, le second a pour déterminant t. Le produit est nul si t = 0.");
    }
    const detB = nonZero();
    const detC = nonZero();
    return numericVariation(familyId, mode,
      "Quel est le déterminant de la matrice par blocs A ?",
      "A = ⟦B,C;0,D⟧, B et D sont carrées, det(B) = " + detB + " et det(D) = " + detC,
      detB * detC, "Une matrice triangulaire par blocs a pour déterminant le produit des déterminants de ses blocs diagonaux.");
  }
  if (familyId === "matrix-characteristic-polynomial") {
    const a = pick([-3, -2, 1, 2, 3]);
    const b = pick([-3, -2, 1, 2, 3]);
    if (mode === 1) {
      const [first, second] = sample([-3, -2, -1, 1, 2, 3], 2);
      const firstMultiplicity = randomInt(1, 3);
      const secondMultiplicity = randomInt(1, 3);
      return numericVariation(familyId, mode,
        "Quelle est la dimension de E ?",
        "u est un endomorphisme de E et χ_u(X) = " + polynomialRootFactor(first) + "^{" + firstMultiplicity + "}" + polynomialRootFactor(second) + "^{" + secondMultiplicity + "}",
        firstMultiplicity + secondMultiplicity,
        "La dimension de E est le degré de χ_u : " + firstMultiplicity + " + " + secondMultiplicity + " = " + (firstMultiplicity + secondMultiplicity) + ".");
    }
    if (mode === 2) {
      const polynomial = characteristicPolynomial2(a + b, a * b);
      return variation(familyId, mode,
        "Quel couple (tr(A), det(A)) lit-on dans χ_A ?",
        "χ_A(X) = " + polynomial,
        vector([a + b, a * b]),
        [vector([a + b + 1, a * b]), vector([a + b, a * b + 1]), vector([a + b + 1, a * b + 1])],
        "Le coefficient de X est −tr(A), tandis que le terme constant vaut det(A).");
    }
    if (mode === 3) {
      const other = a + 4;
      const multiplicity = randomInt(2, 4);
      const otherMultiplicity = randomInt(1, 2);
      return numericVariation(familyId, mode,
        "Quelle est la multiplicité algébrique de la valeur propre " + a + " ?",
        "χ_A(X) = " + polynomialRootFactor(a) + "^{" + multiplicity + "}" + polynomialRootFactor(other) + "^{" + otherMultiplicity + "}",
        multiplicity,
        "La multiplicité algébrique est l’ordre de la racine " + a + " dans χ_A, ici " + multiplicity + ". Elle ne donne pas, en général, la dimension de l’espace propre.");
    }
    const shift = pick([-2, -1, 1, 2]);
    const oldEigenvalues = [a, b];
    const newPolynomial = characteristicPolynomial2(a + b + 2 * shift, (a + shift) * (b + shift));
    return variation(familyId, mode,
      "Quel est le polynôme caractéristique de " + shiftedMatrix(-shift) + " ?",
      "A est diagonale d’ordre 2, de diagonale " + vector(oldEigenvalues) + ".",
      newPolynomial,
      [characteristicPolynomial2(a + b, a * b), characteristicPolynomial2(a + b - 2 * shift, (a - shift) * (b - shift)), characteristicPolynomial2(a + b + shift, (a + shift) * (b + shift))],
      "Passer de A à " + shiftedMatrix(-shift) + " décale chaque valeur propre de " + shift + " ; les nouvelles racines sont " + (a + shift) + " et " + (b + shift) + ".");
  }
  return supplementalReductionQuestion(familyId, mode);
}

function supplementalReductionQuestion(familyId: string, mode: number): Question {
  if (familyId === "matrix-eigenspace") {
    const eigenvalue = pick([-3, -2, 1, 2, 3]);
    const other = eigenvalue + 4;
    if (mode === 1) {
      return variation(familyId, mode,
        "Quel est l’espace propre de A associé à λ = " + eigenvalue + " ?",
        "A = " + matrix([[eigenvalue, 0], [0, other]]),
        "Vect(" + columnVector([1, 0]) + ")",
        ["Vect(" + columnVector([0, 1]) + ")", "ℝ²", "{0}"],
        "Résoudre (A − λI)x = 0 impose seulement la seconde coordonnée nulle.");
    }
    const coupled = Math.random() < 0.5;
    return numericVariation(familyId, mode,
      "Quelle est la dimension de l’espace propre E_" + eigenvalue + " ?",
      "A = " + matrix([[eigenvalue, coupled ? 1 : 0, 0], [0, eigenvalue, 0], [0, 0, other]]),
      coupled ? 1 : 2,
      coupled ? "Le bloc non diagonal réduit la dimension de Ker(A − λI) à 1." : "Les deux premières directions canoniques sont propres pour λ.");
  }
  if (familyId === "matrix-annihilating-polynomial") {
    if (mode === 1) {
      const roots = sample([-3, -2, -1, 1, 2, 3], 3);
      return variation(familyId, mode,
        "Quel nombre ne peut pas être une valeur propre de A ?",
        "P(A) = 0 avec P(X) = " + roots.map(polynomialRootFactor).join(""),
        "4", roots.map(String),
        "Toute valeur propre de A est une racine de P ; 4 n’est pas une racine de ce polynôme.");
    }
    const k = pick([-3, -2, 3]);
    return variation(familyId, mode,
      "Que vaut A⁴ si A² = " + k + "I ?",
      "A est une matrice carrée.",
      (k * k) + "I",
      [k + "I", (k * k) + "A", (2 * k) + "I"],
      "A⁴ = (A²)² = (" + k + "I)² = " + (k * k) + "I.");
  }
  if (familyId === "matrix-minimal-polynomial") {
    const a = pick([-3, -2, 1, 2, 3]);
    if (mode === 1) {
      const other = a + 4;
      const root = polynomialRootFactor(a);
      const otherRoot = polynomialRootFactor(other);
      return variation(familyId, mode,
        "Lequel de ces polynômes annule nécessairement A ?",
        "Le polynôme minimal de A est μ_A(X) = " + root + "².",
        root + "²" + otherRoot,
        [root, otherRoot + "²", root + otherRoot],
        "Les polynômes annulateurs sont exactement les multiples du polynôme minimal ; seul " + root + "²" + otherRoot + " est divisible par μ_A.");
    }
    const b = a + 4;
    return variation(familyId, mode,
      "Quelle conclusion découle du polynôme minimal de u ?",
      "μ_u(X) = " + polynomialRootFactor(a) + polynomialRootFactor(b) + ", sur un espace vectoriel réel de dimension finie.",
      "u est diagonalisable sur ℝ.",
      ["u n’est pas diagonalisable sur ℝ.", "u est nilpotent.", "u possède une seule valeur propre."],
      "Le polynôme minimal est scindé à racines simples : c’est le critère de diagonalisation.");
  }
  if (familyId === "matrix-characteristic-subspace") {
    const a = pick([-3, -2, 1, 2]);
    const b = a + 4;
    if (mode === 1) {
      return numericVariation(familyId, mode,
        "Quelle est la dimension du sous-espace caractéristique N_" + a + " ?",
        "χ_A(X) = " + polynomialRootFactor(a) + polynomialRootFactor(a) + polynomialRootFactor(b),
        2, "La dimension de N_" + a + " est la multiplicité algébrique de " + a + ", ici 2.");
    }
    return variation(familyId, mode,
      "Quel couple (dim E_" + a + ", dim N_" + a + ") correspond à A ?",
      "A = " + matrix([[a, 1, 0], [0, a, 0], [0, 0, b]]),
      vector([1, 2]), [vector([2, 1]), vector([2, 2]), vector([1, 1])],
      "Le bloc non diagonal donne un seul vecteur propre indépendant, mais deux vecteurs dans le sous-espace caractéristique.");
  }
  if (familyId === "matrix-adjoint") {
    if (mode === 1) {
      return variation(familyId, mode,
        "Quelle identité définit l’adjoint u^{*} dans un espace euclidien ?",
        "u est un endomorphisme de E. L’identité doit être vraie pour tous les vecteurs x et y de E.",
        "⟨u(x), y⟩ = ⟨x, u^{*}(y)⟩",
        ["⟨u(x), y⟩ = ⟨u^{*}(x), y⟩", "⟨u(x), y⟩ = ⟨x, u(y)⟩", "⟨u(x), y⟩ = −⟨x, u^{*}(y)⟩"],
        "L’adjoint transfère l’endomorphisme du premier argument vers le second dans le produit scalaire.");
    }
    return variation(familyId, mode,
      "Quel est l’adjoint d’une composée u ∘ v ?",
      "u et v sont deux endomorphismes d’un espace euclidien.",
      "(u ∘ v)^{*} = v^{*} ∘ u^{*}",
      ["(u ∘ v)^{*} = u^{*} ∘ v^{*}", "(u ∘ v)^{*} = u ∘ v", "(u ∘ v)^{*} = −v^{*} ∘ u^{*}"],
      "La prise de l’adjoint renverse l’ordre de composition.");
  }
  if (familyId === "matrix-self-adjoint") {
    const k = pick([-3, -2, 1, 2, 3]);
    if (mode === 1) {
      return numericVariation(familyId, mode,
        "Quelle valeur de t rend A symétrique ?",
        "A = ⟦1,t;" + k + ",2⟧",
        k, "La symétrie impose l’égalité des deux coefficients hors diagonale : t = " + k + ".");
    }
    return variation(familyId, mode,
      "Quelle propriété possède tout endomorphisme autoadjoint réel ?",
      "E est un espace euclidien de dimension finie.",
      "Toutes ses valeurs propres sont réelles.",
      ["Toutes ses valeurs propres sont positives.", "Sa matrice est diagonale dans toute base.", "Il est nécessairement inversible."],
      "Le théorème spectral fournit une base orthonormée de vecteurs propres et des valeurs propres réelles.");
  }
  if (familyId === "matrix-spectral-theorem") {
    const a = pick([-3, -2, 1, 2]);
    const b = pick([-3, -2, 1, 2]);
    const A = matrix([[a, b], [b, a]]);
    if (mode === 1) {
      return numericVariation(familyId, mode,
        "Quelle valeur propre de A est associée à v = " + columnVector([1, 1]) + " ?",
        "A = " + A,
        a + b, "A" + columnVector([1, 1]) + " = " + formatLinearExpression([[a + b, columnVector([1, 1])]]) + ".");
    }
    const normalized = fraction(1, squareRoot(2));
    return variation(familyId, mode,
      "Quelle matrice orthogonale P diagonalise A ?",
      "A = " + A,
      normalized + matrix([[1, 1], [1, -1]]),
      [matrix([[1, 1], [1, -1]]), matrix([[1, 1], [0, 1]]), normalized + matrix([[1, 1], [1, 1]])],
      "Les colonnes " + normalized + columnVector([1, 1]) + " et " + normalized + columnVector([1, -1]) + " sont orthonormées et propres pour A.");
  }
  if (familyId === "matrix-positivity") {
    if (mode === 1) {
      return variation(familyId, mode,
        "Quel critère caractérise la positivité stricte d’une matrice symétrique A d’ordre 2 ?",
        "A = ⟦a,b;b,c⟧",
        "a > 0 et ac − b² > 0",
        ["a > 0 et ac − b² < 0", "a < 0 et ac − b² > 0", "a + c > 0 seulement"],
        "Le critère de Sylvester exige que les deux mineurs principaux dominants soient strictement positifs.");
    }
    const a = pick([1, 2, 3]);
    const b = pick([1, 2, 3]);
    const x = randomVector(2);
    const value = a * x[0] * x[0] + b * x[1] * x[1];
    return numericVariation(familyId, mode,
      "Quelle est la valeur de la forme quadratique xᵀAx ?",
      "A = " + matrix([[a, 0], [0, b]]) + " et x = " + columnVector(x),
      value, "xᵀAx = " + a + " × " + factor(x[0]) + "² + " + b + " × " + factor(x[1]) + "² = " + value + ".");
  }
  throw new Error("Aucune tâche complémentaire pour " + familyId + " (" + mode + ")");
}

const VARIANT_FAMILY_IDS = new Set([
  "vector-combination", "vector-span", "vector-subspace",
  "basis-determinant", "basis-coordinates", "basis-rank",
  "application-kernel", "application-explicit-rank", "application-image",
  "application-linearity", "matrix-vector-product", "matrix-representation",
  "matrix-invertibility", "matrix-spectrum", "matrix-determinant-2",
  "matrix-determinant-3", "matrix-product", "matrix-block-determinant",
  "matrix-characteristic-polynomial", "matrix-eigenspace",
  "matrix-annihilating-polynomial", "matrix-minimal-polynomial",
  "matrix-characteristic-subspace", "matrix-adjoint",
  "matrix-self-adjoint", "matrix-spectral-theorem", "matrix-positivity",
]);

export const LEGACY_EXERCISE_FAMILIES: readonly ExerciseFamily[] =
  BASE_EXERCISE_FAMILIES.map((family) => ({
    ...family,
    generate: (spaceDimension, history) => {
      if (!VARIANT_FAMILY_IDS.has(family.id)) return family.generate(spaceDimension, history);
      const variantCount = family.id === "matrix-characteristic-polynomial" ? 5 : 3;
      const mode = weightedIndex(Array.from({ length: variantCount }, (_, index) => {
        const key = RECALL_TASKS[family.id]?.[index];
        return key ? recallWeight(key, history) : 1;
      }));
      if (mode === 0) return { ...family.generate(spaceDimension, history), taskKind: "core" };
      return supplementalQuestion(family.id, mode, spaceDimension);
    },
  }));

export const EXERCISE_FAMILIES: readonly ExerciseFamily[] = [
  ...WORKSHOP_EXERCISE_FAMILIES,
  ...LEGACY_EXERCISE_FAMILIES,
];

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
  history?: PracticeHistory,
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
  ).generate(spaceDimension, history);
}
