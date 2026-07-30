import { pathToFileURL } from "node:url";

import {
  INSTRUMENTS,
  INVARIANT_PROTOCOLS,
  PRESTIGE_SCALE,
  WORKSHOP_MODULES,
  basePassiveProduction,
  basisChangeGain,
  correctAnomalyRewardMultiplier,
  inheritedStructuralWorkshops,
  instrumentCost,
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
} from "../app/game-balance.ts";

export const DEFAULT_RUN_TARGETS = [1, 2, 4, 8, 16];

const PROTOCOL_PRIORITY = [1, 2, 5, 0, 4, 3];
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
    matrixWorkshopCostMultiplier(state.instruments)
  );
}

function passiveRate(state) {
  return (
    basePassiveProduction(
      state.instruments,
      state.modules,
      state.masteries,
    ) *
    state.invariantMultiplier(state.totalInvariants) *
    protocolPassiveMultiplier(state.protocols)
  );
}

function manualRate(state) {
  const clicksPerSecond =
    state.runElapsed < 90
      ? 2
      : state.runElapsed < 900
        ? 0.25
        : 0.05;
  const emitterBonus = 1 + (state.instruments[0] ?? 0) * 0.1;
  const basisBonus = 1 + (state.instruments[6] ?? 0) * 0.05;
  return (
    clicksPerSecond *
    emitterBonus *
    basisBonus *
    protocolManualMultiplier(state.protocols) *
    state.invariantMultiplier(state.totalInvariants)
  );
}

function expectedQuestionRate(state, passive) {
  const reward =
    Math.max(24, passive * 20) *
    correctAnomalyRewardMultiplier(state.instruments) *
    protocolAnomalyMultiplier(state.protocols);
  return reward / QUESTION_INTERVAL;
}

function totalRate(state) {
  const passive = passiveRate(state);
  return passive + manualRate(state) + expectedQuestionRate(state, passive);
}

function actionProductionDelta(state, action) {
  const before = passiveRate(state);
  if (action.type === "instrument") {
    state.instruments[action.index] += 1;
    const after = passiveRate(state);
    state.instruments[action.index] -= 1;
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
      actions.push({
        type: "instrument",
        index,
        cost: Math.ceil(
          instrumentCost(index, state.instruments[index]) * factor,
        ),
      });
    }

    for (
      let moduleIndex = 0;
      moduleIndex < WORKSHOP_MODULES.length;
      moduleIndex += 1
    ) {
      const module = WORKSHOP_MODULES[moduleIndex];
      if (
        state.instruments[index] >= module.threshold &&
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

function applyAction(state, action, unlocks) {
  state.coordinates -= action.cost;
  if (action.type === "instrument") {
    const wasUnbuilt = state.instruments[action.index] === 0;
    state.instruments[action.index] += 1;
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
    for (const index of PROTOCOL_PRIORITY) {
      const protocol = INVARIANT_PROTOCOLS[index];
      const level = state.protocols[index];
      const cost = invariantProtocolCost(index, level);
      if (level < protocol.maxLevel && state.invariants >= cost) {
        state.invariants -= cost;
        state.protocols[index] += 1;
        purchased = true;
        break;
      }
    }
  }
}

function resetRun(state) {
  const inherited = inheritedStructuralWorkshops(state.protocols);
  const fresh = freshWorkshopState();
  for (let index = 0; index < inherited; index += 1) {
    fresh.instruments[index] = 1;
  }
  state.coordinates = 0;
  state.runTotal = 0;
  state.runElapsed = 0;
  state.instruments = fresh.instruments;
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
    invariantMultiplier,
  };
  const changes = [];
  const unlocks = [];
  let actionCount = 0;

  while (
    changes.length < runTargets.length &&
    state.elapsed < maximumSeconds &&
    actionCount < MAX_ACTIONS
  ) {
    const targetGain = runTargets[changes.length];
    const targetTotal = PRESTIGE_SCALE * targetGain ** 2;
    if (state.runTotal >= targetTotal * (1 - 1e-12)) {
      const gained = basisChangeGain(
        state.runTotal,
        state.totalInvariants,
      );
      state.invariants += gained;
      state.totalInvariants += gained;
      spendProtocols(state);
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
      });
      resetRun(state);
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
    if (affordable.length > 0) {
      applyAction(state, affordable[0], unlocks);
      actionCount += 1;
      continue;
    }

    const rate = totalRate(state);
    if (!(rate > 0) || !Number.isFinite(rate)) break;
    const nextCost = actions
      .filter((action) => action.productionDelta > 0)
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
    if (!Number.isFinite(seconds)) break;
    advance(state, seconds);
  }

  return {
    completed: changes.length === runTargets.length,
    elapsed: state.elapsed,
    allTime: state.allTime,
    totalInvariants: state.totalInvariants,
    changes,
    unlocks,
    actionCount,
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
