/**
 * Key Moment Probe — measures what the key-moment layer actually produces.
 *
 * Answers three questions the tactical-options design depends on:
 *  1. What success rate does a player actually see, once BASE_CHANCE, the stat
 *     differential, the counter bonus and the live context modifiers are combined?
 *  2. How well does the strongAgainst/weakAgainst chart cover the five archetypes —
 *     i.e. for a given opponent, how many options are a good read vs. a bad one?
 *  3. How do the four outcome bands (crit-success / success / failure / crit-failure)
 *     actually split, and does "critical" carry any information about choice quality?
 *
 * Run with: npx tsx src/test/analysis/keyMomentProbe.ts
 */

import { KeyMomentResolver } from '../../game/KeyMomentResolver';
import { TACTICAL_OPTIONS, TacticalOption, KeyMomentType } from '../../data/tacticalOptions';
import { ARCHETYPE_DATA } from '../../data/archetypes';
import type { ArchetypeType } from '../../data/archetypes';
import type { PlayerStats } from '../../types/game';
import { createUniformPlayer } from './playerFactory';
import { print, printBanner, printHeader, printTable, fmtNum } from './formatters';

const ARCHETYPES = Object.keys(ARCHETYPE_DATA) as ArchetypeType[];
const ALL_OPTIONS: Array<{ type: KeyMomentType; option: TacticalOption }> = Object.entries(
  TACTICAL_OPTIONS,
).flatMap(([type, opts]) =>
  opts.map((option) => ({ type: type as KeyMomentType, option })),
);

const statsAt = (rating: number): PlayerStats =>
  createUniformPlayer(`p${rating}`, rating).stats as unknown as PlayerStats;

// ─── 1. Success rate vs. stat gap and matchup ────────────────────────────────

function probeSuccessRates(): void {
  printHeader('Success probability by stat gap and matchup (no context modifiers)');

  const GAPS = [-20, -10, 0, 10, 20];
  const rows: (string | number)[][] = [];

  for (const gap of GAPS) {
    const player = statsAt(50 + gap);
    const opponent = statsAt(50);
    const bucket: Record<string, number[]> = { counter: [], neutral: [], weak: [] };

    for (const { option } of ALL_OPTIONS) {
      for (const arch of ARCHETYPES) {
        const p = KeyMomentResolver.calculateSuccessProbability(
          player, opponent, option, arch,
        );
        const key = option.strongAgainst.includes(arch)
          ? 'counter'
          : option.weakAgainst.includes(arch)
            ? 'weak'
            : 'neutral';
        bucket[key].push(p);
      }
    }

    const mean = (xs: number[]): string =>
      xs.length ? `${fmtNum(xs.reduce((a, b) => a + b, 0) / xs.length)}%` : '—';

    rows.push([
      gap > 0 ? `+${gap}` : `${gap}`,
      mean(bucket.counter),
      mean(bucket.neutral),
      mean(bucket.weak),
    ]);
  }

  printTable(['Player stat gap', 'Good read', 'Neutral', 'Bad read'], rows);
  print('');
  print('An evenly-matched player picking a NEUTRAL option is the baseline the');
  print('design intends to sit near 50%.');
}

// ─── 2. Counter coverage per archetype ───────────────────────────────────────

function probeCounterCoverage(): void {
  printHeader('Counter chart coverage — how each archetype can be answered');

  const rows: (string | number)[][] = [];
  for (const arch of ARCHETYPES) {
    let strong = 0;
    let weak = 0;
    let neutral = 0;
    for (const { option } of ALL_OPTIONS) {
      if (option.strongAgainst.includes(arch)) strong++;
      else if (option.weakAgainst.includes(arch)) weak++;
      else neutral++;
    }
    rows.push([
      ARCHETYPE_DATA[arch].label,
      strong,
      neutral,
      weak,
      `${fmtNum((100 * strong) / ALL_OPTIONS.length)}%`,
    ]);
  }
  printTable(
    ['Opponent archetype', 'Options strong vs.', 'Neutral', 'Weak vs.', '% counterable'],
    rows,
  );

  // Per-situation view: within a single 3-option menu, how many are a good read?
  printHeader('Reads available inside one menu (per situation × opponent)');
  const dist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const deadMenus: string[] = [];
  for (const [type, opts] of Object.entries(TACTICAL_OPTIONS)) {
    for (const arch of ARCHETYPES) {
      const n = opts.filter((o) => o.strongAgainst.includes(arch)).length;
      dist[n] = (dist[n] ?? 0) + 1;
      if (n === 0) deadMenus.push(`${type} vs ${arch}`);
    }
  }
  printTable(
    ['Good reads in the menu', 'How many (situation × opponent) pairs'],
    Object.entries(dist).map(([n, c]) => [n, c]),
  );
  if (deadMenus.length) {
    print('');
    print(`Menus with NO countering option (${deadMenus.length}):`);
    for (const m of deadMenus) print(`  · ${m}`);
  }
}

// ─── 3. Outcome band split ───────────────────────────────────────────────────

function probeOutcomeBands(): void {
  printHeader('Outcome bands — does "critical" track choice quality?');

  const N = 40000;
  const player = statsAt(50);
  const opponent = statsAt(50);
  const rows: (string | number)[][] = [];

  const scenarios: Array<{ label: string; pick: 'counter' | 'neutral' | 'weak' }> = [
    { label: 'Good read', pick: 'counter' },
    { label: 'Neutral', pick: 'neutral' },
    { label: 'Bad read', pick: 'weak' },
  ];

  for (const { label, pick } of scenarios) {
    const tally = { 'critical-success': 0, success: 0, failure: 0, 'critical-failure': 0 };
    let n = 0;
    for (let i = 0; i < N; i++) {
      const { option } = ALL_OPTIONS[i % ALL_OPTIONS.length];
      const arch =
        pick === 'counter'
          ? option.strongAgainst[0]
          : pick === 'weak'
            ? option.weakAgainst[0]
            : ARCHETYPES.find(
                (a) => !option.strongAgainst.includes(a) && !option.weakAgainst.includes(a),
              );
      if (!arch) continue;
      const r = KeyMomentResolver.resolveKeyMoment(player, opponent, option, arch);
      tally[r.outcome]++;
      n++;
    }
    const pct = (x: number): string => `${fmtNum((100 * x) / n)}%`;
    const wins = tally['critical-success'] + tally.success;
    const losses = tally.failure + tally['critical-failure'];
    rows.push([
      label,
      pct(wins),
      pct(tally['critical-success']),
      pct(tally['critical-failure']),
      `${fmtNum((100 * tally['critical-success']) / wins)}%`,
      `${fmtNum((100 * tally['critical-failure']) / losses)}%`,
    ]);
  }

  printTable(
    ['Choice', 'Win rate', 'Crit success', 'Crit failure', 'of wins, crit', 'of losses, crit'],
    rows,
  );
}

// ─── 4. Context modifier reach ───────────────────────────────────────────────

function probeContextSwing(): void {
  printHeader('How far live context can move a key moment');

  const rows: (string | number)[][] = [
    ['Best case (mom +100, mood +100, energy 100, pressure 0)',
      fmtNum(KeyMomentResolver.getContextModifiers(
        { momentum: 100, mood: 100, energy: 100, pressure: 0 }).total)],
    ['Typical good (mom +30, mood +20, energy 70, pressure 40)',
      fmtNum(KeyMomentResolver.getContextModifiers(
        { momentum: 30, mood: 20, energy: 70, pressure: 40 }).total)],
    ['Neutral (all mid)',
      fmtNum(KeyMomentResolver.getContextModifiers(
        { momentum: 0, mood: 0, energy: 70, pressure: 50 }).total)],
    ['Typical bad (mom -30, mood -20, energy 45, pressure 70)',
      fmtNum(KeyMomentResolver.getContextModifiers(
        { momentum: -30, mood: -20, energy: 45, pressure: 70 }).total)],
    ['Worst case (mom -100, mood -100, energy 0, pressure 100)',
      fmtNum(KeyMomentResolver.getContextModifiers(
        { momentum: -100, mood: -100, energy: 0, pressure: 100 }).total)],
  ];
  printTable(['Context', 'Total modifier (%)'], rows);
}


// ─── 5. Realistic in-match scenarios ─────────────────────────────────────────

/**
 * Key moments fire on close games late in sets — exactly the conditions
 * MatchOrchestrator.updatePressure() scores highest. Base score pressure is 30,
 * +20 for a close game at 3+, +30 for a close set, +20 once a set is complete.
 * So a key moment is never played at low pressure, and pressure is a pure penalty.
 */
function probeRealisticScenarios(): void {
  printHeader('What a player actually sees at a key moment');

  const scenarios: Array<{
    label: string; playerRating: number; oppRating: number;
    pressure: number; energy: number; momentum: number; mood: number;
  }> = [
    { label: 'Set 1 break pt, even match', playerRating: 50, oppRating: 50, pressure: 50, energy: 85, momentum: 0, mood: 0 },
    { label: 'Set 2 break pt, even match', playerRating: 50, oppRating: 50, pressure: 70, energy: 65, momentum: 0, mood: 0 },
    { label: 'Set 3 match pt, even match', playerRating: 50, oppRating: 50, pressure: 100, energy: 45, momentum: 0, mood: 0 },
    { label: 'Set 2 break pt, player +10', playerRating: 60, oppRating: 50, pressure: 70, energy: 65, momentum: 20, mood: 10 },
    { label: 'Set 2 break pt, player -10', playerRating: 40, oppRating: 50, pressure: 70, energy: 65, momentum: -20, mood: -10 },
  ];

  const rows: (string | number)[][] = [];
  for (const s of scenarios) {
    const player = statsAt(s.playerRating);
    const opponent = statsAt(s.oppRating);
    const ctx = { pressure: s.pressure, energy: s.energy, momentum: s.momentum, mood: s.mood };
    const bucket: Record<string, number[]> = { counter: [], neutral: [], weak: [] };

    for (const { option } of ALL_OPTIONS) {
      for (const arch of ARCHETYPES) {
        const p = KeyMomentResolver.calculateSuccessProbability(
          player, opponent, option, arch, ctx,
        );
        const key = option.strongAgainst.includes(arch)
          ? 'counter'
          : option.weakAgainst.includes(arch)
            ? 'weak'
            : 'neutral';
        bucket[key].push(p);
      }
    }
    const mean = (xs: number[]): string =>
      xs.length ? `${fmtNum(xs.reduce((a, b) => a + b, 0) / xs.length)}%` : '—';
    rows.push([s.label, mean(bucket.counter), mean(bucket.neutral), mean(bucket.weak)]);
  }

  printTable(['Scenario', 'Good read', 'Neutral', 'Bad read'], rows);
  print('');
  print('Pressure and energy are one-sided penalties in getContextModifiers() —');
  print('they can only subtract. Only momentum and mood can add. Since key moments');
  print('fire on high-pressure points by definition, the context layer is a net');
  print('negative essentially every time it is consulted.');
}

printBanner('KEY MOMENT PROBE');
probeSuccessRates();
probeCounterCoverage();
probeOutcomeBands();
probeContextSwing();
probeRealisticScenarios();
