/**
 * Accent palette selection.
 *
 * The accent colours live in CSS variables (src/index.css); this only decides
 * which set is active by setting `data-palette` on <html>. Picked with
 * `?palette=ball|grass|red` and remembered, so a palette can be tried across a
 * whole session without touching code. `red` is the original.
 */

export const PALETTES = ['red', 'ball', 'grass'] as const;
export type Palette = (typeof PALETTES)[number];

const STORAGE_KEY = 'breakpoint-palette';

const isPalette = (value: unknown): value is Palette =>
  typeof value === 'string' && (PALETTES as readonly string[]).includes(value);

/** Reads the palette from the URL (and remembers it), else from storage, else red. */
export function applyPalette(): Palette {
  let palette: Palette = 'red';
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('palette');
    if (isPalette(fromUrl)) {
      palette = fromUrl;
      window.localStorage.setItem(STORAGE_KEY, fromUrl);
    } else {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isPalette(stored)) palette = stored;
    }
  } catch {
    // Storage can be unavailable (private mode); the URL still works for the page.
  }
  if (palette === 'red') delete document.documentElement.dataset.palette;
  else document.documentElement.dataset.palette = palette;
  return palette;
}
