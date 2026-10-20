/**
 * Opponent Presets Database
 * 5 archetypes x 4 tiers = 20 unique opponents.
 * One is randomly selected per match from the chosen tier.
 *
 * These are the practice rosters. Each tier is built to its season's practice
 * band (docs/proposals/mid-late-progression.md §2.2): about the OVR of a player
 * just promoted into it, before the +2 per practice win. Measured, not eyeballed:
 * `bandCheck ONLY=<season>-practice` gives each one's effective OVR. Shapes widen
 * with the tier, and a flat all-courter plays softer than its OVR while a big
 * server plays harder, so their written OVRs sit either side of the band.
 */

import type { PlayerStats, OpponentTier, Ability } from '../types/game';
import { AbilityName } from '../types/game';
import type { ArchetypeType } from './archetypes';
import type { ArchetypeProfile } from '../types/archetype';
import { profileForArchetype } from './archetypeTree';
import { ABILITY_DEFINITIONS } from './abilities';

import { random } from '../core/random';
export interface OpponentPreset {
  name: string;
  description: string;
  tier: OpponentTier;
  archetype: ArchetypeType;
  stats: PlayerStats;
  abilities?: Ability[];
}

// ============================================================
// TIER 1 — Club Level
// ============================================================

const TIER_1_OPPONENTS: OpponentPreset[] = [
  {
    name: 'Danny Park',
    description: 'Weekend warrior who hits hard but makes lots of errors',
    tier: 1,
    archetype: 'aggressive',
    stats: {
      core: { serve: 20, forehand: 25, backhand: 10, return: 10, net: 16 },
      technical: { slice: 8, spin: 13, placement: 13 },
      physical: { speed: 18, stamina: 13, strength: 25 },
      mental: { focus: 18, anticipation: 13, tactics: 16 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.HEAVY_HITTER]],
  },
  {
    name: 'Marta Ruiz',
    description: 'Patient club player who just keeps getting the ball back',
    tier: 1,
    archetype: 'defensive',
    stats: {
      core: { serve: 21, forehand: 16, backhand: 18, return: 20, net: 13 },
      technical: { slice: 15, spin: 15, placement: 13 },
      physical: { speed: 23, stamina: 25, strength: 15 },
      mental: { focus: 23, anticipation: 25, tactics: 19 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.BASELINER]],
  },
  {
    name: 'Rick Tanaka',
    description: 'Crafty player who mixes up pace and hits tricky shots',
    tier: 1,
    archetype: 'all_court',
    stats: {
      core: { serve: 21, forehand: 20, backhand: 20, return: 18, net: 15 },
      technical: { slice: 22, spin: 20, placement: 20 },
      physical: { speed: 16, stamina: 19, strength: 14 },
      mental: { focus: 20, anticipation: 20, tactics: 14 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.SPIN_MASTER]],
  },
  {
    name: 'Big Steve',
    description: 'Tall club player with a big serve who loves the net',
    tier: 1,
    archetype: 'serve_volley',
    stats: {
      core: { serve: 25, forehand: 22, backhand: 22, return: 13, net: 25 },
      technical: { slice: 13, spin: 13, placement: 15 },
      physical: { speed: 18, stamina: 18, strength: 23 },
      mental: { focus: 18, anticipation: 21, tactics: 16 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.OVERHEAD_SMASH]],
  },
  {
    name: 'Lin Chen',
    description: 'Quick and scrappy — retrieves everything and waits for you to miss',
    tier: 1,
    archetype: 'counterpuncher',
    stats: {
      core: { serve: 20, forehand: 18, backhand: 21, return: 23, net: 12 },
      technical: { slice: 20, spin: 21, placement: 18 },
      physical: { speed: 25, stamina: 25, strength: 10 },
      mental: { focus: 20, anticipation: 20, tactics: 19 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.SLIDER]],
  },
];

// ============================================================
// TIER 2 — Regional Level
// ============================================================

const TIER_2_OPPONENTS: OpponentPreset[] = [
  {
    name: 'Marcus Cole',
    description: 'Powerful regional player who dominates with his forehand',
    tier: 2,
    archetype: 'aggressive',
    stats: {
      core: { serve: 50, forehand: 58, backhand: 39, return: 36, net: 36 },
      technical: { slice: 28, spin: 41, placement: 43 },
      physical: { speed: 43, stamina: 39, strength: 54 },
      mental: { focus: 41, anticipation: 36, tactics: 43 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.HEAVY_HITTER]],
  },
  {
    name: 'Sofia Petrov',
    description: 'Consistent baseliner who rarely misses and grinds you down',
    tier: 2,
    archetype: 'defensive',
    stats: {
      core: { serve: 38, forehand: 45, backhand: 49, return: 49, net: 28 },
      technical: { slice: 43, spin: 45, placement: 43 },
      physical: { speed: 49, stamina: 54, strength: 34 },
      mental: { focus: 49, anticipation: 45, tactics: 43 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.BASELINER]],
  },
  {
    name: 'Jake Morrison',
    description: 'Well-rounded player comfortable anywhere on the court',
    tier: 2,
    archetype: 'all_court',
    stats: {
      core: { serve: 46, forehand: 50, backhand: 46, return: 44, net: 42 },
      technical: { slice: 42, spin: 44, placement: 50 },
      physical: { speed: 46, stamina: 50, strength: 44 },
      mental: { focus: 46, anticipation: 44, tactics: 44 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.SOFT_HANDS]],
  },
  {
    name: 'Henri Blanc',
    description: 'Classic serve and volleyer with a booming serve',
    tier: 2,
    archetype: 'serve_volley',
    stats: {
      core: { serve: 58, forehand: 39, backhand: 32, return: 30, net: 52 },
      technical: { slice: 36, spin: 32, placement: 47 },
      physical: { speed: 47, stamina: 36, strength: 47 },
      mental: { focus: 41, anticipation: 47, tactics: 38 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.NETCRASHER]],
  },
  {
    name: 'Yuki Sato',
    description: 'Lightning-fast retriever who turns defense into offense',
    tier: 2,
    archetype: 'counterpuncher',
    stats: {
      core: { serve: 32, forehand: 41, backhand: 47, return: 52, net: 23 },
      technical: { slice: 50, spin: 43, placement: 39 },
      physical: { speed: 54, stamina: 58, strength: 30 },
      mental: { focus: 50, anticipation: 52, tactics: 41 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.RANGY_RETURN]],
  },
];

// ============================================================
// TIER 3 — Professional Level
// ============================================================

const TIER_3_OPPONENTS: OpponentPreset[] = [
  {
    name: 'Diego Vargas',
    description: 'Explosive tour pro who overwhelms opponents with firepower',
    tier: 3,
    archetype: 'aggressive',
    stats: {
      core: { serve: 67, forehand: 72, backhand: 52, return: 44, net: 53 },
      technical: { slice: 37, spin: 56, placement: 58 },
      physical: { speed: 56, stamina: 46, strength: 69 },
      mental: { focus: 52, anticipation: 46, tactics: 46 },
    },
    abilities: [
      ABILITY_DEFINITIONS[AbilityName.HEAVY_HITTER],
      ABILITY_DEFINITIONS[AbilityName.SERVE_CANNON],
    ],
  },
  {
    name: 'Anna Kowalski',
    description: 'Rock-solid professional who never gives you a free point',
    tier: 3,
    archetype: 'defensive',
    stats: {
      core: { serve: 52, forehand: 58, backhand: 63, return: 63, net: 42 },
      technical: { slice: 58, spin: 61, placement: 58 },
      physical: { speed: 63, stamina: 70, strength: 47 },
      mental: { focus: 63, anticipation: 61, tactics: 53 },
    },
    abilities: [
      ABILITY_DEFINITIONS[AbilityName.BASELINER],
      ABILITY_DEFINITIONS[AbilityName.SPEED_DEMON],
    ],
  },
  {
    name: 'Alex Novak',
    description: 'Versatile pro who adapts to any opponent and surface',
    tier: 3,
    archetype: 'all_court',
    stats: {
      core: { serve: 62, forehand: 64, backhand: 62, return: 59, net: 57 },
      technical: { slice: 59, spin: 62, placement: 64 },
      physical: { speed: 62, stamina: 64, strength: 59 },
      mental: { focus: 64, anticipation: 62, tactics: 56 },
    },
    abilities: [
      ABILITY_DEFINITIONS[AbilityName.SPIN_MASTER],
      ABILITY_DEFINITIONS[AbilityName.CLUTCH],
    ],
  },
  {
    name: 'James Whitfield',
    description: 'Classic grass-court specialist with a lethal serve and volley game',
    tier: 3,
    archetype: 'serve_volley',
    stats: {
      core: { serve: 73, forehand: 50, backhand: 45, return: 38, net: 69 },
      technical: { slice: 50, spin: 42, placement: 61 },
      physical: { speed: 59, stamina: 45, strength: 61 },
      mental: { focus: 56, anticipation: 61, tactics: 47 },
    },
    abilities: [
      ABILITY_DEFINITIONS[AbilityName.NETCRASHER],
      ABILITY_DEFINITIONS[AbilityName.SERVE_CANNON],
    ],
  },
  {
    name: 'Elena Varga',
    description: 'Defensive wizard who reads every shot and turns the point around',
    tier: 3,
    archetype: 'counterpuncher',
    stats: {
      core: { serve: 46, forehand: 54, backhand: 62, return: 69, net: 37 },
      technical: { slice: 65, spin: 57, placement: 54 },
      physical: { speed: 69, stamina: 73, strength: 42 },
      mental: { focus: 69, anticipation: 69, tactics: 46 },
    },
    abilities: [
      ABILITY_DEFINITIONS[AbilityName.RANGY_RETURN],
      ABILITY_DEFINITIONS[AbilityName.SPEED_DEMON],
    ],
  },
];

// ============================================================
// TIER 4 — Champion Level
// ============================================================

const TIER_4_OPPONENTS: OpponentPreset[] = [
  {
    name: 'Carlos Fuentes',
    description: 'Former world #1 known for devastating forehand winners',
    tier: 4,
    archetype: 'aggressive',
    stats: {
      core: { serve: 78, forehand: 86, backhand: 65, return: 59, net: 65 },
      technical: { slice: 49, spin: 70, placement: 75 },
      physical: { speed: 65, stamina: 59, strength: 81 },
      mental: { focus: 70, anticipation: 62, tactics: 54 },
    },
    abilities: [
      ABILITY_DEFINITIONS[AbilityName.HEAVY_HITTER],
      ABILITY_DEFINITIONS[AbilityName.SERVE_CANNON],
    ],
  },
  {
    name: 'Nadia Volkov',
    description: 'Legendary champion who broke opponents with relentless consistency',
    tier: 4,
    archetype: 'defensive',
    stats: {
      core: { serve: 55, forehand: 67, backhand: 71, return: 75, net: 49 },
      technical: { slice: 67, spin: 71, placement: 67 },
      physical: { speed: 71, stamina: 78, strength: 51 },
      mental: { focus: 75, anticipation: 71, tactics: 55 },
    },
    abilities: [
      ABILITY_DEFINITIONS[AbilityName.BASELINER],
      ABILITY_DEFINITIONS[AbilityName.SPEED_DEMON],
    ],
  },
  {
    name: 'Thomas Lund',
    description: 'Tactical genius who could play any style and dominate',
    tier: 4,
    archetype: 'all_court',
    stats: {
      core: { serve: 68, forehand: 73, backhand: 68, return: 68, net: 66 },
      technical: { slice: 63, spin: 68, placement: 76 },
      physical: { speed: 68, stamina: 73, strength: 63 },
      mental: { focus: 76, anticipation: 73, tactics: 62 },
    },
    abilities: [
      ABILITY_DEFINITIONS[AbilityName.SOFT_HANDS],
      ABILITY_DEFINITIONS[AbilityName.CLUTCH],
    ],
  },
  {
    name: 'Patrick Rafter Jr.',
    description: 'Son of a legend — inherited the serve and volley magic',
    tier: 4,
    archetype: 'serve_volley',
    stats: {
      core: { serve: 80, forehand: 58, backhand: 53, return: 48, net: 78 },
      technical: { slice: 58, spin: 53, placement: 74 },
      physical: { speed: 69, stamina: 53, strength: 69 },
      mental: { focus: 69, anticipation: 74, tactics: 48 },
    },
    abilities: [
      ABILITY_DEFINITIONS[AbilityName.NETCRASHER],
      ABILITY_DEFINITIONS[AbilityName.SERVE_CANNON],
    ],
  },
  {
    name: 'Kim Soo-jin',
    description: 'Retired champion famous for impossibly long rallies and clutch comebacks',
    tier: 4,
    archetype: 'counterpuncher',
    stats: {
      core: { serve: 54, forehand: 65, backhand: 75, return: 81, net: 46 },
      technical: { slice: 78, spin: 70, placement: 65 },
      physical: { speed: 78, stamina: 86, strength: 49 },
      mental: { focus: 81, anticipation: 81, tactics: 43 },
    },
    abilities: [
      ABILITY_DEFINITIONS[AbilityName.SPEED_DEMON],
      ABILITY_DEFINITIONS[AbilityName.CLUTCH],
    ],
  },
];

/**
 * All opponents organized by tier.
 */
export const OPPONENTS_BY_TIER: Record<OpponentTier, OpponentPreset[]> = {
  1: TIER_1_OPPONENTS,
  2: TIER_2_OPPONENTS,
  3: TIER_3_OPPONENTS,
  4: TIER_4_OPPONENTS,
};

/**
 * Get a random opponent from a specific tier.
 */
export function getRandomOpponent(tier: OpponentTier): OpponentPreset {
  const opponents = OPPONENTS_BY_TIER[tier];
  return opponents[Math.floor(random() * opponents.length)];
}

/**
 * Build the full phase-based archetype profile for an opponent from its authored
 * archetype label, so it plays with a coherent identity in the match engine.
 */
export function getOpponentArchetypeProfile(preset: {
  archetype: ArchetypeType;
  tier: OpponentTier;
}): ArchetypeProfile {
  return profileForArchetype(preset.archetype, preset.tier);
}

/**
 * Get all opponents for a specific tier.
 */
export function getOpponentsForTier(tier: OpponentTier): OpponentPreset[] {
  return OPPONENTS_BY_TIER[tier];
}

/**
 * Apply difficulty scaling to an opponent's stats based on how many practice
 * wins the player has accumulated against that tier. Each win adds +2 to all
 * stats, capped at +20 (reached after 10 wins). Stats are clamped to 100.
 */
export function getScaledOpponentStats(stats: PlayerStats, tierWins: number): PlayerStats {
  const boost = Math.min(tierWins * 2, 20);
  if (boost === 0) return stats;

  // Generic so it survives stats moving bucket — it was a hand-written list of
  // every stat name, which had to be edited whenever the roster changed shape.
  const scale = <T extends object>(group: T): T => {
    const out = { ...group } as Record<string, number>;
    for (const key of Object.keys(out)) out[key] = Math.min(100, out[key] + boost);
    return out as T;
  };

  return {
    core: scale(stats.core),
    technical: scale(stats.technical),
    physical: scale(stats.physical),
    mental: scale(stats.mental),
  };
}
