import { pathToFileURL } from "node:url";
import { INSTRUMENTS, INSTRUMENT_INDEX_BY_ID, WORKSHOP_MODULES, PRESTIGE_SCALE } from "../app/game-balance.ts";
import {
  CANDIDATE_PROTOCOL_COSTS, CANDIDATE_PROTOCOL_GATES, CANDIDATE_EDUCATIONAL_GATES,
  candidateGain, candidatePermanentMultiplier, candidateWorkshopCost,
  candidateWorkshopProduction, candidateCostFactor, candidateGlobalSynergy,
  candidateQuestionReward,
} from "./economy-candidate.mjs";
import { REVISED_ECONOMY } from "./economy-candidate-v2.mjs";

// Event-driven, deterministic given the seed. No browser, save or game rule writes.
const N = INSTRUMENTS.length;
const prices = INSTRUMENTS.map((_, i) => candidateWorkshopCost(i));
const outputs = INSTRUMENTS.map((_, i) => candidateWorkshopProduction(i));
const globalIds = ["rank-compressor", "rank-balance", "spectral-chamber", "diagonalizer", "cayley-hamilton-forge", "orthogonal-diagonalizer", "schmidt-orthogonalizer"];
const discountIds = ["gauss-inverter", "triangularizer", "characteristic-decomposer", "positivity-analyzer", "orthogonal-chamber"];
const rewardIds = ["image-forge", "eigenspace-extractor", "minimal-extractor", "self-adjoint-symmetrizer", "metric-projector"];
const defaultPriority = [5, 6, 1, 2, 7, 8, 4, 0, 3];
const level = (s, id) => s.units[INSTRUMENT_INDEX_BY_ID[id]] ?? 0;
const sumLevels = (s, ids) => ids.reduce((sum, id) => sum + level(s, id), 0);
const cycle = i => Math.floor(i / 4) + 1;
const zeros = () => Array(N).fill(0);
const modules = () => Array.from({ length: N }, () => Array(5).fill(0));
const bounded = (s, id, limit) => 1 + limit * level(s, id) / (level(s, id) + 25);
const reference = c => Math.max(PRESTIGE_SCALE, prices[(c - 1) * 4]);
const rules = s => s.options?.economy;
const price = (s, i) => (rules(s)?.prices ?? prices)[i];
const costs = s => rules(s)?.protocolCosts ?? CANDIDATE_PROTOCOL_COSTS;
const protocolGates = s => rules(s)?.protocolGates ?? CANDIDATE_PROTOCOL_GATES;
const gain = s => (rules(s)?.gain ?? candidateGain)(s.runTotal, s.frontier, s.repeats);
const gainReference = s => (rules(s)?.reference ?? reference)(s.frontier);

// The simulation's production rates are floating-point approximations, but
// integer coin debits can be exact. Fractional income is retained separately.
export function creditCandidateWallet(s, amount) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Invalid wallet credit");
  if (!rules(s)?.exactWallet) { s.wallet += amount; return; }
  const whole = Math.trunc(amount), fraction = s.walletFraction + (amount - whole);
  s.walletInteger += BigInt(whole) + BigInt(Math.floor(fraction));
  s.walletFraction = fraction - Math.floor(fraction);
  s.wallet = Number(s.walletInteger) + s.walletFraction;
}
export function debitCandidateWallet(s, cost) {
  if (!Number.isFinite(cost) || !Number.isInteger(cost) || cost < 0) throw new Error("Invalid wallet debit");
  if (!rules(s)?.exactWallet) {
    const before = s.wallet; s.wallet -= cost;
    if (before === s.wallet && cost > 0) s.ineffectiveDebits++;
    return;
  }
  if (s.walletInteger < BigInt(cost)) throw new Error("Unaffordable exact debit");
  const before = s.walletInteger;
  s.walletInteger -= BigInt(cost);
  if (before - s.walletInteger !== BigInt(cost)) throw new Error("Inexact debit");
  s.wallet = Number(s.walletInteger) + s.walletFraction;
}
const affordable = (s, cost) => rules(s)?.exactWallet ? s.walletInteger >= BigInt(cost) : cost <= s.wallet * (1 + 1e-12);
const shortfall = (s, cost) => rules(s)?.exactWallet ? Math.max(0, Number(BigInt(cost) - s.walletInteger) - s.walletFraction) : Math.max(0, cost - s.wallet);

export function candidatePassiveProduction(s) {
  const group = {};
  for (let i = 0; i < N; i++) {
    let output = s.units[i] * (rules(s)?.outputs ?? outputs)[i] * 2 ** s.masteries[i];
    for (let m = 0; m < 5; m++) if (s.modules[i][m]) output *= WORKSHOP_MODULES[m].multiplier;
    group[INSTRUMENTS[i].cycleId] = (group[INSTRUMENTS[i].cycleId] ?? 0) + output;
  }
  const collect = (...ids) => ids.reduce((sum, id) => sum + (group[id] ?? 0), 0);
  const directions = collect("space-construction"), families = collect("families-dimension");
  const applications = collect("linear-maps");
  const matrices = collect("matrix-representations", "systems-gauss", "basis-changes", "determinants");
  const reduction = collect("stable-blocks", "eigen-elements", "matrix-reduction");
  const polynomial = collect("polynomial-reduction");
  const euclidean = collect("euclidean-foundations", "orthogonal-isometries", "euclidean-reduction");
  const remaining = Object.values(group).reduce((a, b) => a + b, 0) - directions - families - applications - matrices - reduction - polynomial - euclidean;
  const regional = directions * bounded(s, "family-assembler", 0.5)
    + families * bounded(s, "freedom-tester", 0.375) * bounded(s, "linear-transformer", 0.5)
    + applications * (bounded(s, "matrix-composer", 0.375) + bounded(s, "matrix-encoder", 0.5) - 1)
    + matrices * bounded(s, "characteristic-tracer", 0.5)
    + reduction * bounded(s, "polynomial-evaluator", 0.5)
    + polynomial * bounded(s, "adjoint-chamber", 0.5)
    + euclidean * bounded(s, "inner-product-tuner", 0.5) + remaining;
  const globals = globalIds.reduce((product, id) => product * candidateGlobalSynergy(level(s, id)), 1);
  return regional * globals * candidatePermanentMultiplier(s.totalInvariants)
    * (1 + 0.08 * s.protocols[1]) * (1 + s.knowledge.reduce((a, b) => a + b, 0) * 0.003);
}

export function candidatePurchaseCost(s, action) {
  const factor = candidateCostFactor(0.99 ** sumLevels(s, discountIds), 0.95 ** s.protocols[2]);
  const unit = (i, owned) => Math.ceil(price(s, i) * 1.18 ** owned);
  if (action.type === "module") {
    const definition = WORKSHOP_MODULES[action.moduleIndex];
    return Math.ceil(Math.ceil(unit(action.index, definition.threshold) * definition.costFactor) * factor);
  }
  if (action.type === "mastery") return Math.ceil(Math.ceil(unit(action.index, 200 * 2 ** s.masteries[action.index]) * 0.2) * factor);
  let cost = 0;
  for (let k = 0; k < action.quantity; k++) {
    const owned = s.units[action.index] + k;
    const reconstruction = rules(s)?.reconstruction ? rules(s).reconstruction(s, action.index, owned)
      : action.index < 8 && owned < 10 ? 1 - 0.12 * s.protocols[6] : 1;
    cost += Math.ceil(unit(action.index, owned) * factor * reconstruction);
  }
  return cost;
}

function mutate(s, a, delta) {
  if (a.type === "unit") s.units[a.index] += delta * a.quantity;
  else if (a.type === "module") s.modules[a.index][a.moduleIndex] += delta;
  else s.masteries[a.index] += delta;
}

function blankState(options) {
  return {
    options, time: 0, activeTime: 0, wallet: 0, walletInteger: 0n, walletFraction: 0,
    archivedHighest: -1, runTotal: 0, allTime: 0, runStarted: 0,
    frontier: 1, highestEver: -1, repeats: 0, cycleResets: 0,
    units: zeros(), modules: modules(), masteries: zeros(), knowledge: [0, 0, 0, 0],
    invariants: 0, totalInvariants: 0, protocols: Array(9).fill(0),
    validations: Object.fromEntries(CANDIDATE_EDUCATIONAL_GATES.map(c => [c, new Set()])),
    nextQuestion: options.questionInterval, streak: 0, boostUntil: 0,
    nextPurchase: 0, nextAutomatic: 0,
    seed: options.seed >>> 0, unlocks: [], resets: [], purchases: [], gates: [],
    sources: { passive: 0, manual: 0, questions: 0, offline: 0 },
    questions: 0, correct: 0, boosts: 0, boostSeconds: 0, boostIncome: 0,
    autoPurchases: 0, manualPurchases: 0, spent: 0, ineffectiveDebits: 0,
    lowestFactor: 1, maxRate: 0, maxRewardSeconds: 0, maxAward: 0,
  };
}

function random(s) { s.seed = (Math.imul(1664525, s.seed) + 1013904223) >>> 0; return s.seed / 4294967296; }
function session(s) {
  const { sessionSeconds, absenceSeconds } = s.options;
  if (!absenceSeconds) return { online: true, producing: true, next: Infinity };
  const period = sessionSeconds + absenceSeconds, offset = s.time % period;
  if (offset < sessionSeconds - 1e-7) return { online: true, producing: true, next: s.time + sessionSeconds - offset };
  const offlineAge = offset - sessionSeconds, cap = Math.min(7200, absenceSeconds);
  return { online: false, producing: offlineAge < cap - 1e-7,
    next: s.time + (offlineAge < cap - 1e-7 ? sessionSeconds + cap - offset : period - offset) };
}
function rates(s, phase) {
  const base = candidatePassiveProduction(s);
  const boost = phase.online && s.boostUntil > s.time + 1e-7 ? 2 : 1;
  const manual = s.options.clickRate * (1 + 0.1 * s.units[0]) * (1 + 0.05 * s.units[6])
    * (1 + 0.15 * s.protocols[0]) * candidatePermanentMultiplier(s.totalInvariants)
    * s.options.manualResonance * (1 + 0.08 * s.protocols[3]);
  const passive = phase.producing ? base * boost : 0;
  return { base, passive, manual: phase.online ? manual : 0, boost };
}
function advance(s, seconds, phase, rate) {
  if (!(seconds >= 0) || !Number.isFinite(seconds)) throw new Error("Invalid event interval");
  const gain = (rate.passive + rate.manual) * seconds;
  creditCandidateWallet(s, gain); s.runTotal += gain; s.allTime += gain;
  s.sources[phase.online ? "passive" : "offline"] += rate.passive * seconds;
  s.sources.manual += rate.manual * seconds;
  if (phase.online) s.activeTime += seconds;
  if (phase.online && rate.boost === 2) { s.boostSeconds += seconds; s.boostIncome += rate.base * seconds; }
  s.time += seconds;
}
function answerQuestion(s) {
  s.questions++;
  const correct = random(s) < s.options.success;
  if (correct) {
    s.correct++; s.streak++;
    // The least-practised sector is selected among topics already introduced:
    // vectors in C1, bases in C2, applications in C4, matrices in C7.
    const count = s.frontier >= 7 ? 4 : s.frontier >= 4 ? 3 : s.frontier >= 2 ? 2 : 1;
    let sector = 0;
    for (let i = 1; i < count; i++) if (s.knowledge[i] < s.knowledge[sector]) sector = i;
    if (s.highestEver >= 0) s.knowledge[sector] = Math.min(100, s.knowledge[sector] + 6);
    const rewardFactor = (1 + 0.1 * s.protocols[4]) * (1 + 0.5 * sumLevels(s, rewardIds) / (sumLevels(s, rewardIds) + 50));
    const base = candidatePassiveProduction(s), reward = candidateQuestionReward(base, true, rewardFactor);
    creditCandidateWallet(s, reward); s.runTotal += reward; s.allTime += reward; s.sources.questions += reward;
    if (base > 0) s.maxRewardSeconds = Math.max(s.maxRewardSeconds, reward / base);
    for (const c of CANDIDATE_EDUCATIONAL_GATES) {
      if (s.frontier === c - 1 && s.validations[c].size < 3) {
        const taskCount = Math.min(4, s.highestEver - (c - 2) * 4 + 1) * 5;
        const taskType = Math.floor(random(s) * taskCount);
        s.validations[c].add(taskType);
        if (s.validations[c].size === 3) s.gates.push({ cycle: c, seconds: s.time, questions: s.questions });
      }
    }
    if (s.streak >= 3 && s.boostUntil <= s.time + 1e-7) {
      s.boostUntil = s.time + 60; s.streak = 0; s.boosts++;
    }
  } else s.streak = 0;
  s.nextQuestion = s.time + s.options.questionInterval;
}

function buyProtocols(s) {
  for (;;) {
    let bought = false;
    for (const index of s.options.protocolPriority) {
      const owned = s.protocols[index], cost = costs(s)[index].costs[owned];
      if (cost !== undefined && s.frontier >= protocolGates(s)[index][owned] && s.invariants >= cost) {
        s.invariants -= cost; s.protocols[index]++;
        s.purchases.push({ index, level: owned + 1, cost, seconds: s.time, cycle: s.frontier });
        bought = true; break;
      }
    }
    if (!bought) break;
  }
}
function resetTarget(s) {
  const { resetPolicy, resetsPerFrontier } = s.options;
  if (resetPolicy === "none" || s.resets.length >= s.options.maximumResets) return Infinity;
  if (s.options.resetCycles && !s.options.resetCycles.includes(s.frontier)) return Infinity;
  if (resetPolicy === "first-point") return gainReference(s) * 2 ** s.repeats;
  if (s.cycleResets >= resetsPerFrontier) return Infinity;
  if (s.units[(s.frontier - 1) * 4 + 3] === 0) return Infinity;
  const ratio = resetPolicy === "funding" ? (rules(s)?.fundingRatio ? rules(s).fundingRatio(s) : [32, 128, 512][s.cycleResets]) : 2 ** Math.min(3, s.frontier + 1) - 1;
  return gainReference(s) * ratio * (resetPolicy === "funding" ? 1 : 2 ** s.repeats);
}
function reserveFrontier(s) {
  return s.options.resetPolicy !== "none" && s.options.resetPolicy !== "first-point"
    && (!s.options.resetCycles || s.options.resetCycles.includes(s.frontier))
    && s.cycleResets < s.options.resetsPerFrontier && s.resets.length < s.options.maximumResets;
}
function reset(s) {
  const gained = gain(s);
  if (!(gained > 0)) throw new Error("Zero-reward reset");
  s.resets.push({ seconds: s.time, duration: s.time - s.runStarted, cycle: s.frontier,
    gained, total: s.totalInvariants + gained, repeats: s.repeats, production: candidatePassiveProduction(s),
    runTotal: s.runTotal, target: resetTarget(s), highest: s.units.findLastIndex(n => n > 0) });
  s.maxAward = Math.max(s.maxAward, gained);
  s.invariants += gained; s.totalInvariants += gained; s.repeats++; s.cycleResets++;
  // Inheritance applies using protocols held BEFORE spending the new points.
  const inherited = Math.min(4, 1 + s.protocols[5]);
  if (rules(s)?.inheritance) {
    s.archivedHighest = s.units.findLastIndex(n => n > 0);
    s.units = rules(s).inheritance(s, s.units);
    if (s.units[s.resets.at(-1).highest] > 0) s.resets.at(-1).reconstructionSeconds = 0;
  } else {
    if (s.resets.at(-1).highest < inherited) s.resets.at(-1).reconstructionSeconds = 0;
    s.units = zeros(); for (let i = 0; i < inherited; i++) s.units[i] = 1;
  }
  s.modules = modules(); s.masteries = zeros(); s.wallet = 0; s.runTotal = 0;
  s.walletInteger = 0n; s.walletFraction = 0;
  s.runStarted = s.time; s.boostUntil = 0; s.streak = 0;
  s.nextPurchase = s.time; buyProtocols(s);
  if (candidatePassiveProduction(s) >= s.resets.at(-1).production * 0.8) s.resets.at(-1).powerRecoverySeconds = 0;
}
function actions(s) {
  const result = [];
  const before = candidatePassiveProduction(s);
  for (let i = 0; i < N; i++) {
    if (i > 0 && s.units[i - 1] === 0) break;
    const c = cycle(i), gate = s.validations[c];
    const locked = (gate && gate.size < 3) || (c > s.frontier && reserveFrontier(s));
    const revealed = s.allTime >= (i < 4 ? INSTRUMENTS[i].unlock : price(s, i) * 1.25);
    if (!locked && revealed) {
      const owned = s.units[i];
      const threshold = [5, 10, 25, 50, 100, 200, 400, 800].find(n => n > owned) ?? owned + 25;
      const quantity = Math.min(threshold - owned, owned < 25 ? 1 : owned < 100 ? 5 : 25);
      result.push({ type: "unit", index: i, quantity });
    }
    for (let m = 0; m < 5; m++) if (s.units[i] >= WORKSHOP_MODULES[m].threshold && !s.modules[i][m]) result.push({ type: "module", index: i, moduleIndex: m });
    if (s.modules[i].every(Boolean) && s.units[i] >= 200 * 2 ** s.masteries[i]) result.push({ type: "mastery", index: i });
  }
  for (const a of result) {
    a.cost = candidatePurchaseCost(s, a); mutate(s, a, 1);
    a.delta = candidatePassiveProduction(s) - before; mutate(s, a, -1);
  }
  return result.filter(a => a.delta > 0 && Number.isFinite(a.cost));
}
function nextReveal(s) {
  const i = s.units.findLastIndex(n => n > 0) + 1;
  if (i >= N || (cycle(i) > s.frontier && reserveFrontier(s))) return Infinity;
  if (s.validations[cycle(i)]?.size < 3) return Infinity;
  const target = i < 4 ? INSTRUMENTS[i].unlock : price(s, i) * 1.25;
  return target > s.allTime ? target : Infinity;
}
function perform(s, a, automatic) {
  const before = s.wallet;
  debitCandidateWallet(s, a.cost); s.spent += a.cost;
  if (s.wallet < -Math.max(1e-7, before * 1e-12)) throw new Error("Unaffordable purchase");
  s.wallet = Math.max(0, s.wallet);
  const wasNew = a.type === "unit" && !s.units[a.index];
  mutate(s, a, 1);
  if (s.resets.length) {
    const latest = s.resets.at(-1);
    if (latest.powerRecoverySeconds === undefined && candidatePassiveProduction(s) >= latest.production * 0.8) latest.powerRecoverySeconds = s.time - latest.seconds;
  }
  if (wasNew && s.resets.length && a.index === s.resets.at(-1).highest) {
    const latest = s.resets.at(-1);
    latest.reconstructionSeconds ??= s.time - latest.seconds;
  }
  if (wasNew && a.index > s.highestEver) {
    s.highestEver = a.index;
    s.unlocks.push({ index: a.index, cycle: cycle(a.index), seconds: s.time, activeSeconds: s.activeTime, run: s.resets.length + 1 });
    if (cycle(a.index) > s.frontier) { s.frontier = cycle(a.index); s.repeats = 0; s.cycleResets = 0; buyProtocols(s); }
  }
  if (automatic) { s.autoPurchases++; s.nextAutomatic = s.time + 1; }
  else { s.manualPurchases++; s.nextPurchase = s.time + s.options.actionDelay; }
}
function automated(s, a, reserve) {
  if (!s.options.automation || a.cost > s.wallet * 0.1 || a.cost > s.wallet - reserve) return false;
  if (a.type === "module") return a.moduleIndex < [0, 1, 3, 5][s.protocols[7]];
  return a.type === "unit" && s.protocols[8] > 0 && cycle(a.index) < s.frontier
    && s.units[a.index] + a.quantity <= (s.protocols[8] === 1 ? 25 : 50);
}

export function simulateCandidateEconomy(options = {}) {
  options = { seed: 42, success: 0.7, questionInterval: 75, clickRate: 0.25,
    manualResonance: 1, actionDelay: 1, resetPolicy: "frontier", resetsPerFrontier: 1,
    maximumResets: 120, maximumSeconds: 30 * 86400, maximumSteps: 500_000,
    automation: true, protocolPriority: defaultPriority, sessionSeconds: 3600,
    absenceSeconds: 0, finishFunding: false, ...options };
  const s = blankState(options);
  let stopReason = "time-limit", steps = 0;
  for (; steps < options.maximumSteps && s.time < options.maximumSeconds; steps++) {
    const phase = session(s), rate = rates(s, phase);
    s.maxRate = Math.max(s.maxRate, rate.passive + rate.manual);
    s.lowestFactor = Math.min(s.lowestFactor, candidateCostFactor(0.99 ** sumLevels(s, discountIds), 0.95 ** s.protocols[2]));
    if (![s.wallet, s.runTotal, s.allTime, rate.base].every(Number.isFinite)) { stopReason = "non-finite"; break; }
    const fundingComplete = s.highestEver === N - 1 && s.protocols.every((n, i) => n === costs(s)[i].costs.length);
    if (options.finishFunding ? fundingComplete : s.units.at(-1) > 0) { stopReason = "finished"; break; }
    if (phase.online) {
      if (s.nextQuestion <= s.time + 1e-7) { answerQuestion(s); continue; }
      if (s.runTotal >= resetTarget(s) * (1 - 1e-12)) { reset(s); continue; }
      const list = actions(s);
      const next = list.find(a => a.type === "unit" && !s.units[a.index]);
      const reserved = next ? next.cost * 0.2 : 0;
      const affordableActions = list.filter(a => affordable(s, a.cost));
      if (s.nextAutomatic <= s.time + 1e-7) {
        const auto = affordableActions.filter(a => automated(s, a, reserved)).sort((a, b) => a.cost / a.delta - b.cost / b.delta)[0];
        if (auto) { perform(s, auto, true); continue; }
      }
      // Purchase simulations keep finite player action time; priority goes to
      // opening a new workshop, otherwise only investments with useful payback.
      const horizon = Math.max(180, next ? (next.cost - s.wallet) / Math.max(1, rate.base) * 0.8 : 1800);
      const useful = list.filter(a => (a.type === "unit" && !s.units[a.index]) || a.cost / a.delta <= horizon);
      if (s.nextPurchase <= s.time + 1e-7) {
        const forward = useful.find(a => a.type === "unit" && !s.units[a.index] && affordable(s, a.cost));
        const invest = useful.filter(a => affordable(s, a.cost)).sort((a, b) => a.cost / a.delta - b.cost / b.delta)[0];
        if (forward || invest) { perform(s, forward ?? invest, false); continue; }
      }
      const income = rate.passive + rate.manual;
      const toCost = useful.reduce((best, a) => {
        const missing = rules(s)?.exactWallet ? !affordable(s, a.cost) : a.cost > s.wallet;
        const costWait = missing ? shortfall(s, a.cost) / income : s.nextPurchase > s.time ? s.nextPurchase - s.time : Infinity;
        return Math.min(best, costWait);
      }, Infinity);
      const reveal = nextReveal(s);
      const waits = [options.maximumSeconds - s.time, phase.next - s.time,
        s.nextQuestion - s.time, s.boostUntil > s.time ? s.boostUntil - s.time : Infinity,
        (resetTarget(s) - s.runTotal) / income, (reveal - s.allTime) / income, toCost];
      // Retry optimizer at most once per minute as the savings horizon changes.
      waits.push(60);
      const wait = Math.max(1e-6, Math.min(...waits.filter(x => x > (rules(s)?.exactWallet ? 0 : 1e-7))));
      advance(s, wait, phase, rate);
      if (options.questionInterval === Infinity && s.highestEver === 11 && s.validations[4].size < 3
        && s.wallet >= price(s, 12) * 1.25) { stopReason = "educational-gate"; break; }
    } else {
      advance(s, Math.min(phase.next - s.time, options.maximumSeconds - s.time), phase, rate);
      // No queued burst of exercises or purchases on resuming the app.
      if (session(s).online) s.nextQuestion = s.time + options.questionInterval;
    }
  }
  if (steps === options.maximumSteps) stopReason = "step-limit";
  return { completed: stopReason === "finished", stopReason, elapsed: s.time, activeTime: s.activeTime, steps,
    workshops: s.highestEver + 1, frontier: s.frontier, totalInvariants: s.totalInvariants, invariants: s.invariants,
    protocols: s.protocols, protocolPurchases: s.purchases, resets: s.resets, unlocks: s.unlocks, gates: s.gates,
    questions: s.questions, correct: s.correct, boosts: s.boosts, boostSeconds: s.boostSeconds,
    boostIncome: s.boostIncome, sources: s.sources, automaticPurchases: s.autoPurchases,
    manualPurchases: s.manualPurchases, spent: s.spent, ineffectiveDebits: s.ineffectiveDebits,
    lowestCostFactor: s.lowestFactor, maximumProduction: s.maxRate, maximumRewardSeconds: s.maxRewardSeconds,
    maximumAward: s.maxAward, final: { coordinates: s.wallet, runTotal: s.runTotal, instruments: s.units,
      modules: s.modules, masteries: s.masteries, passive: candidatePassiveProduction(s), knowledge: s.knowledge,
      walletInteger: rules(s)?.exactWallet ? s.walletInteger.toString() : null },
  };
}

export function summarizeCandidate(report) {
  const byIndex = new Map(report.unlocks.map(e => [e.index, e]));
  const cycles = Array.from({ length: 17 }, (_, i) => {
    const events = Array.from({ length: 4 }, (_, j) => byIndex.get(i * 4 + j));
    return { cycle: i + 1, entryMinutes: events[0] ? events[0].seconds / 60 : null,
      workshopMinutes: events.map(e => e ? e.seconds / 60 : null),
      insideMinutes: events[0] && events[3] ? (events[3].seconds - events[0].seconds) / 60 : null,
      gapMinutes: i && events[0] && byIndex.has(i * 4 - 1) ? (events[0].seconds - byIndex.get(i * 4 - 1).seconds) / 60 : null };
  });
  const resetTime = report.resets.reduce((sum, r) => sum + r.duration, 0);
  return { completed: report.completed, stopReason: report.stopReason, hours: report.elapsed / 3600,
    activeHours: report.activeTime / 3600, workshops: report.workshops, frontier: report.frontier,
    invariants: report.totalInvariants, balance: report.invariants, protocols: report.protocols,
    protocolCostPaid: report.protocolPurchases.reduce((sum, p) => sum + p.cost, 0),
    resets: report.resets.map(r => ({ cycle: r.cycle, gain: r.gained, minutes: r.duration / 60, reconstructionMinutes: r.reconstructionSeconds === undefined ? null : r.reconstructionSeconds / 60, powerRecoveryMinutes: r.powerRecoverySeconds === undefined ? null : r.powerRecoverySeconds / 60 })),
    resetRunHours: resetTime / 3600, cycles, questions: report.questions, correct: report.correct,
    boosts: report.boosts, boostDuty: report.activeTime ? report.boostSeconds / report.activeTime : 0,
    automaticPurchases: report.automaticPurchases, manualPurchases: report.manualPurchases,
    ineffectiveDebits: report.ineffectiveDebits, minimumCostFactor: report.lowestCostFactor,
    maxRewardSeconds: report.maximumRewardSeconds, maximumAward: report.maximumAward,
    sources: report.sources, steps: report.steps,
  };
}

export const CANDIDATE_SCENARIOS = [
  { id: "regular", label: "70 % de réussite, un redémarrage par frontière", options: {} },
  { id: "regular-seed-7", label: "70 %, autre tirage déterministe (7)", options: { seed: 7 } },
  { id: "regular-seed-2026", label: "70 %, autre tirage déterministe (2026)", options: { seed: 2026 } },
  { id: "novice", label: "40 % de réussite, réponses toutes les 90 s", options: { success: 0.4, questionInterval: 90, clickRate: 0.1 } },
  { id: "expert", label: "95 % de réussite, réponses toutes les 65 s", options: { success: 0.95, questionInterval: 65, clickRate: 2, manualResonance: 3 } },
  { id: "no-reset", label: "70 %, sans redémarrage", options: { resetPolicy: "none" } },
  { id: "four-resets", label: "70 %, redémarrages aux frontières 4, 8, 12 et 16", options: { resetCycles: [4, 8, 12, 16] } },
  { id: "random", label: "25 %, choix aléatoires", options: { success: 0.25 } },
  { id: "passive", label: "Sans exercices", options: { resetPolicy: "none", questionInterval: Infinity, clickRate: 0.05 } },
  { id: "frequent", label: "Redémarrage au premier point", options: { resetPolicy: "first-point", maximumSeconds: 7 * 86400 } },
  { id: "funding", label: "Trois redémarrages par frontière, enveloppe 32/128/512", options: { resetPolicy: "funding", resetsPerFrontier: 3, finishFunding: true } },
  { id: "no-automation", label: "70 %, automatisations désactivées", options: { automation: false } },
  { id: "alternative", label: "Achats permanents orientés clic et exercices", options: { protocolPriority: [0, 4, 3, 1, 2, 5, 6, 7, 8] } },
  { id: "offline", label: "Une heure active puis onze heures absentes", options: { sessionSeconds: 3600, absenceSeconds: 11 * 3600, maximumSeconds: 90 * 86400 } },
];

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const requested = process.argv.find(a => a.startsWith("--scenario="))?.split("=")[1];
  const version = process.argv.find(a => a.startsWith("--version="))?.split("=")[1] ?? "v1";
  if (!["v1", "v2"].includes(version)) throw new Error(`Unknown version: ${version}`);
  if (requested && !CANDIDATE_SCENARIOS.some(s => s.id === requested)) throw new Error(`Unknown scenario: ${requested}`);
  for (const scenario of CANDIDATE_SCENARIOS) {
    if (requested && scenario.id !== requested) continue;
    const started = performance.now(), report = simulateCandidateEconomy({ ...scenario.options, economy: version === "v2" ? REVISED_ECONOMY : undefined });
    const label = version === "v2" && scenario.id === "funding"
      ? "Collection : trois redémarrages par frontière, seuil visé de deux à six points" : scenario.label;
    console.log(JSON.stringify({ id: scenario.id, version, label, ...summarizeCandidate(report), executionSeconds: (performance.now() - started) / 1000 }));
  }
}
