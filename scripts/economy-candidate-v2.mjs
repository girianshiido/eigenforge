import { INSTRUMENTS } from "../app/game-balance.ts";
import { CANDIDATE_PROTOCOL_COSTS, CANDIDATE_PROTOCOL_GATES } from "./economy-candidate.mjs";

// Calibration experiment only. Neither this file nor the simulator is imported
// by a playable page. v1 is kept unchanged for reproducible comparisons.
export function revisedEconomy({ chapterGrowth = 64, payback = 1400, paceStep = 0.35,
  gatePremium = 1.5, archiveUnits = [1, 2, 3, 5], earlyPaceStep,
  lateChapterPremium = [1, 1, 1] } = {}) {
  const gates = [4, 8, 12, 15, 17];
  const prices = INSTRUMENTS.map((w, i) => {
    if (i < 4) return w.baseCost;
    const c = Math.floor(i / 4) + 1;
    const entry = 260_000 * chapterGrowth ** (c - 2);
    return Math.ceil(entry * 2.8 ** (i % 4) * (i % 4 === 0 && gates.includes(c) ? gatePremium : 1)
      * (c >= 15 ? lateChapterPremium[c - 15] : 1));
  });
  const outputs = INSTRUMENTS.map((w, i) => {
    if (i < 4) return w.baseProduction;
    const c = Math.floor(i / 4) + 1;
    const pace = earlyPaceStep === undefined ? 1 + paceStep * (c - 2)
      : 1 + earlyPaceStep * Math.min(3, c - 2) + paceStep * Math.max(0, c - 5);
    return (260_000 * chapterGrowth ** (c - 2)) / (payback * pace) * 2.6 ** (i % 4);
  });
  const reference = c => Math.max(100_000, prices[(c - 1) * 4]);
  return {
    version: "v2", parameters: { chapterGrowth, payback, paceStep, gatePremium, archiveUnits, earlyPaceStep, lateChapterPremium },
    prices, outputs, reference, exactWallet: true,
    protocolCosts: CANDIDATE_PROTOCOL_COSTS.map((p, i) => ({ ...p,
      costs: i === 7 ? [3, 7, 12] : i === 8 ? [6, 12] : [...p.costs] })),
    protocolGates: CANDIDATE_PROTOCOL_GATES.map((g, i) => i === 7 ? [3, 7, 11] : i === 8 ? [5, 9] : [...g]),
    gain: (runTotal, c, repeats) => Math.min(c + 1, Math.floor(Math.log2(1 + Math.max(0, runTotal) / reference(c) / 2 ** repeats))),
    // Archive only previously built units, including the completed frontier.
    // Copies are capped by what was ACTUALLY owned before the reset.
    inheritance: (state, previousUnits) => previousUnits.map(n => Math.min(n, archiveUnits[state.protocols[5]])),
    reconstruction: (state, index, owned) => index <= state.archivedHighest && owned < 10 ? 1 - 0.12 * state.protocols[6] : 1,
    fundingRatio: (state) => (2 ** Math.min(6, state.frontier + 1) - 1) * 2 ** state.repeats,
  };
}

export const REVISED_ECONOMY = revisedEconomy({ chapterGrowth: 80, payback: 1000,
  earlyPaceStep: 0.15, paceStep: 1.2, gatePremium: 2.8, lateChapterPremium: [1.2, 1.35, 1.6] });
