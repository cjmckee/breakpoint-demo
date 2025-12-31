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
  coach_gonzalez: {
    id: 'coach_gonzalez',
    name: 'Coach Gonzalez',
    role: 'Coach',
  },
  jordan_rival: {
    id: 'jordan_rival',
    name: 'Jordan',
    role: 'Rival',
  },
  alex_romance: {
    id: 'alex_romance',
    name: 'Alex',
    role: 'Friend',
  },
  parent: {
    id: 'parent',
    name: 'Parent',
    role: 'Family',
  },
  sponsor_rep: {
    id: 'sponsor_rep',
    name: 'Sponsor Representative',
    role: 'Sponsor',
  },
  journalist: {
    id: 'journalist',
    name: 'Journalist',
    role: 'Media',
  },
  agent: {
    id: 'agent',
    name: 'Agent',
    role: 'Career',
  },
  tournament_director: {
    id: 'tournament_director',
    name: 'Tournament Director',
    role: 'Official',
  },
};

/**
 * Get character display name by ID
 * Returns the character name or a fallback if not found
 */
export function getCharacterName(characterId: string | null): string | null {
  if (!characterId) return null;
  return CHARACTERS[characterId]?.name || characterId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Get character by ID
 */
export function getCharacter(characterId: string): Character | undefined {
  return CHARACTERS[characterId];
}
