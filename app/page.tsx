"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  INSTRUMENT_MILESTONES,
  INSTRUMENTS,
  INVARIANT_PROTOCOLS,
  basePassiveProduction,
  correctAnomalyRewardMultiplier,
  inheritedStructuralWorkshops,
  instrumentCost,
  invariantGain,
  invariantProtocolCost,
  matrixWorkshopCostMultiplier,
  milestoneMultiplier,
  nextInvariantThreshold,
  protocolAnomalyMultiplier,
  protocolManualMultiplier,
  protocolPassiveMultiplier,
  protocolResonanceMultiplier,
  protocolWorkshopCostMultiplier,
  resonanceDecayRate,
} from "./game-balance";
import { generateQuestion as generateExercise } from "./question-generator";
import MathExpression from "./math-expression";

type Sector = "vectors" | "bases" | "applications" | "matrices";
type GameTab = "network" | "instruments" | "anomalies" | "atlas";

type GameState = {
  coordinates: number;
  runTotal: number;
  allTime: number;
  instruments: number[];
  mastery: Record<Sector, number>;
  correctAnswers: number;
  anomalies: number;
  nextAnomalyAt: number;
  resonance: number;
  invariants: number;
  totalInvariants: number;
  protocols: number[];
  lastTick: number;
};

type Question = {
  id: string;
  sector: Sector;
  eyebrow: string;
  prompt: string;
  formula: string;
  choices: Array<{ text: string; correct: boolean }>;
  explanation: string;
  geometry: string;
  trap: string;
};

type AnswerState = {
  choice: number;
  correct: boolean;
  reward: number;
};

const SAVE_KEY = "reseau-des-espaces-v1";

const INITIAL_STATE: GameState = {
  coordinates: 0,
  runTotal: 0,
  allTime: 0,
  instruments: INSTRUMENTS.map(() => 0),
  mastery: { vectors: 0, bases: 0, applications: 0, matrices: 0 },
  correctAnswers: 0,
  anomalies: 0,
  nextAnomalyAt: 0,
  resonance: 0,
  invariants: 0,
  totalInvariants: 0,
  protocols: INVARIANT_PROTOCOLS.map(() => 0),
  lastTick: 0,
};

const SECTOR_LABELS: Record<Sector, string> = {
  vectors: "Vecteurs",
  bases: "Bases",
  applications: "Applications",
  matrices: "Matrices",
};

const GAME_TABS: Array<{
  id: GameTab;
  label: string;
  shortLabel: string;
  mark: string;
}> = [
  { id: "network", label: "Réseau", shortLabel: "Réseau", mark: "⌁" },
  { id: "instruments", label: "Instruments", shortLabel: "Ateliers", mark: "◫" },
  { id: "anomalies", label: "Anomalies", shortLabel: "Anomalies", mark: "◉" },
  { id: "atlas", label: "Atlas", shortLabel: "Atlas", mark: "✦" },
];

const WORKSHOP_CHAPTERS = Array.from(
  new Set(INSTRUMENTS.map((instrument) => instrument.chapter)),
);

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nonZero() {
  const values = [-3, -2, -1, 1, 2, 3];
  return values[randomInt(0, values.length - 1)];
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = randomInt(0, index);
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function vector(x: number, y: number) {
  return `(${x} ; ${y})`;
}

function formatLinearExpression(terms: Array<[number, string]>) {
  const visibleTerms = terms.filter(([coefficient]) => coefficient !== 0);
  if (visibleTerms.length === 0) return "0";

  return visibleTerms
    .map(([coefficient, variable], index) => {
      const absoluteValue = Math.abs(coefficient);
      const magnitude = absoluteValue === 1 ? "" : `${absoluteValue}`;
      const sign =
        index === 0
          ? coefficient < 0
            ? "−"
            : ""
          : coefficient < 0
            ? " − "
            : " + ";
      return `${sign}${magnitude}${variable}`;
    })
    .join("");
}

function arithmeticSum(first: number, second: number) {
  return `${first} ${second < 0 ? "−" : "+"} ${Math.abs(second)}`;
}

function factor(value: number) {
  return value < 0 ? `(${value})` : `${value}`;
}

function choices(correct: string, distractors: string[]) {
  const unique = Array.from(new Set([correct, ...distractors]));
  let offset = 1;
  while (unique.length < 4) {
    const numeric = Number(correct);
    const vectorMatch = correct.match(/^\((-?\d+) ; (-?\d+)\)$/);
    const fallback = Number.isFinite(numeric)
      ? `${numeric + offset}`
      : vectorMatch
        ? vector(Number(vectorMatch[1]) + offset, Number(vectorMatch[2]) - offset)
        : `Aucune des trois autres propositions (${offset})`;
    if (!unique.includes(fallback)) unique.push(fallback);
    offset += 1;
  }
  return shuffle(
    unique.slice(0, 4).map((text) => ({ text, correct: text === correct })),
  );
}

function vectorQuestion(): Question {
  const template = randomInt(0, 2);

  if (template === 0) {
    const a = nonZero();
    const b = nonZero();
    const c = nonZero();
    const d = nonZero();
    const answer = vector(a + c, b + d);
    return {
      id: `V-SOM-${Date.now()}`,
      sector: "vectors",
      eyebrow: "Combinaison linéaire",
      prompt: "Quelles sont les coordonnées de u + v ?",
      formula: `u = ${vector(a, b)}   et   v = ${vector(c, d)}`,
      choices: choices(answer, [
        vector(a + c, b - d),
        vector(a - c, b + d),
        vector(a * c, b * d),
      ]),
      explanation: `On additionne les coordonnées terme à terme : u + v = (${arithmeticSum(a, c)} ; ${arithmeticSum(b, d)}) = ${answer}.`,
      geometry:
        "L’addition place les deux vecteurs bout à bout : la diagonale du parallélogramme représente leur somme.",
      trap: "Il ne faut ni multiplier les coordonnées ni mélanger les deux axes.",
    };
  }

  if (template === 1) {
    const a = nonZero();
    const b = nonZero();
    const answer = vector(2 * a, 2 * b);
    return {
      id: `V-VECT-${Date.now()}`,
      sector: "vectors",
      eyebrow: "Sous-espace engendré",
      prompt: `Quel vecteur appartient à Vect(${vector(a, b)}) ?`,
      formula: "",
      choices: choices(answer, [
        vector(2 * a, 2 * b + 1),
        vector(a + 1, b),
        vector(-a, b),
      ]),
      explanation: `${answer} = 2 × ${vector(a, b)}. Il s’agit donc bien d’un multiple scalaire du vecteur générateur.`,
      geometry:
        "Tous les vecteurs de Vect(u) sont portés par la même droite vectorielle que u.",
      trap: "Modifier une seule coordonnée ne conserve généralement pas la direction.",
    };
  }

  const a = nonZero();
  const b = nonZero();
  const linearForm = formatLinearExpression([
    [a, "x"],
    [b, "y"],
  ]);
  const answer = `{(x ; y) ∈ ℝ² | ${linearForm} = 0}`;
  return {
    id: `V-SEV-${Date.now()}`,
    sector: "vectors",
    eyebrow: "Sous-espace vectoriel",
    prompt: "Quel ensemble est nécessairement un sous-espace vectoriel de ℝ² ?",
    formula: "Chercher une condition homogène et stable par combinaison linéaire.",
    choices: choices(answer, [
      `{(x ; y) ∈ ℝ² | ${linearForm} = 1}`,
      "{(x ; y) ∈ ℝ² | x ≥ 0}",
      "{(x ; y) ∈ ℝ² | xy = 0}",
    ]),
    explanation: `L’équation ${linearForm} = 0 est linéaire et homogène. L’ensemble de ses solutions contient 0 et reste stable par combinaison linéaire.`,
    geometry:
      "Dans ℝ², une équation linéaire homogène non triviale décrit une droite passant par l’origine.",
    trap: "Une droite affine ne passant pas par l’origine n’est pas un sous-espace vectoriel.",
  };
}

function basisQuestion(): Question {
  const template = randomInt(0, 2);

  if (template === 0) {
    let a = nonZero();
    let b = nonZero();
    let c = nonZero();
    let d = nonZero();
    while (a * d - b * c === 0) {
      a = nonZero();
      b = nonZero();
      c = nonZero();
      d = nonZero();
    }
    const determinant = a * d - b * c;
    const answer = `${determinant}`;
    return {
      id: `B-DET-${Date.now()}`,
      sector: "bases",
      eyebrow: "Famille libre",
      prompt: "Quel est le déterminant de la famille (u, v) ?",
      formula: `u = ${vector(a, b)}   et   v = ${vector(c, d)}`,
      choices: choices(answer, [
        `${a * c - b * d}`,
        `${a * d + b * c}`,
        `${b * c - a * d}`,
      ]),
      explanation: `det(u, v) = ${factor(a)} × ${factor(d)} − ${factor(b)} × ${factor(c)} = ${determinant}. Comme ce nombre est non nul, (u, v) est une base de ℝ².`,
      geometry:
        "La valeur absolue du déterminant mesure l’aire du parallélogramme construit sur u et v.",
      trap: "Le produit croisé se soustrait : ad − bc, et non ad + bc.",
    };
  }

  if (template === 1) {
    const p = nonZero();
    const alpha = nonZero();
    const beta = nonZero();
    const x = alpha + p * beta;
    const answer = vector(alpha, beta);
    const coordinateEquation = formatLinearExpression([
      [1, "λ"],
      [p, "μ"],
    ]);
    return {
      id: `B-COORD-${Date.now()}`,
      sector: "bases",
      eyebrow: "Coordonnées dans une base",
      prompt: "Quelles sont les coordonnées de x dans la base B = (e₁, e₂) ?",
      formula: `e₁ = ${vector(1, 0)}, e₂ = ${vector(p, 1)} et x = ${vector(x, beta)}`,
      choices: choices(answer, [
        vector(x, beta),
        vector(beta, alpha),
        vector(alpha + p, beta),
      ]),
      explanation: `On cherche x = λe₁ + μe₂. La seconde coordonnée donne μ = ${beta}, puis ${coordinateEquation} = ${x}, donc λ = ${alpha}. Ainsi [x]ᴮ = ${answer}.`,
      geometry:
        "Changer de base ne déplace pas le vecteur : seules les coordonnées utilisées pour le décrire changent.",
      trap: "Les coordonnées canoniques de x ne sont pas automatiquement ses coordonnées dans B.",
    };
  }

  const a = nonZero();
  const b = nonZero();
  const c = nonZero();
  let d = nonZero();
  while (a * d - b * c === 0) d = nonZero();
  return {
    id: `B-DIM-${Date.now()}`,
    sector: "bases",
    eyebrow: "Dimension",
    prompt: "Quelle est la dimension du sous-espace engendré par cette famille ?",
    formula: `F = Vect(${vector(a, b)}, ${vector(c, d)}, ${vector(a + c, b + d)})`,
    choices: choices("2", ["0", "1", "3"]),
    explanation:
      "Les deux premiers vecteurs sont indépendants car leur déterminant est non nul. Le troisième est leur somme. La famille engendre donc tout ℝ² et dim(F) = 2.",
    geometry:
      "Deux directions indépendantes suffisent à parcourir tout le plan ; un troisième vecteur du plan n’ajoute aucun degré de liberté.",
    trap: "La dimension compte les directions indépendantes, pas le nombre total de vecteurs écrits.",
  };
}

function applicationQuestion(): Question {
  const template = randomInt(0, 3);

  if (template === 0) {
    const a = nonZero();
    const b = nonZero();
    const answer = vector(b, -a);
    const linearForm = formatLinearExpression([
      [a, "x"],
      [b, "y"],
    ]);
    return {
      id: `A-KER-${Date.now()}`,
      sector: "applications",
      eyebrow: "Noyau",
      prompt: "Quel vecteur appartient au noyau de f ?",
      formula: `f : ℝ² → ℝ,   f(x, y) = ${linearForm}`,
      choices: choices(answer, [
        vector(a, b),
        vector(b, a),
        vector(-b, -a),
      ]),
      explanation: `En posant (x ; y) = ${answer}, on obtient f(x, y) = ab + b(−a) = ab − ab = 0. Ce vecteur appartient donc à Ker(f).`,
      geometry:
        "Le noyau rassemble toutes les directions que l’application écrase sur le vecteur nul.",
      trap: "Un vecteur fixe par f et un vecteur envoyé sur 0 sont deux notions différentes.",
    };
  }

  if (template === 1) {
    const dimension = randomInt(3, 7);
    const kernel = randomInt(1, dimension - 1);
    const rank = dimension - kernel;
    return {
      id: `A-RANK-${Date.now()}`,
      sector: "applications",
      eyebrow: "Théorème du rang",
      prompt: "Quel est le rang de f ?",
      formula: `dim(E) = ${dimension}   et   dim(Ker f) = ${kernel}`,
      choices: choices(`${rank}`, [
        `${kernel}`,
        `${dimension + kernel}`,
        `${dimension}`,
      ]),
      explanation: `Le théorème du rang donne dim(E) = dim(Ker f) + rg(f). Ainsi rg(f) = ${dimension} − ${kernel} = ${rank}.`,
      geometry:
        "La dimension de départ se partage entre les directions écrasées et les directions encore visibles dans l’image.",
      trap: "Le rang complète la dimension du noyau ; il ne s’y ajoute pas au-delà de dim(E).",
    };
  }

  if (template === 2) {
    const coefficient = nonZero();
    const firstCoordinate = formatLinearExpression([[coefficient, "x"]]);
    return {
      id: `A-IMAGE-${Date.now()}`,
      sector: "applications",
      eyebrow: "Image et rang",
      prompt: "Quel est le rang de cette application ?",
      formula: `f(x, y) = (${firstCoordinate} ; 0)`,
      choices: choices("1", ["0", "2", `${Math.abs(coefficient)}`]),
      explanation: `Im(f) = Vect(${vector(1, 0)}). L’image est une droite vectorielle, donc rg(f) = 1.`,
      geometry:
        "L’application rabat tout le plan sur l’axe horizontal : une seule direction subsiste.",
      trap: "Le rang est une dimension, pas la valeur du coefficient non nul.",
    };
  }

  const a = nonZero();
  const b = nonZero();
  const c = nonZero();
  const firstCoordinate = formatLinearExpression([
    [a, "x"],
    [b, "y"],
  ]);
  const secondCoordinate = formatLinearExpression([[c, "x"]]);
  const nonlinearCoordinate = formatLinearExpression([
    [a, "x²"],
    [b, "y"],
  ]);
  const answer = `f(x, y) = (${firstCoordinate} ; ${secondCoordinate})`;
  return {
    id: `A-LIN-${Date.now()}`,
    sector: "applications",
    eyebrow: "Linéarité",
    prompt: "Laquelle de ces applications est linéaire ?",
    formula: "Une application linéaire conserve les combinaisons linéaires et envoie 0 sur 0.",
    choices: choices(answer, [
      `f(x, y) = (${firstCoordinate} + 1 ; ${secondCoordinate})`,
      `f(x, y) = (${nonlinearCoordinate} ; ${secondCoordinate})`,
      `f(x, y) = (${firstCoordinate} ; ${c})`,
    ]),
    explanation:
      "Chaque coordonnée de l’application correcte est une combinaison linéaire homogène de x et y. Il n’y a ni terme constant ni produit non linéaire.",
    geometry:
      "Une transformation linéaire peut étirer, tourner, cisailler ou écraser l’espace, mais elle garde l’origine fixe.",
    trap: "La présence d’un terme constant non nul suffit à détruire la linéarité.",
  };
}

function generateQuestion(sectors: Sector[]) {
  const sector = sectors[randomInt(0, sectors.length - 1)];
  if (sector === "bases") return basisQuestion();
  if (sector === "applications") return applicationQuestion();
  return vectorQuestion();
}

function production(state: GameState) {
  const base = basePassiveProduction(state.instruments);
  const invariantMultiplier = 1 + state.totalInvariants * 0.15;
  const masteryTotal =
    state.mastery.vectors + state.mastery.bases + state.mastery.applications;
  return (
    base *
    invariantMultiplier *
    protocolPassiveMultiplier(state.protocols) *
    (1 + masteryTotal * 0.003)
  );
}

function clickPower(state: GameState) {
  const emitterBonus = 1 + state.instruments[0] * 0.1;
  const basisExtractionBonus = 1 + (state.instruments[6] ?? 0) * 0.05;
  const resonanceBonus = 1 + Math.floor(state.resonance / 25) * 0.5;
  return (
    emitterBonus *
    basisExtractionBonus *
    resonanceBonus *
    protocolManualMultiplier(state.protocols) *
    (1 + state.totalInvariants * 0.15)
  );
}

function workshopCost(state: GameState, index: number) {
  return Math.ceil(
    instrumentCost(index, state.instruments[index]) *
      protocolWorkshopCostMultiplier(state.protocols) *
      matrixWorkshopCostMultiplier(state.instruments),
  );
}

function protocolEffect(index: number, level: number) {
  if (level === 0) return "Aucun bonus actif";
  if (index === 0) return `Émission manuelle : +${level * 25} %`;
  if (index === 1) return `Production passive : +${level * 12} %`;
  if (index === 2) {
    const reduction = Math.round(
      (1 - protocolWorkshopCostMultiplier([0, 0, level])) * 100,
    );
    return `Prix des ateliers : −${reduction} %`;
  }
  if (index === 3) return `Stabilité de résonance : +${level * 12} %`;
  if (index === 4) return `Réponses justes : +${level * 15} %`;
  return `${level} atelier${level > 1 ? "s" : ""} dimensionnel${level > 1 ? "s" : ""} conservé${level > 1 ? "s" : ""}`;
}

function anomalyDelay(allTime: number) {
  const [minimum, maximum] = allTime < INSTRUMENTS[2].unlock ? [45, 60] : [65, 90];
  return randomInt(minimum, maximum) * 1000;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (value < 1000) {
    return value < 100 ? value.toFixed(value < 10 ? 1 : 0) : Math.floor(value).toString();
  }
  const units = [
    { value: 1e12, suffix: " B" },
    { value: 1e9, suffix: " Md" },
    { value: 1e6, suffix: " M" },
    { value: 1e3, suffix: " k" },
  ];
  const unit = units.find((item) => value >= item.value) ?? units[units.length - 1];
  return `${(value / unit.value).toFixed(value / unit.value < 10 ? 1 : 0)}${unit.suffix}`;
}

function restoreState(raw: string | null): GameState {
  if (!raw) return { ...INITIAL_STATE, lastTick: Date.now(), nextAnomalyAt: Date.now() + 8000 };
  try {
    const saved = JSON.parse(raw) as Partial<GameState>;
    const instruments = INSTRUMENTS.map((_, index) =>
      Math.max(0, Number(saved.instruments?.[index]) || 0),
    );
    // Les anciennes versions autorisaient parfois un atelier avancé sans son
    // prédécesseur. La migration rétablit une chaîne structurelle cohérente.
    for (let index = instruments.length - 1; index > 0; index -= 1) {
      if (instruments[index] > 0) {
        instruments[index - 1] = Math.max(1, instruments[index - 1]);
      }
    }
    return {
      ...INITIAL_STATE,
      ...saved,
      instruments,
      protocols: INVARIANT_PROTOCOLS.map((protocol, index) =>
        Math.min(
          protocol.maxLevel,
          Math.max(0, Number(saved.protocols?.[index]) || 0),
        ),
      ),
      mastery: {
        vectors: Number(saved.mastery?.vectors) || 0,
        bases: Number(saved.mastery?.bases) || 0,
        applications: Number(saved.mastery?.applications) || 0,
        matrices: Number(saved.mastery?.matrices) || 0,
      },
      lastTick: Number(saved.lastTick) || Date.now(),
      nextAnomalyAt: Number(saved.nextAnomalyAt) || Date.now() + 8000,
    };
  } catch {
    return { ...INITIAL_STATE, lastTick: Date.now(), nextAnomalyAt: Date.now() + 8000 };
  }
}

export default function Home() {
  const [game, setGame] = useState<GameState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<AnswerState | null>(null);
  const [notice, setNotice] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmBasisChange, setConfirmBasisChange] = useState(false);
  const [activeTab, setActiveTab] = useState<GameTab>("network");
  const [activeWorkshopChapter, setActiveWorkshopChapter] = useState(
    WORKSHOP_CHAPTERS[0],
  );
  const [emitBurst, setEmitBurst] = useState(0);
  const [isEmitting, setIsEmitting] = useState(false);

  const rate = useMemo(() => production(game), [game]);
  const manualPower = useMemo(() => clickPower(game), [game]);
  // Le premier exemplaire de chaque atelier structurel ajoute un vecteur à la
  // base. Les exemplaires suivants renforcent la production sans changer dim(E).
  const spaceDimension =
    game.instruments[3] > 0
      ? 4
      : game.instruments[2] > 0
        ? 3
        : game.instruments[1] > 0
          ? 2
          : game.instruments[0] > 0
            ? 1
            : 0;
  const basisVectors = ["e₁", "e₂", "e₃"].slice(0, spaceDimension);
  const spaceGeneratorList =
    spaceDimension >= 4 ? "e₁, …, e₄" : basisVectors.join(", ");

  useEffect(() => {
    const preventGesture = (event: Event) => event.preventDefault();
    const preventPinch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    const nonPassive = { passive: false } as AddEventListenerOptions;

    document.addEventListener("gesturestart", preventGesture, nonPassive);
    document.addEventListener("gesturechange", preventGesture, nonPassive);
    document.addEventListener("gestureend", preventGesture, nonPassive);
    document.addEventListener("touchmove", preventPinch, nonPassive);

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchmove", preventPinch);
    };
  }, []);

  useEffect(() => {
    const restored = restoreState(window.localStorage.getItem(SAVE_KEY));
    const now = Date.now();
    const elapsed = Math.min(Math.max(0, now - restored.lastTick), 2 * 60 * 60 * 1000);
    const offlineGain = production(restored) * (elapsed / 1000);
    const readyAnomaly =
      restored.allTime >= 15 && now >= restored.nextAnomalyAt
        ? Math.min(3, restored.anomalies + 1)
        : restored.anomalies;
    setGame({
      ...restored,
      coordinates: restored.coordinates + offlineGain,
      runTotal: restored.runTotal + offlineGain,
      allTime: restored.allTime + offlineGain,
      anomalies: readyAnomaly,
      nextAnomalyAt:
        readyAnomaly > restored.anomalies
          ? now + anomalyDelay(restored.allTime)
          : restored.nextAnomalyAt,
      lastTick: now,
    });
    if (offlineGain >= 1) {
      setNotice(`Le réseau a produit ${formatNumber(offlineGain)} coordonnées pendant votre absence.`);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setInterval(() => {
      setGame((previous) => {
        const now = Date.now();
        const elapsed = Math.min(1, Math.max(0, (now - previous.lastTick) / 1000));
        const gain = production(previous) * elapsed;
        let anomalies = previous.anomalies;
        let nextAnomalyAt = previous.nextAnomalyAt;
        if (previous.allTime >= 15 && now >= nextAnomalyAt && anomalies < 3) {
          anomalies += 1;
          nextAnomalyAt = now + anomalyDelay(previous.allTime);
        } else if (anomalies >= 3 && now >= nextAnomalyAt) {
          nextAnomalyAt = now + 25000;
        }
        return {
          ...previous,
          coordinates: previous.coordinates + gain,
          runTotal: previous.runTotal + gain,
          allTime: previous.allTime + gain,
          resonance: Math.max(
            0,
            previous.resonance -
              (elapsed * resonanceDecayRate(previous.instruments)) /
                protocolResonanceMultiplier(previous.protocols),
          ),
          anomalies,
          nextAnomalyAt,
          lastTick: now,
        };
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const saver = window.setInterval(() => {
      setGame((current) => {
        window.localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({ ...current, lastTick: Date.now() }),
        );
        return current;
      });
    }, 2500);
    return () => window.clearInterval(saver);
  }, [hydrated]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!hydrated) return;
    const nextIndex = game.instruments.findIndex((count) => count === 0);
    if (nextIndex >= 0) {
      setActiveWorkshopChapter(INSTRUMENTS[nextIndex].chapter);
    }
  }, [hydrated]);

  function emitVector() {
    if (!hydrated) return;
    setEmitBurst((current) => current + 1);
    setIsEmitting(false);
    window.requestAnimationFrame(() => {
      setIsEmitting(true);
      window.setTimeout(() => setIsEmitting(false), 760);
    });
    setGame((previous) => {
      const gain = clickPower(previous);
      const firstAnomaly =
        previous.anomalies === 0 && previous.allTime < 15 && previous.allTime + gain >= 15;
      return {
        ...previous,
        coordinates: previous.coordinates + gain,
        runTotal: previous.runTotal + gain,
        allTime: previous.allTime + gain,
        resonance: Math.min(100, previous.resonance + 9),
        anomalies: firstAnomaly ? 1 : previous.anomalies,
        nextAnomalyAt: firstAnomaly
          ? Date.now() + anomalyDelay(previous.allTime + gain)
          : previous.nextAnomalyAt,
      };
    });
  }

  function buyInstrument(index: number) {
    setGame((previous) => {
      const cost = workshopCost(previous, index);
      const prerequisiteOwned =
        index === 0 || (previous.instruments[index - 1] ?? 0) > 0;
      if (
        previous.coordinates < cost ||
        previous.allTime < INSTRUMENTS[index].unlock ||
        !prerequisiteOwned
      ) {
        return previous;
      }
      const instruments = [...previous.instruments];
      instruments[index] += 1;
      return { ...previous, coordinates: previous.coordinates - cost, instruments };
    });
  }

  function buyProtocol(index: number) {
    setGame((previous) => {
      const currentLevel = previous.protocols[index] ?? 0;
      const protocol = INVARIANT_PROTOCOLS[index];
      const cost = invariantProtocolCost(index, currentLevel);
      if (
        currentLevel >= protocol.maxLevel ||
        previous.invariants < cost
      ) {
        return previous;
      }
      const protocols = [...previous.protocols];
      protocols[index] = currentLevel + 1;
      return {
        ...previous,
        invariants: previous.invariants - cost,
        protocols,
      };
    });
  }

  function openAnomaly() {
    if (game.anomalies <= 0) return;
    const sectors: Sector[] = ["vectors"];
    if (game.instruments[1] > 0) sectors.push("bases");
    if (game.instruments[8] > 0) {
      sectors.push("applications");
    }
    if (game.instruments[12] > 0) {
      sectors.push("matrices");
    }
    const weakest = [...sectors].sort(
      (left, right) => game.mastery[left] - game.mastery[right],
    );
    const pool = Math.random() < 0.55 ? [weakest[0]] : sectors;
    const mpUnlocked = game.instruments[15] > 0;
    setQuestion(generateExercise(pool, spaceDimension, mpUnlocked));
    setAnswer(null);
  }

  function chooseAnswer(index: number) {
    if (!question || answer) return;
    const isCorrect = question.choices[index].correct;
    const reward =
      Math.max(isCorrect ? 24 : 5, rate * (isCorrect ? 20 : 5)) *
      (isCorrect
        ? correctAnomalyRewardMultiplier(game.instruments) *
          protocolAnomalyMultiplier(game.protocols)
        : 1);
    setAnswer({ choice: index, correct: isCorrect, reward });
    setGame((previous) => {
      const now = Date.now();
      return {
        ...previous,
        coordinates: previous.coordinates + reward,
        runTotal: previous.runTotal + reward,
        allTime: previous.allTime + reward,
        anomalies: Math.max(0, previous.anomalies - 1),
        nextAnomalyAt: isCorrect
          ? previous.nextAnomalyAt
          : Math.min(previous.nextAnomalyAt, now + 30000),
        correctAnswers: previous.correctAnswers + (isCorrect ? 1 : 0),
        mastery: isCorrect
          ? {
              ...previous.mastery,
              [question.sector]: Math.min(100, previous.mastery[question.sector] + 6),
            }
          : previous.mastery,
      };
    });
  }

  function closeQuestion() {
    setQuestion(null);
    setAnswer(null);
  }

  function changeBasis() {
    const gained = invariantGain(game.runTotal);
    if (gained < 1) return;
    setGame((previous) => {
      const inheritedCount = inheritedStructuralWorkshops(
        previous.protocols,
      );
      const instruments = INSTRUMENTS.map((_, index) =>
        index < inheritedCount ? 1 : 0,
      );
      return {
        ...INITIAL_STATE,
        instruments,
        protocols: previous.protocols,
        mastery: previous.mastery,
        correctAnswers: previous.correctAnswers,
        allTime: previous.allTime,
        invariants: previous.invariants + gained,
        totalInvariants: previous.totalInvariants + gained,
        lastTick: Date.now(),
        nextAnomalyAt: Date.now() + 8000,
      };
    });
    setConfirmBasisChange(false);
    setActiveTab("network");
    setNotice(`${gained} invariant${gained > 1 ? "s" : ""} conservé${gained > 1 ? "s" : ""}. Le réseau adopte une nouvelle base.`);
  }

  function resetGame() {
    window.localStorage.removeItem(SAVE_KEY);
    setGame({
      ...INITIAL_STATE,
      lastTick: Date.now(),
      nextAnomalyAt: Date.now() + 8000,
    });
    setConfirmReset(false);
    setNotice("La carte a été entièrement effacée.");
  }

  const pendingInvariantGain = invariantGain(game.runTotal);
  const followingInvariantThreshold = nextInvariantThreshold(pendingInvariantGain);
  const currentInvariantMultiplier = 1 + game.totalInvariants * 0.15;
  const futureInvariantMultiplier =
    1 + (game.totalInvariants + pendingInvariantGain) * 0.15;
  const instrumentCount = game.instruments.reduce((sum, count) => sum + count, 0);
  const unlockedSectorCount =
    1 +
    (game.instruments[1] > 0 ? 1 : 0) +
    (game.instruments[8] > 0 ? 1 : 0) +
    (game.instruments[12] > 0 ? 1 : 0);
  const nextWorkshopIndex = game.instruments.findIndex((count) => count === 0);
  const nextWorkshop =
    nextWorkshopIndex >= 0 ? INSTRUMENTS[nextWorkshopIndex] : null;
  const missionNumber = Math.min(
    INSTRUMENTS.length + 1,
    game.instruments.reduce((sum, item) => sum + (item > 0 ? 1 : 0), 0) + 1,
  )
    .toString()
    .padStart(2, "0");
  const nextAnomalySeconds = Math.max(
    0,
    Math.ceil((game.nextAnomalyAt - Date.now()) / 1000),
  );
  const mission =
    game.allTime < 15
      ? {
          title: "Alimenter la forge",
          text: "Forgez 15 coordonnées pour provoquer la première anomalie.",
          progress: Math.min(100, (game.allTime / 15) * 100),
        }
      : nextWorkshop && game.allTime < nextWorkshop.unlock
        ? {
            title: `Révéler ${nextWorkshop.name}`,
            text: `Atteignez ${formatNumber(nextWorkshop.unlock)} coordonnées cumulées pour ouvrir cet atelier.`,
            progress: Math.min(
              100,
              (game.allTime / nextWorkshop.unlock) * 100,
            ),
          }
        : nextWorkshop
          ? {
              title: nextWorkshop.mission,
              text: `Construisez ${nextWorkshop.name}. ${nextWorkshop.description}`,
              progress: Math.min(
                100,
                (game.coordinates /
                  Math.ceil(
                    instrumentCost(nextWorkshopIndex, 0) *
                      protocolWorkshopCostMultiplier(game.protocols) *
                      matrixWorkshopCostMultiplier(game.instruments),
                  )) *
                  100,
              ),
            }
          : {
              title: "Préparer un changement de base",
              text: "Renforcez les douze ateliers et stabilisez les anomalies.",
              progress: Math.min(
                100,
                (game.runTotal / nextInvariantThreshold(0)) * 100,
              ),
            };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="kicker">Atlas d’algèbre linéaire</p>
            <h1>EIGENFORGE</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <a className="exercise-lab-link" href="./exercises/">
            <span aria-hidden="true">∑</span>
            <strong>Exercices libres</strong>
          </a>
          <div className="resource-strip" aria-label="Ressources">
            <div className="resource">
              <span>Coordonnées</span>
              <strong>{formatNumber(game.coordinates)}</strong>
            </div>
            <div className="resource">
              <span>Production</span>
              <strong>{formatNumber(rate)}/s</strong>
            </div>
            <div className="resource invariant-resource">
              <span>Invariants</span>
              <strong>{game.invariants}</strong>
            </div>
          </div>
        </div>
      </header>

      <nav className="tab-navigation" role="tablist" aria-label="Sections du jeu">
        {GAME_TABS.map((tab) => (
          <button
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
            key={tab.id}
          >
            <span className="tab-mark" aria-hidden="true">{tab.mark}</span>
            <span className="tab-label">{tab.label}</span>
            <span className="tab-short-label">{tab.shortLabel}</span>
            {tab.id === "anomalies" && game.anomalies > 0 && (
              <strong className="tab-badge" aria-label={`${game.anomalies} anomalies`}>
                {game.anomalies}
              </strong>
            )}
          </button>
        ))}
      </nav>

      <section className="tab-stage">
        <section
          className="tab-panel network-tab"
          id="panel-network"
          role="tabpanel"
          aria-labelledby="tab-network"
          hidden={activeTab !== "network"}
        >
          <section className="network-column">
            <div className="network-heading">
              <div>
                <p className="section-number">I · Carte active</p>
                <h2>Espace vectoriel E</h2>
              </div>
              <div className="dimension-chip">
                <span>dim</span>
                <strong>{spaceDimension}</strong>
              </div>
            </div>

            <div
              className={[
                "network-stage",
                `dimension-${spaceDimension}`,
                game.instruments[8] > 0 ? "has-transform" : "",
                game.instruments[9] > 0 ? "has-kernel" : "",
                game.instruments[10] > 0 ? "has-image" : "",
                game.instruments[11] > 0 ? "rank-balanced" : "",
                game.instruments[12] > 0 ? "has-matrix" : "",
                game.instruments[15] > 0 ? "has-spectrum" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="star-field" aria-hidden="true" />
              <div className="coordinate-grid" aria-hidden="true" />
              <div
                className={`line-space ${spaceDimension === 1 ? "visible" : ""}`}
                style={{ "--angle": "-28deg" } as CSSProperties}
                aria-hidden="true"
              />
              <div
                className={`plane plane-one ${spaceDimension >= 2 ? "visible" : ""}`}
                aria-hidden="true"
              />
              <div
                className={`depth-grid ${spaceDimension >= 3 ? "visible" : ""}`}
                aria-hidden="true"
              />
              <div
                className={`transform-grid ${game.instruments[8] > 0 ? "visible" : ""}`}
                aria-hidden="true"
              />
              <div
                className={`kernel-space ${game.instruments[9] > 0 ? "visible" : ""}`}
                aria-hidden="true"
              >
                <span>Ker(f)</span>
              </div>
              <div
                className={`image-space ${game.instruments[10] > 0 ? "visible" : ""}`}
                aria-hidden="true"
              >
                <span>Im(f)</span>
              </div>
              <div
                className={`matrix-operator ${game.instruments[12] > 0 ? "visible" : ""}`}
                aria-label="Matrice de l’application f dans la base de l’espace"
              >
                <span>Mat(f)</span>
                <div aria-hidden="true">
                  <i>a</i>
                  <i>b</i>
                  <i>c</i>
                  <i>d</i>
                </div>
              </div>
              <div
                className={`spectral-marker ${game.instruments[15] > 0 ? "visible" : ""}`}
                aria-hidden="true"
              >
                <span>λ₁</span>
                <span>λ₂</span>
              </div>
              <div
                className={`vector-line vector-one ${game.instruments[0] > 0 ? "visible" : ""}`}
                style={{ "--angle": "-28deg", "--length": "35%" } as CSSProperties}
                aria-hidden="true"
              >
                <span>e₁</span>
              </div>
              <div
                className={`vector-line vector-two ${game.instruments[1] > 0 ? "visible" : ""}`}
                style={{ "--angle": "-102deg", "--length": "28%" } as CSSProperties}
                aria-hidden="true"
              >
                <span>e₂</span>
              </div>
              <div
                className={`vector-line vector-three ${game.instruments[2] > 0 ? "visible" : ""}`}
                style={{ "--angle": "23deg", "--length": "42%" } as CSSProperties}
                aria-hidden="true"
              >
                <span>e₃</span>
              </div>

              {isEmitting && spaceDimension > 0 && (
                <div
                  className={`forged-vector dimension-${spaceDimension}`}
                  key={`vector-${emitBurst}`}
                  aria-hidden="true"
                >
                  <span>u</span>
                </div>
              )}
              {isEmitting && game.instruments[8] > 0 && (
                <div
                  className="mapped-vector"
                  key={`mapped-${emitBurst}`}
                  aria-hidden="true"
                >
                  <span>f(u)</span>
                </div>
              )}

              {spaceDimension >= 1 && (
                <div
                  className="space-indicator"
                  aria-label={`Espace engendré par e 1 à e ${spaceDimension}`}
                >
                  E = Vect({spaceGeneratorList})
                </div>
              )}
              {spaceDimension === 0 && (
                <div className="zero-space-label" aria-hidden="true">E = {"{0}"}</div>
              )}

              <button
                className={`core-button ${isEmitting ? "is-emitting" : ""}`}
                type="button"
                onClick={emitVector}
                disabled={!hydrated}
                aria-label={
                  spaceDimension === 0
                    ? "Forger des coordonnées"
                    : "Forger un vecteur"
                }
              >
                {emitBurst > 0 && (
                  <span className="core-impact" key={emitBurst} aria-hidden="true" />
                )}
                <span className="core-orbit" aria-hidden="true" />
                <span className="core-glyph" aria-hidden="true">
                  {spaceDimension === 0 ? "✦" : "→"}
                </span>
                <strong>
                  {spaceDimension === 0
                    ? "Forger des coordonnées"
                    : "Forger un vecteur"}
                </strong>
                <small>+{formatNumber(manualPower)} coordonnées</small>
              </button>

              <div className="map-caption">
                <span>Résonance</span>
                <div className="resonance-track">
                  <span style={{ width: `${game.resonance}%` }} />
                </div>
                <strong>×{(1 + Math.floor(game.resonance / 25) * 0.5).toFixed(1)}</strong>
              </div>
            </div>

            <div className="mission-card">
              <div className="mission-index">{missionNumber}</div>
              <div className="mission-copy">
                <p>Mission active</p>
                <h3>{mission.title}</h3>
                <span>{mission.text}</span>
              </div>
              <div
                className="mission-ring"
                style={{ "--progress": `${mission.progress * 3.6}deg` } as CSSProperties}
                aria-label={`${Math.floor(mission.progress)} %`}
              >
                <span>{Math.floor(mission.progress)}%</span>
              </div>
            </div>
          </section>
        </section>

        <section
          className="tab-panel"
          id="panel-instruments"
          role="tabpanel"
          aria-labelledby="tab-instruments"
          hidden={activeTab !== "instruments"}
        >
        <aside className="panel instruments-panel">
          <div className="panel-heading">
            <div>
              <p className="section-number">II · Instruments</p>
              <h2>Architecture productive</h2>
            </div>
            <span className="status-dot">Actif</span>
          </div>

          <nav
            className="workshop-cycle-navigation"
            aria-label="Cycles d’ateliers"
          >
            {WORKSHOP_CHAPTERS.map((chapter, chapterIndex) => {
              const chapterIndices = INSTRUMENTS.flatMap(
                (instrument, index) =>
                  instrument.chapter === chapter ? [index] : [],
              );
              const firstIndex = chapterIndices[0];
              const accessible =
                firstIndex === 0 ||
                (game.instruments[firstIndex - 1] ?? 0) > 0;
              const builtWorkshops = chapterIndices.filter(
                (index) => (game.instruments[index] ?? 0) > 0,
              ).length;
              const chapterRate = chapterIndices.reduce(
                (sum, index) =>
                  sum +
                  (game.instruments[index] ?? 0) *
                    INSTRUMENTS[index].baseProduction *
                    milestoneMultiplier(game.instruments[index] ?? 0),
                0,
              );
              return (
                <button
                  type="button"
                  className={[
                    activeWorkshopChapter === chapter ? "active" : "",
                    accessible ? "" : "preview",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={activeWorkshopChapter === chapter}
                  onClick={() => setActiveWorkshopChapter(chapter)}
                  key={chapter}
                >
                  <span>Cycle {String(chapterIndex + 1).padStart(2, "0")}</span>
                  <strong>{chapter}</strong>
                  <small>
                    {accessible
                      ? `${builtWorkshops}/4 actifs · ${formatNumber(chapterRate)}/s`
                      : "Aperçu verrouillé"}
                  </small>
                </button>
              );
            })}
          </nav>

          <div className="instrument-list">
            {WORKSHOP_CHAPTERS.map(
              (chapter, chapterIndex) => (
                <section
                  className="workshop-sector"
                  hidden={activeWorkshopChapter !== chapter}
                  key={chapter}
                >
                  <div className="workshop-sector-heading">
                    <span>Cycle 0{chapterIndex + 1}</span>
                    <h3>{chapter}</h3>
                  </div>
                  <div className="workshop-grid">
                    {INSTRUMENTS.map((instrument, index) => {
                      if (instrument.chapter !== chapter) return null;
                      const prerequisiteOwned =
                        index === 0 || (game.instruments[index - 1] ?? 0) > 0;
                      const progressUnlocked = game.allTime >= instrument.unlock;
                      const unlocked = prerequisiteOwned && progressUnlocked;
                      const count = game.instruments[index] ?? 0;
                      const cost = workshopCost(game, index);
                      const affordable = game.coordinates >= cost;
                      const nextMilestone = INSTRUMENT_MILESTONES.find(
                        (milestone) => milestone > count,
                      );
                      const instrumentRate =
                        count *
                        instrument.baseProduction *
                        milestoneMultiplier(count);
                      const lockedDescription = !prerequisiteOwned
                        ? `Nécessite d’abord ${INSTRUMENTS[index - 1].name}.`
                        : `Se révèle à ${formatNumber(instrument.unlock)} coordonnées cumulées.`;
                      return (
                        <article
                          className={`instrument-card ${unlocked ? "" : "locked"}`}
                          key={instrument.name}
                        >
                          <div className="instrument-mark" aria-hidden="true">
                            {instrument.mark}
                          </div>
                          <div className="instrument-copy">
                            <div className="instrument-title">
                              <div>
                                <span>{instrument.sector}</span>
                                <h3>{instrument.name}</h3>
                              </div>
                              <strong>{count}</strong>
                            </div>
                            <p>{unlocked ? instrument.description : lockedDescription}</p>
                            <div
                              className="milestone-row"
                              aria-label={`Paliers de ${instrument.name}`}
                            >
                              {INSTRUMENT_MILESTONES.map((milestone) => (
                                <span
                                  className={count >= milestone ? "reached" : ""}
                                  key={milestone}
                                >
                                  {milestone}
                                </span>
                              ))}
                            </div>
                            <div className="instrument-bottom">
                              <div className="instrument-output">
                                <span>{formatNumber(instrumentRate)}/s</span>
                                <small>
                                  {nextMilestone
                                    ? `${nextMilestone - count} avant le prochain ×2`
                                    : "Tous les paliers atteints"}
                                </small>
                              </div>
                              <button
                                className={`workshop-buy ${unlocked && affordable ? "ready" : ""}`}
                                type="button"
                                onClick={() => buyInstrument(index)}
                                disabled={!unlocked || !affordable}
                                aria-label={`Construire ${instrument.name} pour ${formatNumber(cost)} coordonnées`}
                              >
                                <span className="workshop-buy-copy">
                                  <small>
                                    {unlocked
                                      ? "Forger une unité"
                                      : prerequisiteOwned
                                        ? "Atelier verrouillé"
                                        : "Prérequis manquant"}
                                  </small>
                                  <strong>
                                    {unlocked
                                      ? formatNumber(cost)
                                      : prerequisiteOwned
                                        ? formatNumber(instrument.unlock)
                                        : "—"}
                                    {prerequisiteOwned && <em> coord.</em>}
                                  </strong>
                                </span>
                                <span className="workshop-buy-mark" aria-hidden="true">
                                  {unlocked ? "+" : "◇"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ),
            )}
          </div>
        </aside>
        </section>

        <section
          className="tab-panel"
          id="panel-anomalies"
          role="tabpanel"
          aria-labelledby="tab-anomalies"
          hidden={activeTab !== "anomalies"}
        >
        <aside className="panel anomalies-panel">
          <div className="panel-heading">
            <div>
              <p className="section-number">III · Observatoire</p>
              <h2>Anomalies mathématiques</h2>
            </div>
          </div>

          <div className="anomaly-workspace">
            <section className={`anomaly-card ${game.anomalies > 0 ? "ready" : ""}`}>
              <div className="anomaly-orbit" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p>{game.anomalies > 0 ? "Anomalie détectée" : "Réseau stable"}</p>
              <h3>
                {game.anomalies > 0
                  ? `${game.anomalies} perturbation${game.anomalies > 1 ? "s" : ""} à résoudre`
                  : game.allTime < 15
                    ? "La carte prend forme"
                    : `Prochaine lecture dans ≈ ${nextAnomalySeconds}s`}
              </h3>
              <button
                type="button"
                disabled={game.anomalies <= 0}
                onClick={openAnomaly}
              >
                {game.anomalies > 0 ? "Stabiliser maintenant" : "Aucune anomalie"}
              </button>
            </section>

            <section className="anomaly-guide">
              <p>Révision adaptative</p>
              <h3>Le réseau cible les notions fragiles</h3>
              <span>
                Les anomalies puisent d’abord dans le secteur débloqué dont la
                maîtrise est la plus faible. Une erreur déclenche une correction,
                sans retirer de coordonnées.
              </span>
              <div className="queue-indicator" aria-label={`${game.anomalies} anomalies sur 3`}>
                {[0, 1, 2].map((index) => (
                  <span className={index < game.anomalies ? "filled" : ""} key={index} />
                ))}
              </div>
              <div className="sector-chips">
                <span>Vecteurs</span>
                <span className={game.instruments[1] === 0 ? "locked" : ""}>
                  Bases
                </span>
                <span className={game.instruments[8] === 0 ? "locked" : ""}>
                  Applications
                </span>
                <span className={game.instruments[12] === 0 ? "locked" : ""}>
                  Matrices
                </span>
              </div>
            </section>
          </div>
        </aside>
        </section>

        <section
          className="tab-panel"
          id="panel-atlas"
          role="tabpanel"
          aria-labelledby="tab-atlas"
          hidden={activeTab !== "atlas"}
        >
        <aside className="panel atlas-tab-panel">
          <div className="panel-heading">
            <div>
              <p className="section-number">IV · Atlas</p>
              <h2>Maîtrise et invariants</h2>
            </div>
          </div>

          <div className="atlas-layout">
          <section className="mastery-section">
            <div className="subheading">
              <h3>Maîtrise</h3>
              <span>{game.correctAnswers} réponses justes</span>
            </div>
            {(Object.keys(SECTOR_LABELS) as Sector[]).map((sector) => {
              const locked =
                sector === "bases"
                  ? game.instruments[1] === 0
                  : sector === "applications"
                    ? game.instruments[8] === 0
                    : sector === "matrices"
                      ? game.instruments[12] === 0
                    : false;
              return (
                <div className={`mastery-row ${locked ? "locked" : ""}`} key={sector}>
                  <div>
                    <span>{SECTOR_LABELS[sector]}</span>
                    <strong>{locked ? "—" : `${game.mastery[sector]}%`}</strong>
                  </div>
                  <div className="mastery-track">
                    <span style={{ width: `${locked ? 0 : game.mastery[sector]}%` }} />
                  </div>
                </div>
              );
            })}
          </section>

          <section className="atlas-note atlas-principle">
            <div className="compass-mark" aria-hidden="true">✦</div>
            <div>
              <p>Principe observé</p>
              <blockquote>
                « La dimension mesure le nombre de degrés de liberté. »
              </blockquote>
            </div>
          </section>

          <div className="basis-card atlas-basis-card">
            <div>
              <span className="basis-symbol">Δ</span>
              <div>
                <p>Changement de base</p>
                <strong>
                  {pendingInvariantGain > 0
                    ? `+${pendingInvariantGain} invariant${pendingInvariantGain > 1 ? "s" : ""}`
                    : "Structure insuffisante"}
                </strong>
                <span className="basis-detail">
                  Bonus permanent actuel : ×{currentInvariantMultiplier.toFixed(2)}
                </span>
                <span className="basis-detail">
                  Prochain invariant dans {formatNumber(
                    Math.max(0, followingInvariantThreshold - game.runTotal),
                  )} coordonnées
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={pendingInvariantGain < 1}
              onClick={() => setConfirmBasisChange(true)}
            >
              Prévisualiser le changement
            </button>
          </div>

          <section className="protocol-section">
            <div className="protocol-heading">
              <div>
                <p>Principes permanents</p>
                <h3>Orienter les prochains cycles</h3>
                <span>
                  Dépenser un invariant ne réduit jamais le bonus permanent déjà
                  gagné avec les changements de base.
                </span>
              </div>
              <div className="protocol-balance">
                <strong>{game.invariants}</strong>
                <span>invariant{game.invariants > 1 ? "s" : ""} disponible{game.invariants > 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="protocol-grid">
              {INVARIANT_PROTOCOLS.map((protocol, index) => {
                const level = game.protocols[index] ?? 0;
                const cost = invariantProtocolCost(index, level);
                const complete = level >= protocol.maxLevel;
                const affordable = !complete && game.invariants >= cost;
                return (
                  <article
                    className={`protocol-card ${complete ? "complete" : ""}`}
                    key={protocol.name}
                  >
                    <div className="protocol-mark" aria-hidden="true">
                      {protocol.mark}
                    </div>
                    <div className="protocol-copy">
                      <div>
                        <span>Niveau {level}/{protocol.maxLevel}</span>
                        <h4>{protocol.name}</h4>
                      </div>
                      <p>{protocol.description}</p>
                      <strong className="protocol-effect">
                        {protocolEffect(index, level)}
                      </strong>
                      <div className="protocol-levels" aria-label={`Niveau ${level} sur ${protocol.maxLevel}`}>
                        {Array.from({ length: protocol.maxLevel }, (_, item) => (
                          <span className={item < level ? "filled" : ""} key={item} />
                        ))}
                      </div>
                      <button
                        type="button"
                        className={affordable ? "ready" : ""}
                        disabled={!affordable}
                        onClick={() => buyProtocol(index)}
                      >
                        {complete ? (
                          "Principe maîtrisé"
                        ) : (
                          <>
                            Renforcer
                            <strong>{cost} invariant{cost > 1 ? "s" : ""}</strong>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
          </div>

          <button
            type="button"
            className="reset-link"
            onClick={() => setConfirmReset(true)}
          >
            Effacer cette partie
          </button>
        </aside>
        </section>
      </section>

      <footer>
        <span>Prototype MPSI · Vecteurs, bases et applications linéaires</span>
        <span>Sauvegarde locale automatique</span>
      </footer>

      {notice && <div className="toast" role="status">{notice}</div>}

      {question && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="question-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-title"
          >
            <div className="question-topline">
              <div>
                <p>{SECTOR_LABELS[question.sector]} · {question.eyebrow}</p>
                <span>{question.id}</span>
              </div>
              {!answer && (
                <button type="button" onClick={closeQuestion} aria-label="Reporter cette anomalie">
                  Plus tard
                </button>
              )}
            </div>

            <h2 id="question-title">
              <MathExpression text={question.prompt} />
            </h2>
            {question.formula && (
              <div className="formula-card">
                <MathExpression text={question.formula} />
              </div>
            )}

            <div className="answer-grid">
              {question.choices.map((choice, index) => {
                const chosen = answer?.choice === index;
                const revealCorrect = Boolean(answer && choice.correct);
                return (
                  <button
                    type="button"
                    key={`${choice.text}-${index}`}
                    onClick={() => chooseAnswer(index)}
                    disabled={Boolean(answer)}
                    className={`${chosen ? "chosen" : ""} ${revealCorrect ? "correct" : ""} ${chosen && answer && !answer.correct ? "wrong" : ""}`}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    <strong><MathExpression text={choice.text} /></strong>
                  </button>
                );
              })}
            </div>

            {answer && (
              <div className={`correction ${answer.correct ? "success" : "error"}`}>
                <div className="correction-result">
                  <span>{answer.correct ? "✓" : "×"}</span>
                  <div>
                    <p>{answer.correct ? "Structure stabilisée" : "La structure reste instable"}</p>
                    <strong>+{formatNumber(answer.reward)} coordonnées</strong>
                  </div>
                </div>
                <div className="correction-block">
                  <span>Méthode</span>
                  <p><MathExpression text={question.explanation} /></p>
                </div>
                <div className="correction-columns">
                  <div>
                    <span>Lecture géométrique</span>
                    <p>{question.geometry}</p>
                  </div>
                  <div>
                    <span>Point de vigilance</span>
                    <p>{question.trap}</p>
                  </div>
                </div>
                <button type="button" onClick={closeQuestion}>
                  Revenir au réseau
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {confirmBasisChange && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="basis-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="basis-title"
          >
            <div className="basis-modal-heading">
              <div>
                <p>Changement de base</p>
                <h2 id="basis-title">Recomposer le réseau ?</h2>
                <span>
                  La structure repartira du vecteur nul, mais ses propriétés
                  essentielles demeureront.
                </span>
              </div>
              <div className="basis-gain-seal" aria-label={`${pendingInvariantGain} invariants gagnés`}>
                <strong>+{pendingInvariantGain}</strong>
                <span>invariant{pendingInvariantGain > 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="multiplier-preview">
              <div>
                <span>Multiplicateur actuel</span>
                <strong>×{currentInvariantMultiplier.toFixed(2)}</strong>
              </div>
              <span className="multiplier-arrow" aria-hidden="true">→</span>
              <div>
                <span>Après le changement</span>
                <strong>×{futureInvariantMultiplier.toFixed(2)}</strong>
              </div>
            </div>

            <div className="basis-impact-grid">
              <section className="impact-card lost">
                <p>Remis à zéro</p>
                <ul>
                  <li><strong>{formatNumber(game.coordinates)}</strong> coordonnées disponibles</li>
                  <li><strong>{instrumentCount}</strong> instruments construits</li>
                  <li><strong>{game.anomalies}</strong> anomalie{game.anomalies > 1 ? "s" : ""} en attente</li>
                  <li>La résonance actuelle</li>
                </ul>
              </section>

              <section className="impact-card kept">
                <p>Conservé</p>
                <ul>
                  <li>La maîtrise des <strong>{unlockedSectorCount}</strong> secteurs ouverts</li>
                  <li><strong>{game.correctAnswers}</strong> réponses justes</li>
                  <li>Tous les secteurs déjà révélés</li>
                  <li>Les invariants précédents</li>
                  <li>Les principes permanents renforcés</li>
                </ul>
              </section>

              <section className="impact-card gained">
                <p>Gagné</p>
                <ul>
                  <li><strong>+{pendingInvariantGain}</strong> invariant{pendingInvariantGain > 1 ? "s" : ""}</li>
                  <li>Production passive ×{futureInvariantMultiplier.toFixed(2)}</li>
                  <li>Émission manuelle ×{futureInvariantMultiplier.toFixed(2)}</li>
                  <li>Un nouveau cycle plus rapide</li>
                </ul>
              </section>
            </div>

            <p className="basis-modal-note">
              Les invariants accordent chacun +15 % à la production et à
              l’émission. Ce bonus est permanent et ne sera pas perdu lors des
              changements suivants, même lorsqu’un invariant est dépensé dans
              un principe.
            </p>

            <div className="basis-modal-actions">
              <button type="button" onClick={() => setConfirmBasisChange(false)}>
                Continuer ce cycle
              </button>
              <button type="button" className="confirm" onClick={changeBasis}>
                Confirmer le changement
              </button>
            </div>
          </section>
        </div>
      )}

      {confirmReset && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <p>Effacement de l’atlas</p>
            <h2 id="reset-title">Recommencer depuis le vecteur nul ?</h2>
            <span>Coordonnées, instruments, maîtrise et invariants seront supprimés sur cet appareil.</span>
            <div>
              <button type="button" onClick={() => setConfirmReset(false)}>Annuler</button>
              <button type="button" className="danger" onClick={resetGame}>Tout effacer</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
