type RecallProgress = {
  lastSeen: number;
  successes: number;
  lastResult?: "correct" | "incorrect";
};

export type PracticeHistory = {
  shown: number;
  recall: Record<string, RecallProgress>;
};

type ReviewQuestion = { recallKey?: string };

export function emptyPracticeHistory(): PracticeHistory {
  return { shown: 0, recall: {} };
}

export function restorePracticeHistory(value: unknown): PracticeHistory {
  if (!value || typeof value !== "object") return emptyPracticeHistory();
  const saved = value as Partial<PracticeHistory>;
  const shown = Math.max(0, Math.floor(Number(saved.shown) || 0));
  const recall: Record<string, RecallProgress> = {};
  if (saved.recall && typeof saved.recall === "object") {
    for (const [key, progress] of Object.entries(saved.recall)) {
      if (!progress || typeof progress !== "object") continue;
      recall[key] = {
        lastSeen: Math.min(shown, Math.max(0, Math.floor(Number(progress.lastSeen) || 0))),
        successes: Math.min(6, Math.max(0, Math.floor(Number(progress.successes) || 0))),
        lastResult: progress.lastResult === "correct" || progress.lastResult === "incorrect"
          ? progress.lastResult : undefined,
      };
    }
  }
  return { shown, recall };
}

export function recallWeight(key: string, history?: PracticeHistory) {
  const progress = history?.recall[key];
  if (!progress) return 0.2;
  const spacing = progress.lastResult === "correct"
    ? Math.min(160, 30 * 2 ** Math.max(0, progress.successes - 1)) : 8;
  if ((history?.shown ?? 0) - progress.lastSeen < spacing) return 0;
  return progress.lastResult === "correct" ? 0.06
    : progress.lastResult === "incorrect" ? 0.35 : 0.15;
}

export function recordQuestionShown(history: PracticeHistory, question: ReviewQuestion): PracticeHistory {
  const shown = history.shown + 1;
  if (!question.recallKey) return { ...history, shown };
  const previous = history.recall[question.recallKey];
  return {
    shown,
    recall: {
      ...history.recall,
      [question.recallKey]: { ...previous, successes: previous?.successes ?? 0, lastSeen: shown },
    },
  };
}

export function recordQuestionAnswer(history: PracticeHistory, question: ReviewQuestion, correct: boolean): PracticeHistory {
  if (!question.recallKey) return history;
  const previous = history.recall[question.recallKey];
  return {
    ...history,
    recall: {
      ...history.recall,
      [question.recallKey]: {
        lastSeen: previous?.lastSeen ?? history.shown,
        successes: correct ? Math.min(6, (previous?.successes ?? 0) + 1) : 0,
        lastResult: correct ? "correct" : "incorrect",
      },
    },
  };
}
