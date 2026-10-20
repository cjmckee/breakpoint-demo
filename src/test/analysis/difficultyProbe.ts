/**
 * Difficulty Probe — how hard is each Club opponent for the players who meet it,
 * and how far would it have to move to hit a target win rate?
 *
 * Builds come from careerSim's CAREERS output: each career's build the evening before
 * every opponent slot (`builds`). Each slot's opponent is shifted by k on every stat
 * (clamped 1–100) and played N times by every career's build, so the shape of the
 * opponent — and its abilities — stay as written. Populations are the careers' TAG.
 *
 * Slots: the day-5 tutorial matches (Keith, Jen; best of one, no match form), the
 * practice roster's first rung (best of one, averaged over the roster), the five team
 * matches at their venues and the Riverside Open's four rounds (best of three).
 *
 * It holds builds fixed, so it ignores the feedback of an easier season (more wins,
 * more pay): re-run careerSim with the new opponents to confirm.
 *
 * Run: CAREERS=out.jsonl TAG=average RUNS=30 npx tsx src/test/analysis/careerSim.ts  (and a
 *      skilled population), then npx tsx src/test/analysis/difficultyProbe.ts out.jsonl
 * Env: N=6 (matches per build per k)  SHIFTS=-20,-16,...  SLOTS=tm1,tm5 (default all)
 *      TARGET=60 (the population named by TARGET_TAG=average)
 */

import { readFileSync } from 'node:fs';
import type { MatchFormat, PlayerStats } from '../../types';
import type { ArchetypeProfile } from '../../types/archetype';
import type { Ability, Venue, HomeSide } from '../../types/game';
import { PlayerProfile } from '../../core/PlayerProfile';
import { MatchSimulator } from '../../core/MatchSimulator';
import { abilityEffects } from '../../core/EffectAggregator';
import { profileForArchetype } from '../../data/archetypeTree';
import { OPPONENTS_BY_TIER, getOpponentArchetypeProfile } from '../../data/opponents';
import {
  TEAM_MATCH_1,
  TEAM_MATCH_2,
  TEAM_MATCH_3,
  TEAM_MATCH_4,
  TEAM_MATCH_5,
} from '../../data/teamMatches';
import { riversideOpen } from '../../data/tournaments/riversideOpen';
import { StoryEventRepository } from '../../data/storyEvents';
import type { StoryMatchMetadata } from '../../types/game';

const N = Number(process.env.N ?? 6);
const SHIFTS = (process.env.SHIFTS ?? '-20,-16,-12,-10,-8,-6,-4,-2,0,2,4').split(',').map(Number);
const TARGET = Number(process.env.TARGET ?? 60);
const TARGET_TAG = process.env.TARGET_TAG ?? 'average';

const BO1: MatchFormat = { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };

interface Side {
  stats: PlayerStats;
  profile: ArchetypeProfile;
  effects?: Record<string, number>;
}

interface Opponent extends Side {
  name: string;
}

interface Slot {
  id: string;
  /** Which saved build meets it. */
  build: string;
  opponents: Opponent[];
  format: MatchFormat;
  surface: 'hard' | 'clay' | 'grass' | 'carpet';
  venue?: Venue;
  home?: HomeSide;
  /** Tutorial matches turn match-day form off. */
  noForm?: boolean;
  energy: number;
}

const effectsOf = (abilities: Ability[] | undefined): Record<string, number> =>
  abilityEffects(abilities ?? []);

/** The day-5 tutorial matches, read from the event that schedules them. */
function tutorialOpponents(): Opponent[] {
  const event = StoryEventRepository.getEventById('match_play_basics');
  const outcomes = [event?.defaultOutcome, ...(event?.options ?? []).map((o) => o.outcome)];
  return outcomes
    .flatMap((o) => o?.effects?.scheduledEvents ?? [])
    .filter((e) => e.eventType === 'story_match')
    .map((e) => {
      const m = e.metadata as StoryMatchMetadata;
      return {
        name: m.opponentName ?? '?',
        stats: m.opponentStats!,
        profile: m.opponentArchetypeProfile ?? profileForArchetype('all_court'),
        effects: effectsOf(m.opponentAbilities),
      };
    });
}

const team = (t: typeof TEAM_MATCH_1, i: number): Slot => ({
  id: `tm${i + 1}`,
  build: `tm${i + 1}`,
  opponents: [
    {
      name: t.opponent.name,
      stats: t.opponent.stats,
      profile: profileForArchetype(t.opponent.archetype, t.opponent.tier),
      effects: effectsOf(t.opponent.abilities),
    },
  ],
  format: BO3,
  surface: t.venue.surface,
  venue: t.venue,
  home: t.home,
  energy: 80,
});

const [keith, jen] = tutorialOpponents();
const SLOTS: Slot[] = [
  {
    id: 'keith',
    build: 'early',
    opponents: [keith],
    format: BO1,
    surface: 'hard',
    noForm: true,
    energy: 100,
  },
  {
    id: 'jen',
    build: 'early',
    opponents: [jen],
    format: BO1,
    surface: 'hard',
    noForm: true,
    energy: 100,
  },
  {
    id: 'practice',
    build: 'early',
    opponents: OPPONENTS_BY_TIER[1].map((o) => ({
      name: o.name,
      stats: o.stats,
      profile: getOpponentArchetypeProfile(o),
      effects: effectsOf(o.abilities),
    })),
    format: BO1,
    surface: 'hard',
    energy: 80,
  },
  ...[TEAM_MATCH_1, TEAM_MATCH_2, TEAM_MATCH_3, TEAM_MATCH_4, TEAM_MATCH_5].map(team),
  ...riversideOpen.rounds.map((r, i): Slot => ({
    id: `r${i + 1}`,
    build: 'riverside',
    opponents: [
      {
        name: r.opponent.name,
        stats: r.opponent.stats,
        profile: profileForArchetype(r.opponent.archetype, r.opponent.tier),
        effects: effectsOf(r.opponent.abilities),
      },
    ],
    format: BO3,
    surface: riversideOpen.venue.surface,
    venue: riversideOpen.venue,
    energy: 100,
  })),
];

const shift = (s: PlayerStats, k: number): PlayerStats => {
  const move = <T extends object>(g: T): T =>
    Object.fromEntries(
      Object.entries(g).map(([key, v]) => [key, Math.max(1, Math.min(100, (v as number) + k))]),
    ) as T;
  return {
    core: move(s.core),
    technical: move(s.technical),
    physical: move(s.physical),
    mental: move(s.mental),
  };
};

const ovr = (s: PlayerStats): number => {
  const all = [s.core, s.technical, s.physical, s.mental].flatMap((g) => Object.values(g));
  return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
};

function win(me: Side, opp: Side, slot: Slot): boolean {
  const player = new PlayerProfile('p', 'P', me.stats, me.profile);
  player.energy = slot.energy;
  const sim = new MatchSimulator({
    player,
    opponent: new PlayerProfile('o', 'O', opp.stats, opp.profile),
    courtSurface: slot.surface,
    venue: slot.venue,
    home: slot.home,
    matchFormat: slot.format,
    playerEffects: me.effects,
    opponentEffects: opp.effects,
    ...(slot.noForm ? { matchFormVariance: 0 } : {}),
  });
  return sim.simulateMatch().winner === 'player';
}

function main(): void {
  const path = process.argv[2];
  const rows = readFileSync(path, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(
      (l) =>
        JSON.parse(l) as {
          identity: string;
          settings: Record<string, string>;
          builds: Record<string, Side & { day: number }>;
        },
    );
  const tags = [...new Set(rows.map((r) => r.settings.TAG ?? '?'))];
  const only = process.env.SLOTS?.split(',');
  const quiet = console.log;
  console.log = () => {};
  console.warn = () => {};
  const out: string[] = [];
  out.push(
    `difficultyProbe  N=${N} per build per shift  careers ${tags.map((t) => `${t}=${rows.filter((r) => (r.settings.TAG ?? '?') === t).length}`).join(' ')}`,
  );
  for (const slot of SLOTS.filter((s) => !only || only.includes(s.id))) {
    const names = slot.opponents.map((o) => o.name).join('/');
    const baseOvr = Math.round(
      slot.opponents.reduce((a, o) => a + ovr(o.stats), 0) / slot.opponents.length,
    );
    const day = rows[0].builds[slot.build].day;
    out.push(`\n${slot.id}  ${names}  (mean stat ${baseOvr}, build of day ${day})`);
    out.push(`  shift  ${tags.map((t) => t.padStart(9)).join('')}`);
    const curve: Array<{ k: number; rate: Record<string, number> }> = [];
    for (const k of SHIFTS) {
      const rate: Record<string, number> = {};
      for (const tag of tags) {
        let won = 0;
        let played = 0;
        for (const r of rows.filter((x) => (x.settings.TAG ?? '?') === tag)) {
          for (let i = 0; i < N; i++) {
            const opp = slot.opponents[i % slot.opponents.length];
            if (win(r.builds[slot.build], { ...opp, stats: shift(opp.stats, k) }, slot)) won++;
            played++;
          }
        }
        rate[tag] = (100 * won) / played;
      }
      curve.push({ k, rate });
      out.push(
        `  ${String(k).padStart(5)}  ${tags.map((t) => rate[t].toFixed(0).padStart(8) + '%').join('')}`,
      );
    }
    // The shift whose TARGET_TAG rate is closest to TARGET.
    const best = curve.reduce((a, b) =>
      Math.abs((b.rate[TARGET_TAG] ?? 0) - TARGET) < Math.abs((a.rate[TARGET_TAG] ?? 0) - TARGET)
        ? b
        : a,
    );
    out.push(
      `  → shift ${best.k} puts ${TARGET_TAG} at ${best.rate[TARGET_TAG]?.toFixed(0)}% ` +
        `(${tags.map((t) => `${t} ${best.rate[t].toFixed(0)}%`).join(', ')})`,
    );
  }
  console.log = quiet;
  console.log(out.join('\n'));
}

main();
