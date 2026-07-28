import type { CSSProperties, ReactNode } from "react";

type MathExpressionProps = {
  text: string;
  className?: string;
};

const STRUCTURED_MATH_PATTERN = /⟦([^⟧]+)⟧|⟪([^⟫]+)⟫/g;
const INLINE_SCRIPT_PATTERN =
  /_(\{[^}]+\}|[−-]?\d+|[A-Za-zλμ])|([₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]+)|([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ᵀ]+)/g;
const ATOMIC_MATH_PATTERN =
  /[A-Zℬ]\s*=\s*\((?:[^()]|\([^()]*\))*\)|N_(?:\{[^}]+\}|[−-]?\d+|[A-Za-zλμ])\s*=\s*Ker\((?:[^()]|\([^()]*\))*\)|(?:Vect|Ker|Im|det|dim|Sp)\((?:[^()]|\([^()]*\))*\)|[χπ]_(?:\{[^}]+\}|[−-]?\d+|[A-Za-zλμ])(?:\([^)]*\))?|N_(?:\{[^}]+\}|[−-]?\d+|[A-Za-zλμ])/g;
const SUBSCRIPT_CHARACTERS: Record<string, string> = {
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
  "₊": "+",
  "₋": "−",
  "₌": "=",
  "₍": "(",
  "₎": ")",
};
const SUPERSCRIPT_CHARACTERS: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁺": "+",
  "⁻": "−",
  "⁼": "=",
  "⁽": "(",
  "⁾": ")",
  "ᵀ": "T",
};

function normalizeScript(
  source: string,
  characters: Record<string, string>,
) {
  return Array.from(source, (character) => characters[character] ?? character).join(
    "",
  );
}

function ScriptedText({ source }: { source: string }) {
  const parts: ReactNode[] = [];
  let previousEnd = 0;

  for (const match of source.matchAll(INLINE_SCRIPT_PATTERN)) {
    const start = match.index ?? 0;
    if (start > previousEnd) {
      parts.push(source.slice(previousEnd, start));
    }

    if (match[3] !== undefined) {
      const superscript = normalizeScript(
        match[3],
        SUPERSCRIPT_CHARACTERS,
      );
      parts.push(
        <sup
          className="math-superscript"
          key={`superscript-${start}-${superscript}`}
        >
          {superscript}
        </sup>,
      );
    } else {
      const rawSubscript = (match[1] ?? match[2]).replace(/^\{|\}$/g, "");
      const subscript =
        match[2] === undefined
          ? rawSubscript.replace("-", "−")
          : normalizeScript(rawSubscript, SUBSCRIPT_CHARACTERS);
      parts.push(
        <sub
          className="math-subscript"
          key={`subscript-${start}-${subscript}`}
        >
          {subscript}
        </sub>,
      );
    }
    previousEnd = start + match[0].length;
  }

  if (previousEnd < source.length) {
    parts.push(source.slice(previousEnd));
  }

  return <>{parts}</>;
}

function PlainMath({ source }: { source: string }) {
  const parts: ReactNode[] = [];
  let previousEnd = 0;

  for (const match of source.matchAll(ATOMIC_MATH_PATTERN)) {
    const start = match.index ?? 0;
    if (start > previousEnd) {
      parts.push(
        <ScriptedText
          source={source.slice(previousEnd, start)}
          key={`text-${previousEnd}-${start}`}
        />,
      );
    }
    parts.push(
      <span
        className="math-atomic"
        key={`atomic-${start}-${match[0]}`}
      >
        <ScriptedText source={match[0]} />
      </span>,
    );
    previousEnd = start + match[0].length;
  }

  if (previousEnd < source.length) {
    parts.push(
      <ScriptedText
        source={source.slice(previousEnd)}
        key={`text-${previousEnd}-${source.length}`}
      />,
    );
  }

  return <>{parts}</>;
}

function Matrix({ source }: { source: string }) {
  const rows = source
    .split(";")
    .map((row) => row.split(",").map((cell) => cell.trim()));
  const columnCount = Math.max(...rows.map((row) => row.length));
  const spokenRows = rows
    .map((row, index) => `ligne ${index + 1} : ${row.join(", ")}`)
    .join(" ; ");

  return (
    <span
      className={`math-matrix order-${Math.max(rows.length, columnCount)}`}
      role="img"
      aria-label={`Matrice, ${spokenRows}`}
    >
      <span
        className="math-matrix-grid"
        style={{ "--matrix-columns": columnCount } as CSSProperties}
        aria-hidden="true"
      >
        {rows.flatMap((row, rowIndex) =>
          Array.from({ length: columnCount }, (_, columnIndex) => (
            <span key={`${rowIndex}-${columnIndex}`}>
              {row[columnIndex] ?? ""}
            </span>
          )),
        )}
      </span>
    </span>
  );
}

function ColumnVector({ source }: { source: string }) {
  const coordinates = source.split(",").map((coordinate) => coordinate.trim());

  return (
    <span
      className="math-column-vector"
      role="img"
      aria-label={`Vecteur colonne : ${coordinates.join(", ")}`}
    >
      <span className="math-column-vector-grid" aria-hidden="true">
        {coordinates.map((coordinate, index) => (
          <span key={`${index}-${coordinate}`}>
            <ScriptedText source={coordinate} />
          </span>
        ))}
      </span>
    </span>
  );
}

export default function MathExpression({
  text,
  className = "",
}: MathExpressionProps) {
  const parts: ReactNode[] = [];
  let previousEnd = 0;

  for (const match of text.matchAll(STRUCTURED_MATH_PATTERN)) {
    const start = match.index ?? 0;
    if (start > previousEnd) {
      parts.push(
        <PlainMath
          source={text.slice(previousEnd, start)}
          key={`plain-${previousEnd}-${start}`}
        />,
      );
    }
    parts.push(
      match[1] !== undefined ? (
        <Matrix source={match[1]} key={`matrix-${start}-${match[1]}`} />
      ) : (
        <ColumnVector
          source={match[2]}
          key={`column-${start}-${match[2]}`}
        />
      ),
    );
    previousEnd = start + match[0].length;
  }

  if (previousEnd < text.length) {
    parts.push(
      <PlainMath
        source={text.slice(previousEnd)}
        key={`plain-${previousEnd}-${text.length}`}
      />,
    );
  }

  return (
    <span className={`math-expression ${className}`.trim()}>
      {parts}
    </span>
  );
}
