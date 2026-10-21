/**
 * Emoji check — does anything the player sees still draw an emoji?
 *
 * The game's icons are pixel grids (src/data/pixelIcons.ts) drawn with <PixelIcon>.
 * An emoji renders in the system's colour font, at the system's size, next to a
 * pixel font it doesn't match, and differs between phones. This fails on any emoji
 * left in game source so new ones don't creep back.
 *
 * Skipped: comments, developer logging (trace, console), the analysis and check
 * scripts in src/test, and the debug panel. ☰ ♪ ★ are allowed: they draw in the
 * pixel font.
 *
 * Exits non-zero on any find, so it can gate a release.
 *
 * Run: npx tsx src/test/emojiCheck.ts
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set([join(ROOT, 'test'), join(ROOT, 'debug')]);
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
const ALLOWED = new Set(['☰', '♪', '★']);

function sourceFiles(dir: string): string[] {
  if (SKIP_DIRS.has(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

/** Blanks a call's arguments, keeping line breaks so line numbers still match. */
function blankCalls(source: string, callee: RegExp): string {
  let out = source;
  for (let match = callee.exec(out); match; match = callee.exec(out)) {
    let depth = 1;
    let end = match.index + match[0].length;
    while (end < out.length && depth > 0) {
      if (out[end] === '(') depth++;
      if (out[end] === ')') depth--;
      end++;
    }
    const blanked = out.slice(match.index, end).replace(/[^\n]/g, ' ');
    out = out.slice(0, match.index) + blanked + out.slice(end);
  }
  return out;
}

function playerFacing(source: string): string {
  const noBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const noLineComments = noBlockComments.replace(/^\s*\/\/.*$/gm, '');
  return blankCalls(noLineComments, /\b(?:trace|console\.\w+)\(/g);
}

const finds: string[] = [];
for (const file of sourceFiles(ROOT)) {
  playerFacing(readFileSync(file, 'utf8'))
    .split('\n')
    .forEach((line, i) => {
      const emoji = [...line].filter((ch) => EMOJI.test(ch) && !ALLOWED.has(ch));
      if (emoji.length > 0) finds.push(`${relative(ROOT, file)}:${i + 1}  ${emoji.join(' ')}`);
    });
}

if (finds.length > 0) {
  console.log('Emoji in game source (draw a pixel icon instead, src/data/pixelIcons.ts):');
  finds.forEach((f) => console.log(`  ${f}`));
  process.exit(1);
}
console.log('✅ no emoji in game source');
