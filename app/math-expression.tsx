import type { CSSProperties, ReactNode } from "react";

type MathExpressionProps = {
  text: string;
  className?: string;
};

const STRUCTURED_MATH_PATTERN = /⟦([^⟧]+)⟧|⟪([^⟫]+)⟫/g;
const SUBSCRIPT_PATTERN = /_(\{[^}]+\}|[−-]?\d+|[A-Za-zλμ])/g;

function PlainMath({ source }: { source: string }) {
  const parts: ReactNode[] = [];
  let previousEnd = 0;

  for (const match of source.matchAll(SUBSCRIPT_PATTERN)) {
    const start = match.index ?? 0;
    if (start > previousEnd) {
      parts.push(source.slice(previousEnd, start));
    }

    const rawSubscript = match[1].replace(/^\{|\}$/g, "");
    const subscript = rawSubscript.replace("-", "−");
    parts.push(
      <sub
        className="math-subscript"
        key={`subscript-${start}-${subscript}`}
      >
        {subscript}
      </sub>,
    );
    previousEnd = start + match[0].length;
  }

  if (previousEnd < source.length) {
    parts.push(source.slice(previousEnd));
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
          <span key={`${index}-${coordinate}`}>{coordinate}</span>
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
