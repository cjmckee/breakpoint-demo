/**
 * Stamina Probe — which lever makes the stamina stat pay across its range?
 *
 * staminaAnatomy finds stamina works only through match fatigue (the
 * rally-length channel costs under 0.5% of quality at tier 1, because 95% of
 * shots come in the first five of a rally), and that its value saturates:
 * almost everything is in 20 → 40, and past ~50 fatigue is already near zero.
 * Stamina is read three times — fatigue gain rate, per-point recovery and
 * changeover/set recovery — so a high-stamina player both tires slowly and
 * recovers fast, and the curve collapses.
 *
 * Levers, measured as the point-win gain from a stamina bump against the same
 * player without it, real MatchSimulator, opponent uniform BASE:
 *
 *   FLAT     recovery stops reading stamina. Per-point and changeover recovery
 *            are held at their stamina-50 values, so a stamina-50 player's
 *            match is unchanged; stamina governs only how fast fatigue builds.
 *   PENALTY  FATIGUE_MODIFIER.minModifier 0.8 → 0.7 (or 0.6): fatigue costs
 *            half as much again (or double).
 *   both
 *
 * CONTROL is the same build on both sides at that lever setting.
 *
 * Run: npx tsx src/test/analysis/staminaProbe.ts
 * Env: N=1500 (matches per cell)  BASE=30  BUMPS=30>50,50>70  FORMAT=bo3|bo1
 *      LEVERS=<regex over labels>
 */

import type { MatchFormat, PlayerStats } from '../../types';
import { PlayerProfile } from '../../core/PlayerProfile';
import { MatchSimulator } from '../../core/MatchSimulator';
import { MATCH_FATIGUE, FATIGUE_MODIFIER, STAMINA_RECOVERY } from '../../config/shotThresholds';

const N = Number(process.env.N ?? 1500);
const BASE = Number(process.env.BASE ?? 30);
const BUMPS = (process.env.BUMPS ?? '30>50,50>70')
  .split(',')
  .map((b) => b.split('>').map(Number) as [number, number]);
const FORMAT: MatchFormat =
  process.env.FORMAT === 'bo1'
    ? { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 }
    : { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, net: r },
  technical: { slice: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r },
  mental: { focus: r, anticipation: r, tactics: r },
});

/** Point-win % for a player at `stamina` (everything else BASE) against uniform BASE. */
function pointWin(stamina: number, oppStamina: number): number {
  let won = 0;
  let total = 0;
  for (let m = 0; m < N; m++) {
    const p = uniform(BASE);
    p.physical.stamina = stamina;
    const o = uniform(BASE);
    o.physical.stamina = oppStamina;
    const sim = new MatchSimulator({
      player: new PlayerProfile('p', 'P', p),
      opponent: new PlayerProfile('o', 'O', o),
      courtSurface: 'hard',
      matchFormat: FORMAT,
    });
    sim.simulateMatch();
    for (const point of sim.exportMatchData().points) {
      total++;
      if (point.winner === 'player') won++;
    }
  }
  return (won / total) * 100;
}

const SHIPPED = {
  fatigue: { ...MATCH_FATIGUE },
  recovery: { ...STAMINA_RECOVERY },
  penalty: FATIGUE_MODIFIER.minModifier,
};

function restore(): void {
  Object.assign(MATCH_FATIGUE, SHIPPED.fatigue);
  Object.assign(STAMINA_RECOVERY, SHIPPED.recovery);
  (FATIGUE_MODIFIER as { minModifier: number }).minModifier = SHIPPED.penalty;
}

/** Hold every recovery term at its stamina-50 value. */
function flatRecovery(): void {
  const perPoint =
    SHIPPED.fatigue.baseRecoveryPerPoint +
    0.5 * (SHIPPED.fatigue.maxRecoveryPerPoint - SHIPPED.fatigue.baseRecoveryPerPoint);
  MATCH_FATIGUE.baseRecoveryPerPoint = perPoint;
  MATCH_FATIGUE.maxRecoveryPerPoint = perPoint;
  STAMINA_RECOVERY.perGameBase = SHIPPED.recovery.perGameBase + 0.5 * SHIPPED.recovery.perGameScale;
  STAMINA_RECOVERY.perGameScale = 0;
  STAMINA_RECOVERY.perSetBase = SHIPPED.recovery.perSetBase + 0.5 * SHIPPED.recovery.perSetScale;
  STAMINA_RECOVERY.perSetScale = 0;
}

const levers: Array<{ label: string; apply: () => void }> = [
  { label: 'shipped', apply: () => {} },
  { label: 'FLAT recovery', apply: flatRecovery },
  {
    label: 'PENALTY 0.7',
    apply: () => ((FATIGUE_MODIFIER as { minModifier: number }).minModifier = 0.7),
  },
  {
    label: 'PENALTY 0.6',
    apply: () => ((FATIGUE_MODIFIER as { minModifier: number }).minModifier = 0.6),
  },
  {
    label: 'FLAT + PENALTY 0.7',
    apply: () => {
      flatRecovery();
      (FATIGUE_MODIFIER as { minModifier: number }).minModifier = 0.7;
    },
  },
];

const f = (x: number): string => (x >= 0 ? '+' : '') + x.toFixed(2);

function main(): void {
  const only = process.env.LEVERS ? new RegExp(process.env.LEVERS) : null;
  console.log(
    `staminaProbe  N=${N} BASE=${BASE} format=${process.env.FORMAT ?? 'bo3'} ` +
      `(point-win gain from the stamina bump; opponent stamina = the bump's start)`,
  );
  console.log(['lever', 'CONTROL', ...BUMPS.map(([a, b]) => `${a}→${b}`)].join('\t'));
  const log = console.log;
  for (const lever of levers.filter((l) => !only || only.test(l.label))) {
    restore();
    lever.apply();
    console.log = (): void => {};
    const control = pointWin(BASE, BASE) - 50;
    const cells = BUMPS.map(([from, to]) => pointWin(to, from) - pointWin(from, from));
    console.log = log;
    console.log([lever.label, f(control), ...cells.map(f)].join('\t'));
  }
  restore();
}

main();
