import type { CSSProperties, ReactNode } from "react";

type MathExpressionProps = {
  text: string;
  className?: string;
};

const STRUCTURED_MATH_PATTERN =
  /⟦([^⟧]+)⟧|⟪([^⟫]+)⟫|⟬([^¦⟭]+)¦([^⟭]+)⟭/g;
const SQUARE_ROOT_PATTERN =
  /√(\{[^}]+\}|\([^)]*\)|[A-Za-z0-9]+(?:_(?:\{[^}]+\}|[−-]?\d+|[A-Za-zλμ]))?)/g;
const INLINE_SCRIPT_PATTERN =
  /_(\{[^}]+\}|[−-]?\d+|[A-Za-zλμ])|([₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]+)|([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ᵀ]+)/g;
const ATOMIC_MATH_PATTERN =
  /(?:[A-Zℬ]\s*=\s*\((?:[^()]|\([^()]*\))*\)|N_(?:\{[^}]+\}|[−-]?\d+|[A-Za-zλμ])\s*=\s*Ker\((?:[^()]|\([^()]*\))*\)|(?:Vect|Ker|Im|det|dim|Sp)\((?:[^()]|\([^()]*\))*\)|[χπ]_(?:\{[^}]+\}|[−-]?\d+|[A-Za-zλμ])(?:\([^)]*\))?|N_(?:\{[^}]+\}|[−-]?\d+|[A-Za-zλμ]))(?:\s*[?!.:,;])?/g;
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

function SquareRoot({ radicand }: { radicand: string }) {
  const normalizedRadicand = radicand.replace(/^\{|\}$|^\(|\)$/g, "");

  return (
    <span
      className="math-square-root"
      role="img"
      aria-label={`Racine carrée de ${normalizedRadicand}`}
    >
      <span className="math-radical-symbol" aria-hidden="true">
        √
      </span>
      <span className="math-radicand" aria-hidden="true">
        <ScriptedText source={normalizedRadicand} />
      </span>
    </span>
  );
}

function RootedText({ source }: { source: string }) {
  const parts: ReactNode[] = [];
  let previousEnd = 0;

  for (const match of source.matchAll(SQUARE_ROOT_PATTERN)) {
    const start = match.index ?? 0;
    if (start > previousEnd) {
      parts.push(
        <ScriptedText
          source={source.slice(previousEnd, start)}
          key={`root-text-${previousEnd}-${start}`}
        />,
      );
    }
    parts.push(
      <SquareRoot
        radicand={match[1]}
        key={`square-root-${start}-${match[1]}`}
      />,
    );
    previousEnd = start + match[0].length;
  }

  if (previousEnd < source.length) {
    parts.push(
      <ScriptedText
        source={source.slice(previousEnd)}
        key={`root-text-${previousEnd}-${source.length}`}
      />,
    );
  }

  return <>{parts}</>;
}

function Fraction({
  numerator,
  denominator,
}: {
  numerator: string;
  denominator: string;
}) {
  return (
    <span
      className="math-fraction"
      role="img"
      aria-label={`${numerator} sur ${denominator.replace("√", "racine carrée de ")}`}
    >
      <span className="math-fraction-numerator" aria-hidden="true">
        <RootedText source={numerator} />
      </span>
      <span className="math-fraction-denominator" aria-hidden="true">
        <RootedText source={denominator} />
      </span>
    </span>
  );
}

function PlainMath({ source }: { source: string }) {
  const parts: ReactNode[] = [];
  let previousEnd = 0;

  for (const match of source.matchAll(ATOMIC_MATH_PATTERN)) {
    const start = match.index ?? 0;
    if (start > previousEnd) {
      parts.push(
        <RootedText
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
        <RootedText source={match[0]} />
      </span>,
    );
    previousEnd = start + match[0].length;
  }

  if (previousEnd < source.length) {
    parts.push(
      <RootedText
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

function MathLine({ text }: { text: string }) {
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
      ) : match[2] !== undefined ? (
        <ColumnVector
          source={match[2]}
          key={`column-${start}-${match[2]}`}
        />
      ) : (
        <Fraction
          numerator={match[3]}
          denominator={match[4]}
          key={`fraction-${start}-${match[3]}-${match[4]}`}
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

  return <>{parts}</>;
}

export default function MathExpression({
  text,
  className = "",
}: MathExpressionProps) {
  const lines = text.split("\n");

  return (
    <span
      className={`math-expression ${lines.length > 1 ? "has-lines" : ""} ${className}`.trim()}
    >
      {lines.map((line, index) =>
        lines.length > 1 ? (
          <span className="math-expression-line" key={`${index}-${line}`}>
            <MathLine text={line} />
          </span>
        ) : (
          <MathLine text={line} key={`${index}-${line}`} />
        ),
      )}
    </span>
  );
}
