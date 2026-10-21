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

/**
 * Holds modals back while a transition plays, so whatever the new day or slot opens
 * with fades in after it rather than showing through it (`body[data-transition]` in
 * index.css). Each transition sets it from its store subscription, before React renders
 * the update that opened the modal, so the modal never gets a visible frame; a layout
 * effect keeps it set while the transition shows and clears it when it goes.
 */
export function holdModals(kind: 'day' | 'slot' | null): void {
  if (kind) document.body.dataset.transition = kind;
  else delete document.body.dataset.transition;
}
