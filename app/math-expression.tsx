import type { CSSProperties, ReactNode } from "react";

type MathExpressionProps = {
  text: string;
  className?: string;
};

const STRUCTURED_MATH_PATTERN = /⟦([^⟧]+)⟧|⟪([^⟫]+)⟫/g;

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
      className="math-matrix"
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
      parts.push(text.slice(previousEnd, start));
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
    parts.push(text.slice(previousEnd));
  }

  return (
    <span className={`math-expression ${className}`.trim()}>
      {parts}
    </span>
  );
}
