import assert from "node:assert/strict";
import test from "node:test";

import {
  EXERCISE_FAMILIES,
  basisQuestion,
  combinationQuestion,
  explicitMapRankQuestion,
  familyRankQuestion,
  spanQuestion,
  subspaceQuestion,
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
  const match = text.match(/^\((-?\d+(?: ; -?\d+)+)\)$/);
  assert.ok(match, `Vecteur attendu, reçu : ${text}`);
  return match[1].split(" ; ").map(Number);
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

test("the shared catalogue exposes every exercise family to the game and laboratory", () => {
  assert.equal(EXERCISE_FAMILIES.length, 10);
  assert.deepEqual(
    new Set(EXERCISE_FAMILIES.map((family) => family.sector)),
    new Set(["vectors", "bases", "applications"]),
  );
  assert.equal(
    new Set(EXERCISE_FAMILIES.map((family) => family.id)).size,
    EXERCISE_FAMILIES.length,
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
