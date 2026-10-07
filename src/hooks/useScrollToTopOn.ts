import { useLayoutEffect } from 'react';

/**
 * Scrolls the window to the top whenever `key` changes.
 *
 * The app swaps whole screens inside one long-lived document, so without this a
 * new screen inherits the previous one's scroll offset — Pre-match used to open
 * 280px down because Match Setup's Preview button sits at the bottom of its page.
 * Layout effect, so the jump happens before paint rather than as a visible flick.
 */
export function useScrollToTopOn(key: string): void {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [key]);
}
