/**
 * Shot type map check — does every authored tactic label reach the right stat?
 *
 * A tactical option names its shot in a coarse vocabulary of its own ('return',
 * 'volley', 'slice'), not the precise ShotType the simulation records. When a key
 * moment resolves, MatchOrchestrator translates the label through
 * TACTIC_SHOT_TYPES so the synthesized shots land in the same shotTypeStats
 * buckets as simulated ones.
 *
 * Two ways that goes wrong, both silent:
 *
 *   - A new label is authored and nobody adds a mapping. The lookup falls back to
 *     'forehand', so the shot is filed as a forehand and credited to the forehand
 *     stat. Nothing throws; the statistics are just wrong.
 *   - A mapping is added that points somewhere plausible but resolves to a
 *     different stat than the label did — 'volley' sent to a groundstroke, say.
 *     The bucket moves and the stat attribution moves with it.
 *
 * getPrimaryStatName is the arbiter: it accepts both vocabularies by design, so a
 * mapping is faithful exactly when the label and its ShotType resolve to the same
 * stat. That is what makes the translation safe to apply to shipped statistics.
 *
 * Exits non-zero on the first failure, so it can gate a release.
 *
 * Run: npx tsx src/test/shotTypeMapCheck.ts
 */

import { TACTICAL_OPTIONS } from '../data/tacticalOptions';
import { TACTIC_SHOT_TYPES } from '../game/MatchOrchestrator';
import { getPrimaryStatName } from '../core/shotStatMapping';

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

/** Every distinct shot label the tactical options actually author, both branches. */
function authoredLabels(): string[] {
  const labels = new Set<string>();
  for (const option of TACTICAL_OPTIONS) {
    labels.add(option.shotOutcomes.success.shotType);
    labels.add(option.shotOutcomes.failure.shotType);
  }
  return [...labels].sort();
}

function main(): void {
  console.log('\n── tactic shot labels map onto real shot types ──\n');

  const labels = authoredLabels();

  check('the options author at least one shot label',
    labels.length > 0,
    'nothing to check means the data moved and this check is looking at the wrong place');

  const unmapped = labels.filter((label) => !(label in TACTIC_SHOT_TYPES));
  check('every authored label has a mapping',
    unmapped.length === 0,
    `unmapped, so these fall back to 'forehand': ${unmapped.join(', ')}`);

  const misattributed = labels
    .filter((label) => label in TACTIC_SHOT_TYPES)
    .map((label) => ({ label, shotType: TACTIC_SHOT_TYPES[label] }))
    .filter(({ label, shotType }) => getPrimaryStatName(label) !== getPrimaryStatName(shotType));
  check('every mapping keeps the stat its label resolves to',
    misattributed.length === 0,
    misattributed
      .map(({ label, shotType }) =>
        `${label} (${getPrimaryStatName(label)}) → ${shotType} (${getPrimaryStatName(shotType)})`)
      .join('\n          '));

  // Not a failure: a mapping can outlive the label that needed it, and carrying a
  // spare costs nothing. Worth printing so the table can be pruned on purpose.
  const spare = Object.keys(TACTIC_SHOT_TYPES).filter((label) => !labels.includes(label));
  if (spare.length > 0) {
    console.log(`\n  note  mapped but no longer authored: ${spare.join(', ')}`);
  }

  console.log(`\n  ${labels.length} authored label${labels.length === 1 ? '' : 's'} checked`);

  console.log(failures === 0
    ? '\n✅ all checks passed\n'
    : `\n❌ ${failures} check${failures === 1 ? '' : 's'} failed\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
