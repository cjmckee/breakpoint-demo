/**
 * Whether the between-days and between-slots transitions play.
 *
 * E2E drives the game faster than a person, and a card over the screen at every
 * new day or slot only slows it down. A spec that wants them adds `?transitions`
 * to the URL.
 */
export function transitionsEnabled(): boolean {
  if (typeof navigator === 'undefined' || !navigator.webdriver) return true;
  return new URLSearchParams(window.location.search).has('transitions');
}
