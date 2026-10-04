import { revisedEconomy } from "./economy-candidate-v2.mjs";
import { simulateCandidateEconomy, summarizeCandidate } from "./simulate-candidate-economy.mjs";

// Small explicit parameter sweep, not a fit to hide undesired player profiles.
const candidates = [
  { id: "A", payback: 1400, paceStep: 0.35, gatePremium: 1.5 },
  { id: "B", payback: 1400, paceStep: 0.6, gatePremium: 2.5 },
  { id: "C", payback: 1600, paceStep: 0.6, gatePremium: 2.5 },
  { id: "D", payback: 1600, paceStep: 0.8, gatePremium: 2.5 },
  { id: "E", chapterGrowth: 80, payback: 1000, earlyPaceStep: 0.15, paceStep: 1.2, gatePremium: 2.8 },
  { id: "F", chapterGrowth: 64, payback: 1000, earlyPaceStep: 0.15, paceStep: 1.2, gatePremium: 2.8 },
  { id: "G", chapterGrowth: 80, payback: 1000, earlyPaceStep: 0.15, paceStep: 1.2,
    gatePremium: 2.8, lateChapterPremium: [1.2, 1.35, 1.6] },
];
const requested = process.argv.find(a => a.startsWith("--candidate="))?.split("=")[1];
for (const candidate of candidates) for (const resetPolicy of ["frontier", "none"]) {
  if (requested && candidate.id !== requested) continue;
  const result = summarizeCandidate(simulateCandidateEconomy({ economy: revisedEconomy(candidate), resetPolicy }));
  console.log(JSON.stringify({ candidate, resetPolicy, ...result }));
}
