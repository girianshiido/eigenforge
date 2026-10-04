import assert from "node:assert/strict";
import test from "node:test";

import {
  EXERCISE_FAMILIES,
  innerProductQuestion,
} from "../app/question-generator.ts";
import { protectMathSpacing } from "../app/math-spacing.ts";

test("each expanded family exposes at least three genuinely different task routes", () => {
  for (const family of EXERCISE_FAMILIES) {
    const seen = new Set();
    for (let trial = 0; trial < 400; trial += 1) {
      const question = family.generate(3);
      const texts = question.choices.map((choice) => choice.text);
      assert.equal(texts.length, 4, family.id);
      assert.equal(new Set(texts).size, 4, family.id);
      assert.equal(question.choices.filter((choice) => choice.correct).length, 1, family.id);
      assert.ok(texts.every((text) => !text.includes("Autre proposition")), family.id);
      seen.add(question.taskKind ?? question.prompt.replaceAll(/-?\d+/g, "#"));
    }
    assert.ok(seen.size >= 3, family.id + " offers only " + seen.size + " task types");
  }
});

test("the characteristic-polynomial family covers five different tasks", () => {
  const family = EXERCISE_FAMILIES.find((item) => item.id === "matrix-characteristic-polynomial");
  const seen = new Set();
  for (let trial = 0; trial < 500; trial += 1) seen.add(family.generate(3).taskKind);
  assert.deepEqual(seen, new Set(["core", "task-1", "task-2", "task-3", "task-4"]));
});

test("characteristic-polynomial dimensions and multiplicities match the factorization", () => {
  const family = EXERCISE_FAMILIES.find((item) => item.id === "matrix-characteristic-polynomial");
  let checked = 0;
  for (let trial = 0; trial < 2500; trial += 1) {
    const question = family.generate(3);
    if (!["task-1", "task-3"].includes(question.taskKind)) continue;
    checked += 1;
    const factors = [...question.formula.matchAll(/\(X ([−+]) (\d+)\)\^\{(\d+)\}/g)]
      .map((match) => ({ root: Number(match[2]) * (match[1] === "−" ? 1 : -1), multiplicity: Number(match[3]) }));
    assert.equal(factors.length, 2);
    assert.notEqual(factors[0].root, factors[1].root);
    const answer = Number(question.choices.find((choice) => choice.correct).text);
    if (question.taskKind === "task-1") {
      assert.equal(answer, factors.reduce((sum, factor) => sum + factor.multiplicity, 0));
    } else {
      const root = Number(question.prompt.match(/propre (-?\d+)/)[1]);
      assert.equal(answer, factors.find((factor) => factor.root === root).multiplicity);
    }
  }
  assert.ok(checked > 100);
});

test("Cauchy-Schwarz answers have exactly one collinear pair in dimensions two and three", () => {
  for (const dimension of [2, 3]) {
    let checked = 0;
    for (let trial = 0; trial < 8000; trial += 1) {
      const question = innerProductQuestion(dimension);
      if (!question.eyebrow.includes("Cauchy")) continue;
      checked += 1;
      const valid = question.choices.filter((choice) => {
        const tuples = [...choice.text.matchAll(/\(([-\d ;]+)\)/g)];
        assert.equal(tuples.length, 2);
        const u = tuples[0][1].split(" ; ").map(Number);
        const v = tuples[1][1].split(" ; ").map(Number);
        return u.every((left, i) => u.every((right, j) => left * v[j] === right * v[i]));
      });
      assert.equal(valid.length, 1, JSON.stringify(question));
      assert.ok(valid[0].correct);
    }
    assert.ok(checked > 1000);
  }
});

test("mathematical operators and tuples do not introduce line-break spaces", () => {
  const expression = protectMathSpacing("χ_A(X) = det(XI − A) et u − 3v");
  assert.match(expression, /χ_A\(X\)\u00a0=\u00a0det\(XI\u00a0−\u00a0A\)/);
  assert.match(expression, /u\u00a0−\u00a03v/);
  assert.match(expression, / et /);
  assert.equal(protectMathSpacing("B = (e₁, e₂)"), "B\u00a0=\u00a0(e₁,\u00a0e₂)");
  assert.equal(protectMathSpacing("u = ⟬1¦√2⟭ ⟪1,1⟫"), "u\u00a0=\u00a0⟬1¦√2⟭\u00a0⟪1,1⟫");
  assert.equal(protectMathSpacing("f : ℝ² → ℝ²"), "f\u00a0:\u00a0ℝ²\u00a0→\u00a0ℝ²");
  assert.equal(protectMathSpacing("⟨u(x), y⟩ = ⟨x, u^{*}(y)⟩"), "⟨u(x),\u00a0y⟩\u00a0=\u00a0⟨x,\u00a0u^{*}(y)⟩");
  assert.equal(protectMathSpacing("H = {(x ; y) ∈ ℝ² | x + y = 0}"), "H\u00a0=\u00a0{(x\u00a0;\u00a0y)\u00a0∈\u00a0ℝ²\u00a0|\u00a0x\u00a0+\u00a0y\u00a0=\u00a00}");
});
