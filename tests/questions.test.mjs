import assert from "node:assert/strict";
import test from "node:test";

import {
  EXERCISE_FAMILIES,
  adjointMatrixQuestion,
  annihilatingPolynomialQuestion,
  availableExerciseFamilies,
  basisQuestion,
  blockDeterminantQuestion,
  characteristicPolynomialQuestion,
  characteristicSubspaceQuestion,
  combinationQuestion,
  determinant2MatrixQuestion,
  determinant3Question,
  diagonalizabilityQuestion,
  eigenvectorQuestion,
  explicitMapRankQuestion,
  familyRankQuestion,
  generateQuestion,
  imageQuestion,
  matrixProductQuestion,
  minimalPolynomialQuestion,
  positivityQuestion,
  rankTheoremQuestion,
  selfAdjointQuestion,
  spanQuestion,
  spectralTheoremQuestion,
  subspaceQuestion,
  triangularizationQuestion,
  cayleyHamiltonQuestion,
} from "../app/question-generator.ts";

function assertWellFormed(question) {
  assert.equal(question.choices.length, 4);
  assert.equal(
    question.choices.filter((choice) => choice.correct).length,
    1,
  );
  assert.equal(
    new Set(question.choices.map((choice) => choice.text)).size,
    4,
  );
}

function parseVector(text) {
  const tupleMatch = text.match(/^\((-?\d+(?: ; -?\d+)+)\)$/);
  const columnMatch = text.match(/^⟪(-?\d+(?:,-?\d+)+)⟫$/);
  const match = tupleMatch ?? columnMatch;
  assert.ok(match, `Vecteur attendu, reçu : ${text}`);
  return match[1].split(tupleMatch ? " ; " : ",").map(Number);
}

function assertNoSingleCoordinateRevealsAnswer(question) {
  const correctChoice = question.choices.find((choice) => choice.correct);
  const wrongChoices = question.choices.filter((choice) => !choice.correct);
  const correct = parseVector(correctChoice.text);
  const wrongVectors = wrongChoices.map((choice) => parseVector(choice.text));

  for (let coordinate = 0; coordinate < correct.length; coordinate += 1) {
    assert.ok(
      wrongVectors.some(
        (candidate) => candidate[coordinate] === correct[coordinate],
      ),
      `La coordonnée ${coordinate + 1} désigne seule la bonne réponse dans ${question.prompt}`,
    );
  }
}

function parseMatrix(text) {
  const match = text.match(/⟦([^⟧]+)⟧/);
  assert.ok(match, `Matrice attendue, reçu : ${text}`);
  return match[1]
    .split(";")
    .map((row) => row.split(",").map(Number));
}

function determinant(rows) {
  if (rows.length === 1) return rows[0][0];
  return rows[0].reduce((sum, coefficient, column) => {
    const minor = rows
      .slice(1)
      .map((row) => row.filter((_, index) => index !== column));
    return sum + (column % 2 === 0 ? 1 : -1) * coefficient * determinant(minor);
  }, 0);
}

function multiply(first, second) {
  return first.map((row) =>
    second[0].map((_, column) =>
      row.reduce(
        (sum, coefficient, index) =>
          sum + coefficient * second[index][column],
        0,
      ),
    ),
  );
}

test("the shared catalogue exposes every exercise family to the game and laboratory", () => {
  assert.equal(EXERCISE_FAMILIES.length, 31);
  assert.deepEqual(
    new Set(EXERCISE_FAMILIES.map((family) => family.sector)),
    new Set(["vectors", "bases", "applications", "matrices"]),
  );
  assert.equal(
    new Set(EXERCISE_FAMILIES.map((family) => family.id)).size,
    EXERCISE_FAMILIES.length,
  );
  assert.deepEqual(
    new Set(EXERCISE_FAMILIES.map((family) => family.program)),
    new Set(["MPSI", "MP"]),
  );

  for (const family of EXERCISE_FAMILIES) {
    for (const dimension of [2, 3]) {
      for (let index = 0; index < 40; index += 1) {
        const question = family.generate(dimension);
        assertWellFormed(question);
        assert.equal(question.sector, family.sector);
      }
    }
  }
});

test("vector anomalies remain available before the first workshop", () => {
  for (let index = 0; index < 100; index += 1) {
    const question = generateQuestion(["vectors"], 0, -1);
    assertWellFormed(question);
    assert.equal(question.sector, "vectors");
  }
});

test("matrix questions use structured notation and mental 3 by 3 determinants", () => {
  const determinantTemplates = new Set();
  const matrixFamilies = EXERCISE_FAMILIES.filter(
    (family) => family.sector === "matrices",
  );
  assert.equal(matrixFamilies.length, 20);

  for (const family of matrixFamilies) {
    for (let index = 0; index < 150; index += 1) {
      const question = family.generate(3);
      assertWellFormed(question);
      assert.doesNotMatch(
        question.choices.map((choice) => choice.text).join(" "),
        /Autre proposition/,
      );
      if (question.formula.includes("⟦")) {
        assert.match(question.formula, /⟦[^⟧]+⟧/);
      }
      if (family.id === "matrix-vector-product") {
        assertNoSingleCoordinateRevealsAnswer(question);
        assert.match(question.formula, /u = ⟪-?\d+,-?\d+⟫/);
        assert.match(question.explanation, /Au = ⟪-?\d+,-?\d+⟫/);
        assert.ok(
          question.choices.every((choice) =>
            /^⟪-?\d+,-?\d+⟫$/.test(choice.text),
          ),
        );
      }
      if (family.id === "matrix-representation") {
        assert.equal(
          [...question.explanation.matchAll(/⟪[^⟫]+⟫/g)].length,
          2,
        );
      }
    }
  }

  for (let index = 0; index < 300; index += 1) {
    const question = determinant3Question();
    assertWellFormed(question);
    const matrixToken = question.formula.match(/⟦([^⟧]+)⟧/);
    assert.ok(matrixToken);
    assert.equal(matrixToken[1].split(";").length, 3);
    assert.ok(
      matrixToken[1]
        .split(";")
        .every((row) => row.split(",").length === 3),
    );
    const rows = matrixToken[1]
      .split(";")
      .map((row) => row.split(",").map(Number));
    const computedDeterminant =
      rows[0][0] * (rows[1][1] * rows[2][2] - rows[1][2] * rows[2][1]) -
      rows[0][1] * (rows[1][0] * rows[2][2] - rows[1][2] * rows[2][0]) +
      rows[0][2] * (rows[1][0] * rows[2][1] - rows[1][1] * rows[2][0]);
    assert.equal(
      Number(question.choices.find((choice) => choice.correct).text),
      computedDeterminant || 0,
    );
    if (question.explanation.includes("triangulaire")) {
      determinantTemplates.add("triangular");
    } else if (question.explanation.includes("première ligne")) {
      determinantTemplates.add("first-row");
    } else if (question.explanation.includes("deuxième ligne")) {
      determinantTemplates.add("second-row");
    }
  }

  assert.deepEqual(
    determinantTemplates,
    new Set(["triangular", "first-row", "second-row"]),
  );
});

test("matrix generators cover products and determinants from order two to five", () => {
  let sawLargeCoefficient = false;
  const blockOrders = new Set();

  for (let index = 0; index < 400; index += 1) {
    const determinant2Question = determinant2MatrixQuestion();
    assertWellFormed(determinant2Question);
    const rows2 = parseMatrix(determinant2Question.formula);
    assert.equal(
      Number(
        determinant2Question.choices.find((choice) => choice.correct).text,
      ),
      determinant(rows2),
    );

    const productQuestion = matrixProductQuestion();
    assertWellFormed(productQuestion);
    const matrices = [...productQuestion.formula.matchAll(/⟦([^⟧]+)⟧/g)].map(
      (match) => parseMatrix(match[0]),
    );
    assert.equal(matrices.length, 2);
    assert.deepEqual(
      parseMatrix(
        productQuestion.choices.find((choice) => choice.correct).text,
      ),
      multiply(matrices[0], matrices[1]),
    );

    const blockQuestion = blockDeterminantQuestion();
    assertWellFormed(blockQuestion);
    const blockRows = parseMatrix(blockQuestion.formula);
    blockOrders.add(blockRows.length);
    assert.equal(
      Number(blockQuestion.choices.find((choice) => choice.correct).text),
      determinant(blockRows),
    );

    const matrixVectorFamily = EXERCISE_FAMILIES.find(
      (family) => family.id === "matrix-vector-product",
    );
    const matrixVector = matrixVectorFamily.generate(2);
    const matrixRows = parseMatrix(matrixVector.formula);
    sawLargeCoefficient ||= matrixRows
      .flat()
      .some((coefficient) => Math.abs(coefficient) >= 8);
    assert.ok(
      matrixRows.flat().every((coefficient) => Math.abs(coefficient) <= 9),
    );
  }

  assert.deepEqual(blockOrders, new Set([4, 5]));
  assert.equal(sawLargeCoefficient, true);
});

test("the MP exercise path unlocks one reduction topic per workshop", () => {
  assert.deepEqual(
    EXERCISE_FAMILIES.filter((family) => family.program === "MP").map(
      (family) => family.id,
    ),
    [
      "matrix-spectrum",
      "matrix-block-determinant",
      "matrix-characteristic-polynomial",
      "matrix-eigenspace",
      "matrix-diagonalization",
      "matrix-triangularization",
      "matrix-annihilating-polynomial",
      "matrix-minimal-polynomial",
      "matrix-cayley-hamilton",
      "matrix-characteristic-subspace",
      "matrix-adjoint",
      "matrix-self-adjoint",
      "matrix-spectral-theorem",
      "matrix-positivity",
    ],
  );

  assert.equal(
    availableExerciseFamilies(["matrices"], 14).every(
      (family) => family.program === "MPSI",
    ),
    true,
  );
  assert.deepEqual(
    availableExerciseFamilies(["matrices"], 15)
      .filter((family) => family.program === "MP")
      .map((family) => family.id),
    ["matrix-spectrum", "matrix-block-determinant"],
  );
  assert.deepEqual(
    [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27].map((highestOwnedInstrument) =>
      availableExerciseFamilies(
        ["matrices"],
        highestOwnedInstrument,
      )
        .filter((family) => family.program === "MP")
        .at(-1).id,
    ),
    [
      "matrix-characteristic-polynomial",
      "matrix-eigenspace",
      "matrix-diagonalization",
      "matrix-triangularization",
      "matrix-annihilating-polynomial",
      "matrix-minimal-polynomial",
      "matrix-cayley-hamilton",
      "matrix-characteristic-subspace",
      "matrix-adjoint",
      "matrix-self-adjoint",
      "matrix-spectral-theorem",
      "matrix-positivity",
    ],
  );
});

test("Euclidean reduction questions validate adjoints and symmetry", () => {
  const adjointOrders = new Set();
  const selfAdjointOrders = new Set();

  for (let index = 0; index < 400; index += 1) {
    const adjoint = adjointMatrixQuestion();
    assertWellFormed(adjoint);
    const source = parseMatrix(adjoint.formula);
    const expected = source[0].map((_, column) =>
      source.map((row) => row[column]),
    );
    assert.deepEqual(
      parseMatrix(adjoint.choices.find((choice) => choice.correct).text),
      expected,
    );
    adjointOrders.add(source.length);

    const selfAdjoint = selfAdjointQuestion();
    assertWellFormed(selfAdjoint);
    const correct = parseMatrix(
      selfAdjoint.choices.find((choice) => choice.correct).text,
    );
    selfAdjointOrders.add(correct.length);
    assert.deepEqual(
      correct,
      correct[0].map((_, column) => correct.map((row) => row[column])),
    );
    for (const choice of selfAdjoint.choices.filter((choice) => !choice.correct)) {
      const candidate = parseMatrix(choice.text);
      assert.notDeepEqual(
        candidate,
        candidate[0].map((_, column) =>
          candidate.map((row) => row[column]),
        ),
      );
    }
  }

  assert.deepEqual(adjointOrders, new Set([2, 3]));
  assert.deepEqual(selfAdjointOrders, new Set([2, 3]));
});

test("spectral and positivity questions cover theorem, computation and all signs", () => {
  const spectralTemplates = new Set();
  const positivityTemplates = new Set();

  for (let index = 0; index < 600; index += 1) {
    const spectral = spectralTheoremQuestion();
    assertWellFormed(spectral);
    if (spectral.id.includes("THEOREM")) {
      spectralTemplates.add("theorem");
      assert.match(
        spectral.choices.find((choice) => choice.correct).text,
        /orthogonale P.*diagonale D.*A = PDPᵀ/,
      );
    } else {
      spectralTemplates.add("basis");
      const source = parseMatrix(spectral.formula);
      const answer = parseMatrix(
        spectral.choices.find((choice) => choice.correct).text,
      );
      assert.deepEqual(answer, [
        [source[0][0] + source[0][1], 0],
        [0, source[0][0] - source[0][1]],
      ]);
    }

    const positivity = positivityQuestion();
    assertWellFormed(positivity);
    const source = parseMatrix(positivity.formula);
    const determinantValue = determinant(source);
    const correct = positivity.choices.find((choice) => choice.correct).text;
    if (positivity.id.includes("SEMIDEFINED")) {
      positivityTemplates.add("semidefinite");
      assert.equal(correct, "A est positive, mais pas définie positive.");
      assert.equal(determinantValue, 0);
      assert.ok(source[0][0] >= 0 && source[1][1] >= 0);
    } else if (positivity.id.includes("DEFINED")) {
      positivityTemplates.add("definite");
      assert.equal(correct, "A est définie positive.");
      assert.ok(source[0][0] > 0 && determinantValue > 0);
    } else {
      positivityTemplates.add("not-positive");
      assert.equal(correct, "A n’est pas positive.");
      assert.ok(
        source[0][0] < 0 ||
          source[1][1] < 0 ||
          determinantValue < 0,
      );
    }
  }

  assert.deepEqual(spectralTemplates, new Set(["theorem", "basis"]));
  assert.deepEqual(
    positivityTemplates,
    new Set(["definite", "semidefinite", "not-positive"]),
  );
});

test("MP reduction questions validate characteristic and eigenvector calculations", () => {
  const characteristicForms = new Set();
  const spectrumFamily = EXERCISE_FAMILIES.find(
    (family) => family.id === "matrix-spectrum",
  );

  for (let index = 0; index < 400; index += 1) {
    const spectrumQuestion = spectrumFamily.generate(3);
    assertWellFormed(spectrumQuestion);
    const spectrumMatrix = parseMatrix(spectrumQuestion.formula);
    const eigenvalues = new Set([
      spectrumMatrix[0][0],
      spectrumMatrix[1][1],
    ]);
    assert.equal(
      spectrumQuestion.choices.filter((choice) =>
        eigenvalues.has(Number(choice.text)),
      ).length,
      1,
    );

    const characteristic = characteristicPolynomialQuestion();
    assertWellFormed(characteristic);
    const rows = parseMatrix(characteristic.formula);
    const trace = rows[0][0] + rows[1][1];
    const determinantValue = determinant(rows);
    const expected = (() => {
      let result = "X²";
      if (trace !== 0) {
        const magnitude =
          Math.abs(trace) === 1 ? "" : `${Math.abs(trace)}`;
        result += trace > 0 ? ` − ${magnitude}X` : ` + ${magnitude}X`;
      }
      if (determinantValue !== 0) {
        result +=
          determinantValue > 0
            ? ` + ${determinantValue}`
            : ` − ${Math.abs(determinantValue)}`;
      }
      return result;
    })();
    assert.equal(
      characteristic.choices.find((choice) => choice.correct).text,
      expected,
    );
    characteristicForms.add(expected);

    const eigenvector = eigenvectorQuestion();
    assertWellFormed(eigenvector);
    const matrixRows = parseMatrix(eigenvector.formula);
    const vectorValue = parseVector(
      eigenvector.choices.find((choice) => choice.correct).text,
    );
    const eigenvalue = Number(
      eigenvector.prompt.match(/valeur propre (-?\d+)/)[1],
    );
    assert.deepEqual(
      [
        matrixRows[0][0] * vectorValue[0] +
          matrixRows[0][1] * vectorValue[1],
        matrixRows[1][0] * vectorValue[0] +
          matrixRows[1][1] * vectorValue[1],
      ].map((coordinate) => coordinate || 0),
      vectorValue.map((coordinate) => eigenvalue * coordinate || 0),
    );
    assert.notDeepEqual(vectorValue, [0, 0]);
  }

  assert.ok(characteristicForms.size >= 20);
});

test("MP reduction questions vary diagonalizability and preserve multiplicities", () => {
  const conclusions = new Set();
  const diagonalTemplates = new Set();
  const triangularTemplates = new Set();

  for (let index = 0; index < 400; index += 1) {
    const diagonalization = diagonalizabilityQuestion();
    assertWellFormed(diagonalization);
    const conclusion = diagonalization.choices.find(
      (choice) => choice.correct,
    ).text;
    conclusions.add(conclusion.includes("n’est pas") ? "no" : "yes");
    diagonalTemplates.add(
      diagonalization.id.includes("SPECTRUM")
        ? "spectrum"
        : diagonalization.id.includes("BASIS")
          ? "basis"
          : "eigenspaces",
    );

    const triangularization = triangularizationQuestion();
    assertWellFormed(triangularization);
    triangularTemplates.add(
      triangularization.id.includes("FIELD")
        ? "field"
        : triangularization.id.includes("BASIS")
          ? "basis"
          : "diagonal",
    );
  }

  assert.deepEqual(conclusions, new Set(["yes", "no"]));
  assert.deepEqual(
    diagonalTemplates,
    new Set(["spectrum", "basis", "eigenspaces"]),
  );
  assert.deepEqual(
    triangularTemplates,
    new Set(["field", "basis", "diagonal"]),
  );
});

test("polynomial reduction covers annihilators, minimal polynomial, Cayley-Hamilton and characteristic subspaces", () => {
  const minimalTemplates = new Set();
  const characteristicDimensions = new Set();
  const characteristicOrders = new Set();
  const characteristicBlockSizes = new Set();
  let sawNonUnitCoupling = false;
  let sawNonTriangularMatrix = false;
  const cayleyTemplates = new Set();

  for (let index = 0; index < 400; index += 1) {
    const annihilator = annihilatingPolynomialQuestion();
    assertWellFormed(annihilator);
    assert.match(annihilator.explanation, /annule A/);

    const minimal = minimalPolynomialQuestion();
    assertWellFormed(minimal);
    minimalTemplates.add(minimal.id.split("-")[2]);
    assert.doesNotMatch(
      minimal.choices.map((choice) => choice.text).join(" "),
      /Autre proposition/,
    );

    const cayleyHamilton = cayleyHamiltonQuestion();
    assertWellFormed(cayleyHamilton);
    const cayleyTemplate = cayleyHamilton.id.split("-")[2];
    cayleyTemplates.add(cayleyTemplate);
    const cayleyAnswer = cayleyHamilton.choices.find(
      (choice) => choice.correct,
    ).text;
    if (cayleyTemplate === "IDENTITY") {
      assert.match(cayleyHamilton.formula, /^χ_A\(X\)/);
      assert.doesNotMatch(cayleyHamilton.formula, /⟦/);
      assert.match(cayleyAnswer, /^χ_A\(A\) = /);
    } else if (cayleyTemplate === "ANNULATOR") {
      assert.match(cayleyHamilton.formula, /⟦/);
      assert.doesNotMatch(cayleyHamilton.formula, /χ_A\(X\)/);
    } else if (cayleyTemplate === "EQUIVALENT") {
      assert.match(cayleyHamilton.formula, /^P\(X\)/);
      assert.match(cayleyAnswer, /^A = A² − \d+I$/);
    } else {
      assert.equal(parseMatrix(cayleyHamilton.formula).length, 3);
      assert.match(cayleyAnswer, /= 0$/);
    }

    const characteristicSpace = characteristicSubspaceQuestion();
    assertWellFormed(characteristicSpace);
    characteristicOrders.add(
      Number(characteristicSpace.id.match(/-O(\d)-/)[1]),
    );
    characteristicBlockSizes.add(
      Number(characteristicSpace.id.match(/-B(\d)-/)[1]),
    );
    const characteristicMatrix = parseMatrix(characteristicSpace.formula);
    sawNonUnitCoupling ||= characteristicMatrix.some((row, rowIndex) =>
      row.some(
        (coefficient, columnIndex) =>
          rowIndex !== columnIndex && Math.abs(coefficient) > 1,
      ),
    );
    sawNonTriangularMatrix ||= characteristicMatrix.some((row, rowIndex) =>
      row.some(
        (coefficient, columnIndex) =>
          rowIndex > columnIndex && coefficient !== 0,
      ),
    );
    characteristicDimensions.add(
      characteristicSpace.choices.find((choice) => choice.correct).text,
    );
    assert.match(
      characteristicSpace.prompt,
      /Ker\(\(A [−+] (?:\d+)?I\)[³⁴⁵]\)/,
    );
    assert.doesNotMatch(characteristicSpace.prompt, /− -/);
    assert.doesNotMatch(characteristicSpace.prompt, /[−+] 1I/);
  }

  assert.deepEqual(minimalTemplates, new Set(["0", "1", "2"]));
  assert.deepEqual(
    characteristicDimensions,
    new Set(["1", "2", "3", "4"]),
  );
  assert.deepEqual(
    characteristicOrders,
    new Set([3, 4, 5]),
  );
  assert.deepEqual(characteristicBlockSizes, new Set([2, 3, 4]));
  assert.equal(sawNonUnitCoupling, true);
  assert.equal(sawNonTriangularMatrix, true);
  assert.deepEqual(
    cayleyTemplates,
    new Set(["IDENTITY", "ANNULATOR", "EQUIVALENT", "ORDER3"]),
  );
});

test("image exercises genuinely determine images in dimensions two and three", () => {
  const templates = new Set();
  const answers = new Set();

  for (let index = 0; index < 500; index += 1) {
    const question = imageQuestion(index % 2 === 0 ? 2 : 3);
    assertWellFormed(question);
    assert.equal(question.prompt, "Quelle est l’image de f ?");
    assert.equal(question.eyebrow, "Image d’une application");
    templates.add(
      question.id.includes("CANONICAL") ? "canonical" : "line",
    );
    answers.add(question.choices.find((choice) => choice.correct).text);
    assert.match(question.explanation, /Im\(f\)/);
  }

  assert.deepEqual(templates, new Set(["canonical", "line"]));
  assert.ok(answers.size >= 20);
});

test("rank theorem exercises ask for every term of the dimension formula", () => {
  const prompts = new Set();

  for (let index = 0; index < 400; index += 1) {
    const question = rankTheoremQuestion();
    assertWellFormed(question);
    prompts.add(question.prompt);
    assert.match(question.explanation, /dim\(E\) = dim\(Ker f\) \+ rg\(f\)/);
  }

  assert.deepEqual(
    prompts,
    new Set([
      "Quel est le rang de f ?",
      "Quelle est la dimension de Ker(f) ?",
      "Quelle est la dimension de E ?",
    ]),
  );
});

test("linear combinations vary coefficients without displaying useless ones", () => {
  const prompts = new Set();
  const statements = new Set();

  for (let index = 0; index < 300; index += 1) {
    const dimension = index % 2 === 0 ? 2 : 3;
    const question = combinationQuestion(dimension);
    assertWellFormed(question);
    assertNoSingleCoordinateRevealsAnswer(question);
    prompts.add(question.prompt);
    statements.add(`${question.prompt} ${question.formula}`);
    assert.doesNotMatch(question.prompt, /(?:^|\s)[+-]?1[uv]\b/);
    assert.doesNotMatch(question.prompt, /\+\s*−|-\s*-/);
    if (dimension === 3) {
      assert.match(question.formula, /\([^)]* ; [^)]* ; [^)]*\)/);
    }
  }

  assert.ok(prompts.size >= 5);
  assert.ok(statements.size >= 100);
  assert.ok([...prompts].some((prompt) => prompt.includes("u − v")));
  assert.ok([...prompts].some((prompt) => prompt.includes("2u + v")));
  assert.ok([...prompts].some((prompt) => prompt.includes("u − 3v")));
});

test("coordinate calculations require checking every coordinate", () => {
  let coordinateQuestions = 0;

  for (let index = 0; index < 600; index += 1) {
    const question = basisQuestion(2);
    if (!question.id.startsWith("B-COORD")) continue;
    coordinateQuestions += 1;
    assertWellFormed(question);
    assertNoSingleCoordinateRevealsAnswer(question);
  }

  assert.ok(coordinateQuestions >= 100);
});

test("span questions alternate membership and use planes in dimension three", () => {
  const ids = new Set();

  for (let index = 0; index < 500; index += 1) {
    const question = spanQuestion(3);
    assertWellFormed(question);
    ids.add(question.id.split("-").slice(0, 3).join("-"));
  }

  assert.ok([...ids].some((id) => id === "V-VECT-IN"));
  assert.ok([...ids].some((id) => id === "V-VECT-OUT"));
  assert.ok([...ids].some((id) => id === "V-PLANE-IN"));
  assert.ok([...ids].some((id) => id === "V-PLANE-OUT"));
});

test("three-vector families realize every possible rank in dimension three", () => {
  const observedRanks = new Set();

  for (let index = 0; index < 500; index += 1) {
    const question = familyRankQuestion(3);
    assertWellFormed(question);
    observedRanks.add(
      question.choices.find((choice) => choice.correct).text,
    );
    assert.match(question.prompt, /ℝ³/);
  }

  assert.deepEqual([...observedRanks].sort(), ["0", "1", "2", "3"]);
});

test("explicit linear maps realize ranks zero through the ambient dimension", () => {
  for (const dimension of [2, 3]) {
    const observedRanks = new Set();

    for (let index = 0; index < 400; index += 1) {
      const question = explicitMapRankQuestion(dimension);
      assertWellFormed(question);
      observedRanks.add(
        question.choices.find((choice) => choice.correct).text,
      );
    }

    assert.deepEqual(
      [...observedRanks].sort(),
      Array.from({ length: dimension + 1 }, (_, rank) => `${rank}`),
    );
  }
});

test("subspace questions vary statement, polarity and ambient dimension", () => {
  const prompts = new Set();
  const choiceSets = new Set();

  for (let index = 0; index < 500; index += 1) {
    const question = subspaceQuestion(index % 2 === 0 ? 2 : 3);
    assertWellFormed(question);
    prompts.add(question.prompt);
    choiceSets.add(
      question.choices.map((choice) => choice.text).sort().join(" || "),
    );
  }

  assert.ok([...prompts].some((prompt) => prompt.includes("est un sous-espace")));
  assert.ok([...prompts].some((prompt) => prompt.includes("n’est pas")));
  assert.ok([...prompts].some((prompt) => prompt.includes("ℝ²")));
  assert.ok([...prompts].some((prompt) => prompt.includes("ℝ³")));
  assert.ok(choiceSets.size >= 100);
});
