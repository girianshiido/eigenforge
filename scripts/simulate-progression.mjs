import { pathToFileURL } from "node:url";

import {
  INSTRUMENTS,
  INVARIANT_PROTOCOLS,
  PRESTIGE_SCALE,
  WORKSHOP_MODULES,
  basePassiveProduction,
  basisChangeGain,
  basisChangePreview,
  correctAnomalyRewardMultiplier,
  instrumentBulkCost,
  invariantProductionMultiplier,
  invariantProtocolCost,
  matrixWorkshopCostMultiplier,
  protocolAnomalyMultiplier,
  protocolManualMultiplier,
  protocolPassiveMultiplier,
  protocolWorkshopCostMultiplier,
  workshopMasteryCost,
  workshopMasteryThreshold,
  workshopModuleCost,
  workshopOutput,
} from "../app/game-balance.ts";

export const DEFAULT_RUN_TARGETS = [1, 2, 4, 8, 16];

const PROTOCOL_PRIORITY = [5, 6, 1, 2, 0, 4, 3];
const QUESTION_INTERVAL = 75;
const MAX_ACTIONS = 100_000;

function freshWorkshopState() {
  return {
    instruments: INSTRUMENTS.map(() => 0),
    modules: INSTRUMENTS.map(() => WORKSHOP_MODULES.map(() => 0)),
    masteries: INSTRUMENTS.map(() => 0),
  };
}

function workshopCostFactor(state) {
  return (
    protocolWorkshopCostMultiplier(state.protocols) *
    (state.costSynergies ? matrixWorkshopCostMultiplier(state.instruments) : 1)
  );
}

function passiveRate(state) {
  return (
    (state.productionSynergies ? basePassiveProduction(
      state.instruments,
      state.modules,
      state.masteries,
    ) : INSTRUMENTS.reduce((sum, _workshop, index) => sum + workshopOutput(index, state.instruments[index], state.modules[index], state.masteries[index]), 0)) *
    state.invariantMultiplier(state.totalInvariants) *
    protocolPassiveMultiplier(state.protocols) * (1 + state.masteryBonus)
  );
}

function manualRate(state) {
  const clicksPerSecond = state.clickRate ?? (
    state.runElapsed < 90
      ? 2
      : state.runElapsed < 900
        ? 0.25
        : 0.05);
  const emitterBonus = 1 + (state.instruments[0] ?? 0) * 0.1;
  const basisBonus = 1 + (state.instruments[6] ?? 0) * 0.05;
  return (
    clicksPerSecond *
    emitterBonus *
    basisBonus *
    protocolManualMultiplier(state.protocols) *
    state.resonanceMultiplier *
    state.invariantMultiplier(state.totalInvariants)
  );
}

function expectedQuestionRate(state, passive) {
  const correctReward =
    Math.max(24, passive * 20) *
    correctAnomalyRewardMultiplier(state.instruments) *
    protocolAnomalyMultiplier(state.protocols);
  const wrongReward = Math.max(5, passive * 5);
  return (correctReward * state.questionSuccessRate + wrongReward * (1 - state.questionSuccessRate)) / state.questionInterval;
}

function totalRate(state) {
  const passive = passiveRate(state);
  return passive + manualRate(state) + expectedQuestionRate(state, passive);
}

function actionProductionDelta(state, action) {
  const before = passiveRate(state);
  if (action.type === "instrument") {
    state.instruments[action.index] += action.quantity;
    const after = passiveRate(state);
    state.instruments[action.index] -= action.quantity;
    return after - before;
  }
  if (action.type === "module") {
    state.modules[action.index][action.moduleIndex] = 1;
    const after = passiveRate(state);
    state.modules[action.index][action.moduleIndex] = 0;
    return after - before;
  }
  state.masteries[action.index] += 1;
  const after = passiveRate(state);
  state.masteries[action.index] -= 1;
  return after - before;
}

function availableActions(state) {
  const actions = [];
  const factor = workshopCostFactor(state);

  for (let index = 0; index < INSTRUMENTS.length; index += 1) {
    const prerequisiteOwned =
      index === 0 || (state.instruments[index - 1] ?? 0) > 0;
    if (
      prerequisiteOwned &&
      state.allTime >= INSTRUMENTS[index].unlock
    ) {
      const currentLevel = state.instruments[index];
      const quantity =
        currentLevel < 5
          ? 1
          : currentLevel < 25
            ? 10
            : currentLevel < 100
              ? 25
              : currentLevel < 1_000
                ? 100
                : 1_000;
      actions.push({
        type: "instrument",
        index,
        quantity,
        cost: cachedWorkshopCost(state, index, currentLevel, quantity, factor),
      });
    }

    for (
      let moduleIndex = 0;
      moduleIndex < WORKSHOP_MODULES.length;
      moduleIndex += 1
    ) {
      const moduleDefinition = WORKSHOP_MODULES[moduleIndex];
      if (
        state.instruments[index] >= moduleDefinition.threshold &&
        state.modules[index][moduleIndex] === 0
      ) {
        actions.push({
          type: "module",
          index,
          moduleIndex,
          cost: Math.ceil(workshopModuleCost(index, moduleIndex) * factor),
        });
      }
    }

    const rank = state.masteries[index];
    if (
      state.modules[index].every((owned) => owned > 0) &&
      state.instruments[index] >= workshopMasteryThreshold(rank)
    ) {
      actions.push({
        type: "mastery",
        index,
        cost: Math.ceil(workshopMasteryCost(index, rank) * factor),
      });
    }
  }

  return actions.map((action) => ({
    ...action,
    productionDelta: actionProductionDelta(state, action),
  }));
}

function cachedWorkshopCost(state, index, owned, quantity, factor) {
  const reconstruction = state.protocols[6] ?? 0;
  const key = `${index}:${owned}:${quantity}:${factor}:${reconstruction}`;
  if (!state.costCache.has(key)) {
    state.costCache.set(key, instrumentBulkCost(index, owned, quantity, factor, reconstruction));
  }
  return state.costCache.get(key);
}

function applyAction(state, action, unlocks) {
  state.coordinates -= action.cost;
  if (action.type === "instrument") {
    const wasUnbuilt = state.instruments[action.index] === 0;
    state.instruments[action.index] += action.quantity;
    if (wasUnbuilt) {
      unlocks.push({
        instrument: action.index,
        name: INSTRUMENTS[action.index].name,
        cycle: Math.floor(action.index / 4) + 1,
        seconds: state.elapsed,
        allTime: state.allTime,
      });
    }
    return;
  }
  if (action.type === "module") {
    state.modules[action.index][action.moduleIndex] = 1;
    return;
  }
  state.masteries[action.index] += 1;
}

function spendProtocols(state) {
  let purchased = true;
  while (purchased) {
    purchased = false;
    for (const index of state.protocolPriority) {
      const protocol = INVARIANT_PROTOCOLS[index];
      const level = state.protocols[index];
      const cost = invariantProtocolCost(index, level);
      if (level < protocol.maxLevel && state.invariants >= cost) {
        state.invariants -= cost;
        state.protocols[index] += 1;
        state.protocolPurchases.push({
          index,
          level: level + 1,
          cost,
          seconds: state.elapsed,
          totalInvariants: state.totalInvariants,
        });
        purchased = true;
        break;
      }
    }
  }
}

function resetRun(state) {
  const restart = basisChangePreview(0, state.totalInvariants, state.protocols);
  const fresh = freshWorkshopState();
  state.coordinates = 0;
  state.runTotal = 0;
  state.runElapsed = 0;
  state.instruments = restart.instruments;
  state.modules = fresh.modules;
  state.masteries = fresh.masteries;
}

function nextLockedUnlock(state) {
  let next = Number.POSITIVE_INFINITY;
  for (let index = 0; index < INSTRUMENTS.length; index += 1) {
    const prerequisiteOwned =
      index === 0 || (state.instruments[index - 1] ?? 0) > 0;
    if (
      prerequisiteOwned &&
      state.allTime < INSTRUMENTS[index].unlock
    ) {
      next = Math.min(next, INSTRUMENTS[index].unlock);
    }
  }
  return next;
}

function advance(state, seconds) {
  const gain = totalRate(state) * seconds;
  state.coordinates += gain;
  state.runTotal += gain;
  state.allTime += gain;
  state.elapsed += seconds;
  state.runElapsed += seconds;
}

export function simulateProgression({
  runTargets = DEFAULT_RUN_TARGETS,
  maximumSeconds = 60 * 60 * 24 * 365,
  invariantMultiplier = invariantProductionMultiplier,
  stopAtLastWorkshop = false,
  questionInterval = QUESTION_INTERVAL,
  questionSuccessRate = 1,
  clickRate,
  resonanceMultiplier = 1,
  masteryBonus = 0,
  protocolPriority = PROTOCOL_PRIORITY,
  maximumSteps = 250_000,
  actionDelay = 0,
  productionSynergies = true,
  costSynergies = true,
} = {}) {
  const workshops = freshWorkshopState();
  const state = {
    coordinates: 0,
    runTotal: 0,
    allTime: 0,
    elapsed: 0,
    runElapsed: 0,
    instruments: workshops.instruments,
    modules: workshops.modules,
    masteries: workshops.masteries,
    invariants: 0,
    totalInvariants: 0,
    protocols: INVARIANT_PROTOCOLS.map(() => 0),
    protocolPurchases: [],
    invariantMultiplier,
    questionInterval,
    questionSuccessRate,
    clickRate,
    resonanceMultiplier,
    masteryBonus,
    protocolPriority,
    costCache: new Map(),
    actionDelay,
    productionSynergies,
    costSynergies,
  };
  const changes = [];
  const unlocks = [];
  let actionCount = 0;
  let stepCount = 0;
  let stopReason = "targets-complete";
  let firstUnsafeInvariantCount = null;
  let maximumProduction = 0;

  while (
    changes.length < runTargets.length &&
    state.elapsed < maximumSeconds &&
    actionCount < MAX_ACTIONS &&
    stepCount < maximumSteps
  ) {
    stepCount += 1;
    if (stopAtLastWorkshop && state.instruments.at(-1) > 0) {
      stopReason = "last-workshop-built";
      break;
    }
    const checkedRate = totalRate(state);
    maximumProduction = Math.max(maximumProduction, checkedRate);
    if (![state.coordinates, state.runTotal, state.allTime, state.elapsed, checkedRate].every(Number.isFinite)) {
      stopReason = "non-finite-number";
      break;
    }
    const targetGain = runTargets[changes.length];
    const targetTotal = PRESTIGE_SCALE * targetGain ** 2;
    if (state.runTotal >= targetTotal * (1 - 1e-12)) {
      const gained = basisChangeGain(
        state.runTotal,
        state.totalInvariants,
      );
      const endingProduction = passiveRate(state);
      state.invariants += gained;
      state.totalInvariants += gained;
      if (!Number.isSafeInteger(state.totalInvariants) && firstUnsafeInvariantCount === null) {
        firstUnsafeInvariantCount = { change: changes.length + 1, total: state.totalInvariants, highestInstrument: state.instruments.reduce((highest, n, i) => n > 0 ? i : highest, -1) };
      }
      changes.push({
        change: changes.length + 1,
        gained,
        seconds: state.elapsed,
        runDuration: state.runElapsed,
        allTime: state.allTime,
        highestInstrument: state.instruments.reduce(
          (highest, count, index) => (count > 0 ? index : highest),
          -1,
        ),
        protocols: [...state.protocols],
        endingProduction,
        highestLevel: Math.max(...state.instruments),
        highestMastery: Math.max(...state.masteries),
        totalInvariants: state.totalInvariants,
      });
      resetRun(state);
      // In the game, newly earned invariants can be spent only after the reset.
      // Base héritée bought then will apply at the following reset, not this one.
      spendProtocols(state);
      continue;
    }

    const actions = availableActions(state);
    const affordable = actions
      .filter(
        (action) =>
          action.productionDelta > 0 && action.cost <= state.coordinates,
      )
      .sort(
        (left, right) =>
          left.cost / left.productionDelta -
          right.cost / right.productionDelta,
      );
    const firstWorkshop = affordable.find(
      (action) =>
        action.type === "instrument" &&
        state.instruments[action.index] === 0,
    );
    const bestInvestment = affordable[0];
    const secondsToTargetAtCurrentRate =
      Math.max(0, targetTotal - state.runTotal) / totalRate(state);
    const paysBackDuringRun =
      bestInvestment &&
      bestInvestment.cost / bestInvestment.productionDelta <=
        Math.max(60, secondsToTargetAtCurrentRate * 0.8);
    const chosenAction =
      firstWorkshop ?? (paysBackDuringRun ? bestInvestment : null);
    if (chosenAction) {
      applyAction(state, chosenAction, unlocks);
      actionCount += 1;
      if (state.actionDelay > 0) advance(state, state.actionDelay);
      continue;
    }

    const rate = totalRate(state);
    if (!(rate > 0) || !Number.isFinite(rate)) { stopReason = "invalid-rate"; break; }
    const nextCost = actions
      .filter(
        (action) =>
          action.productionDelta > 0 &&
          action.cost > state.coordinates,
      )
      .reduce(
        (minimum, action) => Math.min(minimum, action.cost),
        Number.POSITIVE_INFINITY,
      );
    const nextUnlock = nextLockedUnlock(state);
    const secondsToCost =
      nextCost < Number.POSITIVE_INFINITY
        ? Math.max(0, nextCost - state.coordinates) / rate
        : Number.POSITIVE_INFINITY;
    const secondsToTarget = Math.max(0, targetTotal - state.runTotal) / rate;
    const secondsToUnlock =
      nextUnlock < Number.POSITIVE_INFINITY
        ? Math.max(0, nextUnlock - state.allTime) / rate
        : Number.POSITIVE_INFINITY;
    const seconds = Math.max(
      1e-12,
      Math.min(secondsToCost, secondsToTarget, secondsToUnlock),
    );
    if (!Number.isFinite(seconds)) { stopReason = "no-next-event"; break; }
    if (state.elapsed + seconds === state.elapsed && state.runTotal + rate * seconds === state.runTotal) {
      stopReason = "floating-point-stall";
      break;
    }
    advance(state, seconds);
  }

  if (state.elapsed >= maximumSeconds) stopReason = "time-limit";
  else if (actionCount >= MAX_ACTIONS || stepCount >= maximumSteps) stopReason = "step-limit";
  return {
    completed: stopReason === "last-workshop-built" || changes.length === runTargets.length,
    stopReason,
    elapsed: state.elapsed,
    allTime: state.allTime,
    totalInvariants: state.totalInvariants,
    changes,
    unlocks,
    protocolPurchases: state.protocolPurchases,
    actionCount,
    stepCount,
    maximumProduction,
    firstUnsafeInvariantCount,
    final: {
      coordinates: state.coordinates,
      runTotal: state.runTotal,
      instruments: [...state.instruments],
      modules: state.modules.map(row => [...row]),
      masteries: [...state.masteries],
      protocols: [...state.protocols],
      passiveProduction: passiveRate(state),
      costMultiplier: workshopCostFactor(state),
    },
  };
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds.toFixed(0)} s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  if (seconds < 86_400) return `${(seconds / 3600).toFixed(1)} h`;
  return `${(seconds / 86_400).toFixed(1)} j`;
}

function printReport(report) {
  console.log("EIGENFORGE — simulation de progression");
  console.table(
    report.changes.map((change) => ({
      changement: change.change,
      durée_du_run: formatDuration(change.runDuration),
      temps_cumulé: formatDuration(change.seconds),
      invariants_gagnés: change.gained,
      dernier_atelier:
        change.highestInstrument >= 0
          ? INSTRUMENTS[change.highestInstrument].name
          : "Aucun",
      cycle: Math.floor(change.highestInstrument / 4) + 1,
    })),
  );
  const firstCycleUnlockMap = new Map();
  for (const unlock of report.unlocks) {
    if (!firstCycleUnlockMap.has(unlock.cycle)) {
      firstCycleUnlockMap.set(unlock.cycle, unlock);
    }
  }
  const firstCycleUnlocks = Array.from(firstCycleUnlockMap.values());
  console.table(
    firstCycleUnlocks.map((unlock) => ({
      cycle: unlock.cycle,
      atelier: unlock.name,
      temps_cumulé: formatDuration(unlock.seconds),
      coordonnées_cumulées: unlock.allTime.toExponential(2),
    })),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  printReport(simulateProgression());
}
