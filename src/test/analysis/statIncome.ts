/**
 * Stat Income — how many permanent stat points the authored content hands out,
 * and to which stats.
 *
 * Tallies story event outcomes (every option, including minigame fail
 * branches), challenge template rewards, and ability base stat boosts. Story
 * totals are across all branches, so they bound what one playthrough can
 * collect; "sum of best outcome per event" is the tighter bound.
 * Also lists every statThreshold challenge requirement, since those are the
 * goals a points-spend economy would let a player buy directly.
 *
 * Run: npx tsx src/test/analysis/statIncome.ts
 */

import { StoryEventRepository } from '../../data/storyEvents';
import * as CT from '../../data/challengeTemplates';
import { ABILITY_DEFINITIONS } from '../../data/abilities';
import type { StatBoosts } from '../../types/game';
import type { ChallengeTemplate } from '../../types/challenges';

type Tot = Record<string, { pos: number; neg: number; n: number }>;
function add(t: Tot, b: StatBoosts | undefined) {
  if (!b) return 0;
  let s = 0;
  for (const [k, v] of Object.entries(b)) {
    if (!v) continue;
    t[k] ??= { pos: 0, neg: 0, n: 0 };
    if (v > 0) t[k].pos += v;
    else t[k].neg += v;
    t[k].n++;
    s += v;
  }
  return s;
}
const story: Tot = {};
let outcomes = 0,
  withStats = 0;
const sizes: number[] = [];
let maxPerEvent = 0,
  events = 0,
  eventsWithStats = 0,
  sumBestPerEvent = 0;
for (const e of StoryEventRepository.getAllEvents()) {
  events++;
  const outs = e.options.length
    ? e.options.flatMap((o) => [o.outcome, ...(o.minigame ? [o.minigame.failOutcome] : [])])
    : [e.defaultOutcome!].filter(Boolean);
  let best = 0;
  for (const o of outs) {
    outcomes++;
    const s = add(story, o.effects.statChanges);
    if (o.effects.statChanges && Object.keys(o.effects.statChanges).length) {
      withStats++;
      sizes.push(s);
    }
    best = Math.max(best, s);
  }
  if (best > 0) {
    eventsWithStats++;
    sumBestPerEvent += best;
  }
}
console.log(
  'story events',
  events,
  'outcomes',
  outcomes,
  'with stats',
  withStats,
  'events w/ stats',
  eventsWithStats,
  'sum of best outcome per event',
  sumBestPerEvent,
);
sizes.sort((a, b) => a - b);
console.log(
  'outcome net size median',
  sizes[Math.floor(sizes.length / 2)],
  'max',
  sizes.at(-1),
  'min',
  sizes[0],
);
console.table(story);
const ch: Tot = {};
let chTot = 0;
const thresholds: string[] = [];
const isTemplate = (v: unknown): v is ChallengeTemplate =>
  typeof v === 'object' && v !== null && 'reward' in v && 'requirements' in v;
for (const [name, t] of Object.entries(CT)) {
  if (!isTemplate(t)) continue;
  chTot += add(ch, t.reward.modifiers?.statBoosts);
  for (const r of t.requirements)
    if (r.type === 'statThreshold') thresholds.push(`${name}: ${r.statName}>=${r.targetValue}`);
}
console.log('challenge stat total', chTot);
console.table(ch);
console.log(thresholds);
const ab: Tot = {};
let abTot = 0;
for (const a of Object.values(ABILITY_DEFINITIONS)) abTot += add(ab, a.modifiers.statBoosts);
console.log('abilities', Object.keys(ABILITY_DEFINITIONS).length, 'base stat total', abTot);
console.table(ab);
