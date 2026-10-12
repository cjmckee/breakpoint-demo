/**
 * Sprite check — are the layer grids well-formed, and does every appearance compose?
 *
 * Layer grids are hand-typed strings, so a dropped `.` shifts a row and an unknown letter
 * silently draws nothing. This catches both, and that every combination of choices the
 * creator offers produces a sprite in every pose.
 *
 * Run: npx tsx src/test/spriteCheck.ts
 */

import {
  ACCESSORIES,
  HAIR_STYLES,
  POSE_FRAMES,
  SIDE_POSE_FRAMES,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  type SpriteLayer,
} from '../data/sprites/layers';
import { FIXED_COLORS } from '../data/sprites/palettes';
import {
  composeSprite,
  appearanceFromSeed,
  HAIR_COLOR_KEYS,
  HAIR_STYLE_KEYS,
  KIT_COLOR_KEYS,
  SKIN_TONE_KEYS,
} from '../core/spriteComposer';
import type { Appearance, SpritePose } from '../types/appearance';
import { CHARACTERS } from '../data/characters';
import { StoryEventRepository } from '../data/storyEvents';
import { TournamentRegistry } from '../data/tournaments';
import * as TeamMatches from '../data/teamMatches';

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

const SYMBOLS = new Set(['.', ...Object.keys(FIXED_COLORS), 'S', 's', 'H', 'h', 'L', 'O', 'o']);

function checkLayer(name: string, layer: SpriteLayer): void {
  const badWidth = layer.rows.findIndex((row) => row.length !== SPRITE_WIDTH);
  check(
    `${name}: every row is ${SPRITE_WIDTH} wide`,
    badWidth === -1,
    badWidth === -1 ? undefined : `row ${badWidth} is "${layer.rows[badWidth]}"`,
  );
  check(
    `${name}: fits inside ${SPRITE_HEIGHT} rows`,
    layer.top >= 0 && layer.top + layer.rows.length <= SPRITE_HEIGHT,
  );
  const unknown = [...layer.rows.join('')].filter((ch) => !SYMBOLS.has(ch));
  check(
    `${name}: only palette symbols`,
    unknown.length === 0,
    `unknown: ${[...new Set(unknown)].join('')}`,
  );
}

console.log('── layer grids ──');
for (const [view, poseFrames] of [
  ['front', POSE_FRAMES],
  ['side', SIDE_POSE_FRAMES],
] as const) {
  for (const [pose, frames] of Object.entries(poseFrames)) {
    frames.forEach((frame, i) => {
      checkLayer(`${view} ${pose}[${i}] body`, frame.body);
      checkLayer(`${view} ${pose}[${i}] racquet`, frame.racquet);
    });
  }
}
for (const [style, layers] of Object.entries(HAIR_STYLES)) {
  checkLayer(`hair ${style} front`, layers.front);
  if (layers.back) checkLayer(`hair ${style} back`, layers.back);
  checkLayer(`hair ${style} side`, layers.side);
}

for (const [accessory, { layer, side }] of Object.entries(ACCESSORIES)) {
  checkLayer(`accessory ${accessory}`, layer);
  checkLayer(`accessory ${accessory} side`, side);
}

console.log('\n── every appearance composes in every pose ──');
const poses = Object.keys(POSE_FRAMES) as SpritePose[];
let combos = 0;
let empty = 0;
for (const skinTone of SKIN_TONE_KEYS)
  for (const hairStyle of HAIR_STYLE_KEYS)
    for (const hairColor of HAIR_COLOR_KEYS)
      for (const kitColor of KIT_COLOR_KEYS)
        for (const handedness of ['right', 'left'] as const)
          for (const pose of poses)
            for (const facing of [undefined, 'left', 'right'] as const) {
              const appearance: Appearance = {
                skinTone,
                hairStyle,
                hairColor,
                kitColor,
                handedness,
              };
              combos++;
              if (composeSprite(appearance, pose, 0, { facing }).length === 0) empty++;
            }
check(`${combos} combinations all draw something`, empty === 0, `${empty} drew nothing`);

const right = composeSprite({ ...appearanceFromSeed('mirror'), handedness: 'right' }, 'swing');
const left = composeSprite({ ...appearanceFromSeed('mirror'), handedness: 'left' }, 'swing');
const mirrored = right.every((run) =>
  left.some(
    (l) =>
      l.y === run.y &&
      l.w === run.w &&
      l.color === run.color &&
      l.x === SPRITE_WIDTH - run.x - run.w,
  ),
);
check('a left-hander is the right-hander mirrored', mirrored && left.length === right.length);

const faceRight = composeSprite(appearanceFromSeed('facing'), 'run', 0, { facing: 'right' });
const faceLeft = composeSprite(appearanceFromSeed('facing'), 'run', 0, { facing: 'left' });
check(
  'facing left is facing right mirrored',
  faceRight.length === faceLeft.length &&
    faceRight.every((run) =>
      faceLeft.some((l) => l.y === run.y && l.x === SPRITE_WIDTH - run.x - run.w),
    ),
);

check(
  'a seeded appearance is stable',
  JSON.stringify(appearanceFromSeed('Jordan')) === JSON.stringify(appearanceFromSeed('Jordan')),
);

console.log('\n── every speaker has a look ──');
const speakers = new Set<string>();
const opponents = new Set<string>();
// Dialogue sits on events and on their outcomes at varying depths, so walk the lot.
const collectSpeakers = (node: unknown): void => {
  if (Array.isArray(node)) {
    node.forEach(collectSpeakers);
    return;
  }
  if (typeof node !== 'object' || node === null) return;
  for (const [key, value] of Object.entries(node)) {
    if (key === 'dialogue' && Array.isArray(value)) {
      for (const line of value) {
        if (Array.isArray(line) && typeof line[0] === 'string') speakers.add(line[0]);
      }
    } else if (key === 'characters' && Array.isArray(value)) {
      value.forEach((id) => typeof id === 'string' && speakers.add(id));
    } else if (key === 'opponentId' && typeof value === 'string') {
      opponents.add(value);
    } else {
      collectSpeakers(value);
    }
  }
};
collectSpeakers(StoryEventRepository.getAllEvents());
speakers.delete('player');
const unregistered = [...speakers].filter((id) => !(id in CHARACTERS));
check(
  `all ${speakers.size} story characters are registered with an appearance`,
  unregistered.length === 0,
  `not in CHARACTERS: ${unregistered.join(', ')}`,
);
for (const tournament of TournamentRegistry.getAllTournaments()) {
  for (const round of tournament.rounds) opponents.add(round.opponent.characterId);
}
for (const config of Object.values(TeamMatches)) {
  if (typeof config === 'object' && config !== null && 'opponent' in config) {
    opponents.add(config.opponent.characterId);
  }
}
const emptyHanded = [...opponents].filter((id) => CHARACTERS[id]?.plays === undefined);
check(
  `all ${opponents.size} match opponents hold a racquet`,
  emptyHanded.length === 0,
  `no \`plays\`: ${emptyHanded.join(', ')}`,
);

const keyLooks = Object.values(CHARACTERS)
  .filter((c) => c.isKeyCharacter)
  .map((c) => JSON.stringify(c.appearance));
check('key characters all look different', new Set(keyLooks).size === keyLooks.length);

if (failures > 0) {
  console.log(`\n${failures} sprite check(s) failed`);
  process.exit(1);
}
console.log('\nall sprite checks passed');
