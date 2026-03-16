/**
 * Opponent Presets Database
 * 5 archetypes x 4 tiers = 20 unique opponents.
 * One is randomly selected per match from the chosen tier.
 */

import type { PlayerStats, OpponentTier } from '../types/game';
import type { ArchetypeType } from './archetypes';

export interface OpponentPreset {
  name: string;
  description: string;
  tier: OpponentTier;
  archetype: ArchetypeType;
  stats: PlayerStats;
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
      technical: {
        serve: 35, forehand: 40, backhand: 25, volley: 20,
        overhead: 25, dropShot: 15, slice: 20, return: 25,
        spin: 25, placement: 25,
      },
      physical: {
        speed: 35, stamina: 30, strength: 40, agility: 30, recovery: 30,
      },
      mental: {
        focus: 25, anticipation: 20, shotVariety: 20, offensive: 45, defensive: 20,
      },
    },
  },
  {
    name: 'Marta Ruiz',
    description: 'Patient club player who just keeps getting the ball back',
    tier: 1,
    archetype: 'defensive',
    stats: {
      technical: {
        serve: 25, forehand: 30, backhand: 30, volley: 20,
        overhead: 20, dropShot: 20, slice: 30, return: 35,
        spin: 25, placement: 25,
      },
      physical: {
        speed: 35, stamina: 40, strength: 25, agility: 30, recovery: 35,
      },
      mental: {
        focus: 30, anticipation: 30, shotVariety: 20, offensive: 20, defensive: 40,
      },
    },
  },
  {
    name: 'Rick Tanaka',
    description: 'Crafty player who mixes up pace and hits tricky shots',
    tier: 1,
    archetype: 'all_court',
    stats: {
      technical: {
        serve: 30, forehand: 30, backhand: 30, volley: 28,
        overhead: 25, dropShot: 25, slice: 28, return: 30,
        spin: 30, placement: 30,
      },
      physical: {
        speed: 32, stamina: 35, strength: 28, agility: 32, recovery: 32,
      },
      mental: {
        focus: 30, anticipation: 28, shotVariety: 30, offensive: 30, defensive: 30,
      },
    },
  },
  {
    name: 'Big Steve',
    description: 'Tall club player with a big serve who loves the net',
    tier: 1,
    archetype: 'serve_volley',
    stats: {
      technical: {
        serve: 40, forehand: 25, backhand: 20, volley: 35,
        overhead: 35, dropShot: 15, slice: 20, return: 20,
        spin: 20, placement: 28,
      },
      physical: {
        speed: 25, stamina: 25, strength: 38, agility: 28, recovery: 28,
      },
      mental: {
        focus: 25, anticipation: 28, shotVariety: 22, offensive: 35, defensive: 18,
      },
    },
  },
  {
    name: 'Lin Chen',
    description: 'Quick and scrappy — retrieves everything and waits for you to miss',
    tier: 1,
    archetype: 'counterpuncher',
    stats: {
      technical: {
        serve: 22, forehand: 28, backhand: 32, volley: 18,
        overhead: 20, dropShot: 22, slice: 35, return: 38,
        spin: 28, placement: 25,
      },
      physical: {
        speed: 40, stamina: 40, strength: 22, agility: 38, recovery: 38,
      },
      mental: {
        focus: 35, anticipation: 35, shotVariety: 22, offensive: 18, defensive: 42,
      },
    },
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
      technical: {
        serve: 58, forehand: 65, backhand: 48, volley: 42,
        overhead: 50, dropShot: 35, slice: 38, return: 45,
        spin: 50, placement: 52,
      },
      physical: {
        speed: 52, stamina: 48, strength: 62, agility: 50, recovery: 48,
      },
      mental: {
        focus: 50, anticipation: 45, shotVariety: 45, offensive: 72, defensive: 32,
      },
    },
  },
  {
    name: 'Sofia Petrov',
    description: 'Consistent baseliner who rarely misses and grinds you down',
    tier: 2,
    archetype: 'defensive',
    stats: {
      technical: {
        serve: 45, forehand: 52, backhand: 55, volley: 35,
        overhead: 38, dropShot: 40, slice: 50, return: 55,
        spin: 52, placement: 50,
      },
      physical: {
        speed: 55, stamina: 60, strength: 42, agility: 52, recovery: 58,
      },
      mental: {
        focus: 55, anticipation: 52, shotVariety: 42, offensive: 38, defensive: 62,
      },
    },
  },
  {
    name: 'Jake Morrison',
    description: 'Well-rounded player comfortable anywhere on the court',
    tier: 2,
    archetype: 'all_court',
    stats: {
      technical: {
        serve: 52, forehand: 55, backhand: 52, volley: 48,
        overhead: 48, dropShot: 45, slice: 48, return: 50,
        spin: 50, placement: 55,
      },
      physical: {
        speed: 52, stamina: 55, strength: 50, agility: 52, recovery: 52,
      },
      mental: {
        focus: 52, anticipation: 50, shotVariety: 52, offensive: 50, defensive: 50,
      },
    },
  },
  {
    name: 'Henri Blanc',
    description: 'Classic serve and volleyer with a booming serve',
    tier: 2,
    archetype: 'serve_volley',
    stats: {
      technical: {
        serve: 65, forehand: 48, backhand: 42, volley: 62,
        overhead: 58, dropShot: 38, slice: 45, return: 40,
        spin: 42, placement: 55,
      },
      physical: {
        speed: 55, stamina: 45, strength: 55, agility: 58, recovery: 48,
      },
      mental: {
        focus: 50, anticipation: 55, shotVariety: 48, offensive: 58, defensive: 35,
      },
    },
  },
  {
    name: 'Yuki Sato',
    description: 'Lightning-fast retriever who turns defense into offense',
    tier: 2,
    archetype: 'counterpuncher',
    stats: {
      technical: {
        serve: 42, forehand: 50, backhand: 55, volley: 32,
        overhead: 35, dropShot: 42, slice: 58, return: 60,
        spin: 52, placement: 48,
      },
      physical: {
        speed: 62, stamina: 65, strength: 40, agility: 60, recovery: 62,
      },
      mental: {
        focus: 58, anticipation: 60, shotVariety: 45, offensive: 30, defensive: 70,
      },
    },
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
      technical: {
        serve: 78, forehand: 82, backhand: 65, volley: 60,
        overhead: 72, dropShot: 55, slice: 52, return: 58,
        spin: 68, placement: 70,
      },
      physical: {
        speed: 68, stamina: 60, strength: 80, agility: 65, recovery: 62,
      },
      mental: {
        focus: 65, anticipation: 60, shotVariety: 62, offensive: 82, defensive: 38,
      },
    },
  },
  {
    name: 'Anna Kowalski',
    description: 'Rock-solid professional who never gives you a free point',
    tier: 3,
    archetype: 'defensive',
    stats: {
      technical: {
        serve: 62, forehand: 68, backhand: 72, volley: 52,
        overhead: 55, dropShot: 58, slice: 68, return: 72,
        spin: 70, placement: 68,
      },
      physical: {
        speed: 72, stamina: 78, strength: 58, agility: 70, recovery: 75,
      },
      mental: {
        focus: 72, anticipation: 70, shotVariety: 62, offensive: 48, defensive: 78,
      },
    },
  },
  {
    name: 'Alex Novak',
    description: 'Versatile pro who adapts to any opponent and surface',
    tier: 3,
    archetype: 'all_court',
    stats: {
      technical: {
        serve: 70, forehand: 72, backhand: 70, volley: 65,
        overhead: 68, dropShot: 65, slice: 68, return: 68,
        spin: 70, placement: 72,
      },
      physical: {
        speed: 70, stamina: 72, strength: 68, agility: 70, recovery: 68,
      },
      mental: {
        focus: 72, anticipation: 70, shotVariety: 72, offensive: 65, defensive: 65,
      },
    },
  },
  {
    name: 'James Whitfield',
    description: 'Classic grass-court specialist with a lethal serve and volley game',
    tier: 3,
    archetype: 'serve_volley',
    stats: {
      technical: {
        serve: 82, forehand: 62, backhand: 58, volley: 80,
        overhead: 78, dropShot: 55, slice: 62, return: 52,
        spin: 55, placement: 72,
      },
      physical: {
        speed: 70, stamina: 58, strength: 72, agility: 75, recovery: 62,
      },
      mental: {
        focus: 68, anticipation: 72, shotVariety: 65, offensive: 75, defensive: 45,
      },
    },
  },
  {
    name: 'Elena Varga',
    description: 'Defensive wizard who reads every shot and turns the point around',
    tier: 3,
    archetype: 'counterpuncher',
    stats: {
      technical: {
        serve: 58, forehand: 65, backhand: 72, volley: 48,
        overhead: 52, dropShot: 58, slice: 75, return: 78,
        spin: 68, placement: 65,
      },
      physical: {
        speed: 78, stamina: 82, strength: 55, agility: 78, recovery: 80,
      },
      mental: {
        focus: 78, anticipation: 78, shotVariety: 62, offensive: 32, defensive: 85,
      },
    },
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
      technical: {
        serve: 90, forehand: 95, backhand: 82, volley: 78,
        overhead: 85, dropShot: 75, slice: 72, return: 78,
        spin: 85, placement: 88,
      },
      physical: {
        speed: 82, stamina: 78, strength: 92, agility: 82, recovery: 78,
      },
      mental: {
        focus: 85, anticipation: 80, shotVariety: 82, offensive: 92, defensive: 58,
      },
    },
  },
  {
    name: 'Nadia Volkov',
    description: 'Legendary champion who broke opponents with relentless consistency',
    tier: 4,
    archetype: 'defensive',
    stats: {
      technical: {
        serve: 78, forehand: 85, backhand: 88, volley: 72,
        overhead: 75, dropShot: 78, slice: 85, return: 90,
        spin: 88, placement: 85,
      },
      physical: {
        speed: 88, stamina: 92, strength: 75, agility: 85, recovery: 90,
      },
      mental: {
        focus: 90, anticipation: 88, shotVariety: 80, offensive: 65, defensive: 92,
      },
    },
  },
  {
    name: 'Thomas Lund',
    description: 'Tactical genius who could play any style and dominate',
    tier: 4,
    archetype: 'all_court',
    stats: {
      technical: {
        serve: 85, forehand: 88, backhand: 85, volley: 82,
        overhead: 85, dropShot: 82, slice: 82, return: 85,
        spin: 85, placement: 90,
      },
      physical: {
        speed: 85, stamina: 88, strength: 82, agility: 85, recovery: 85,
      },
      mental: {
        focus: 90, anticipation: 88, shotVariety: 90, offensive: 82, defensive: 80,
      },
    },
  },
  {
    name: 'Patrick Rafter Jr.',
    description: 'Son of a legend — inherited the serve and volley magic',
    tier: 4,
    archetype: 'serve_volley',
    stats: {
      technical: {
        serve: 92, forehand: 78, backhand: 75, volley: 92,
        overhead: 90, dropShot: 72, slice: 78, return: 72,
        spin: 75, placement: 88,
      },
      physical: {
        speed: 85, stamina: 75, strength: 85, agility: 90, recovery: 78,
      },
      mental: {
        focus: 85, anticipation: 88, shotVariety: 82, offensive: 88, defensive: 55,
      },
    },
  },
  {
    name: 'Kim Soo-jin',
    description: 'Retired champion famous for impossibly long rallies and clutch comebacks',
    tier: 4,
    archetype: 'counterpuncher',
    stats: {
      technical: {
        serve: 75, forehand: 82, backhand: 88, volley: 68,
        overhead: 72, dropShot: 78, slice: 90, return: 92,
        spin: 85, placement: 82,
      },
      physical: {
        speed: 90, stamina: 95, strength: 72, agility: 90, recovery: 92,
      },
      mental: {
        focus: 92, anticipation: 92, shotVariety: 78, offensive: 42, defensive: 95,
      },
    },
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
 * Get all opponents for a specific tier.
 */
export function getOpponentsForTier(tier: OpponentTier): OpponentPreset[] {
  return OPPONENTS_BY_TIER[tier];
}
