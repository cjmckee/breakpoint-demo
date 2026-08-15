/**
 * Opponent Presets Database
 * 5 archetypes x 4 tiers = 20 unique opponents.
 * One is randomly selected per match from the chosen tier.
 */

import type { PlayerStats, OpponentTier, Ability } from '../types/game.js';
import { AbilityName } from '../types/game.js';
import type { ArchetypeType } from './archetypes.js';
import type { ArchetypeProfile } from '../types/archetype.js';
import { profileForArchetype } from './archetypeTree.js';
import { ABILITY_DEFINITIONS } from './abilities.js';

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
      core: { serve: 30, forehand: 35, backhand: 20, return: 20, net: 26 },
      technical: { slice: 18, spin: 23, placement: 23 },
      physical: { speed: 28, stamina: 23, strength: 35 },
      mental: { focus: 28, anticipation: 23, tactics: 26 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.HEAVY_HITTER]],
  },
  {
    name: 'Marta Ruiz',
    description: 'Patient club player who just keeps getting the ball back',
    tier: 1,
    archetype: 'defensive',
    stats: {
      core: { serve: 31, forehand: 26, backhand: 28, return: 30, net: 23 },
      technical: { slice: 25, spin: 25, placement: 23 },
      physical: { speed: 33, stamina: 35, strength: 25 },
      mental: { focus: 33, anticipation: 35, tactics: 29 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.BASELINER]],
  },
  {
    name: 'Rick Tanaka',
    description: 'Crafty player who mixes up pace and hits tricky shots',
    tier: 1,
    archetype: 'all_court',
    stats: {
      core: { serve: 31, forehand: 30, backhand: 30, return: 28, net: 25 },
      technical: { slice: 32, spin: 30, placement: 30 },
      physical: { speed: 26, stamina: 29, strength: 24 },
      mental: { focus: 30, anticipation: 30, tactics: 24 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.SPIN_MASTER]],
  },
  {
    name: 'Big Steve',
    description: 'Tall club player with a big serve who loves the net',
    tier: 1,
    archetype: 'serve_volley',
    stats: {
      core: { serve: 35, forehand: 32, backhand: 32, return: 23, net: 35 },
      technical: { slice: 23, spin: 23, placement: 25 },
      physical: { speed: 28, stamina: 28, strength: 33 },
      mental: { focus: 28, anticipation: 31, tactics: 26 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.OVERHEAD_SMASH]],
  },
  {
    name: 'Lin Chen',
    description: 'Quick and scrappy — retrieves everything and waits for you to miss',
    tier: 1,
    archetype: 'counterpuncher',
    stats: {
      core: { serve: 30, forehand: 28, backhand: 31, return: 33, net: 22 },
      technical: { slice: 30, spin: 31, placement: 28 },
      physical: { speed: 35, stamina: 35, strength: 20 },
      mental: { focus: 30, anticipation: 30, tactics: 29 },
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
      core: { serve: 64, forehand: 72, backhand: 53, return: 50, net: 50 },
      technical: { slice: 42, spin: 55, placement: 57 },
      physical: { speed: 57, stamina: 53, strength: 68 },
      mental: { focus: 55, anticipation: 50, tactics: 57 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.HEAVY_HITTER]],
  },
  {
    name: 'Sofia Petrov',
    description: 'Consistent baseliner who rarely misses and grinds you down',
    tier: 2,
    archetype: 'defensive',
    stats: {
      core: { serve: 50, forehand: 57, backhand: 61, return: 61, net: 40 },
      technical: { slice: 55, spin: 57, placement: 55 },
      physical: { speed: 61, stamina: 66, strength: 46 },
      mental: { focus: 61, anticipation: 57, tactics: 55 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.BASELINER]],
  },
  {
    name: 'Jake Morrison',
    description: 'Well-rounded player comfortable anywhere on the court',
    tier: 2,
    archetype: 'all_court',
    stats: {
      core: { serve: 57, forehand: 61, backhand: 57, return: 55, net: 53 },
      technical: { slice: 53, spin: 55, placement: 61 },
      physical: { speed: 57, stamina: 61, strength: 55 },
      mental: { focus: 57, anticipation: 55, tactics: 55 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.SOFT_HANDS]],
  },
  {
    name: 'Henri Blanc',
    description: 'Classic serve and volleyer with a booming serve',
    tier: 2,
    archetype: 'serve_volley',
    stats: {
      core: { serve: 72, forehand: 53, backhand: 46, return: 44, net: 66 },
      technical: { slice: 50, spin: 46, placement: 61 },
      physical: { speed: 61, stamina: 50, strength: 61 },
      mental: { focus: 55, anticipation: 61, tactics: 52 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.NETCRASHER]],
  },
  {
    name: 'Yuki Sato',
    description: 'Lightning-fast retriever who turns defense into offense',
    tier: 2,
    archetype: 'counterpuncher',
    stats: {
      core: { serve: 46, forehand: 55, backhand: 61, return: 66, net: 37 },
      technical: { slice: 64, spin: 57, placement: 53 },
      physical: { speed: 68, stamina: 72, strength: 44 },
      mental: { focus: 64, anticipation: 66, tactics: 55 },
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
      core: { serve: 78, forehand: 82, backhand: 65, return: 58, net: 66 },
      technical: { slice: 52, spin: 68, placement: 70 },
      physical: { speed: 68, stamina: 60, strength: 80 },
      mental: { focus: 65, anticipation: 60, tactics: 60 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.HEAVY_HITTER], ABILITY_DEFINITIONS[AbilityName.SERVE_CANNON]],
  },
  {
    name: 'Anna Kowalski',
    description: 'Rock-solid professional who never gives you a free point',
    tier: 3,
    archetype: 'defensive',
    stats: {
      core: { serve: 62, forehand: 68, backhand: 72, return: 72, net: 54 },
      technical: { slice: 68, spin: 70, placement: 68 },
      physical: { speed: 72, stamina: 78, strength: 58 },
      mental: { focus: 72, anticipation: 70, tactics: 63 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.BASELINER], ABILITY_DEFINITIONS[AbilityName.SPEED_DEMON]],
  },
  {
    name: 'Alex Novak',
    description: 'Versatile pro who adapts to any opponent and surface',
    tier: 3,
    archetype: 'all_court',
    stats: {
      core: { serve: 70, forehand: 72, backhand: 70, return: 68, net: 66 },
      technical: { slice: 68, spin: 70, placement: 72 },
      physical: { speed: 70, stamina: 72, strength: 68 },
      mental: { focus: 72, anticipation: 70, tactics: 65 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.SPIN_MASTER], ABILITY_DEFINITIONS[AbilityName.CLUTCH]],
  },
  {
    name: 'James Whitfield',
    description: 'Classic grass-court specialist with a lethal serve and volley game',
    tier: 3,
    archetype: 'serve_volley',
    stats: {
      core: { serve: 82, forehand: 62, backhand: 58, return: 52, net: 79 },
      technical: { slice: 62, spin: 55, placement: 72 },
      physical: { speed: 70, stamina: 58, strength: 72 },
      mental: { focus: 68, anticipation: 72, tactics: 60 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.NETCRASHER], ABILITY_DEFINITIONS[AbilityName.SERVE_CANNON]],
  },
  {
    name: 'Elena Varga',
    description: 'Defensive wizard who reads every shot and turns the point around',
    tier: 3,
    archetype: 'counterpuncher',
    stats: {
      core: { serve: 58, forehand: 65, backhand: 72, return: 78, net: 50 },
      technical: { slice: 75, spin: 68, placement: 65 },
      physical: { speed: 78, stamina: 82, strength: 55 },
      mental: { focus: 78, anticipation: 78, tactics: 58 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.RANGY_RETURN], ABILITY_DEFINITIONS[AbilityName.SPEED_DEMON]],
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
      core: { serve: 90, forehand: 95, backhand: 82, return: 78, net: 82 },
      technical: { slice: 72, spin: 85, placement: 88 },
      physical: { speed: 82, stamina: 78, strength: 92 },
      mental: { focus: 85, anticipation: 80, tactics: 75 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.HEAVY_HITTER], ABILITY_DEFINITIONS[AbilityName.SERVE_CANNON]],
  },
  {
    name: 'Nadia Volkov',
    description: 'Legendary champion who broke opponents with relentless consistency',
    tier: 4,
    archetype: 'defensive',
    stats: {
      core: { serve: 78, forehand: 85, backhand: 88, return: 90, net: 74 },
      technical: { slice: 85, spin: 88, placement: 85 },
      physical: { speed: 88, stamina: 92, strength: 75 },
      mental: { focus: 90, anticipation: 88, tactics: 78 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.BASELINER], ABILITY_DEFINITIONS[AbilityName.SPEED_DEMON]],
  },
  {
    name: 'Thomas Lund',
    description: 'Tactical genius who could play any style and dominate',
    tier: 4,
    archetype: 'all_court',
    stats: {
      core: { serve: 85, forehand: 88, backhand: 85, return: 85, net: 84 },
      technical: { slice: 82, spin: 85, placement: 90 },
      physical: { speed: 85, stamina: 88, strength: 82 },
      mental: { focus: 90, anticipation: 88, tactics: 81 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.SOFT_HANDS], ABILITY_DEFINITIONS[AbilityName.CLUTCH]],
  },
  {
    name: 'Patrick Rafter Jr.',
    description: 'Son of a legend — inherited the serve and volley magic',
    tier: 4,
    archetype: 'serve_volley',
    stats: {
      core: { serve: 92, forehand: 78, backhand: 75, return: 72, net: 91 },
      technical: { slice: 78, spin: 75, placement: 88 },
      physical: { speed: 85, stamina: 75, strength: 85 },
      mental: { focus: 85, anticipation: 88, tactics: 72 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.NETCRASHER], ABILITY_DEFINITIONS[AbilityName.SERVE_CANNON]],
  },
  {
    name: 'Kim Soo-jin',
    description: 'Retired champion famous for impossibly long rallies and clutch comebacks',
    tier: 4,
    archetype: 'counterpuncher',
    stats: {
      core: { serve: 75, forehand: 82, backhand: 88, return: 92, net: 70 },
      technical: { slice: 90, spin: 85, placement: 82 },
      physical: { speed: 90, stamina: 95, strength: 72 },
      mental: { focus: 92, anticipation: 92, tactics: 68 },
    },
    abilities: [ABILITY_DEFINITIONS[AbilityName.SPEED_DEMON], ABILITY_DEFINITIONS[AbilityName.CLUTCH]],
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
  return opponents[Math.floor(Math.random() * opponents.length)];
}

/**
 * Build the full phase-based archetype profile for an opponent from its authored
 * archetype label, so it plays with a coherent identity in the match engine.
 */
export function getOpponentArchetypeProfile(preset: { archetype: ArchetypeType }): ArchetypeProfile {
  return profileForArchetype(preset.archetype);
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
