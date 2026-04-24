/**
 * Challenge Templates
 * Reusable challenge definitions referenced by story events.
 * Each template defines the static configuration for a challenge;
 * runtime state is added when instantiated via ChallengeManager.createFromTemplate().
 */

import type { ChallengeTemplate } from '../types/challenges';
import { AbilityName } from '../types/game';
import { CHAMPION_WRISTBAND, STYLISH_HEADBAND } from './items';

// ============================================================================
// COACH STORYLINE CHALLENGES
// ============================================================================

export const CHALLENGE_FOREHAND_FUNDAMENTALS: ChallengeTemplate = {
  id: 'challenge_forehand_fundamentals',
  name: 'Forehand Fundamentals',
  description: 'Coach Gonzalez wants you to master the basics of the forehand. Train your forehand stat to 30.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'forehand',
      targetValue: 30,
      description: 'Reach 30 Forehand',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        placement: 5,
        spin: 3,
      },
    },
    relationshipChanges: {
      coach_gonzalez: 5,
    },
    experience: 15,
  },
};

export const CHALLENGE_FIRST_VICTORIES: ChallengeTemplate = {
  id: 'challenge_first_victories',
  name: 'First Victories',
  description: "Coach Gonzalez challenges you to use what you've learned on the court. Win three matches.",
  requirements: [
    {
      type: 'matchCount',
      targetWins: 3,
      description: 'Win 3 matches',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        focus: 5,
        anticipation: 5,
      },
    },
    relationshipChanges: {
      coach_gonzalez: 10,
    },
    experience: 15,
  },
};

export const CHALLENGE_SERVE_MASTERY: ChallengeTemplate = {
  id: 'coach_challenge_serve_mastery',
  name: "Coach's Challenge: Serve Mastery",
  description: 'Coach Gonzalez wants you to develop your serve to a passable level. Train your serve to 40.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'serve',
      targetValue: 40,
      description: 'Reach 40 Serve',
    },
  ],
  reward: {
    abilities: [AbilityName.HEAVY_HITTER],
    modifiers: {
      statBoosts: {
        serve: 5,
        strength: 3,
      },
    },
    relationshipChanges: {
      coach_gonzalez: 5,
    },
    experience: 15,
  },
};

export const CHALLENGE_BASELINE_WARRIOR: ChallengeTemplate = {
  id: 'coach_challenge_baseline_warrior',
  name: "Coach's Challenge: Baseline Warrior",
  description: 'Coach Gonzalez challenges you to become a complete baseline player. Train both forehand and backhand to 35.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'forehand',
      targetValue: 35,
      description: 'Reach 35 Forehand',
    },
    {
      type: 'statThreshold',
      statName: 'backhand',
      targetValue: 35,
      description: 'Reach 35 Backhand',
    },
  ],
  reward: {
    abilities: [AbilityName.BASELINER],
    modifiers: {
      statBoosts: {
        placement: 5,
        defensive: 5,
        stamina: 3,
      },
    },
    relationshipChanges: {
      coach_gonzalez: 5,
    },
    experience: 15,
  },
};

export const CHALLENGE_MENTAL_EDGE: ChallengeTemplate = {
  id: 'coach_challenge_mental_edge',
  name: "Coach's Challenge: Mental Edge",
  description: 'Coach Gonzalez wants you to develop the mental fortitude of a champion. Train your focus to 40.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'focus',
      targetValue: 40,
      description: 'Reach 40 Focus',
    },
  ],
  reward: {
    abilities: [AbilityName.CLUTCH],
    modifiers: {
      statBoosts: {
        focus: 5,
        anticipation: 5,
        offensive: 3,
      },
    },
    relationshipChanges: {
      coach_gonzalez: 10,
    },
    experience: 15,
  },
};

export const CHALLENGE_BALANCED_APPROACH: ChallengeTemplate = {
  id: 'challenge_balanced_approach',
  name: 'Balanced Approach',
  description: 'Coach Gonzalez wants you to become a well-rounded player. Raise both forehand and backhand to 40.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'forehand',
      targetValue: 40,
      description: 'Reach 40 Forehand',
    },
    {
      type: 'statThreshold',
      statName: 'backhand',
      targetValue: 40,
      description: 'Reach 40 Backhand',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        shotVariety: 8,
        placement: 4,
      },
    },
    relationshipChanges: {
      coach_gonzalez: 10,
    },
    experience: 15,
  },
};

export const CHALLENGE_ATHLETIC_FOUNDATION: ChallengeTemplate = {
  id: 'challenge_athletic_foundation',
  name: 'Athletic Foundation',
  description: 'Coach Gonzalez challenges you to build elite-level fitness. Reach 35 in both speed and stamina.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'speed',
      targetValue: 35,
      description: 'Reach 35 Speed',
    },
    {
      type: 'statThreshold',
      statName: 'stamina',
      targetValue: 35,
      description: 'Reach 35 Stamina',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        agility: 5,
        recovery: 5,
      },
    },
    items: [STYLISH_HEADBAND],
    relationshipChanges: {
      coach_gonzalez: 10,
    },
    experience: 15,
  },
};

// ============================================================================
// MILESTONE CHALLENGES
// ============================================================================

export const CHALLENGE_TEN_WINS: ChallengeTemplate = {
  id: 'milestone_challenge_ten_wins',
  name: 'Pursuit of Excellence',
  description: 'Your winning streak has proven you can compete. Now push yourself to reach 10 total match wins to establish yourself as a serious competitor.',
  requirements: [
    {
      type: 'matchCount',
      targetWins: 10,
      description: 'Win 10 total matches',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        focus: 5,
        offensive: 5,
        defensive: 5,
      },
    },
    items: [CHAMPION_WRISTBAND],
    experience: 25,
  },
};

// ============================================================================
// RIVAL STORYLINE CHALLENGES
// ============================================================================

export const CHALLENGE_PROVE_THEM_WRONG: ChallengeTemplate = {
  id: 'challenge_prove_them_wrong',
  name: 'Prove Them Wrong',
  description: 'Jordan thinks you\'re nothing. Show them what you\'re made of by winning 5 matches.',
  requirements: [
    {
      type: 'matchCount',
      targetWins: 5,
      description: 'Win 5 matches',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        offensive: 3,
        defensive: 3,
      },
    },
    experience: 40,
  },
};

export const CHALLENGE_RIVAL_READY: ChallengeTemplate = {
  id: 'challenge_rival_ready',
  name: 'Ready for Anything',
  description: 'Jordan\'s trash talk lit a fire. Channel that energy and sharpen your offense to 35.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'offensive',
      targetValue: 35,
      description: 'Reach 35 Offensive',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        backhand: 3,
        anticipation: 3,
      },
    },
    relationshipChanges: {
      jordan_rival: -5,
    },
    experience: 40,
  },
};

// ============================================================================
// FAMILY STORYLINE CHALLENGES
// ============================================================================

export const CHALLENGE_MAKE_THEM_PROUD: ChallengeTemplate = {
  id: 'challenge_make_them_proud',
  name: 'Make Them Proud',
  description: 'You can\'t help but keep your family in the back of your mind as you play. Win 3 matches and keep focused on the road ahead.',
  requirements: [
    {
      type: 'matchCount',
      targetWins: 3,
      description: 'Win 3 matches',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        stamina: 3,
        focus: 3,
        shotVariety: 3,
        dropShot: 2
      },
    },
    relationshipChanges: {
      family: 15,
    },
    experience: 25,
  },
};

// ============================================================================
// CAREER STORYLINE CHALLENGES
// ============================================================================

export const CHALLENGE_TEAM_SPIRIT: ChallengeTemplate = {
  id: 'challenge_team_spirit',
  name: 'Team Spirit',
  description: 'You\'re part of the Academy team now. Build your relationship with Coach Gonzalez to prove you\'re a team player.',
  requirements: [
    {
      type: 'relationshipLevel',
      characterId: 'coach_gonzalez',
      characterName: 'Coach Gonzalez',
      targetLevel: 60,
      description: 'Reach 60 relationship with Coach Gonzalez',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        defensive: 3,
        return: 3,
        serve: 2,
        spin: 2
      },
    },
    experience: 15,
  },
};

export const CHALLENGE_SPONSOR_WORTHY: ChallengeTemplate = {
  id: 'challenge_sponsor_worthy',
  name: 'Sponsor Worthy',
  description: 'You have a sponsor now, and they love big, flashy serves. Hit 10 aces across your matches.',
  requirements: [
    {
      type: 'matchStat',
      matchStatType: 'aces',
      targetCount: 10,
      cumulative: true,
      description: 'Hit 10 total aces',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        serve: 5,
      },
    },
    experience: 15,
  },
};

// ============================================================================
// ROMANCE STORYLINE CHALLENGES
// ============================================================================

export const CHALLENGE_IMPRESS_ALEX: ChallengeTemplate = {
  id: 'challenge_impress_alex',
  name: 'Backhand Showoff',
  description: 'Alex complimented your backhand. Time to make it even better. Reach 40 backhand.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'backhand',
      targetValue: 40,
      description: 'Reach 40 Backhand',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        backhand: 2,
        spin: 2,
      },
    },
    relationshipChanges: {
      alex_romance: 10,
    },
    experience: 25,
  },
};

// ============================================================================
// MISC EVENT CHALLENGES
// ============================================================================

export const CHALLENGE_SLICE_SPECIALIST: ChallengeTemplate = {
  id: 'challenge_slice_specialist',
  name: 'Slice Specialist',
  description: 'That disc golf game awakened something in your wrist. Train your slice to 30.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'slice',
      targetValue: 30,
      description: 'Reach 30 Slice',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        slice: 3,
        shotVariety: 2,
      },
    },
    experience: 15,
  },
};

export const CHALLENGE_TOUCH_ARTIST: ChallengeTemplate = {
  id: 'challenge_touch_artist',
  name: 'Touch Artist',
  description: 'The ping pong master showed you what true touch looks like. Train your drop shot to 30.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'dropShot',
      targetValue: 30,
      description: 'Reach 30 Drop Shot',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        dropShot: 5,
        volley: 2,
      },
    },
    experience: 15,
  },
};

export const CHALLENGE_OVERHEAD_AUTHORITY: ChallengeTemplate = {
  id: 'challenge_overhead_authority',
  name: 'Overhead Authority',
  description: 'All those volleyball spikes translated to the court. Train your overhead to 30.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'overhead',
      targetValue: 30,
      description: 'Reach 30 Overhead',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        overhead: 5,
        strength: 2,
      },
    },
    experience: 15,
  },
};

export const CHALLENGE_NEED_FOR_SPEED: ChallengeTemplate = {
  id: 'challenge_need_for_speed',
  name: 'Need for Speed',
  description: 'Those geese unlocked a new gear. Train your speed to 35.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'speed',
      targetValue: 35,
      description: 'Reach 35 Speed',
    },
  ],
  reward: {
    abilities: [AbilityName.SPEED_DEMON],
    modifiers: {
      statBoosts: {
        speed: 3,
        agility: 2,
      },
    },
    experience: 15,
  },
};

export const CHALLENGE_NET_DOMINATOR: ChallengeTemplate = {
  id: 'challenge_net_dominator',
  name: 'Net Dominator',
  description: 'Badminton showed you the power of net play. Train your volley to 30.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'volley',
      targetValue: 30,
      description: 'Reach 30 Volley',
    },
  ],
  reward: {
    abilities: [AbilityName.NETCRASHER],
    modifiers: {
      statBoosts: {
        volley: 3,
        dropShot: 2,
      },
    },
    experience: 15,
  },
};

export const CHALLENGE_IRON_RECOVERY: ChallengeTemplate = {
  id: 'challenge_iron_recovery',
  name: 'Iron Recovery',
  description: 'Hot yoga nearly killed you, but you survived. Train your recovery to 30.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'recovery',
      targetValue: 30,
      description: 'Reach 30 Recovery',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        recovery: 3,
        stamina: 2,
      },
    },
    experience: 15,
  },
};

export const CHALLENGE_WINNER_MACHINE: ChallengeTemplate = {
  id: 'challenge_winner_machine',
  name: 'Winner Machine',
  description: 'Time to make those rally skills count. Hit 15 winners across your matches.',
  requirements: [
    {
      type: 'matchStat',
      matchStatType: 'winners',
      targetCount: 15,
      cumulative: true,
      description: 'Hit 15 total winners',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        offensive: 3,
        strength: 2,
      },
    },
    experience: 25,
  },
};

export const CHALLENGE_WALL_CLIMBER: ChallengeTemplate = {
  id: 'challenge_wall_climber',
  name: 'Wall Climber',
  description: 'Rock climbing built serious strength. Train your strength to 30.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'strength',
      targetValue: 30,
      description: 'Reach 30 Strength',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        strength: 3,
        serve: 2,
      },
    },
    experience: 15,
  },
};

export const CHALLENGE_PRECISION_CUTTER: ChallengeTemplate = {
  id: 'challenge_precision_cutter',
  name: 'Precision Cutter',
  description: 'All that knife work at the BBQ sharpened your touch. Train your placement to 30.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'placement',
      targetValue: 30,
      description: 'Reach 30 Placement',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        placement: 3,
        dropShot: 2,
      },
    },
    experience: 15,
  },
};

export const CHALLENGE_ESCAPE_ARTIST: ChallengeTemplate = {
  id: 'challenge_escape_artist',
  name: 'Escape Artist',
  description: 'You escaped the room. Now escape your opponents. Win 5 break points across your matches.',
  requirements: [
    {
      type: 'matchStat',
      matchStatType: 'breakPoints',
      targetCount: 5,
      cumulative: true,
      description: 'Win 5 break points',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        return: 3,
        anticipation: 2,
        speed: 3
      },
    },
    experience: 25,
  },
};

// ============================================================================
// ROMANCE STORYLINE CHALLENGES (additional)
// ============================================================================

export const CHALLENGE_PRACTICE_MAKES_PERFECT: ChallengeTemplate = {
  id: 'challenge_practice_makes_perfect',
  name: 'Practice Makes Perfect',
  description: "Alex has secretly been holding back. They gave you some pointers on serve return. Reach 40 Return.",
  requirements: [
    {
      type: 'statThreshold',
      statName: 'return',
      targetValue: 40,
      description: 'Reach 40 Return',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        speed: 3,
        anticipation: 3,
        slice: 2,
        defensive: 4
      },
    },
    relationshipChanges: {
      alex_romance: 15,
    },
    experience: 10,
  },
};

// ============================================================================
// FAMILY STORYLINE CHALLENGES (additional)
// ============================================================================

export const CHALLENGE_SIBLING_TEACHER: ChallengeTemplate = {
  id: 'challenge_sibling_teacher',
  name: 'Best in the Family',
  description: 'You started teaching your sibling. Finish the job by mastering placement yourself. Reach 40 Placement.',
  requirements: [
    {
      type: 'statThreshold',
      statName: 'placement',
      targetValue: 40,
      description: 'Reach 40 Placement',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        focus: 3,
        spin: 2,
        strength: 2
      },
    },
    relationshipChanges: {
      family: 10,
    },
    experience: 15,
  },
};

// ============================================================================
// COACH STORYLINE CHALLENGES (additional)
// ============================================================================

export const CHALLENGE_TRICK_SHOT_MASTER: ChallengeTemplate = {
  id: 'challenge_trick_shot_master',
  name: 'Trick Shot Master',
  description: "Coach Gonzalez believes you can learn some flashy moves. Don't embarrass him. Reach 30 Drop Shot and 35 Shot Variety.",
  requirements: [
    {
      type: 'statThreshold',
      statName: 'dropShot',
      targetValue: 30,
      description: 'Reach 30 Drop Shot',
    },
    {
      type: 'statThreshold',
      statName: 'shotVariety',
      targetValue: 35,
      description: 'Reach 35 Shot Variety',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        dropShot: 4,
        shotVariety: 4,
        placement: 2,
        defensive: 4,
        slice: 4
      },
    },
    relationshipChanges: {
      coach_gonzalez: 5,
    },
    experience: 15,
  },
};

// ============================================================================
// RIVAL STORYLINE CHALLENGES (additional)
// ============================================================================

export const CHALLENGE_DOUBLES_INSTINCTS: ChallengeTemplate = {
  id: 'challenge_doubles_instincts',
  name: 'Doubles Instincts',
  description: "Adapting to Jordan's chaos sharpened your net game. Reach 45 Volley.",
  requirements: [
    {
      type: 'statThreshold',
      statName: 'volley',
      targetValue: 45,
      description: 'Reach 45 Volley',
    },
  ],
  reward: {
    modifiers: {
      statBoosts: {
        volley: 3,
        return: 2,
        overhead: 3,
        offensive: 2
      },
    },
    experience: 25,
  },
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

/**
 * All challenge templates indexed by ID for easy lookup.
 */
export const CHALLENGE_TEMPLATES: Record<string, ChallengeTemplate> = {
  // Coach
  [CHALLENGE_FOREHAND_FUNDAMENTALS.id]: CHALLENGE_FOREHAND_FUNDAMENTALS,
  [CHALLENGE_FIRST_VICTORIES.id]: CHALLENGE_FIRST_VICTORIES,
  [CHALLENGE_SERVE_MASTERY.id]: CHALLENGE_SERVE_MASTERY,
  [CHALLENGE_BASELINE_WARRIOR.id]: CHALLENGE_BASELINE_WARRIOR,
  [CHALLENGE_MENTAL_EDGE.id]: CHALLENGE_MENTAL_EDGE,
  [CHALLENGE_BALANCED_APPROACH.id]: CHALLENGE_BALANCED_APPROACH,
  [CHALLENGE_ATHLETIC_FOUNDATION.id]: CHALLENGE_ATHLETIC_FOUNDATION,
  // Milestones
  [CHALLENGE_TEN_WINS.id]: CHALLENGE_TEN_WINS,
  // Rival
  [CHALLENGE_PROVE_THEM_WRONG.id]: CHALLENGE_PROVE_THEM_WRONG,
  [CHALLENGE_RIVAL_READY.id]: CHALLENGE_RIVAL_READY,
  // Family
  [CHALLENGE_MAKE_THEM_PROUD.id]: CHALLENGE_MAKE_THEM_PROUD,
  // Career
  [CHALLENGE_TEAM_SPIRIT.id]: CHALLENGE_TEAM_SPIRIT,
  [CHALLENGE_SPONSOR_WORTHY.id]: CHALLENGE_SPONSOR_WORTHY,
  // Romance
  [CHALLENGE_IMPRESS_ALEX.id]: CHALLENGE_IMPRESS_ALEX,
  [CHALLENGE_PRACTICE_MAKES_PERFECT.id]: CHALLENGE_PRACTICE_MAKES_PERFECT,
  // Family (additional)
  [CHALLENGE_SIBLING_TEACHER.id]: CHALLENGE_SIBLING_TEACHER,
  // Coach (additional)
  [CHALLENGE_TRICK_SHOT_MASTER.id]: CHALLENGE_TRICK_SHOT_MASTER,
  // Rival (additional)
  [CHALLENGE_DOUBLES_INSTINCTS.id]: CHALLENGE_DOUBLES_INSTINCTS,
  // Misc
  [CHALLENGE_SLICE_SPECIALIST.id]: CHALLENGE_SLICE_SPECIALIST,
  [CHALLENGE_TOUCH_ARTIST.id]: CHALLENGE_TOUCH_ARTIST,
  [CHALLENGE_OVERHEAD_AUTHORITY.id]: CHALLENGE_OVERHEAD_AUTHORITY,
  [CHALLENGE_NEED_FOR_SPEED.id]: CHALLENGE_NEED_FOR_SPEED,
  [CHALLENGE_NET_DOMINATOR.id]: CHALLENGE_NET_DOMINATOR,
  [CHALLENGE_IRON_RECOVERY.id]: CHALLENGE_IRON_RECOVERY,
  [CHALLENGE_WINNER_MACHINE.id]: CHALLENGE_WINNER_MACHINE,
  [CHALLENGE_WALL_CLIMBER.id]: CHALLENGE_WALL_CLIMBER,
  [CHALLENGE_PRECISION_CUTTER.id]: CHALLENGE_PRECISION_CUTTER,
  [CHALLENGE_ESCAPE_ARTIST.id]: CHALLENGE_ESCAPE_ARTIST,
};
