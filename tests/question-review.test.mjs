import assert from "node:assert/strict";
import test from "node:test";
import { EXERCISE_FAMILIES } from "../app/question-generator.ts";
import {
  emptyPracticeHistory, recallWeight, recordQuestionShown,
  recordQuestionAnswer, restorePracticeHistory,
} from "../app/question-review.ts";

const concept = { recallKey: "positive-definite-criterion-2" };
function advance(history, count) {
  for (let i = 0; i < count; i++) history = recordQuestionShown(history, {});
  return history;
}

test("correct conceptual answers are spaced further after successive successes", () => {
  let history = recordQuestionShown(emptyPracticeHistory(), concept);
  history = recordQuestionAnswer(history, concept, true);
  assert.equal(recallWeight(concept.recallKey, advance(history, 29)), 0);
  history = advance(history, 30);
  assert.equal(recallWeight(concept.recallKey, history), 0.06);
  history = recordQuestionAnswer(recordQuestionShown(history, concept), concept, true);
  assert.equal(recallWeight(concept.recallKey, advance(history, 59)), 0);
  assert.equal(recallWeight(concept.recallKey, advance(history, 60)), 0.06);
  assert.deepEqual(restorePracticeHistory(JSON.parse(JSON.stringify(history))), history);
});

test("incorrect conceptual answers return sooner without immediate repetition", () => {
  let history = recordQuestionShown(emptyPracticeHistory(), concept);
  history = recordQuestionAnswer(history, concept, false);
  assert.equal(recallWeight(concept.recallKey, advance(history, 7)), 0);
  assert.equal(recallWeight(concept.recallKey, advance(history, 8)), 0.35);
  assert.equal(recallWeight(concept.recallKey, emptyPracticeHistory()), 0.2);
});

test("positivity avoids the frozen criterion during its review cooldown", () => {
  const family = EXERCISE_FAMILIES.find((family) => family.id === "matrix-positivity");
  const history = recordQuestionAnswer(recordQuestionShown(emptyPracticeHistory(), concept), concept, true);
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const question = family.generate(3, history);
    assert.notEqual(question.recallKey, concept.recallKey);
    seen.add(question.taskKind);
  }
  assert.ok(seen.has("core"));
  assert.ok(seen.has("task-2"));
});

test("static positivity questions remain available but are a minority", () => {
  const family = EXERCISE_FAMILIES.find((family) => family.id === "matrix-positivity");
  let recalled = 0;
  for (let i = 0; i < 4000; i++) {
    if (family.generate(3).recallKey === concept.recallKey) recalled++;
  }
  assert.ok(recalled > 100 && recalled < 650, `criterion appeared ${recalled}/4000 times`);
});

test("invalid saved review state is safely normalized", () => {
  assert.deepEqual(restorePracticeHistory(null), emptyPracticeHistory());
  const restored = restorePracticeHistory({ shown: 10, recall: { example: { lastSeen: 200, successes: -1, lastResult: "other" } } });
  assert.deepEqual(restored.recall.example, { lastSeen: 10, successes: 0, lastResult: undefined });
});
