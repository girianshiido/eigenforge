import { INSTRUMENTS, INVARIANT_PROTOCOLS } from "./game-economy.ts";
import { LEGACY_INSTRUMENT_IDS, INVARIANT_PROTOCOLS as LEGACY_PROTOCOLS, WORKSHOP_MODULES, legacyWorkshopModules, workshopMasteryThreshold } from "./game-balance.ts";
import { restoreWallet } from "./economy-state.ts";
import { emptyPracticeHistory, restorePracticeHistory, type PracticeHistory } from "./question-review.ts";
type Sector = "vectors" | "bases" | "applications" | "matrices";

export type GameState = {
  saveVersion: number;
  coordinates: number;
  coordinatesWhole: string;
  coordinatesFraction: number;
  runTotal: number;
  allTime: number;
  instruments: number[];
  instrumentIds: string[];
  instrumentModules: number[][];
  instrumentMasteries: number[];
  mastery: Record<Sector, number>;
  questionHistory: PracticeHistory;
  correctAnswers: number;
  anomalies: number;
  nextAnomalyAt: number;
  resonance: number;
  invariants: number;
  totalInvariants: number;
  protocols: number[];
  highestWorkshop: number;
  archivedHighest: number;
  frontierResets: number;
  gateValidations: Record<string, string[]>;
  streak: number;
  boostUntil: number;
  nextAutomaticAt: number;
  automationEnabled: boolean[];
  lastTick: number;
};

export const INITIAL_STATE: GameState = {
  saveVersion: 3,
  coordinates: 0,
  coordinatesWhole: "0",
  coordinatesFraction: 0,
  runTotal: 0,
  allTime: 0,
  instruments: INSTRUMENTS.map(() => 0),
  instrumentIds: INSTRUMENTS.map((instrument) => instrument.id),
  instrumentModules: INSTRUMENTS.map(() =>
    WORKSHOP_MODULES.map(() => 0),
  ),
  instrumentMasteries: INSTRUMENTS.map(() => 0),
  mastery: { vectors: 0, bases: 0, applications: 0, matrices: 0 },
  questionHistory: emptyPracticeHistory(),
  correctAnswers: 0,
  anomalies: 0,
  nextAnomalyAt: 0,
  resonance: 0,
  invariants: 0,
  totalInvariants: 0,
  protocols: INVARIANT_PROTOCOLS.map(() => 0),
  highestWorkshop: -1,
  archivedHighest: -1,
  frontierResets: 0,
  gateValidations: {},
  streak: 0,
  boostUntil: 0,
  nextAutomaticAt: 0,
  automationEnabled: [true, true],
  lastTick: 0,
};

export function restoreState(raw: string | null): GameState {
  if (!raw) return { ...INITIAL_STATE, lastTick: Date.now(), nextAnomalyAt: Date.now() + 8000 };
  try {
    const saved = JSON.parse(raw) as Partial<GameState>;
    const savedInstrumentIds =
      Array.isArray(saved.instrumentIds) &&
      saved.instrumentIds.length === saved.instruments?.length
        ? saved.instrumentIds
        : [...LEGACY_INSTRUMENT_IDS];
    const savedIndexById = new Map(
      savedInstrumentIds.map((id, index) => [id, index]),
    );
    const instruments = INSTRUMENTS.map((instrument) =>
      Math.min(10_000, Math.max(
        0,
        Math.floor(Number(
          saved.instruments?.[savedIndexById.get(instrument.id) ?? -1],
        ) || 0),
      )),
    );
    // Les anciennes versions autorisaient parfois un atelier avancé sans son
    // prédécesseur. La migration rétablit une chaîne structurelle cohérente.
    for (let index = instruments.length - 1; index > 0; index -= 1) {
      if (instruments[index] > 0) {
        instruments[index - 1] = Math.max(1, instruments[index - 1]);
      }
    }
    const hasSavedModules = Array.isArray(saved.instrumentModules);
    const instrumentModules = INSTRUMENTS.map((instrument, currentIndex) =>
      WORKSHOP_MODULES.map((__, moduleIndex) => {
        const savedIndex = savedIndexById.get(instrument.id) ?? -1;
        if (hasSavedModules) {
          return (saved.instrumentModules?.[savedIndex]?.[moduleIndex] ?? 0) >
            0
            ? 1
            : 0;
        }
        // Les anciens paliers automatiques donnaient ×2 aux niveaux 10, 25 et
        // 50. Cette migration conserve exactement ces bonus dans les parties
        // existantes, sans offrir automatiquement les nouveaux modules ensuite.
        return legacyWorkshopModules(instruments[currentIndex])[moduleIndex];
      }),
    );
    const instrumentMasteries = INSTRUMENTS.map((instrument, index) => {
      const savedIndex = savedIndexById.get(instrument.id) ?? -1;
      const savedRank = Math.max(
        0,
        Math.floor(Number(saved.instrumentMasteries?.[savedIndex]) || 0),
      );
      let supportedRank = 0;
      while (
        supportedRank < savedRank &&
        instruments[index] >= workshopMasteryThreshold(supportedRank)
      ) {
        supportedRank += 1;
      }
      return supportedRank;
    });
    // Old levels beyond the new catalogue are reimbursed at their original
    // point price; earned points and retained levels are not confiscated.
    const refund = saved.saveVersion === 3 ? 0 : LEGACY_PROTOCOLS.reduce((sum, p, i) => {
      const oldLevel = Math.min(p.maxLevel, Math.max(0, Math.floor(Number(saved.protocols?.[i]) || 0)));
      let amount = 0;
      for (let level = INVARIANT_PROTOCOLS[i].maxLevel; level < oldLevel; level++) amount += p.baseCost + p.costStep * level;
      return sum + amount;
    }, 0);
    return {
      ...INITIAL_STATE,
      ...saved,
      saveVersion: 3,
      ...restoreWallet(saved),
      highestWorkshop: Math.max(instruments.findLastIndex(n => n > 0), Number.isFinite(saved.highestWorkshop) ? Math.min(67, Math.floor(saved.highestWorkshop!)) : -1),
      archivedHighest: Number.isFinite(saved.archivedHighest) ? Math.max(-1, Math.min(67, Math.floor(saved.archivedHighest!))) : -1,
      frontierResets: saved.saveVersion === 3 ? Math.max(0, Math.floor(Number(saved.frontierResets) || 0)) : 0,
      gateValidations: Object.fromEntries([4, 8, 12, 15, 17].map(c => [c,
        Array.isArray(saved.gateValidations?.[c]) ? [...new Set(saved.gateValidations[c].filter(x => typeof x === "string"))].slice(0, 3) : [],
      ])),
      streak: 0,
      boostUntil: 0,
      nextAutomaticAt: 0,
      automationEnabled: [saved.automationEnabled?.[0] !== false, saved.automationEnabled?.[1] !== false],
      runTotal: Number.isFinite(saved.runTotal) ? Math.max(0, saved.runTotal ?? 0) : 0,
      allTime: Number.isFinite(saved.allTime) ? Math.max(0, saved.allTime ?? 0) : 0,
      invariants: (Number.isFinite(saved.invariants) ? Math.max(0, Math.floor(saved.invariants ?? 0)) : 0) + refund,
      totalInvariants: Number.isFinite(saved.totalInvariants) ? Math.max(0, Math.floor(saved.totalInvariants ?? 0), saved.invariants ?? 0) : 0,
      instruments,
      instrumentIds: INSTRUMENTS.map((instrument) => instrument.id),
      instrumentModules,
      instrumentMasteries,
      protocols: INVARIANT_PROTOCOLS.map((protocol, index) =>
        Math.min(
          protocol.maxLevel,
          Math.max(0, Math.floor(Number(saved.protocols?.[index]) || 0)),
        ),
      ),
      mastery: {
        vectors: Math.min(100, Math.max(0, Number(saved.mastery?.vectors) || 0)),
        bases: Math.min(100, Math.max(0, Number(saved.mastery?.bases) || 0)),
        applications: Math.min(100, Math.max(0, Number(saved.mastery?.applications) || 0)),
        matrices: Math.min(100, Math.max(0, Number(saved.mastery?.matrices) || 0)),
      },
      questionHistory: restorePracticeHistory(saved.questionHistory),
      correctAnswers: Number.isFinite(saved.correctAnswers) ? Math.max(0, Math.floor(saved.correctAnswers ?? 0)) : 0,
      anomalies: Math.min(3, Math.max(0, Math.floor(Number(saved.anomalies) || 0))),
      resonance: Math.min(100, Math.max(0, Number(saved.resonance) || 0)),
      lastTick: Number(saved.lastTick) || Date.now(),
      nextAnomalyAt: Number(saved.nextAnomalyAt) || Date.now() + 8000,
    };
  } catch {
    return { ...INITIAL_STATE, lastTick: Date.now(), nextAnomalyAt: Date.now() + 8000 };
  }
}
