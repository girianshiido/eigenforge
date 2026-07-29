"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EXERCISE_FAMILIES,
  generateQuestion,
  type Question,
  type Sector,
} from "./question-generator";
import MathExpression from "./math-expression";
import ThemeToggle from "./theme-toggle";
import { useInteractionGuards } from "./use-interaction-guards";

type SectorFilter = Sector | "all";

const SECTORS: Array<{
  id: SectorFilter;
  label: string;
  mark: string;
}> = [
  { id: "all", label: "Tout le catalogue", mark: "✦" },
  { id: "vectors", label: "Vecteurs", mark: "→" },
  { id: "bases", label: "Bases", mark: "◇" },
  { id: "applications", label: "Applications", mark: "ƒ" },
  { id: "matrices", label: "Matrices", mark: "▦" },
];

const SECTOR_LABELS: Record<Sector, string> = {
  vectors: "Vecteurs",
  bases: "Bases",
  applications: "Applications",
  matrices: "Matrices",
};

const LETTERS = ["A", "B", "C", "D"];

function makeQuestion(
  sector: SectorFilter,
  familyId: string,
  dimension: 2 | 3,
) {
  const selectedFamily = EXERCISE_FAMILIES.find(
    (family) => family.id === familyId,
  );
  if (selectedFamily) return selectedFamily.generate(dimension);

  const sectors =
    sector === "all"
      ? (["vectors", "bases", "applications", "matrices"] as Sector[])
      : [sector];
  return generateQuestion(
    sectors,
    dimension,
    Number.POSITIVE_INFINITY,
  );
}

export default function ExerciseLab() {
  useInteractionGuards();
  const [sector, setSector] = useState<SectorFilter>("all");
  const [familyId, setFamilyId] = useState("all");
  const [dimension, setDimension] = useState<2 | 3>(3);
  const [question, setQuestion] = useState<Question>(() =>
    makeQuestion("all", "all", 3),
  );
  const [answerIndex, setAnswerIndex] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);

  const visibleFamilies = useMemo(
    () =>
      EXERCISE_FAMILIES.filter(
        (family) => sector === "all" || family.sector === sector,
      ),
    [sector],
  );

  const answered = answerIndex !== null;
  const isCorrect =
    answerIndex !== null && question.choices[answerIndex].correct;
  const successRate =
    attempts === 0 ? 0 : Math.round((correctAnswers / attempts) * 100);

  useEffect(() => {
    const stopGesture = (event: Event) => event.preventDefault();
    const stopMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    document.addEventListener("gesturestart", stopGesture, { passive: false });
    document.addEventListener("gesturechange", stopGesture, { passive: false });
    document.addEventListener("gestureend", stopGesture, { passive: false });
    document.addEventListener("touchmove", stopMultiTouch, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", stopGesture);
      document.removeEventListener("gesturechange", stopGesture);
      document.removeEventListener("gestureend", stopGesture);
      document.removeEventListener("touchmove", stopMultiTouch);
    };
  }, []);

  function nextQuestion(
    nextSector = sector,
    nextFamilyId = familyId,
    nextDimension = dimension,
  ) {
    setQuestion(makeQuestion(nextSector, nextFamilyId, nextDimension));
    setAnswerIndex(null);
  }

  function selectSector(nextSector: SectorFilter) {
    setSector(nextSector);
    setFamilyId("all");
    nextQuestion(nextSector, "all", dimension);
  }

  function selectFamily(nextFamilyId: string) {
    setFamilyId(nextFamilyId);
    nextQuestion(sector, nextFamilyId, dimension);
  }

  function selectDimension(nextDimension: 2 | 3) {
    setDimension(nextDimension);
    nextQuestion(sector, familyId, nextDimension);
  }

  function chooseAnswer(index: number) {
    if (answered) return;
    const correct = question.choices[index].correct;
    setAnswerIndex(index);
    setAttempts((value) => value + 1);
    if (correct) {
      setCorrectAnswers((value) => value + 1);
      setStreak((value) => value + 1);
    } else {
      setStreak(0);
    }
  }

  function resetSession() {
    setAttempts(0);
    setCorrectAnswers(0);
    setStreak(0);
    nextQuestion();
  }

  return (
    <main className="lab-shell">
      <header className="lab-topbar">
        <a className="lab-brand" href="../" aria-label="Retourner au jeu EIGENFORGE">
          <span className="lab-brand-mark" aria-hidden="true">λ</span>
          <span>
            <small>EIGENFORGE</small>
            <strong>Laboratoire d’exercices</strong>
          </span>
        </a>
        <div className="lab-topbar-actions">
          <ThemeToggle />
          <a className="lab-game-link" href="../">
            <span aria-hidden="true">←</span>
            Retour au jeu
          </a>
        </div>
      </header>

      <section className="lab-intro">
        <div>
          <p>Catalogue vivant · MPSI / MP</p>
          <h1>Tester toutes les perturbations, sans limite.</h1>
          <span>
            Cette page partage son catalogue avec le jeu. Toute nouvelle famille
            d’exercices apparaîtra ici automatiquement.
          </span>
        </div>
        <div className="lab-catalog-count" aria-label={`${EXERCISE_FAMILIES.length} familles d’exercices`}>
          <strong>{EXERCISE_FAMILIES.length}</strong>
          <span>familles reliées<br />au générateur</span>
        </div>
      </section>

      <div className="lab-layout">
        <aside className="lab-controls" aria-label="Choix des exercices">
          <section>
            <div className="lab-section-heading">
              <span>01</span>
              <h2>Domaine</h2>
            </div>
            <div className="lab-sector-list">
              {SECTORS.map((item) => (
                <button
                  type="button"
                  className={sector === item.id ? "active" : ""}
                  aria-pressed={sector === item.id}
                  onClick={() => selectSector(item.id)}
                  key={item.id}
                >
                  <span aria-hidden="true">{item.mark}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="lab-section-heading">
              <span>02</span>
              <h2>Famille</h2>
            </div>
            <label className="lab-family-select">
              <span>Type d’exercice</span>
              <select
                value={familyId}
                onChange={(event) => selectFamily(event.target.value)}
              >
                <option value="all">Mélange automatique</option>
                {visibleFamilies.map((family) => (
                  <option value={family.id} key={family.id}>
                    {family.program} · {family.label}
                  </option>
                ))}
              </select>
            </label>
            {familyId !== "all" && (
              <p className="lab-family-description">
                <MathExpression
                  text={
                    EXERCISE_FAMILIES.find(
                      (family) => family.id === familyId,
                    )?.description ?? ""
                  }
                />
              </p>
            )}
          </section>

          <section>
            <div className="lab-section-heading">
              <span>03</span>
              <h2>Dimension disponible</h2>
            </div>
            <div className="lab-dimension-switch">
              {([2, 3] as const).map((value) => (
                <button
                  type="button"
                  className={dimension === value ? "active" : ""}
                  aria-pressed={dimension === value}
                  onClick={() => selectDimension(value)}
                  key={value}
                >
                  <MathExpression
                    text={value === 2 ? "Jusqu’à ℝ²" : "Jusqu’à ℝ³"}
                  />
                </button>
              ))}
            </div>
            <p className="lab-control-note">
              <MathExpression text="Certains thèmes restent naturellement en ℝ², même lorsque ℝ³ est disponible." />
            </p>
          </section>
        </aside>

        <section className="lab-workbench" aria-live="polite">
          <div className="lab-question-meta">
            <div>
              <span>{SECTOR_LABELS[question.sector]}</span>
              <strong>{question.eyebrow}</strong>
            </div>
            <code>{question.id}</code>
          </div>

          <article className="lab-question-card">
            <div className="lab-question-copy">
              <p>Énoncé actuel</p>
              <h2><MathExpression text={question.prompt} /></h2>
              {question.formula && (
                <div className="lab-formula">
                  <MathExpression text={question.formula} />
                </div>
              )}
            </div>

            <div className="lab-answer-grid">
              {question.choices.map((choice, index) => {
                const stateClass = answered
                  ? choice.correct
                    ? "correct"
                    : answerIndex === index
                      ? "wrong"
                      : "muted"
                  : "";
                return (
                  <button
                    type="button"
                    className={stateClass}
                    disabled={answered}
                    onClick={() => chooseAnswer(index)}
                    key={`${question.id}-${choice.text}`}
                  >
                    <span>{LETTERS[index]}</span>
                    <strong><MathExpression text={choice.text} /></strong>
                  </button>
                );
              })}
            </div>

            {answered && (
              <section className={`lab-correction ${isCorrect ? "" : "error"}`}>
                <div className="lab-result">
                  <span aria-hidden="true">{isCorrect ? "✓" : "×"}</span>
                  <div>
                    <p>{isCorrect ? "Réponse exacte" : "Réponse à reprendre"}</p>
                    <strong>
                      {isCorrect
                        ? "Le raisonnement stabilise la perturbation."
                        : "La bonne réponse est maintenant indiquée."}
                    </strong>
                  </div>
                </div>
                <div className="lab-correction-main">
                  <span>Correction</span>
                  <p><MathExpression text={question.explanation} /></p>
                </div>
                <div className="lab-correction-notes">
                  <div>
                    <span>Lecture géométrique</span>
                    <p><MathExpression text={question.geometry} /></p>
                  </div>
                  <div>
                    <span>Piège à éviter</span>
                    <p><MathExpression text={question.trap} /></p>
                  </div>
                </div>
              </section>
            )}

            <div className="lab-question-actions">
              <button type="button" className="secondary" onClick={() => nextQuestion()}>
                Changer l’énoncé
              </button>
              {answered && (
                <button type="button" className="primary" onClick={() => nextQuestion()}>
                  Exercice suivant
                  <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </article>
        </section>

        <aside className="lab-session" aria-label="Résultats de la session">
          <div className="lab-section-heading">
            <span>Session</span>
            <h2>Table de contrôle</h2>
          </div>
          <div className="lab-stat-main">
            <strong>{successRate}%</strong>
            <span>de réussite</span>
          </div>
          <div className="lab-stat-grid">
            <div>
              <span>Réponses</span>
              <strong>{attempts}</strong>
            </div>
            <div>
              <span>Justes</span>
              <strong>{correctAnswers}</strong>
            </div>
            <div>
              <span>Série</span>
              <strong>{streak}</strong>
            </div>
          </div>
          <div className="lab-live-note">
            <span className="status-dot">Synchronisé</span>
            <p>
              Les résultats restent locaux à cette session et ne modifient pas
              ta partie.
            </p>
          </div>
          <button type="button" className="lab-reset" onClick={resetSession}>
            Remettre les compteurs à zéro
          </button>
        </aside>
      </div>
    </main>
  );
}
