/**
 * Split-Step Sprint's rules (src/minigames/games/splitStep.ts): a clean rep
 * passes, and each way of losing one loses it.
 */

import {
  MASH_TARGET,
  planRep,
  stepRep,
  type RepEvent,
  type RepPlan,
  type RepStage,
} from '../minigames/games/splitStep';

let failures = 0;
function check(name: string, ok: boolean): void {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${name}`);
  if (!ok) failures += 1;
}

function run(plan: RepPlan, events: RepEvent[]): RepStage {
  return events.reduce<RepStage>((stage, e) => stepRep(plan, stage, e), { kind: 'wait' });
}

const plan = planRep([0, 0, 0.5], 1); // up, button 3, the arrow at 0.7s
const mash = (from: number, n: number, button = plan.button): RepEvent[] =>
  Array.from({ length: n }, (_, i) => ({ type: 'button', t: from + i * 0.1, button }));
const go: RepEvent[] = [
  { type: 'tick', t: plan.cueAt },
  { type: 'direction', t: plan.cueAt + 0.3, direction: plan.direction },
];

console.log('Split-Step Sprint');
check('the plan rolls a direction and a button', plan.direction === 'up' && plan.button === 3);
check('a clean rep passes', run(plan, [...go, ...mash(1.1, MASH_TARGET)]).kind === 'passed');
check(
  'one press short does not',
  run(plan, [...go, ...mash(1.1, MASH_TARGET - 1)]).kind === 'mash',
);
check(
  'a direction before the arrow is a false start',
  JSON.stringify(run(plan, [{ type: 'direction', t: 0.5, direction: 'up' }])) ===
    JSON.stringify({ kind: 'missed', reason: 'early' }),
);
check(
  'the wrong way loses the rep',
  JSON.stringify(
    run(plan, [
      { type: 'tick', t: plan.cueAt },
      { type: 'direction', t: plan.cueAt + 0.2, direction: 'left' },
    ]),
  ) === JSON.stringify({ kind: 'missed', reason: 'wrong_way' }),
);
check(
  'too slow off the mark loses the rep',
  JSON.stringify(
    run(plan, [
      { type: 'tick', t: plan.cueAt },
      { type: 'tick', t: plan.cueAt + plan.reactWindow + 0.01 },
    ]),
  ) === JSON.stringify({ kind: 'missed', reason: 'too_slow' }),
);
check(
  'running out of mash time loses the rep',
  run(plan, [...go, ...mash(1.1, 4), { type: 'tick', t: 1.0 + plan.mashWindow + 0.1 }]).kind ===
    'missed',
);
check(
  'hammering every button does not fill the meter',
  run(plan, [
    ...go,
    ...Array.from({ length: 40 }, (_, i): RepEvent => ({
      type: 'button',
      t: 1.1 + i * 0.02,
      button: ((i % 4) + 1) as 1 | 2 | 3 | 4,
    })),
  ]).kind !== 'passed',
);
check(
  'the window bonus lengthens both windows, speed shortens them',
  planRep([0, 0, 0], 1, 0.1).reactWindow > plan.reactWindow &&
    planRep([0, 0, 0], 1.22).mashWindow < plan.mashWindow,
);

if (failures > 0) {
  console.log(`❌ ${failures} Split-Step Sprint check(s) failed`);
  process.exit(1);
}
console.log('✅ all Split-Step Sprint checks passed');
