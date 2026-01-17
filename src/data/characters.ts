/**
 * Character Definitions
 * Maps character IDs to their display names and metadata
 */

export interface Character {
  id: string;
  name: string;
  role?: string;
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
  },

  /** Rivals */
  jordan_rival: {
    id: 'jordan_rival',
    name: 'Jordan',
    role: 'Rival',
  },

  /** Friends */
    keith: {
    id: 'keith',
    name: 'Keith',
    role: 'Friend',
  },

  jen: {
    id: 'jen',
    name: 'Jen',
    role: 'Friend',
  },

  chris: {
    id: 'chris',
    name: 'Chris',
    role: 'Friend',
  },

  zack: {
    id: 'zack',
    name: 'Zack',
    role: 'Friend',
  },

  /** Romance */
  alex_romance: {
    id: 'alex_romance',
    name: 'Alex',
    role: 'Friend',
  },

  /** Family */
  parent: {
    id: 'parent',
    name: 'Parent',
    role: 'Family',
  },

  /** Sponsors */
  sponsor_rep: {
    id: 'sponsor_rep',
    name: 'Sponsor Representative',
    role: 'Sponsor',
  },

  agent: {
    id: 'agent',
    name: 'Agent',
    role: 'Career',
  },

  /** Media */
  journalist: {
    id: 'journalist',
    name: 'Journalist',
    role: 'Media',
  },

  /** Tournament */
  tournament_director: {
    id: 'tournament_director',
    name: 'Tournament Director',
    role: 'Official',
  },

  /** Aspen Slopes Academy */
  chet_vale: {
    id: 'chet_vale',
    name: 'Chet Vale',
    role: 'Opponent',
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

  return CHARACTERS[characterId]?.name || characterId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Get character by ID
 */
export function getCharacter(characterId: string): Character | undefined {
  return CHARACTERS[characterId];
}
