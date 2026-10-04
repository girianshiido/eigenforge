import assert from "node:assert/strict";
import test from "node:test";
import { INSTRUMENTS } from "../app/game-balance.ts";
import { WORKSHOP_EXERCISE_FAMILIES, WORKSHOP_TASK_COUNT, availableExerciseFamilies } from "../app/question-generator.ts";
import { emptyPracticeHistory, recordQuestionShown, recordQuestionAnswer } from "../app/question-review.ts";

const sectors = ["vectors", "bases", "applications", "matrices"];
function seeded(callback) {
  const previous = Math.random;
  let state = 0x3456;
  Math.random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
  try { return callback(); } finally { Math.random = previous; }
}
function parseNumber(s) {
  const fraction = s.match(/^⟬(-?\d+)¦(\d+)⟭$/);
  return fraction ? Number(fraction[1]) / Number(fraction[2]) : Number(s.replaceAll("−", "-"));
}
function parseMatrix(s) { const match = s.match(/⟦([^⟧]+)⟧/); assert.ok(match, s); return match[1].split(";").map(r => r.split(",").map(parseNumber)); }
function parseVector(s) { return s.replace(/^[⟪(]|[⟫)]$/g, "").split(/[;,]/).map(x => parseNumber(x.trim())); }
function equal(a, b) {
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((x, i) => equal(x, b[i]));
  return typeof b === "number" && Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-8;
}
function multiply(a, b) {
  const out = Array.from({ length: a.length }, () => Array(b[0].length).fill(0));
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b[0].length; j++) for (let k = 0; k < b.length; k++) out[i][j] += a[i][k] * b[k][j];
  return out;
}
const identity = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const transpose = a => a[0].map((_, j) => a.map(row => row[j]));
const trace = a => a.reduce((s, row, i) => s + row[i], 0);
const subtract = (a, b) => a.map((r, i) => r.map((x, j) => x - b[i][j]));
function pow(a, k) { let out = identity(a.length); for (let i = 0; i < k; i++) out = multiply(out, a); return out; }
// Independent Gaussian elimination (the generators use cofactor expansion).
function determinant(a) {
  a = a.map(row => [...row]); let result = 1;
  for (let j = 0; j < a.length; j++) {
    const pivot = a.findIndex((row, i) => i >= j && Math.abs(row[j]) > 1e-9);
    if (pivot < 0) return 0;
    if (pivot !== j) { [a[pivot], a[j]] = [a[j], a[pivot]]; result *= -1; }
    result *= a[j][j];
    for (let i = j + 1; i < a.length; i++) { const factor = a[i][j] / a[j][j]; for (let k = j; k < a.length; k++) a[i][k] -= factor * a[j][k]; }
  }
  return result;
}
function evaluateMatrix(a, coefficients) {
  let result = a.map(row => row.map(() => 0));
  for (let k = coefficients.length - 1; k >= 0; k--) {
    result = multiply(result, a);
    result.forEach((row, i) => { row[i] += coefficients[k]; });
  }
  return result;
}

test("all 68 workshops own five distinct selectable tasks and unlock in order", () => {
  assert.equal(WORKSHOP_EXERCISE_FAMILIES.length, INSTRUMENTS.length);
  assert.equal(WORKSHOP_TASK_COUNT, 340);
  INSTRUMENTS.forEach((workshop, index) => {
    const family = WORKSHOP_EXERCISE_FAMILIES.find(f => f.workshopId === workshop.id);
    assert.ok(family, workshop.id);
    assert.ok(family.tasks.length >= 5, workshop.id);
    assert.equal(new Set(family.tasks.map(t => t.id)).size, family.tasks.length);
    assert.equal(new Set(family.tasks.map(t => t.label)).size, family.tasks.length);
    assert.equal(family.minInstrument, index);
    assert.equal(family.program, workshop.program);
    assert.ok(!availableExerciseFamilies(sectors, index - 1).includes(family));
    assert.ok(availableExerciseFamilies(sectors, index).includes(family));
  });
});

test("68000 deterministic workshop draws have four distinct answers, one key and valid notation", () => seeded(() => {
  for (const family of WORKSHOP_EXERCISE_FAMILIES) for (const task of family.tasks) {
    const statements = new Set();
    for (let i = 0; i < 200; i++) {
      const q = family.generateTask(task.id), context = `${family.id}/${task.id}`;
      assert.equal(q.workshopId, family.workshopId);
      assert.equal(q.taskKind, task.id);
      assert.equal(q.choices.length, 4, context);
      assert.equal(new Set(q.choices.map(c => c.text)).size, 4, context);
      assert.equal(q.choices.filter(c => c.correct).length, 1, context);
      assert.ok(q.prompt && q.formula && q.explanation, context);
      assert.doesNotMatch(JSON.stringify(q), /undefined|NaN|Infinity|ℝ\d|\+\s*-|\b1I\b/, context);
      statements.add(q.prompt + q.formula + q.choices.map(c => c.text).sort().join("|"));
    }
    // Fixed course facts are explicitly marked for spaced review.
    if (statements.size === 1) assert.ok(family.generateTask(task.id).recallKey, `${family.id}/${task.id} is frozen but unmarked`);
  }
}));

test("matrix and vector calculations agree with independent arithmetic, including every distractor", () => seeded(() => {
  let checked = 0;
  for (const family of WORKSHOP_EXERCISE_FAMILIES) for (const task of family.tasks) for (let i = 0; i < 60; i++) {
    const q = family.generateTask(task.id);
    if (!q.audit) continue;
    checked++;
    const { kind, inputs: [a, b, c] } = q.audit;
    let expected;
    switch (kind) {
      case "det": expected = determinant(a); break;
      case "trace": expected = trace(a); break;
      case "mul": expected = multiply(a, b); break;
      case "triple-product": expected = multiply(multiply(a, b), c); break;
      case "transpose": expected = transpose(a); break;
      case "transpose-product": expected = transpose(multiply(a, b)); break;
      case "trace-product": expected = trace(multiply(a, b)); break;
      case "commutator": expected = subtract(multiply(a, b), multiply(b, a)); break;
      case "power": expected = pow(a, b); break;
      case "mv": expected = multiply(a, b.map(x => [x])).flat(); break;
      case "dot": expected = a.reduce((sum, x, i) => sum + x * b[i], 0); break;
      case "distance-squared": expected = a.reduce((sum, x, i) => sum + (x - b[i]) ** 2, 0); break;
      case "quadratic": expected = multiply([b], multiply(a, b.map(x => [x])))[0][0]; break;
      case "polynomial": expected = evaluateMatrix(a, b); break;
      case "cofactor": expected = (-1) ** (b + c) * determinant(a.filter((_, i) => i !== b).map(row => row.filter((_, j) => j !== c))); break;
      case "symmetric-part": expected = a.map((row, i) => row.map((x, j) => (x + a[j][i]) / 2)); break;
      case "inverse": case "solve": break;
      default: assert.fail(`Missing independent validator for ${kind}`);
    }
    for (const answer of q.choices) {
      const parsed = answer.text.startsWith("⟦") ? parseMatrix(answer.text) : answer.text.startsWith("⟪") || answer.text.startsWith("(") ? parseVector(answer.text) : parseNumber(answer.text);
      const valid = kind === "inverse" ? equal(multiply(a, parsed), identity(a.length)) : kind === "solve" ? equal(multiply(a, parsed.map(x => [x])).flat(), b) : equal(parsed, expected);
      assert.equal(valid, answer.correct, `${q.id}: ${answer.text}`);
    }
  }
  assert.ok(checked >= 3000, `Only ${checked} independent arithmetic checks`);
}));

// A small independent polynomial parser checks the *displayed* expressions.
function polynomial(text) {
  const source = text.replaceAll("−", "-").replaceAll("²", "^2").replaceAll("³", "^3").replaceAll("⁴", "^4").replace(/[{}\s]/g, "");
  const tokens = source.match(/\d+|[XAIP()+*^-]/g) ?? [];
  assert.equal(tokens.join(""), source, `Unsupported polynomial: ${text}`);
  let position = 0;
  const add = (a, b, sign = 1) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] ?? 0) + sign * (b[i] ?? 0));
  const mult = (a, b) => { const result = Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { result[i + j] += x * y; })); return result; };
  const atom = () => {
    const token = tokens[position++];
    if (token === "(") { const p = sum(); assert.equal(tokens[position++], ")"); return p; }
    if (token === "X" || token === "A") return [0, 1];
    if (token === "I") return [1];
    assert.match(token ?? "", /^\d+$/); return [Number(token)];
  };
  const unary = () => { if (tokens[position] === "-") { position++; return unary().map(x => -x); } if (tokens[position] === "+") { position++; return unary(); } let a = atom(); if (tokens[position] === "^") { position++; const n = Number(tokens[position++]); const base = a; a = [1]; for (let i = 0; i < n; i++) a = mult(a, base); } return a; };
  const product = () => { let a = unary(); while (tokens[position] === "*" || /^[\dXAI(]/.test(tokens[position] ?? "")) { if (tokens[position] === "*") position++; a = mult(a, unary()); } return a; };
  const sum = () => { let a = product(); while (["+", "-"].includes(tokens[position])) { const sign = tokens[position++] === "+" ? 1 : -1; a = add(a, product(), sign); } return a; };
  const result = sum(); assert.equal(position, tokens.length); return result;
}
function companion(coefficients) {
  const n = coefficients.length - 1, a = identity(n).map(row => row.map(() => 0));
  for (let i = 1; i < n; i++) a[i][i - 1] = 1;
  for (let i = 0; i < n; i++) a[i][n - 1] = -coefficients[i];
  return a;
}

test("characteristic-polynomial choices match det(XI-A), not just a stored answer flag", () => seeded(() => {
  const family = WORKSHOP_EXERCISE_FAMILIES.find(f => f.workshopId === "characteristic-tracer");
  for (const id of ["compute-two", "compute-three"]) for (let i = 0; i < 250; i++) {
    const q = family.generateTask(id), a = parseMatrix(q.formula);
    const matches = q.choices.filter(c => {
      const p = polynomial(c.text);
      return [-3, -1, 0, 1, 2, 5].every(x => Math.abs(p.reduce((s, coefficient, k) => s + coefficient * x ** k, 0) - determinant(a.map((row, r) => row.map((v, col) => (r === col ? x : 0) - v)))) < 1e-8);
    });
    assert.equal(matches.length, 1, q.id); assert.ok(matches[0].correct);
  }
}));

test("Cayley-Hamilton expressions really hold for companion matrices and scalar repeated-root cases", () => seeded(() => {
  const family = WORKSHOP_EXERCISE_FAMILIES.find(f => f.workshopId === "cayley-hamilton-forge");
  for (const id of ["quadratic", "cubic", "inverse", "reduce-fourth"]) for (let i = 0; i < 200; i++) {
    const q = family.generateTask(id), p = polynomial(q.formula.split(" = ")[1]);
    const examples = [companion(p)];
    if (p.length === 3 && p[1] ** 2 === 4 * p[0]) examples.push(identity(2).map(row => row.map(v => v * (-p[1] / 2))));
    for (const a of examples) {
      const target = id === "quadratic" ? pow(a, 2) : id === "cubic" ? pow(a, 3) : id === "reduce-fourth" ? pow(a, 4) : identity(a.length);
      const matches = q.choices.filter(c => { const result = evaluateMatrix(a, polynomial(c.text.split(" = ").at(-1))); return equal(id === "inverse" ? multiply(a, result) : result, target); });
      assert.equal(matches.length, 1, JSON.stringify(q)); assert.ok(matches[0].correct);
    }
  }
}));

test("fixed course reminders respect the saved cooldown but stay manually selectable", () => seeded(() => {
  const family = WORKSHOP_EXERCISE_FAMILIES.find(f => f.workshopId === "adjoint-chamber");
  const q = family.generateTask("definition");
  assert.ok(q.recallKey);
  let history = recordQuestionShown(emptyPracticeHistory(), q);
  history = recordQuestionAnswer(history, q, true);
  for (let i = 0; i < 100; i++) assert.notEqual(family.generate(3, history).taskKind, "definition");
  assert.equal(family.generateTask("definition").taskKind, "definition");
}));
