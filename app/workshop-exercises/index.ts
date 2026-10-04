import { INSTRUMENTS } from "../game-balance.ts";
import { recallWeight, type PracticeHistory } from "../question-review.ts";
import type { ExerciseFamily, Question, Sector } from "../question-generator.ts";
import { foundations } from "./foundations.ts";
import { maps } from "./maps.ts";
import { matrices } from "./matrices.ts";
import { reduction } from "./reduction.ts";
import { euclidean } from "./euclidean.ts";
import { notation, type Task, type WorkshopTasks } from "./core.ts";

export const WORKSHOP_TASKS: WorkshopTasks = { ...foundations, ...maps, ...matrices, ...reduction, ...euclidean };
export const WORKSHOP_TASK_COUNT = Object.values(WORKSHOP_TASKS).reduce((total, tasks) => total + tasks.length, 0);

function sectorFor(index: number): Sector {
  if (index < 4 || (index >= 8 && index < 12) || index === 40) return "vectors";
  if (index < 8 || index === 41 || index === 42) return "bases";
  if ((index >= 12 && index < 24) || index === 43 || (index >= 44 && index < 47)) return "applications";
  return "matrices";
}

function shuffled<T>(items: readonly T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function selectTask(workshopId: string, tasks: Task[], history?: PracticeHistory) {
  const weights: number[] = tasks.map(task => task.recall ? recallWeight(`workshop:${workshopId}:${task.id}`, history) : 1);
  let value = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < tasks.length; i++) {
    value -= weights[i];
    if (value < 0) return tasks[i];
  }
  return tasks[weights.findLastIndex(weight => weight > 0)];
}

export const WORKSHOP_EXERCISE_FAMILIES: readonly ExerciseFamily[] = INSTRUMENTS.map((workshop, index) => {
  const tasks = WORKSHOP_TASKS[workshop.id];
  if (!tasks || tasks.length < 5) throw new Error(`Atelier incomplet : ${workshop.id}`);
  const sector = sectorFor(index);
  function generateTask(taskId: string): Question {
    const task = tasks.find(task => task.id === taskId);
    if (!task) throw new Error(`Tâche inconnue : ${workshop.id}/${taskId}`);
    const draft = task.generate();
    return {
      id: `${workshop.id}/${task.id}/${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      workshopId: workshop.id,
      taskKind: task.id,
      recallKey: task.recall ? `workshop:${workshop.id}:${task.id}` : undefined,
      sector,
      eyebrow: `${workshop.program} · ${workshop.sector} · ${task.label}`,
      prompt: notation(draft.prompt),
      formula: notation(draft.formula),
      choices: shuffled([{ text: notation(draft.answer), correct: true }, ...draft.wrong.map(text => ({ text: notation(text), correct: false }))]),
      explanation: notation(draft.explanation),
      geometry: "",
      trap: "",
      audit: draft.audit,
    };
  }
  return {
    id: `workshop-${workshop.id}`,
    workshopId: workshop.id,
    cycleId: workshop.cycleId,
    sector,
    program: workshop.program,
    minInstrument: index,
    label: workshop.name,
    description: `${workshop.sector} · ${tasks.length} types de questions : ${tasks.map(task => task.label.toLocaleLowerCase("fr")).join(" ; ")}.`,
    tasks: tasks.map(({ id, label }) => ({ id, label })),
    generateTask,
    generate: (_dimension: number, history?: PracticeHistory) => generateTask(selectTask(workshop.id, tasks, history).id),
  };
});
