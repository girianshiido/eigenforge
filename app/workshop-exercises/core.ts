export type Matrix = number[][];
export type Audit = { kind: string; inputs: unknown[]; expected: number | number[] | Matrix };
export type Draft = {
  prompt: string; formula: string; answer: string; wrong: string[];
  explanation: string; audit?: Audit;
};
export type Task = { id: string; label: string; generate: () => Draft; recall?: boolean };
export type WorkshopTasks = Record<string, Task[]>;

// Apply the same notation rules to statements, choices and explanations.
export function notation(text: string): string {
  return text
    .replace(/_can\b/g, "_{can}")
    .replace(/\^\(([^()]*)\)/g, "^{$1}")
    .replace(/\+\s*\((-[1-9]\d*)\)([A-Za-z])/g, (_m, n: string, v: string) => `− ${Math.abs(Number(n)) === 1 ? "" : Math.abs(Number(n))}${v}`)
    .replace(/(^|[^\dA-Za-z_])1(?=[A-Za-z](?:\b|[₁₂₃₄²³^]))/g, "$1")
    .replace(/(^|[=;\s−-])1(?=\()/g, "$1")
    .replace(/\+\s*[−-]/g, "− ")
    .replace(/\s{2,}/g, " ");
}

export const int = (a = -4, b = 4) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = <T,>(items: readonly T[]): T => items[int(0, items.length - 1)];
export const nz = () => pick([-4, -3, -2, -1, 1, 2, 3, 4]);
export const distinct = () => { const a = nz(); let b = nz(); while (a === b) b = nz(); return [a, b]; };
export const task = (id: string, label: string, generate: () => Draft, recall = false): Task => ({ id, label, generate, recall });
export const V = (v: readonly (number | string)[]) => `(${v.join(" ; ")})`;
export const C = (v: readonly (number | string)[]) => `⟪${v.join(",")}⟫`;
export const M = (a: readonly (readonly (number | string)[])[]) => `⟦${a.map(r => r.join(",")).join(";")}⟧`;
export const R = (n: number) => `ℝ^{${n}}`;
export const frac = (a: number, b: number): string => {
  if (b === 0) throw new Error("Dénominateur nul");
  if (b < 0) { a = -a; b = -b; }
  const gcd = (x: number, y: number): number => y ? gcd(y, x % y) : x;
  const g = gcd(Math.abs(a), b); a /= g; b /= g;
  return b === 1 ? String(a) : `⟬${a}¦${b}⟭`;
};
export const lin = (coefficients: number[], symbols = ["x", "y", "z", "t"]) => coefficients.map((a, i) => {
  if (!a) return "";
  return `${a < 0 ? " − " : " + "}${Math.abs(a) === 1 ? "" : Math.abs(a)}${symbols[i]}`;
}).filter(Boolean).join("").replace(/^ \+ /, "").replace(/^ − /, "−") || "0";
// Constants have no variable: retain their coefficient even when it is ±1.
export const polynomial = (coefficients: number[], symbol = "X") => {
  const terms = coefficients.map((c, i) => ({ c, i })).filter(t => t.c !== 0).reverse();
  if (!terms.length) return "0";
  return terms.map(({ c, i }, k) => `${k ? (c < 0 ? " − " : " + ") : c < 0 ? "−" : ""}${i === 0 || Math.abs(c) !== 1 ? Math.abs(c) : ""}${i === 0 ? "" : i === 1 ? symbol : `${symbol}^{${i}}`}`).join("");
};
export const root = (a: number) => a === 0 ? "X" : `(X ${a < 0 ? "+" : "−"} ${Math.abs(a)})`;
export const shifted = (a: number, symbol = "A") => a === 0 ? symbol : `${symbol} ${a < 0 ? "+" : "−"} ${Math.abs(a) === 1 ? "" : Math.abs(a)}I`;
export const vec = (n = 2) => Array.from({ length: n }, () => int());
export const dot = (u: number[], v: number[]) => u.reduce((s, x, i) => s + x * v[i], 0);
export const add = (u: number[], v: number[]) => u.map((x, i) => x + v[i]);
export const scale = (a: number, v: number[]) => v.map(x => a * x);
export const eye = (n: number) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
export const diag = (d: number[]) => d.map((a, i) => d.map((_, j) => i === j ? a : 0));
export const transpose = (a: Matrix) => a[0].map((_, j) => a.map(row => row[j]));
export const mul = (a: Matrix, b: Matrix) => a.map(row => b[0].map((_, j) => dot(row, b.map(r => r[j]))));
export const mv = (a: Matrix, v: number[]) => a.map(row => dot(row, v));
export const plus = (a: Matrix, b: Matrix) => a.map((row, i) => add(row, b[i]));
export const times = (k: number, a: Matrix) => a.map(row => scale(k, row));
export const power = (a: Matrix, k: number) => { let r = eye(a.length); while (k-- > 0) r = mul(r, a); return r; };
export const det = (a: Matrix): number => a.length === 1 ? a[0][0] : a[0].reduce((s, x, j) => s + (-1) ** j * x * det(a.slice(1).map(row => row.filter((_, k) => k !== j))), 0);
export const trace = (a: Matrix) => a.reduce((s, row, i) => s + row[i], 0);
export const randomMatrix = (m = 2, n = m): Matrix => Array.from({ length: m }, () => vec(n));
export const shear = (k = nz()): Matrix => [[1, k], [0, 1]];
export const jordan = (n: number, a = 0, c = nz()): Matrix => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? a : j === i + 1 ? c : 0));
export const blockDiag = (a: Matrix, b: Matrix): Matrix => [...a.map(row => [...row, ...b[0].map(() => 0)]), ...b.map(row => [...a[0].map(() => 0), ...row])];

export function choice(prompt: string, formula: string, answer: string, wrong: string[], explanation: string): Draft {
  const unique = [...new Set(wrong)].filter(s => s !== answer);
  if (unique.length < 3) throw new Error(`Distracteurs insuffisants : ${prompt} (${answer})`);
  return { prompt, formula, answer, wrong: unique.slice(0, 3), explanation };
}
export function number(prompt: string, formula: string, answer: number, explanation: string, audit?: Audit): Draft {
  return { ...choice(prompt, formula, String(answer), [answer + 1, answer - 1, answer + 2].map(String), explanation), audit };
}
export function vector(prompt: string, formula: string, answer: number[], explanation: string, column = false, audit?: Audit): Draft {
  const format = column ? C : V;
  const alternatives = [answer.map((x, i) => x + +(i === 0)), answer.map((x, i) => x + +(i === answer.length - 1)), answer.map(x => x - 1)];
  return { ...choice(prompt, formula, format(answer), alternatives.map(format), explanation), audit };
}
export function matrix(prompt: string, formula: string, answer: Matrix, explanation: string, audit?: Audit): Draft {
  const alternatives = [answer.map((r, i) => r.map((x, j) => x + +(i === 0 && j === 0))), answer.map((r, i) => r.map((x, j) => x - +(i === answer.length - 1 && j === r.length - 1))), answer.map(r => r.map(x => x + 1))];
  return { ...choice(prompt, formula, M(answer), alternatives.map(M), explanation), audit };
}
export const yesno = (prompt: string, formula: string, yes: boolean, explanation: string) => choice(prompt, formula, yes ? "Oui." : "Non.", [yes ? "Non." : "Oui.", "Les données ne permettent pas de conclure.", "La question n’a pas de sens avec ces dimensions."], explanation);
export const dimension = (prompt: string, formula: string, n: number, why: string) => number(prompt, formula, n, why);
export const computedMatrix = (prompt: string, formula: string, kind: string, inputs: unknown[], result: Matrix, why: string) => matrix(prompt, formula, result, `${why} Le résultat est ${M(result)}.`, { kind, inputs, expected: result });
export const computedVector = (prompt: string, formula: string, kind: string, inputs: unknown[], result: number[], why: string, column = true) => vector(prompt, formula, result, `${why} On obtient ${column ? C(result) : V(result)}.`, column, { kind, inputs, expected: result });
