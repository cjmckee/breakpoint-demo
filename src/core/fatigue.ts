/**
 * Match fatigue — the one implementation of how a player tires and recovers.
 *
 * MatchSimulator (quick sims) and MatchOrchestrator (the live match) both call
 * these, and so do the analysis harnesses, so a change to the fatigue rules
 * reaches every match and every measurement at once. They used to be four
 * hand-kept copies that had drifted: the harness copies had no changeover
 * recovery at all.
 *
 * Stamina is the only stat read here, three ways: how fast fatigue builds, how
 * much comes back between points, and how much comes back at changeovers and
 * set breaks. Fatigue turns into shot quality in ShotCalculator.getFatigueModifier.
 * See docs/research/stamina-at-tier-1.md.
 */

import { MATCH_FATIGUE, STAMINA_RECOVERY } from '../config/shotThresholds';

const clamp = (v: number): number => Math.max(0, Math.min(100, v));

/** Fatigue build-up rate for a stamina value: maxFatigueRate at 0, minFatigueRate at 100. */
export function fatigueRate(stamina: number): number {
  const s = stamina / 100;
  return (
    MATCH_FATIGUE.maxFatigueRate + (MATCH_FATIGUE.minFatigueRate - MATCH_FATIGUE.maxFatigueRate) * s
  );
}

/**
 * Fatigue after a point: what the rally cost, less what comes back between
 * points. `gainMultiplier` scales the build-up only (focus_duration).
 */
export function fatigueAfterPoint(
  current: number,
  rallyLength: number,
  stamina: number,
  gainMultiplier = 1,
): number {
  const rate = fatigueRate(stamina);
  let gain = rallyLength * MATCH_FATIGUE.basePerShot * rate * gainMultiplier;
  if (rallyLength > MATCH_FATIGUE.longRallyThreshold) {
    gain += (rallyLength - MATCH_FATIGUE.longRallyThreshold) * MATCH_FATIGUE.longRallyExtra * rate;
  }
  const recovery =
    MATCH_FATIGUE.baseRecoveryPerPoint +
    (stamina / 100) * (MATCH_FATIGUE.maxRecoveryPerPoint - MATCH_FATIGUE.baseRecoveryPerPoint);
  return clamp(current + gain - recovery);
}

/** Fatigue after a changeover, or a set break when `setCompleted`. */
export function fatigueAfterRest(current: number, stamina: number, setCompleted: boolean): number {
  const base = setCompleted ? STAMINA_RECOVERY.perSetBase : STAMINA_RECOVERY.perGameBase;
  const scale = setCompleted ? STAMINA_RECOVERY.perSetScale : STAMINA_RECOVERY.perGameScale;
  return clamp(current - (base + (stamina / 100) * scale));
}
