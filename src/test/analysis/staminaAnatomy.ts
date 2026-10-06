/**
 * Stamina Anatomy — what does the stamina stat actually buy inside a match?
 *
 * stat-channels.md found stamina has no shot-quality channel of its own: its
 * value is "the fatigue system, entirely". This reads that system off the shots.
 * Every ShotDetail records the two multipliers stamina feeds:
 *
 *   rallyLengthModifier  per shot, from rally length and stamina (1.0 for
 *                        rallies of 5 shots or fewer, whatever the stat)
 *   fatigueModifier      from accumulated match fatigue: 1 − fatigue/100 × 0.2
 *
 * so the mean shortfall from 1.0 on each is exactly what that channel costs a
 * player's shots, and how it moves with stamina is what the stat buys.
 *
 * Runs the real MatchSimulator, not a hand-copied loop: the analysis harnesses'
 * copies of the point loop leave out changeover and set-break recovery and the
 * starting fatigue that low energy brings, both of which read stamina.
 *
 * Player: uniform BASE with stamina at each of STAMINAS. Opponent: uniform BASE.
 *
 * Run: npx tsx src/test/analysis/staminaAnatomy.ts
 * Env: N=400 (matches per row)  BASE=30  STAMINAS=20,40,60,80  ENERGY=100,30
 *      FORMATS=bo1,bo3
 */

import type { MatchFormat, PlayerStats } from '../../types';
import { PlayerProfile } from '../../core/PlayerProfile';
import { MatchSimulator } from '../../core/MatchSimulator';

const N = Number(process.env.N ?? 400);
const BASE = Number(process.env.BASE ?? 30);
const STAMINAS = (process.env.STAMINAS ?? '20,40,60,80').split(',').map(Number);
const ENERGIES = (process.env.ENERGY ?? '100,30').split(',').map(Number);
const FORMATS: Record<string, MatchFormat> = {
  bo1: { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 },
  bo3: { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 },
};
const FORMAT_NAMES = (process.env.FORMATS ?? 'bo1,bo3').split(',');

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, net: r },
  technical: { slice: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r },
  mental: { focus: r, anticipation: r, tactics: r },
});

interface Tally {
  pointsWon: number;
  points: number;
  shots: number;
  rallyLoss: number;
  fatigueLoss: number;
  longRallyShots: number;
  peakFatigue: number;
  matches: number;
}

function run(stamina: number, energy: number, format: MatchFormat): Tally {
  const t: Tally = {
    pointsWon: 0,
    points: 0,
    shots: 0,
    rallyLoss: 0,
    fatigueLoss: 0,
    longRallyShots: 0,
    peakFatigue: 0,
    matches: 0,
  };
  for (let m = 0; m < N; m++) {
    const stats = uniform(BASE);
    stats.physical.stamina = stamina;
    const player = new PlayerProfile('p', 'P', stats);
    const opponent = new PlayerProfile('o', 'O', uniform(BASE));
    player.energy = energy;
    opponent.energy = energy;
    const sim = new MatchSimulator({
      player,
      opponent,
      courtSurface: 'hard',
      matchFormat: format,
    });
    sim.simulateMatch();
    // simulateMatch's result leaves pointResults empty; the export carries every shot.
    const points = sim.exportMatchData().points;

    let peak = 0;
    for (const point of points) {
      t.points++;
      const playerRole = point.server === 'player' ? 'server' : 'returner';
      if (point.winner === 'player') t.pointsWon++;
      for (const shot of point.shots) {
        if (shot.shooter !== playerRole) continue;
        t.shots++;
        t.rallyLoss += 1 - shot.modifiers.rallyLengthModifier;
        t.fatigueLoss += 1 - shot.modifiers.fatigueModifier;
        if (shot.shotNumber > 5) t.longRallyShots++;
        peak = Math.max(peak, ((1 - shot.modifiers.fatigueModifier) / 0.2) * 100);
      }
    }
    t.peakFatigue += peak;
    t.matches++;
  }
  return t;
}

function main(): void {
  console.log(`staminaAnatomy  N=${N} BASE=${BASE} (player shots only)`);
  console.log(
    [
      'format',
      'energy',
      'stamina',
      'pt-win%',
      'shots>5 in rally',
      'rally-length loss',
      'fatigue loss',
      'peak fatigue',
    ].join('\t'),
  );
  const log = console.log;
  for (const f of FORMAT_NAMES) {
    for (const energy of ENERGIES) {
      for (const s of STAMINAS) {
        console.log = (): void => {};
        const t = run(s, energy, FORMATS[f]);
        console.log = log;
        console.log(
          [
            f,
            energy,
            s,
            ((t.pointsWon / t.points) * 100).toFixed(1),
            `${((t.longRallyShots / t.shots) * 100).toFixed(1)}%`,
            `${((t.rallyLoss / t.shots) * 100).toFixed(2)}%`,
            `${((t.fatigueLoss / t.shots) * 100).toFixed(2)}%`,
            (t.peakFatigue / t.matches).toFixed(1),
          ].join('\t'),
        );
      }
    }
  }
}

main();
