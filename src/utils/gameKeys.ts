/**
 * Shared keyboard mapping for the game's interactive surfaces.
 *
 * Arrow keys and the WASD cluster are interchangeable everywhere, and Space is the
 * universal action key. WASD is matched on `event.code` (physical key position) rather
 * than `event.key`, so the same physical cluster sits under the player's fingers on
 * non-QWERTY layouts and Shift/CapsLock can't break the mapping.
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

/** The direction a key press means, or null if it isn't a direction key. */
export function directionFromKey(e: KeyboardEvent): Direction | null {
  switch (e.key) {
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    default:
      break;
  }
  switch (e.code) {
    case 'KeyW':
      return 'up';
    case 'KeyS':
      return 'down';
    case 'KeyA':
      return 'left';
    case 'KeyD':
      return 'right';
    default:
      return null;
  }
}

/** Space — the action/confirm key shared by every minigame. */
export function isActionKey(e: KeyboardEvent): boolean {
  return e.code === 'Space' || e.key === ' ';
}
