"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  WORKSHOP_MODULES,
  instrumentIndex,
  instrumentLevel,
  resonanceDecayRate,
  workshopMasteryMultiplier,
  workshopMasteryThreshold,
  workshopModuleMultiplier,
} from "./game-balance";
import {
  INSTRUMENTS, INVARIANT_PROTOCOLS, WORKSHOP_CYCLES, basisChangeGain, basisChangeGainCap,
  basisChangePreview, invariantGain, invariantProductionMultiplier, invariantProtocolCost,
  nextInvariantThreshold, protocolResonanceMultiplier, protocolWorkshopCostMultiplier,
  workshopOutput, frontierCycle, protocolUnlockCycle, INHERITED_UNIT_CAPS,
} from "./game-economy";
import {
  production, boostedProduction, clickPower, workshopCost, workshopBulkCost, maxAffordableWorkshopQuantity,
  moduleCost, masteryCost, creditIncome, canAfford, exactWorkshopBulkCost,
  purchaseWorkshop, purchaseModule, purchaseMastery, purchaseProtocol,
  applyEconomicAnswer, questionReward, restartEconomy, automaticPurchase,
  pendingGate, workshopGateProgress, canOpenWorkshop,
} from "./economy-state";
import { generateQuestion as generateExercise, WORKSHOP_EXERCISE_FAMILIES } from "./question-generator";
import MathExpression from "./math-expression";
import ThemeToggle from "./theme-toggle";
import { formatNumber, formatCount, formatDecimal } from "./format-number";
import { useInteractionGuards } from "./use-interaction-guards";
import { recordQuestionShown, recordQuestionAnswer } from "./question-review";
import { INITIAL_STATE, restoreState, type GameState } from "./save-state";

type Sector = "vectors" | "bases" | "applications" | "matrices";
type GameTab = "network" | "instruments" | "anomalies" | "atlas";
type PurchaseAmount = 1 | 10 | 25 | "max";


type Question = {
  id: string;
  recallKey?: string;
  workshopId?: string;
  taskKind?: string;
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

type EmittedVectorVisual = {
  angle: number;
  length: number;
  mappedAngle: number;
  mappedLength: number;
};

const LEGACY_SAVE_KEY = "reseau-des-espaces-v1";
const PREVIOUS_SAVE_KEY = "eigenforge-v2";
const SAVE_KEY = "eigenforge-v3";


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

const WORKSHOP_CHAPTERS = WORKSHOP_CYCLES.map((cycle) => cycle.title);
const PURCHASE_AMOUNTS: PurchaseAmount[] = [1, 10, 25, "max"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



function protocolEffect(index: number, level: number) {
  if (level === 0) return "Aucun bonus actif";
  if (index === 0) return `Émission manuelle : +${level * 15} %`;
  if (index === 1) return `Production passive : +${level * 8} %`;
  if (index === 2) {
    const reduction = Math.round(
      (1 - protocolWorkshopCostMultiplier([0, 0, level])) * 100,
    );
    return `Prix des ateliers : −${reduction} %`;
  }
  if (index === 3) return `Stabilité de résonance : +${level * 8} %`;
  if (index === 4) return `Réponses justes : +${level * 10} %`;
  if (index === 5) return `Jusqu’à ${INHERITED_UNIT_CAPS[level]} unités par atelier connu`;
  if (index === 6) return `Dix premières unités des ateliers archivés : −${level * 12} %`;
  if (index === 7) return `${[0, 1, 3, 5][level]} modules automatiques par atelier`;
  return `Anciens ateliers renforcés jusqu’à ${level === 1 ? 25 : 50} unités`;
}

function anomalyDelay(allTime: number) {
  const spatialUnlock =
    INSTRUMENTS[instrumentIndex("spatial-forge")].unlock;
  const [minimum, maximum] =
    allTime < spatialUnlock ? [45, 60] : [65, 90];
  return randomInt(minimum, maximum) * 1000;
}

function formatMultiplier(value: number) {
  return value.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value < 10 && !Number.isInteger(value) ? 1 : 0,
  });
}


export default function Home() {
  useInteractionGuards();
  const [game, setGame] = useState<GameState>(INITIAL_STATE);
  const latestGame = useRef(game);
  useEffect(() => { latestGame.current = game; }, [game]);
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
  const [expandedWorkshop, setExpandedWorkshop] = useState<number | null>(
    null,
  );
  const [purchaseAmount, setPurchaseAmount] =
    useState<PurchaseAmount>(1);
  const [emitBurst, setEmitBurst] = useState(0);
  const [isEmitting, setIsEmitting] = useState(false);
  const [emittedVector, setEmittedVector] =
    useState<EmittedVectorVisual>({
      angle: -28,
      length: 26,
      mappedAngle: 42,
      mappedLength: 27,
    });

  const rate = useMemo(() => boostedProduction(game, game.lastTick), [game]);
  const manualPower = useMemo(() => clickPower(game), [game]);
  // Le premier exemplaire de chaque atelier structurel ajoute un vecteur à la
  // base. Les exemplaires suivants renforcent la production sans changer dim(E).
  const spaceDimension =
    instrumentLevel(game.instruments, "dimension-extension") > 0
      ? 4
      : instrumentLevel(game.instruments, "spatial-forge") > 0
        ? 3
        : instrumentLevel(game.instruments, "plane-deployer") > 0
          ? 2
          : instrumentLevel(game.instruments, "axis-generator") > 0
            ? 1
            : 0;
  const basisVectors = ["e₁", "e₂", "e₃", "e₄"].slice(
    0,
    spaceDimension,
  );
  const spaceGeneratorList = basisVectors.join(", ");

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
    if (!mounted) return;
    const currentSave = window.localStorage.getItem(SAVE_KEY);
    const previousSave = window.localStorage.getItem(PREVIOUS_SAVE_KEY) ?? window.localStorage.getItem(LEGACY_SAVE_KEY);
    const restored = restoreState(currentSave ?? previousSave);
    const now = Date.now();
    const elapsed = Math.min(Math.max(0, now - restored.lastTick), 2 * 60 * 60 * 1000);
    const offlineGain = production(restored) * (elapsed / 1000);
    const readyAnomaly =
      restored.allTime >= 15 && now >= restored.nextAnomalyAt
        ? Math.min(3, restored.anomalies + 1)
        : restored.anomalies;
    setGame({
      ...creditIncome(restored, offlineGain),
      anomalies: readyAnomaly,
      nextAnomalyAt:
        readyAnomaly > restored.anomalies
          ? now + anomalyDelay(restored.allTime)
          : restored.nextAnomalyAt,
      lastTick: now,
    });
    if (!currentSave && previousSave) {
      setNotice("Économie mise à jour. Votre ancienne sauvegarde reste conservée et vos points gagnés sont préservés.");
    } else if (offlineGain >= 1) {
      setNotice(`Le réseau a produit ${formatNumber(offlineGain)} coordonnées pendant votre absence.`);
    }
    setHydrated(true);
    const nextIndex = restored.instruments.findIndex(n => n === 0);
    if (nextIndex >= 0) setActiveWorkshopChapter(INSTRUMENTS[nextIndex].chapter);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setInterval(() => {
      setGame((previous) => {
        const now = Date.now();
        const elapsed = Math.min(1, Math.max(0, (now - previous.lastTick) / 1000));
        const boostedSeconds = Math.min(elapsed, Math.max(0, (previous.boostUntil - previous.lastTick) / 1000));
        const gain = production(previous) * (elapsed + boostedSeconds);
        let anomalies = previous.anomalies;
        let nextAnomalyAt = previous.nextAnomalyAt;
        if (previous.allTime >= 15 && now >= nextAnomalyAt && anomalies < 3) {
          anomalies += 1;
          nextAnomalyAt = now + anomalyDelay(previous.allTime);
        } else if (anomalies >= 3 && now >= nextAnomalyAt) {
          nextAnomalyAt = now + 25000;
        }
        const updated = {
          ...creditIncome(previous, gain),
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
        return document.visibilityState === "visible" ? automaticPurchase(updated, now) : updated;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const persist = () => {
      try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(latestGame.current)); }
      catch { /* A full or restricted browser store must not stop the game. */ }
    };
    const saver = window.setInterval(persist, 2500);
    window.addEventListener("pagehide", persist);
    return () => { window.clearInterval(saver); window.removeEventListener("pagehide", persist); };
  }, [hydrated]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);


  function emitVector() {
    if (!hydrated) return;
    setEmittedVector((previous) => {
      let angle =
        spaceDimension === 1
          ? previous.angle === -28
            ? 152
            : -28
          : randomInt(-165, 194);
      const angularGap = Math.abs(
        ((angle - previous.angle + 540) % 360) - 180,
      );
      if (spaceDimension > 1 && angularGap < 18) {
        angle = ((angle + 48 + 180) % 360) - 180;
      }
      return {
        angle,
        length: randomInt(19, 34),
        mappedAngle: angle + randomInt(38, 128),
        mappedLength: randomInt(18, 32),
      };
    });
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
        ...creditIncome(previous, gain),
        resonance: Math.min(100, previous.resonance + 9),
        anomalies: firstAnomaly ? 1 : previous.anomalies,
        nextAnomalyAt: firstAnomaly
          ? Date.now() + anomalyDelay(previous.allTime + gain)
          : previous.nextAnomalyAt,
      };
    });
  }

  function buyInstrument(index: number, requestedAmount: PurchaseAmount) {
    setGame(previous => purchaseWorkshop(previous, index, requestedAmount === "max"
      ? maxAffordableWorkshopQuantity(previous, index) : requestedAmount));
  }
  function buyWorkshopModule(index: number, moduleIndex: number) {
    setGame(previous => purchaseModule(previous, index, moduleIndex));
  }
  function buyWorkshopMastery(index: number) {
    setGame(previous => purchaseMastery(previous, index));
  }
  function buyProtocol(index: number) {
    setGame(previous => purchaseProtocol(previous, index));
  }

  function openAnomaly() {
    if (game.anomalies <= 0) return;
    const sectors: Sector[] = ["vectors"];
    if (instrumentLevel(game.instruments, "plane-deployer") > 0) {
      sectors.push("bases");
    }
    if (instrumentLevel(game.instruments, "linear-transformer") > 0) {
      sectors.push("applications");
    }
    if (instrumentLevel(game.instruments, "matrix-encoder") > 0) {
      sectors.push("matrices");
    }
    const weakest = [...sectors].sort(
      (left, right) => game.mastery[left] - game.mastery[right],
    );
    const pool = Math.random() < 0.55 ? [weakest[0]] : sectors;
    const highestOwnedInstrument = game.instruments.reduce(
      (highest, count, index) => (count > 0 ? index : highest),
      -1,
    );
    const gate = pendingGate(game);
    const gateFamilies = gate ? WORKSHOP_EXERCISE_FAMILIES.filter(family => family.minInstrument >= (gate - 2) * 4 && family.minInstrument < (gate - 1) * 4 && family.minInstrument <= highestOwnedInstrument) : [];
    // During a frontier validation, offer only already-built workshops from
    // the previous cycle; do not strand the player in unrelated old questions.
    const next = gateFamilies.length
      ? gateFamilies[randomInt(0, gateFamilies.length - 1)].generate(spaceDimension, game.questionHistory)
      : generateExercise(pool, spaceDimension, highestOwnedInstrument, game.questionHistory);
    setQuestion(next);
    setGame((previous) => ({ ...previous, questionHistory: recordQuestionShown(previous.questionHistory, next) }));
    setAnswer(null);
  }

  function chooseAnswer(index: number) {
    if (!question || answer) return;
    const isCorrect = question.choices[index].correct;
    const reward = questionReward(game, isCorrect);
    setAnswer({ choice: index, correct: isCorrect, reward });
    setGame((previous) => {
      const now = Date.now();
      return {
        ...applyEconomicAnswer(previous, question, isCorrect, now),
        anomalies: Math.max(0, previous.anomalies - 1),
        nextAnomalyAt: isCorrect
          ? previous.nextAnomalyAt
          : Math.min(previous.nextAnomalyAt, now + 30000),
        correctAnswers: previous.correctAnswers + (isCorrect ? 1 : 0),
        questionHistory: recordQuestionAnswer(previous.questionHistory, question, isCorrect),
      };
    });
  }

  function closeQuestion() {
    setQuestion(null);
    setAnswer(null);
  }

  function changeBasis() {
    setGame((previous) => {
      const restarted = restartEconomy(previous);
      if (restarted === previous) return previous;
      return {
        ...restarted,
        anomalies: 0,
        lastTick: Date.now(),
        nextAnomalyAt: Date.now() + 8000,
      };
    });
    setConfirmBasisChange(false);
    setActiveTab("network");
    setExpandedWorkshop(null);
    setNotice(`Nouvelle base : +${formatDecimal(restartPreview.productionIncrease, 1)} % de puissance, ${restartPreview.retainedCount} atelier${restartPreview.retainedCount > 1 ? "s" : ""} au démarrage. Vos invariants sont disponibles dans l’Atlas.`);
  }

  function resetGame() {
    window.localStorage.removeItem(SAVE_KEY);
    window.localStorage.removeItem(PREVIOUS_SAVE_KEY);
    window.localStorage.removeItem(LEGACY_SAVE_KEY);
    setGame({
      ...INITIAL_STATE,
      lastTick: Date.now(),
      nextAnomalyAt: Date.now() + 8000,
    });
    setConfirmReset(false);
    setExpandedWorkshop(null);
    setNotice("La carte a été entièrement effacée.");
  }

  const frontier = frontierCycle(game.highestWorkshop);
  const rawInvariantGain = invariantGain(game.runTotal, frontier, game.frontierResets);
  const invariantGainCap = basisChangeGainCap(frontier);
  const pendingInvariantGain = basisChangeGain(
    game.runTotal,
    frontier, game.frontierResets,
  );
  const invariantGainSaturated =
    rawInvariantGain >= invariantGainCap;
  const followingInvariantThreshold = nextInvariantThreshold(pendingInvariantGain, frontier, game.frontierResets);
  const restartPreview = basisChangePreview(game.runTotal, game.totalInvariants, game.protocols, game.instruments, game.highestWorkshop, game.frontierResets);
  const currentInvariantMultiplier = restartPreview.currentMultiplier;
  const futureInvariantMultiplier = restartPreview.futureMultiplier;
  const startingProduction = pendingInvariantGain > 0 ? production(restartEconomy(game)) : 0;
  const extraInvariantPreview = invariantProductionMultiplier(game.totalInvariants + pendingInvariantGain + 1);
  const upcomingProtocols = [5, 6].filter(index => {
    const level = game.protocols[index] ?? 0;
    return level < INVARIANT_PROTOCOLS[index].maxLevel && protocolUnlockCycle(index, level) <= frontier && invariantProtocolCost(index, level) <= game.invariants + pendingInvariantGain;
  });
  const unlockedSectorCount =
    1 +
    (instrumentLevel(game.instruments, "plane-deployer") > 0 ? 1 : 0) +
    (instrumentLevel(game.instruments, "linear-transformer") > 0 ? 1 : 0) +
    (instrumentLevel(game.instruments, "matrix-encoder") > 0 ? 1 : 0);
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
    Math.ceil((game.nextAnomalyAt - game.lastTick) / 1000),
  );
  const mission =
    game.allTime < 15
      ? {
          title: "Alimenter la forge",
          text: "Forgez 15 coordonnées pour provoquer la première anomalie.",
          progress: Math.min(100, (game.allTime / 15) * 100),
        }
      : nextWorkshop && workshopGateProgress(game, nextWorkshopIndex) < 3
        ? {
            title: `Valider l’entrée du cycle ${Math.floor(nextWorkshopIndex / 4) + 1}`,
            text: `Réussissez trois types de questions distincts du cycle précédent : ${workshopGateProgress(game, nextWorkshopIndex)}/3 validés. Les validations restent acquises après un changement de base.`,
            progress: workshopGateProgress(game, nextWorkshopIndex) / 3 * 100,
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
                (game.coordinates / workshopCost(game, nextWorkshopIndex)) *
                  100,
              ),
            }
          : {
              title: "Préparer un changement de base",
              text: "Renforcez les ateliers et stabilisez les anomalies.",
              progress: Math.min(
                100,
                (game.runTotal / nextInvariantThreshold(0, frontier, game.frontierResets)) * 100,
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
          <ThemeToggle />
          <div className="resource-strip" aria-label="Ressources">
            <div className="resource">
              <span>Coordonnées</span>
              <strong>{game.coordinates < 100 ? formatDecimal(game.coordinates, 1) : formatNumber(game.coordinates)}</strong>
            </div>
            <div className="resource">
              <span>Production</span>
              <strong>{formatNumber(rate)}/s</strong>
            </div>
            <div className="resource invariant-resource">
              <span>Invariants</span>
              <strong>{formatCount(game.invariants)}</strong>
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
                instrumentLevel(game.instruments, "linear-transformer") > 0 ? "has-transform" : "",
                instrumentLevel(game.instruments, "kernel-chamber") > 0 ? "has-kernel" : "",
                instrumentLevel(game.instruments, "image-forge") > 0 ? "has-image" : "",
                instrumentLevel(game.instruments, "rank-balance") > 0 ? "rank-balanced" : "",
                instrumentLevel(game.instruments, "matrix-encoder") > 0 ? "has-matrix" : "",
                instrumentLevel(game.instruments, "spectral-chamber") > 0 ? "has-spectrum" : "",
                instrumentLevel(game.instruments, "characteristic-tracer") > 0 ? "has-characteristic" : "",
                instrumentLevel(game.instruments, "diagonalizer") > 0 ? "is-diagonalized" : "",
                instrumentLevel(game.instruments, "triangularizer") > 0 ? "is-triangularized" : "",
                instrumentLevel(game.instruments, "polynomial-evaluator") > 0 ? "has-polynomial" : "",
                instrumentLevel(game.instruments, "cayley-hamilton-forge") > 0 ? "has-cayley-hamilton" : "",
                instrumentLevel(game.instruments, "adjoint-chamber") > 0 ? "has-adjoint" : "",
                instrumentLevel(game.instruments, "orthogonal-diagonalizer") > 0 ? "is-orthogonally-diagonalized" : "",
                instrumentLevel(game.instruments, "inner-product-tuner") > 0 ? "has-inner-product" : "",
                instrumentLevel(game.instruments, "metric-projector") > 0 ? "has-projection" : "",
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
                className={`transform-grid ${instrumentLevel(game.instruments, "linear-transformer") > 0 ? "visible" : ""}`}
                aria-hidden="true"
              />
              <div
                className={`kernel-space ${instrumentLevel(game.instruments, "kernel-chamber") > 0 ? "visible" : ""}`}
                aria-hidden="true"
              >
                <span>Ker(f)</span>
              </div>
              <div
                className={`image-space ${instrumentLevel(game.instruments, "image-forge") > 0 ? "visible" : ""}`}
                aria-hidden="true"
              >
                <span>Im(f)</span>
              </div>
              <div
                className={`matrix-operator ${instrumentLevel(game.instruments, "matrix-encoder") > 0 ? "visible" : ""}`}
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
                className={`spectral-marker ${instrumentLevel(game.instruments, "spectral-chamber") > 0 ? "visible" : ""}`}
                aria-hidden="true"
              >
                <span>λ₁</span>
                <span>λ₂</span>
              </div>
              <div
                className={`reduction-sequence ${instrumentLevel(game.instruments, "characteristic-tracer") > 0 ? "visible" : ""}`}
                aria-label="Progression de la réduction spectrale"
              >
                <span className={instrumentLevel(game.instruments, "characteristic-tracer") > 0 ? "active" : ""}>χA</span>
                <span className={instrumentLevel(game.instruments, "eigenspace-extractor") > 0 ? "active" : ""}>
                  <MathExpression text="E_λ" />
                </span>
                <span className={instrumentLevel(game.instruments, "diagonalizer") > 0 ? "active" : ""}>D</span>
                <span className={instrumentLevel(game.instruments, "triangularizer") > 0 ? "active" : ""}>T</span>
              </div>
              <div
                className={`polynomial-sequence ${instrumentLevel(game.instruments, "polynomial-evaluator") > 0 ? "visible" : ""}`}
                aria-label="Progression du calcul polynomial"
              >
                <span className={instrumentLevel(game.instruments, "polynomial-evaluator") > 0 ? "active" : ""}>P(u)</span>
                <span className={instrumentLevel(game.instruments, "minimal-extractor") > 0 ? "active" : ""}>πu</span>
                <span className={instrumentLevel(game.instruments, "cayley-hamilton-forge") > 0 ? "active" : ""}>χ(u)</span>
                <span className={instrumentLevel(game.instruments, "characteristic-decomposer") > 0 ? "active" : ""}>Nλ</span>
              </div>
              <div
                className={`euclidean-sequence ${instrumentLevel(game.instruments, "adjoint-chamber") > 0 ? "visible" : ""}`}
                aria-label="Progression de la réduction euclidienne"
              >
                <span className={instrumentLevel(game.instruments, "adjoint-chamber") > 0 ? "active" : ""}>u*</span>
                <span className={instrumentLevel(game.instruments, "self-adjoint-symmetrizer") > 0 ? "active" : ""}>S</span>
                <span className={instrumentLevel(game.instruments, "orthogonal-diagonalizer") > 0 ? "active" : ""}>PDPᵀ</span>
                <span className={instrumentLevel(game.instruments, "positivity-analyzer") > 0 ? "active" : ""}>
                  <MathExpression text="S^{++}" />
                </span>
              </div>
              <div
                className={`geometry-sequence ${instrumentLevel(game.instruments, "inner-product-tuner") > 0 ? "visible" : ""}`}
                aria-label="Progression des fondations euclidiennes"
              >
                <span className={instrumentLevel(game.instruments, "inner-product-tuner") > 0 ? "active" : ""}>⟨·,·⟩</span>
                <span className={instrumentLevel(game.instruments, "schmidt-orthogonalizer") > 0 ? "active" : ""}>ON</span>
                <span className={instrumentLevel(game.instruments, "orthogonal-chamber") > 0 ? "active" : ""}>
                  <MathExpression text="F^{⊥}" />
                </span>
                <span className={instrumentLevel(game.instruments, "metric-projector") > 0 ? "active" : ""}>pF</span>
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
              <div
                className={`vector-line vector-four ${game.instruments[3] > 0 ? "visible" : ""}`}
                style={{ "--angle": "148deg", "--length": "31%" } as CSSProperties}
                aria-label="Projection visuelle du quatrième vecteur de base e 4"
              >
                <span>e₄</span>
              </div>

              {isEmitting && spaceDimension > 0 && (
                <div
                  className={`forged-vector dimension-${spaceDimension}`}
                  key={`vector-${emitBurst}`}
                  style={
                    {
                      "--forge-angle": `${emittedVector.angle}deg`,
                      "--forge-length": `${emittedVector.length}%`,
                    } as CSSProperties
                  }
                  aria-hidden="true"
                >
                  <span>u</span>
                </div>
              )}
              {isEmitting && instrumentLevel(game.instruments, "linear-transformer") > 0 && (
                <div
                  className="mapped-vector"
                  key={`mapped-${emitBurst}`}
                  style={
                    {
                      "--map-angle": `${emittedVector.mappedAngle}deg`,
                      "--map-length": `${emittedVector.mappedLength}%`,
                    } as CSSProperties
                  }
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
                <strong>×{formatDecimal(1 + Math.floor(game.resonance / 25) * 0.5, 1)}</strong>
              </div>
            </div>

            <div className="mission-card">
              <div className="mission-index">{missionNumber}</div>
              <div className="mission-copy">
                <p>Mission active</p>
                <h3>{mission.title}</h3>
                <span><MathExpression text={mission.text} /></span>
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
            <div className="purchase-amount-control">
              <span>Quantité</span>
              <div role="group" aria-label="Quantité d’unités à forger">
                {PURCHASE_AMOUNTS.map((amount) => (
                  <button
                    type="button"
                    className={purchaseAmount === amount ? "active" : ""}
                    aria-pressed={purchaseAmount === amount}
                    onClick={() => setPurchaseAmount(amount)}
                    key={amount}
                  >
                    {amount === "max" ? "Max" : amount}
                  </button>
                ))}
              </div>
            </div>
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
                  workshopOutput(
                    index,
                    game.instruments[index] ?? 0,
                    game.instrumentModules[index],
                    game.instrumentMasteries[index] ?? 0,
                  ),
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
                  onClick={() => {
                    setActiveWorkshopChapter(chapter);
                    setExpandedWorkshop(null);
                  }}
                  key={chapter}
                >
                  <span>Cycle {String(chapterIndex + 1).padStart(2, "0")}</span>
                  <strong>{chapter}</strong>
                  <small>
                    {accessible
                      ? `${builtWorkshops}/${chapterIndices.length} actifs · ${formatNumber(chapterRate)}/s`
                      : "Aperçu verrouillé"}
                  </small>
                </button>
              );
            })}
          </nav>
          <p className="cycle-scroll-hint" aria-hidden="true">
            Balayez pour parcourir les {WORKSHOP_CYCLES.length} cycles <span>→</span>
          </p>

          <div className="instrument-list">
            {WORKSHOP_CHAPTERS.map(
              (chapter, chapterIndex) => (
                <section
                  className="workshop-sector"
                  hidden={activeWorkshopChapter !== chapter}
                  key={chapter}
                >
                  <div className="workshop-sector-heading">
                    <span>Cycle {String(chapterIndex + 1).padStart(2, "0")}</span>
                    <h3>{chapter}</h3>
                  </div>
                  <div className="workshop-grid">
                    {INSTRUMENTS.map((instrument, index) => {
                      if (instrument.chapter !== chapter) return null;
                      const prerequisiteOwned =
                        index === 0 || (game.instruments[index - 1] ?? 0) > 0;
                      const gateProgress = workshopGateProgress(game, index);
                      const unlocked = canOpenWorkshop(game, index);
                      const count = game.instruments[index] ?? 0;
                      const purchaseQuantity =
                        purchaseAmount === "max"
                          ? maxAffordableWorkshopQuantity(game, index)
                          : purchaseAmount;
                      const cost =
                        purchaseQuantity > 0
                          ? workshopBulkCost(
                              game,
                              index,
                              purchaseQuantity,
                            )
                          : workshopCost(game, index);
                      const affordable =
                        purchaseQuantity > 0 &&
                        canAfford(game, exactWorkshopBulkCost(game, index, purchaseQuantity));
                      const modules =
                        game.instrumentModules[index] ??
                        WORKSHOP_MODULES.map(() => 0);
                      const moduleCount = modules.filter(
                        (module) => module > 0,
                      ).length;
                      const masteryRank =
                        game.instrumentMasteries[index] ?? 0;
                      const nextModuleIndex = WORKSHOP_MODULES.findIndex(
                        (_, moduleIndex) =>
                          (modules[moduleIndex] ?? 0) === 0,
                      );
                      const availableModuleCount =
                        WORKSHOP_MODULES.filter(
                          (module, moduleIndex) =>
                            count >= module.threshold &&
                            (modules[moduleIndex] ?? 0) === 0,
                        ).length;
                      const allModulesOwned =
                        moduleCount === WORKSHOP_MODULES.length;
                      const nextMasteryLevel =
                        workshopMasteryThreshold(masteryRank);
                      const masteryAvailable =
                        allModulesOwned && count >= nextMasteryLevel;
                      const availableUpgradeCount =
                        availableModuleCount + (masteryAvailable ? 1 : 0);
                      const instrumentRate = workshopOutput(
                        index,
                        count,
                        modules,
                        masteryRank,
                      );
                      const upgradeMultiplier =
                        workshopModuleMultiplier(modules) *
                        workshopMasteryMultiplier(masteryRank);
                      const expanded = expandedWorkshop === index;
                      const nextTarget =
                        availableUpgradeCount > 0
                          ? `${availableUpgradeCount} amélioration${availableUpgradeCount > 1 ? "s" : ""} disponible${availableUpgradeCount > 1 ? "s" : ""}`
                          : nextModuleIndex >= 0
                            ? `${Math.max(0, WORKSHOP_MODULES[nextModuleIndex].threshold - count)} niveaux avant ${WORKSHOP_MODULES[nextModuleIndex].name}`
                            : `${Math.max(0, nextMasteryLevel - count)} niveaux avant la maîtrise ${masteryRank + 1}`;
                      const lockedDescription = !prerequisiteOwned
                        ? `Nécessite d’abord ${INSTRUMENTS[index - 1].name}.`
                        : gateProgress < 3 ? `Validez trois types de questions du cycle précédent (${gateProgress}/3).`
                        : `Se révèle à ${formatNumber(instrument.unlock)} coordonnées cumulées.`;
                      return (
                        <article
                          className={[
                            "instrument-card",
                            unlocked ? "" : "locked",
                            expanded ? "expanded" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          key={instrument.id}
                        >
                          <div className={`instrument-mark${instrument.id === "isometry-forge" ? " instrument-mark-equation" : ""}${["stable-subspace-chamber", "commutation-coupler"].includes(instrument.id) ? " instrument-mark-compact" : ""}`} aria-hidden="true">
                            <MathExpression text={instrument.mark} />
                          </div>
                          <div className="instrument-copy">
                            <div className="instrument-title">
                              <div>
                                <span>{instrument.sector}</span>
                                <h3>{instrument.name}</h3>
                              </div>
                              <strong>{count}</strong>
                            </div>
                            <p>
                              <MathExpression
                                text={unlocked ? instrument.description : lockedDescription}
                              />
                            </p>
                            <div
                              className="module-pips"
                              aria-label={`Modules de ${instrument.name} : ${moduleCount} sur ${WORKSHOP_MODULES.length} installés`}
                            >
                              {WORKSHOP_MODULES.map((module, moduleIndex) => {
                                const owned =
                                  (modules[moduleIndex] ?? 0) > 0;
                                const available =
                                  !owned && count >= module.threshold;
                                return (
                                  <span
                                    className={
                                      owned
                                        ? "owned"
                                        : available
                                          ? "available"
                                          : ""
                                    }
                                    title={`${module.name} · niveau ${module.threshold}`}
                                    key={module.name}
                                  >
                                    <small>{module.threshold}</small>
                                  </span>
                                );
                              })}
                            </div>
                            <div className="instrument-bottom">
                              <div className="instrument-output">
                                <span>{formatNumber(instrumentRate)}/s</span>
                                <small>{nextTarget}</small>
                              </div>
                              <button
                                className={`workshop-buy ${unlocked && affordable ? "ready" : ""}`}
                                type="button"
                                onClick={() =>
                                  buyInstrument(index, purchaseAmount)
                                }
                                disabled={!unlocked || !affordable}
                                aria-label={
                                  gateProgress < 3 && prerequisiteOwned
                                    ? `Valider trois types de questions du cycle précédent pour ${instrument.name} : ${gateProgress} sur 3`
                                  : purchaseQuantity > 0
                                    ? `Construire ${purchaseQuantity} unité${purchaseQuantity > 1 ? "s" : ""} de ${instrument.name} pour ${formatNumber(cost)} coordonnées`
                                    : `Coordonnées insuffisantes pour construire une unité de ${instrument.name}`
                                }
                              >
                                <span className="workshop-buy-copy">
                                  <small>
                                    {unlocked
                                      ? purchaseAmount === "max"
                                        ? purchaseQuantity > 0
                                          ? `Forger ${purchaseQuantity} unité${purchaseQuantity > 1 ? "s" : ""}`
                                          : "Forger au maximum"
                                        : `Forger ${purchaseQuantity === 1 ? "une" : purchaseQuantity} unité${purchaseQuantity > 1 ? "s" : ""}`
                                      : prerequisiteOwned
                                        ? gateProgress < 3 ? "Frontière à valider" : "Atelier verrouillé"
                                        : "Prérequis manquant"}
                                  </small>
                                  <strong>
                                    {unlocked
                                      ? formatNumber(cost)
                                      : prerequisiteOwned
                                        ? gateProgress < 3 ? `${gateProgress}/3 questions` : formatNumber(instrument.unlock)
                                        : "—"}
                                    {prerequisiteOwned && gateProgress >= 3 && <em> coord.</em>}
                                  </strong>
                                </span>
                                <span className="workshop-buy-mark" aria-hidden="true">
                                  {unlocked ? "+" : "◇"}
                                </span>
                              </button>
                            </div>
                          </div>
                          <div className="workshop-upgrades">
                              <button
                                className={`upgrade-toggle ${availableUpgradeCount > 0 ? "ready" : ""}`}
                                type="button"
                                aria-expanded={expanded}
                                aria-controls={`workshop-upgrades-${index}`}
                                onClick={() =>
                                  setExpandedWorkshop((current) =>
                                    current === index ? null : index,
                                  )
                                }
                                disabled={!unlocked || count === 0}
                              >
                                <span>
                                  <small>Améliorations</small>
                                  <strong>
                                    {moduleCount}/{WORKSHOP_MODULES.length} modules
                                    · maîtrise {masteryRank}
                                  </strong>
                                </span>
                                <em>
                                  {availableUpgradeCount > 0
                                    ? `+${availableUpgradeCount}`
                                    : expanded
                                      ? "−"
                                      : "+"}
                                </em>
                              </button>

                              {expanded && (
                                <div
                                  className="upgrade-panel"
                                  id={`workshop-upgrades-${index}`}
                                >
                                  <div className="upgrade-panel-heading">
                                    <span>Architecture de l’atelier</span>
                                    <strong>
                                      Production ×{formatMultiplier(upgradeMultiplier)}
                                    </strong>
                                  </div>

                                  <div className="module-list">
                                    {WORKSHOP_MODULES.map(
                                      (module, moduleIndex) => {
                                        const owned =
                                          (modules[moduleIndex] ?? 0) > 0;
                                        const available =
                                          !owned && count >= module.threshold;
                                        const cost = moduleCost(
                                          game,
                                          index,
                                          moduleIndex,
                                        );
                                        const affordable =
                                          canAfford(game, cost);
                                        return (
                                          <div
                                            className={[
                                              "module-row",
                                              owned ? "owned" : "",
                                              available ? "available" : "",
                                            ]
                                              .filter(Boolean)
                                              .join(" ")}
                                            key={module.name}
                                          >
                                            <span className="module-mark">
                                              {module.mark}
                                            </span>
                                            <div className="module-copy">
                                              <strong>{module.name}</strong>
                                              <small>
                                                Niv. {module.threshold} · ×
                                                {formatMultiplier(
                                                  module.multiplier,
                                                )} · {module.description}
                                              </small>
                                            </div>
                                            {owned ? (
                                              <span className="module-state">
                                                Installé
                                              </span>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  buyWorkshopModule(
                                                    index,
                                                    moduleIndex,
                                                  )
                                                }
                                                disabled={
                                                  !available || !affordable
                                                }
                                                aria-label={`Installer ${module.name} sur ${instrument.name} pour ${formatNumber(cost)} coordonnées`}
                                              >
                                                {available
                                                  ? formatNumber(cost)
                                                  : `Niv. ${module.threshold}`}
                                              </button>
                                            )}
                                          </div>
                                        );
                                      },
                                    )}
                                  </div>

                                  <div
                                    className={`workshop-mastery-row ${masteryAvailable ? "available" : ""}`}
                                  >
                                    <span className="mastery-mark">
                                      {masteryRank + 1}
                                    </span>
                                    <div>
                                      <strong>
                                        Maîtrise {masteryRank + 1}
                                      </strong>
                                      <small>
                                        Niveau {nextMasteryLevel} · double la
                                        production propre de l’atelier.
                                      </small>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        buyWorkshopMastery(index)
                                      }
                                      disabled={
                                        !masteryAvailable ||
                                        !canAfford(game, masteryCost(game, index))
                                      }
                                      aria-label={`Acquérir la maîtrise ${masteryRank + 1} de ${instrument.name} pour ${formatNumber(masteryCost(game, index))} coordonnées`}
                                    >
                                      {allModulesOwned
                                        ? masteryAvailable
                                          ? formatNumber(
                                              masteryCost(game, index),
                                            )
                                          : `Niv. ${nextMasteryLevel}`
                                        : "5 modules"}
                                    </button>
                                  </div>
                                </div>
                              )}
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

          <div className="economy-status" aria-live="polite">
            <strong>{game.boostUntil > game.lastTick ? `Production ×2 · ${Math.ceil((game.boostUntil - game.lastTick) / 1000)} s restantes` : `Série de bonnes réponses : ${game.streak}/3`}</strong>
            <span>Trois bonnes réponses consécutives déclenchent 60 secondes de production doublée. Une erreur ne rapporte rien, mais ne retire aucune coordonnée.</span>
            {pendingGate(game) && <span>Frontière du cycle {pendingGate(game)} : {game.gateValidations[pendingGate(game)!]?.length ?? 0}/3 types de questions validés dans le cycle précédent.</span>}
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
                {pendingGate(game)
                  ? "À cette frontière, les anomalies portent sur les ateliers construits du cycle précédent. Réussissez trois types distincts pour valider l’entrée du suivant."
                  : "Les anomalies puisent d’abord dans le secteur débloqué dont la maîtrise est la plus faible. Une erreur déclenche une correction, sans retirer de coordonnées."}
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
                <span className={instrumentLevel(game.instruments, "linear-transformer") === 0 ? "locked" : ""}>
                  Applications
                </span>
                <span className={instrumentLevel(game.instruments, "matrix-encoder") === 0 ? "locked" : ""}>
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
                    ? instrumentLevel(game.instruments, "linear-transformer") === 0
                    : sector === "matrices"
                      ? instrumentLevel(game.instruments, "matrix-encoder") === 0
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
                    ? `+${formatCount(pendingInvariantGain)} invariant${pendingInvariantGain > 1 ? "s" : ""}`
                    : "Structure insuffisante"}
                </strong>
                <span className="basis-detail">
                  Bonus permanent actuel : ×{formatDecimal(currentInvariantMultiplier, 2)}
                </span>
                {pendingInvariantGain > 0 && (
                  <span className="basis-detail">
                    Au redémarrage : +{formatDecimal(restartPreview.productionIncrease, 1)} % de puissance · {restartPreview.retainedCount} atelier{restartPreview.retainedCount > 1 ? "s" : ""} hérité{restartPreview.retainedCount > 1 ? "s" : ""}
                  </span>
                )}
                <span className="basis-detail">
                  {invariantGainSaturated
                    ? "Résonance saturée · changez de base"
                    : `Prochain invariant dans ${formatNumber(
                        Math.max(0, followingInvariantThreshold - game.runTotal),
                      )} coordonnées`}
                </span>
                <span className="basis-detail">Cycle {frontier} · plafond : +{formatCount(invariantGainCap)} invariants</span>
                <span className="basis-detail">Même frontière : les seuils doublent à chaque redémarrage. Ouvrir un nouveau cycle remet cette pénalité à zéro.</span>
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
                <h3>Préparer les prochains changements de base</h3>
                <span>
                  Dépenser un invariant ne réduit jamais le bonus permanent déjà
                  gagné avec les changements de base.
                </span>
              </div>
              <div className="protocol-balance">
                <strong>{formatCount(game.invariants)}</strong>
                <span>invariant{game.invariants > 1 ? "s" : ""} disponible{game.invariants > 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="protocol-grid">
              {INVARIANT_PROTOCOLS.map((protocol, index) => {
                const level = game.protocols[index] ?? 0;
                const cost = invariantProtocolCost(index, level);
                const complete = level >= protocol.maxLevel;
                const requiredCycle = protocolUnlockCycle(index, level);
                const affordable = !complete && requiredCycle <= frontier && game.invariants >= cost;
                return (
                  <article
                    className={`protocol-card ${complete ? "complete" : ""}`}
                    key={protocol.name}
                  >
                    <div className="protocol-mark" aria-hidden="true">
                      <MathExpression text={protocol.mark} />
                    </div>
                    <div className="protocol-copy">
                      <div>
                        <span>Niveau {level}/{protocol.maxLevel}</span>
                        <h4>{protocol.name}</h4>
                      </div>
                      <p><MathExpression text={protocol.description} /></p>
                      <strong className="protocol-effect">
                        <MathExpression text={protocolEffect(index, level)} />
                      </strong>
                      {!complete && requiredCycle > frontier && <small>Prochain niveau disponible au cycle {requiredCycle}</small>}
                      {index >= 7 && level > 0 && (
                        <label className="automation-toggle">
                          <input type="checkbox" checked={game.automationEnabled[index - 7]} onChange={event => {
                            const enabled = event.target.checked;
                            setGame(previous => ({ ...previous, automationEnabled: previous.automationEnabled.map((value, i) => i === index - 7 ? enabled : value) }));
                          }} />
                          Activer les achats automatiques
                        </label>
                      )}
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
                            {requiredCycle > frontier ? `Cycle ${requiredCycle} requis` : "Renforcer"}
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
        <span>Programme MPSI · MP · Algèbre linéaire</span>
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
                {(question.geometry || question.trap) && <div className="correction-columns">
                  {question.geometry && <div>
                    <span>Lecture géométrique</span>
                    <p><MathExpression text={question.geometry} /></p>
                  </div>}
                  {question.trap && <div>
                    <span>Point de vigilance</span>
                    <p><MathExpression text={question.trap} /></p>
                  </div>}
                </div>}
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
                  Repartez avec vos ateliers hérités et une production renforcée.
                </span>
              </div>
              <div className="basis-gain-seal" aria-label={`${pendingInvariantGain} invariants gagnés`}>
                <strong>+{formatCount(pendingInvariantGain)}</strong>
                <span>invariant{pendingInvariantGain > 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="multiplier-preview">
              <div>
                <span>Multiplicateur actuel</span>
                <strong>×{formatDecimal(currentInvariantMultiplier, 2)}</strong>
              </div>
              <span className="multiplier-arrow" aria-hidden="true">→</span>
              <div>
                <span>Après le changement</span>
                <strong>×{formatDecimal(futureInvariantMultiplier, 2)}</strong>
              </div>
            </div>

            <div className="basis-restart-summary">
              <strong>+{formatDecimal(restartPreview.productionIncrease, 1)} % de production et d’émission, à ateliers identiques</strong>
              <span>Au démarrage : {restartPreview.retainedCount} ateliers connus, avec jusqu’à {restartPreview.unitCap} unité{restartPreview.unitCap > 1 ? "s" : ""} chacun, sans dépasser ce qui était déjà construit. Aucun atelier inédit n’est offert.</span>
              <span>Production au redémarrage : {formatNumber(startingProduction)}/s, avant reconstruction des unités et des modules.</span>
              {restartPreview.reconstructionDiscount > 0 && (
                <span>Premiers achats : −{restartPreview.reconstructionDiscount} % sur les dix premières unités de chaque atelier archivé.</span>
              )}
            </div>

            <div className="basis-impact-grid">
              <section className="impact-card lost">
                <p>Remis à zéro</p>
                <ul>
                  <li><strong>{formatNumber(game.coordinates)}</strong> coordonnées disponibles</li>
                  <li>Les niveaux et améliorations des ateliers, sauf les unités héritées</li>
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
                  <li>Les validations des frontières de cycles</li>
                </ul>
              </section>

              <section className="impact-card gained">
                <p>Gagné</p>
                <ul>
              <li><strong>+{formatCount(pendingInvariantGain)}</strong> invariant{pendingInvariantGain > 1 ? "s" : ""}</li>
                  <li>Production passive ×{formatDecimal(futureInvariantMultiplier, 2)}</li>
                  <li>Émission manuelle ×{formatDecimal(futureInvariantMultiplier, 2)}</li>
                  <li><strong>{restartPreview.retainedCount}</strong> atelier{restartPreview.retainedCount > 1 ? "s" : ""} prêt{restartPreview.retainedCount > 1 ? "s" : ""} à produire au redémarrage</li>
                </ul>
              </section>
            </div>

            {upcomingProtocols.length > 0 && (
              <div className="basis-restart-options">
                <strong>À acheter dans l’Atlas avec vos {formatCount(game.invariants + pendingInvariantGain)} invariants après le changement</strong>
                {upcomingProtocols.map(index => (
                  <p key={index}>
                    {INVARIANT_PROTOCOLS[index].name} · {invariantProtocolCost(index, game.protocols[index] ?? 0)} invariant{invariantProtocolCost(index, game.protocols[index] ?? 0) > 1 ? "s" : ""} : {index === 5 ? `jusqu’à ${INHERITED_UNIT_CAPS[(game.protocols[5] ?? 0) + 1]} unités de chaque atelier connu au changement suivant` : `−${((game.protocols[6] ?? 0) + 1) * 12} % sur les premiers achats des ateliers archivés`}.
                  </p>
                ))}
                {upcomingProtocols.length > 1 && <small>Ces achats sont indépendants : vérifiez le solde disponible pour les combiner.</small>}
              </div>
            )}

            {!invariantGainSaturated && (
              <p className="basis-wait-option">
                En produisant encore {formatNumber(Math.max(0, followingInvariantThreshold - game.runTotal))} coordonnées avant de changer de base : +{formatCount(pendingInvariantGain + 1)} invariants, puis ×{formatDecimal(extraInvariantPreview, 2)} de puissance permanente (+{formatDecimal(100 * (extraInvariantPreview / currentInvariantMultiplier - 1), 1)} %).
              </p>
            )}
            {invariantGainSaturated && (
              <p className="basis-wait-option">Plafond atteint : +{formatCount(invariantGainCap)} invariant{invariantGainCap > 1 ? "s" : ""}. Attendre avant de changer de base ne rapporte plus d’invariants supplémentaires.</p>
            )}

            <p className="basis-modal-note">
              Le plafond dépend du cycle le plus avancé : numéro du cycle + 1.
              À la même frontière, les seuils doublent après chaque changement ;
              ouvrir un nouveau cycle remet cette pénalité à zéro.
              Les points gagnés renforcent durablement la production et l’émission,
              même après leur dépense. Les changements de base réguliers sont
              conseillés : sans eux, atteindre les cycles avancés prend nettement plus de temps.
            </p>

            <div className="basis-modal-actions">
              <button type="button" onClick={() => setConfirmBasisChange(false)}>
                Continuer cette partie
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
