/**
 * Character Definitions
 * Maps character IDs to their display names and metadata
 */

import type { Appearance } from '../types/appearance';
import { appearanceFromSeed } from '../core/spriteComposer';

export interface Character {
  id: string;
  name: string;
  role?: string;
  /** Whether this character has the full threshold + hangout system */
  isKeyCharacter?: boolean;
  /** Fixed pixel-art look, used for dialogue portraits and on court. */
  appearance: Appearance;
  /**
   * How they meet the player on court, if they play at all. Only players hold a racquet:
   * a coach, parent or journalist is drawn empty-handed.
   */
  plays?: 'opponent' | 'teammate';
}

/**
 * All characters in the game
 */
export const CHARACTERS: Record<string, Character> = {
  /** Coaches */
  coach_gonzalez: {
    id: 'coach_gonzalez',
    name: 'Coach Gonzalez',
    role: 'Coach',
    appearance: {
      skinTone: 'tan',
      hairStyle: 'buzz',
      hairColor: 'silver',
      kitColor: 'navy',
      handedness: 'right',
      accessory: 'cap',
    },
    isKeyCharacter: true,
  },

  /** Rivals */
  jordan_rival: {
    id: 'jordan_rival',
    name: 'Jordan',
    role: 'Rival',
    appearance: {
      skinTone: 'porcelain',
      hairStyle: 'short',
      hairColor: 'black',
      kitColor: 'crimson',
      handedness: 'left',
      accessory: 'headband',
    },
    plays: 'opponent',
    isKeyCharacter: true,
  },

  /** Friends */
  keith: {
    id: 'keith',
    name: 'Keith',
    role: 'Friend',
    appearance: {
      skinTone: 'fair',
      hairStyle: 'short',
      hairColor: 'blonde',
      kitColor: 'forest',
      handedness: 'right',
      accessory: 'glasses',
    },
    plays: 'teammate',
    isKeyCharacter: true,
  },

  jen: {
    id: 'jen',
    name: 'Jen',
    role: 'Friend',
    appearance: {
      skinTone: 'brown',
      hairStyle: 'ponytail',
      hairColor: 'brown',
      kitColor: 'sky',
      handedness: 'right',
      accessory: 'visor',
    },
    plays: 'teammate',
    isKeyCharacter: true,
  },

  chris: {
    id: 'chris',
    name: 'Chris',
    role: 'Friend',
    appearance: {
      skinTone: 'deep',
      hairStyle: 'buzz',
      hairColor: 'black',
      kitColor: 'white',
      handedness: 'right',
    },
    plays: 'opponent',
  },

  max: {
    id: 'max',
    name: 'Max',
    role: 'Friend',
    appearance: {
      skinTone: 'porcelain',
      hairStyle: 'long',
      hairColor: 'ginger',
      kitColor: 'sky',
      handedness: 'right',
    },
    plays: 'opponent',
  },

  /** Romance */
  alex_romance: {
    id: 'alex_romance',
    name: 'Alex',
    role: 'Romance',
    appearance: {
      skinTone: 'fair',
      hairStyle: 'long',
      hairColor: 'auburn',
      kitColor: 'violet',
      handedness: 'right',
    },
    isKeyCharacter: true,
  },

  /** Family */
  parent: {
    id: 'parent',
    name: 'Parent',
    role: 'Family',
    appearance: {
      skinTone: 'tan',
      hairStyle: 'short',
      hairColor: 'silver',
      kitColor: 'white',
      handedness: 'right',
    },
  },

  /** Sponsors */
  sponsor_rep: {
    id: 'sponsor_rep',
    name: 'Sponsor Representative',
    role: 'Sponsor',
    appearance: {
      skinTone: 'brown',
      hairStyle: 'buzz',
      hairColor: 'black',
      kitColor: 'violet',
      handedness: 'right',
    },
  },

  agent: {
    id: 'agent',
    name: 'Agent',
    role: 'Career',
    appearance: {
      skinTone: 'porcelain',
      hairStyle: 'short',
      hairColor: 'blonde',
      kitColor: 'navy',
      handedness: 'right',
    },
  },

  /** Media */
  journalist: {
    id: 'journalist',
    name: 'Journalist',
    role: 'Media',
    appearance: {
      skinTone: 'tan',
      hairStyle: 'ponytail',
      hairColor: 'auburn',
      kitColor: 'white',
      handedness: 'right',
    },
  },

  /** Tournament */
  tournament_director: {
    id: 'tournament_director',
    name: 'Tournament Director',
    role: 'Official',
    appearance: {
      skinTone: 'deep',
      hairStyle: 'short',
      hairColor: 'silver',
      kitColor: 'navy',
      handedness: 'right',
    },
  },

  /** Aspen Slopes Academy */
  chet_vale: {
    id: 'chet_vale',
    name: 'Chet Vale',
    role: 'Opponent',
    appearance: {
      skinTone: 'tan',
      hairStyle: 'buzz',
      hairColor: 'blonde',
      kitColor: 'white',
      handedness: 'right',
    },
    plays: 'opponent',
  },

  /** Supporting cast */
  greg: {
    id: 'greg',
    name: 'Greg',
    role: 'Friend',
    appearance: {
      skinTone: 'fair',
      hairStyle: 'buzz',
      hairColor: 'brown',
      kitColor: 'crimson',
      handedness: 'right',
    },
    plays: 'teammate',
  },

  alison: {
    id: 'alison',
    name: 'Alison',
    role: 'Friend',
    appearance: {
      skinTone: 'porcelain',
      hairStyle: 'ponytail',
      hairColor: 'black',
      kitColor: 'violet',
      handedness: 'left',
    },
    plays: 'teammate',
  },

  richard_soil: {
    id: 'richard_soil',
    name: 'Richard Soil',
    role: 'Opponent',
    appearance: {
      skinTone: 'deep',
      hairStyle: 'long',
      hairColor: 'brown',
      kitColor: 'forest',
      handedness: 'right',
    },
    plays: 'opponent',
  },

  reginald_werther: {
    id: 'reginald_werther',
    name: 'Reginald Werther',
    role: 'Opponent',
    appearance: {
      skinTone: 'porcelain',
      hairStyle: 'short',
      hairColor: 'silver',
      kitColor: 'violet',
      handedness: 'right',
    },
    plays: 'opponent',
  },

  old_man: {
    id: 'old_man',
    name: 'Old Man',
    role: 'Stranger',
    appearance: {
      skinTone: 'fair',
      hairStyle: 'buzz',
      hairColor: 'silver',
      kitColor: 'white',
      handedness: 'left',
    },
  },

  martia_estrella: {
    id: 'martia_estrella',
    name: 'Martia Estrella',
    role: 'Opponent',
    appearance: {
      skinTone: 'tan',
      hairStyle: 'long',
      hairColor: 'black',
      kitColor: 'sky',
      handedness: 'right',
    },
    plays: 'opponent',
  },

  olivia_gulp: {
    id: 'olivia_gulp',
    name: 'Olivia Gulp',
    role: 'Opponent',
    appearance: {
      skinTone: 'porcelain',
      hairStyle: 'ponytail',
      hairColor: 'blonde',
      kitColor: 'crimson',
      handedness: 'right',
    },
    plays: 'opponent',
  },

  opponent: {
    id: 'opponent',
    name: 'Opponent',
    role: 'Opponent',
    appearance: {
      skinTone: 'tan',
      hairStyle: 'short',
      hairColor: 'brown',
      kitColor: 'crimson',
      handedness: 'right',
    },
    plays: 'opponent',
  },

  juggler: {
    id: 'juggler',
    name: 'Juggler',
    role: 'Stranger',
    appearance: {
      skinTone: 'brown',
      hairStyle: 'short',
      hairColor: 'ginger',
      kitColor: 'violet',
      handedness: 'right',
    },
  },

  older_woman: {
    id: 'older_woman',
    name: 'Older Woman',
    role: 'Stranger',
    appearance: {
      skinTone: 'fair',
      hairStyle: 'long',
      hairColor: 'silver',
      kitColor: 'forest',
      handedness: 'right',
    },
  },
};

/**
 * Get character display name by ID
 * Returns the character name or a fallback if not found
 * Special case: 'player' returns the actual player's name
 */
export function getCharacterName(characterId: string | null, playerName?: string): string | null {
  if (!characterId) return null;

  // Handle special 'player' character ID
  if (characterId === 'player') {
    return playerName || 'You';
  }

  return (
    CHARACTERS[characterId]?.name ||
    characterId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

/**
 * Get character by ID
 */
export function getCharacter(characterId: string): Character | undefined {
  return CHARACTERS[characterId];
}

/**
 * The look for a dialogue speaker. 'player' is the player's own look; an id outside the
 * registry gets a stable seeded one rather than nothing.
 */
export function getCharacterAppearance(
  characterId: string,
  playerAppearance: Appearance,
): Appearance {
  if (characterId === 'player') return playerAppearance;
  return CHARACTERS[characterId]?.appearance ?? appearanceFromSeed(characterId);
}

/** Whether this person is drawn holding a racquet: only opponents and teammates are. */
export function holdsRacquet(characterId: string): boolean {
  return characterId === 'player' || CHARACTERS[characterId]?.plays !== undefined;
}

/**
 * The look for a match opponent. A named character (Jordan, Chet Vale) looks the same on
 * court as in dialogue; a generated practice opponent gets a look seeded from their name.
 */
export function getOpponentAppearance(
  characterId: string | undefined,
  opponentName: string,
): Appearance {
  return (characterId && CHARACTERS[characterId]?.appearance) || appearanceFromSeed(opponentName);
}
