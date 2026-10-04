import {
  INSTRUMENTS, EDUCATIONAL_GATES, INHERITED_UNIT_CAPS, basePassiveProduction,
  invariantProductionMultiplier, protocolPassiveMultiplier, protocolManualMultiplier,
  protocolResonanceMultiplier, protocolAnomalyMultiplier, protocolWorkshopCostMultiplier,
  matrixWorkshopCostMultiplier, correctAnomalyRewardMultiplier, instrumentCost,
  reconstructionCostMultiplier, workshopModuleCost, workshopMasteryCost,
  frontierCycle, protocolUnlockCycle, invariantProtocolCost, basisChangePreview,
} from "./game-economy.ts";
import { instrumentIndex, instrumentLevel, WORKSHOP_MODULES } from "./game-balance.ts";

export type Wallet = { coordinates: number; coordinatesWhole: string; coordinatesFraction: number };
export type EconomyState = Wallet & {
  runTotal: number; allTime: number; instruments: number[]; instrumentModules: number[][];
  instrumentMasteries: number[]; protocols: number[]; totalInvariants: number; invariants: number;
  mastery: Record<string, number>; resonance: number; highestWorkshop: number; archivedHighest: number;
  frontierResets: number; gateValidations: Record<string, string[]>; streak: number; boostUntil: number;
  nextAutomaticAt: number; automationEnabled: boolean[];
};
export function restoreWallet(value: Partial<Wallet>): Wallet {
  const fallback = Number.isFinite(value.coordinates) ? Math.max(0, value.coordinates ?? 0) : 0;
  const valid = typeof value.coordinatesWhole === "string" && /^\d{1,309}$/.test(value.coordinatesWhole)
    && Number.isFinite(Number(value.coordinatesWhole));
  const whole = valid ? BigInt(value.coordinatesWhole!) : BigInt(Math.floor(fallback));
  const fraction = valid ? Math.min(0.9999999999999999, Math.max(0, Number(value.coordinatesFraction) || 0)) : fallback - Math.floor(fallback);
  return { coordinatesWhole: whole.toString(), coordinatesFraction: fraction, coordinates: Number(whole) + fraction };
}
export function canAfford(state: Wallet, cost: number | bigint | null) {
  if (cost === null || (typeof cost === "number" && (!Number.isFinite(cost) || !Number.isInteger(cost) || cost < 0))) return false;
  const amount = BigInt(cost);
  return amount >= BigInt(0) && BigInt(state.coordinatesWhole) >= amount;
}
export function debitWallet<T extends Wallet>(state: T, cost: number | bigint | null): T {
  if (!canAfford(state, cost)) return state;
  const whole = BigInt(state.coordinatesWhole) - BigInt(cost!);
  return { ...state, coordinatesWhole: whole.toString(), coordinates: Number(whole) + state.coordinatesFraction };
}
export function creditIncome<T extends Wallet & { runTotal: number; allTime: number }>(state: T, amount: number): T {
  if (!Number.isFinite(amount) || amount < 0) return state;
  const integer = Math.trunc(amount), fraction = state.coordinatesFraction + (amount - integer);
  const whole = BigInt(state.coordinatesWhole) + BigInt(integer) + BigInt(Math.floor(fraction));
  return { ...state, coordinatesWhole: whole.toString(), coordinatesFraction: fraction - Math.floor(fraction),
    coordinates: Number(whole) + fraction - Math.floor(fraction), runTotal: state.runTotal + amount, allTime: state.allTime + amount };
}
export function production(state: EconomyState) {
  return basePassiveProduction(state.instruments, state.instrumentModules, state.instrumentMasteries)
    * invariantProductionMultiplier(state.totalInvariants) * protocolPassiveMultiplier(state.protocols)
    * (1 + Object.values(state.mastery).reduce((s, n) => s + n, 0) * 0.003);
}
export const boostedProduction = (s: EconomyState, now: number) => production(s) * (now < s.boostUntil ? 2 : 1);
export function clickPower(s: EconomyState) {
  return (1 + instrumentLevel(s.instruments, "axis-generator") * 0.1)
    * (1 + instrumentLevel(s.instruments, "basis-extractor") * 0.05)
    * (1 + Math.floor(s.resonance / 25) * 0.5) * protocolManualMultiplier(s.protocols)
    * protocolResonanceMultiplier(s.protocols) * invariantProductionMultiplier(s.totalInvariants);
}
export const workshopCostFactor = (s: EconomyState) => protocolWorkshopCostMultiplier(s.protocols) * matrixWorkshopCostMultiplier(s.instruments);
export function exactWorkshopBulkCost(s: EconomyState, i: number, quantity: number): bigint | null {
  if (!INSTRUMENTS[i] || quantity < 1 || quantity > 10_000 || !Number.isInteger(quantity)) return null;
  let sum = BigInt(0);
  for (let k = 0; k < quantity; k++) {
    const owned = s.instruments[i] + k;
    const n = Math.ceil(instrumentCost(i, owned) * workshopCostFactor(s) * reconstructionCostMultiplier(i, owned, s.protocols[6], s.archivedHighest));
    if (!Number.isFinite(n)) return null;
    sum += BigInt(n);
  }
  return sum;
}
export const workshopBulkCost = (s: EconomyState, i: number, n: number) => { const cost = exactWorkshopBulkCost(s, i, n); return cost === null ? Infinity : Number(cost); };
export const workshopCost = (s: EconomyState, i: number) => workshopBulkCost(s, i, 1);
export const moduleCost = (s: EconomyState, i: number, m: number) => Math.ceil(workshopModuleCost(i, m) * workshopCostFactor(s));
export const masteryCost = (s: EconomyState, i: number) => Math.ceil(workshopMasteryCost(i, s.instrumentMasteries[i] ?? 0) * workshopCostFactor(s));
export function maxAffordableWorkshopQuantity(s: EconomyState, i: number) {
  let remaining = BigInt(s.coordinatesWhole), n = 0;
  const factor = workshopCostFactor(s);
  while (n < 10_000) {
    const owned = s.instruments[i] + n;
    const cost = Math.ceil(instrumentCost(i, owned) * factor * reconstructionCostMultiplier(i, owned, s.protocols[6], s.archivedHighest));
    if (!Number.isFinite(cost) || BigInt(cost) > remaining) break;
    remaining -= BigInt(cost); n++;
  }
  return n;
}
export const pendingGate = (s: EconomyState) => EDUCATIONAL_GATES.find(c => c === frontierCycle(s.highestWorkshop) + 1 && (s.gateValidations[c]?.length ?? 0) < 3);
export function workshopGateProgress(s: EconomyState, i: number) {
  const c = Math.floor(i / 4) + 1;
  // An existing workshop is never relocked during migration or reconstruction.
  if (i <= s.highestWorkshop || !EDUCATIONAL_GATES.includes(c)) return 3;
  return s.gateValidations[c]?.length ?? 0;
}
export const canOpenWorkshop = (s: EconomyState, i: number) => !!INSTRUMENTS[i]
  && (i === 0 || s.instruments[i - 1] > 0) && s.allTime >= INSTRUMENTS[i].unlock && workshopGateProgress(s, i) >= 3;
export function purchaseWorkshop<T extends EconomyState>(s: T, i: number, n: number): T {
  const cost = exactWorkshopBulkCost(s, i, n);
  if (!canOpenWorkshop(s, i) || !canAfford(s, cost)) return s;
  const instruments = [...s.instruments]; instruments[i] += n;
  const highestWorkshop = Math.max(i, s.highestWorkshop);
  const entered = frontierCycle(highestWorkshop) > frontierCycle(s.highestWorkshop);
  return { ...debitWallet(s, cost), instruments, highestWorkshop, frontierResets: entered ? 0 : s.frontierResets };
}
export function purchaseModule<T extends EconomyState>(s: T, i: number, m: number): T {
  const definition = WORKSHOP_MODULES[m], cost = moduleCost(s, i, m);
  if (!definition || !INSTRUMENTS[i] || s.instrumentModules[i]?.[m] || s.instruments[i] < definition.threshold || !canAfford(s, cost)) return s;
  const instrumentModules = s.instrumentModules.map(row => [...row]); instrumentModules[i][m] = 1;
  return { ...debitWallet(s, cost), instrumentModules };
}
export function purchaseMastery<T extends EconomyState>(s: T, i: number): T {
  if (!INSTRUMENTS[i] || !s.instrumentModules[i].every(Boolean) || s.instruments[i] < 200 * 2 ** s.instrumentMasteries[i] || !canAfford(s, masteryCost(s, i))) return s;
  const instrumentMasteries = [...s.instrumentMasteries]; instrumentMasteries[i]++;
  return { ...debitWallet(s, masteryCost(s, i)), instrumentMasteries };
}
export function purchaseProtocol<T extends EconomyState>(s: T, i: number): T {
  const level = s.protocols[i] ?? 0, cost = invariantProtocolCost(i, level);
  if (frontierCycle(s.highestWorkshop) < protocolUnlockCycle(i, level) || s.invariants < cost) return s;
  const protocols = [...s.protocols]; protocols[i] = level + 1;
  return { ...s, protocols, invariants: s.invariants - cost };
}
export type AnswerQuestion = { workshopId?: string; taskKind?: string; sector: string };
export function questionReward(s: EconomyState, correct: boolean) {
  return correct ? Math.max(24, production(s) * 12) * Math.min(2, correctAnomalyRewardMultiplier(s.instruments) * protocolAnomalyMultiplier(s.protocols)) : 0;
}
export function applyEconomicAnswer<T extends EconomyState>(s: T, q: AnswerQuestion, correct: boolean, now: number): T {
  const reward = questionReward(s, correct);
  let streak = correct ? s.streak + 1 : 0, boostUntil = s.boostUntil;
  if (streak >= 3 && boostUntil <= now) { boostUntil = now + 60_000; streak = 0; }
  // No banked series during an active boost; no extension or stacking.
  if (boostUntil > now) streak = 0;
  const gateValidations = { ...s.gateValidations };
  const gate = pendingGate(s);
  if (correct && gate && q.workshopId && q.taskKind) {
    const i = instrumentIndex(q.workshopId);
    if (i >= (gate - 2) * 4 && i < (gate - 1) * 4 && i <= s.highestWorkshop) {
      const key = `${q.workshopId}/${q.taskKind}`;
      gateValidations[gate] = [...new Set([...(gateValidations[gate] ?? []), key])].slice(0, 3);
    }
  }
  return { ...creditIncome(s, reward), gateValidations, streak, boostUntil,
    mastery: correct ? { ...s.mastery, [q.sector]: Math.min(100, (s.mastery[q.sector] ?? 0) + 6) } : s.mastery };
}
export function restartEconomy<T extends EconomyState>(s: T): T {
  const preview = basisChangePreview(s.runTotal, s.totalInvariants, s.protocols, s.instruments, s.highestWorkshop, s.frontierResets);
  if (preview.gained < 1) return s;
  return { ...s, coordinates: 0, coordinatesWhole: "0", coordinatesFraction: 0, runTotal: 0,
    instruments: preview.instruments, instrumentModules: INSTRUMENTS.map(() => WORKSHOP_MODULES.map(() => 0)),
    instrumentMasteries: INSTRUMENTS.map(() => 0), archivedHighest: s.instruments.findLastIndex(n => n > 0),
    frontierResets: s.frontierResets + 1, invariants: s.invariants + preview.gained, totalInvariants: s.totalInvariants + preview.gained,
    streak: 0, boostUntil: 0, resonance: 0, nextAutomaticAt: 0 };
}
export function automaticPurchase<T extends EconomyState>(s: T, now: number): T {
  if (now < s.nextAutomaticAt || (!s.protocols[7] && !s.protocols[8])) return s;
  const frontier = frontierCycle(s.highestWorkshop);
  const nextIndex = s.instruments.findIndex(n => n === 0);
  const nextCost = nextIndex >= 0 && canOpenWorkshop(s, nextIndex) ? workshopCost(s, nextIndex) : 0;
  const reserve = BigInt(Math.ceil(nextCost * 0.2));
  const balance = BigInt(s.coordinatesWhole);
  const actions: { cost: number; delta: number; apply: () => T }[] = [];
  const before = production(s);
  const consider = (cost: number, apply: () => T) => {
    if (!canAfford(s, cost) || BigInt(cost) * BigInt(10) > balance || BigInt(cost) > balance - reserve) return;
    const next = apply(), delta = production(next) - before;
    if (delta > 0) actions.push({ cost, delta, apply: () => next });
  };
  for (let i = 0; i <= s.highestWorkshop; i++) {
    if (s.automationEnabled[0]) {
      const moduleCount = [0, 1, 3, 5][s.protocols[7]];
      for (let m = 0; m < moduleCount; m++) {
        if (!s.instrumentModules[i][m] && s.instruments[i] >= WORKSHOP_MODULES[m].threshold) consider(moduleCost(s, i, m), () => purchaseModule(s, i, m));
      }
    }
    if (s.automationEnabled[1] && s.protocols[8] > 0 && Math.floor(i / 4) + 1 < frontier && s.instruments[i] > 0) {
      const owned = s.instruments[i], limit = s.protocols[8] === 1 ? 25 : 50;
      const target = [5, 10, 25, 50].find(n => n > owned) ?? limit;
      const n = Math.min(target - owned, owned < 25 ? 1 : 5, limit - owned);
      if (n > 0) consider(workshopBulkCost(s, i, n), () => purchaseWorkshop(s, i, n));
    }
  }
  actions.sort((a, b) => a.cost / a.delta - b.cost / b.delta);
  return actions.length ? { ...actions[0].apply(), nextAutomaticAt: now + 1000 } : s;
}
export const inheritedCap = (s: EconomyState) => INHERITED_UNIT_CAPS[s.protocols[5] ?? 0];
