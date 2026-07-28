import type { CSSProperties, ReactNode } from "react";

type MathExpressionProps = {
  text: string;
  className?: string;
};

const MATRIX_PATTERN = /⟦([^⟧]+)⟧/g;

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

export default function MathExpression({
  text,
  className = "",
}: MathExpressionProps) {
  const parts: ReactNode[] = [];
  let previousEnd = 0;

  for (const match of text.matchAll(MATRIX_PATTERN)) {
    const start = match.index ?? 0;
    if (start > previousEnd) {
      parts.push(text.slice(previousEnd, start));
    }
    parts.push(<Matrix source={match[1]} key={`${start}-${match[1]}`} />);
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
