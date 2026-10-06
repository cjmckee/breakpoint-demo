/**
 * Currency check — the stat-currency rules the game relies on.
 *
 *   - every stat has a recipe, and its length is a price band (2, 3 or 4 units)
 *   - the price step: ×1 below 40, ×2 in the 40s-50s, ×3 in the 60s-70s, ×4 from 80
 *   - a plan of +1s is priced at each point's starting value, in order
 *   - losses clamp each currency at zero, gains add
 *   - a purchase applies all of a plan or none of it, and refuses what it can't pay
 *   - training and matches pay whole units, in the shapes the economy promises
 *
 * Run: npx tsx src/test/currencyCheck.ts  (part of npm test)
 */

import type { Player } from '../types/game';
import { ABILITY_CURRENCY, CURRENCIES, STAT_RECIPES } from '../config/economy';
import { ABILITY_DEFINITIONS } from '../data/abilities';
import { abilityPrice, generateDailyShopItems } from '../game/ShopSystem';
import { PlayerManager } from '../game/PlayerManager';
import {
  contentCurrency,
  matchPayout,
  matchPayoutLines,
  roundAmounts,
  trainingPayout,
} from '../game/CurrencyIncome';
import {
  STAT_NAMES,
  applyCurrency,
  getStat,
  hasNewCurrency,
  newCurrency,
  planCost,
  priceBand,
  priceOf,
  purchase,
  statsFedBy,
  stepMultiplier,
  unitsOf,
  withStat,
} from '../game/StatDevelopment';

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function playerWith(
  wallet: Player['wallet'],
  stats?: Partial<Record<(typeof STAT_NAMES)[number], number>>,
): Player {
  const base = PlayerManager.createPlayer('Check', 'balanced');
  let s = base.stats;
  for (const [k, v] of Object.entries(stats ?? {}))
    s = withStat(s, k as (typeof STAT_NAMES)[number], v);
  return { ...base, stats: s, wallet };
}

function main(): void {
  console.log('── recipes ──');
  check(
    'every stat has a recipe',
    STAT_NAMES.every((s) => STAT_RECIPES[s] !== undefined),
  );
  check(
    'every recipe is a price band of 2, 3 or 4 units',
    STAT_NAMES.every((s) => [2, 3, 4].includes(unitsOf(STAT_RECIPES[s]))),
  );
  check(
    'recipes only use the four currencies',
    STAT_NAMES.every((s) =>
      Object.keys(STAT_RECIPES[s]).every((c) => (CURRENCIES as readonly string[]).includes(c)),
    ),
  );
  check(
    'focus is cheap, serve is premium',
    priceBand('focus') === 'cheap' && priceBand('serve') === 'premium',
  );

  console.log('\n── the price step ──');
  check(
    '×1 below 40, ×2 at 40-59, ×3 at 60-79, ×4 from 80',
    stepMultiplier(20) === 1 &&
      stepMultiplier(39) === 1 &&
      stepMultiplier(40) === 2 &&
      stepMultiplier(59) === 2 &&
      stepMultiplier(60) === 3 &&
      stepMultiplier(80) === 4,
  );
  const serve45 = priceOf('serve', 45);
  check(
    'serve at 45 costs 6 Power and 2 Technique',
    serve45.power === 6 && serve45.technique === 2,
    JSON.stringify(serve45),
  );

  console.log('\n── plan cost ──');
  const stats39 = withStat(PlayerManager.createPlayer('x', 'balanced').stats, 'focus', 39);
  const cost = planCost(stats39, ['focus', 'focus']);
  check(
    'two focus points from 39 cost 2 + 4 Mind (the second crosses 40)',
    cost.mind === 6,
    JSON.stringify(cost),
  );
  check('an empty plan costs nothing', unitsOf(planCost(stats39, [])) === 0);

  console.log('\n── applying currency ──');
  const w = { power: 40, quickness: 5, technique: 0, mind: 10 };
  const lost = applyCurrency(w, { power: -60, mind: -3 });
  check('a loss bigger than the balance clamps at zero', lost.power === 0, String(lost.power));
  check('a smaller loss subtracts', lost.mind === 7);
  check('untouched currencies keep their balance', lost.quickness === 5 && lost.technique === 0);
  check('gains add', applyCurrency(w, { technique: 4 }).technique === 4);
  check('the wallet passed in is not changed', w.power === 40);

  console.log('\n── purchase ──');
  const rich = playerWith({ power: 50, quickness: 50, technique: 50, mind: 50 }, { focus: 30 });
  const bought = purchase(rich, ['focus', 'focus', 'serve']);
  check('an affordable plan succeeds', bought.success && bought.data !== undefined, bought.error);
  if (bought.data) {
    check('each stat rises by its count', getStat(bought.data.stats, 'focus') === 32);
    const expected = planCost(rich.stats, ['focus', 'focus', 'serve']);
    check(
      'the wallet pays the plan cost exactly',
      CURRENCIES.every((c) => bought.data!.wallet[c] === rich.wallet[c] - (expected[c] ?? 0)),
    );
    check(
      'the player passed in is not changed',
      getStat(rich.stats, 'focus') === 30 && rich.wallet.mind === 50,
    );
  }
  const poor = playerWith({ power: 0, quickness: 0, technique: 0, mind: 3 }, { focus: 30 });
  const refused = purchase(poor, ['focus', 'focus']);
  check(
    'an unaffordable plan fails',
    !refused.success && /Mind/.test(refused.error ?? ''),
    refused.error,
  );
  check('a failed plan buys nothing (no partial purchase)', refused.data === undefined);
  const capped = purchase(
    playerWith({ power: 999, quickness: 999, technique: 999, mind: 999 }, { focus: 100 }),
    ['focus'],
  );
  check('a stat at 100 cannot be bought', !capped.success, capped.error);
  check('an empty plan fails', !purchase(rich, []).success);

  console.log('\n── income ──');
  const rounded = roundAmounts({ power: 2.4, quickness: 2.4, technique: 2.4, mind: 0.8 });
  check(
    'rounding keeps the rounded total and pays whole units',
    unitsOf(rounded) === 8 && CURRENCIES.every((c) => Number.isInteger(rounded[c] ?? 0)),
    JSON.stringify(rounded),
  );
  const serve3 = trainingPayout('serve', 3);
  check(
    'a clean serve session pays 13 units ((2 + 3×3) × 1.2), mostly Power',
    unitsOf(serve3) === 13 &&
      (serve3.power ?? 0) > unitsOf(serve3) / 2 &&
      (serve3.quickness ?? 0) > 0 &&
      (serve3.mind ?? 0) > 0,
    JSON.stringify(serve3),
  );
  check(
    'a session with no clean reps still pays the base',
    unitsOf(trainingPayout('serve', 0)) === 2,
  );
  const ret = trainingPayout('return', 3);
  check(
    'return training pays mostly Quickness',
    CURRENCIES.every((c) => (ret[c] ?? 0) <= (ret.quickness ?? 0)),
    JSON.stringify(ret),
  );
  const perf = {
    servingScore: 80,
    returningScore: 20,
    rallyScore: 20,
    netPlayScore: 0,
    mentalScore: 20,
    overallScore: 50,
  };
  const match = matchPayout(perf);
  check(
    'a match pays 16 × (0.5 + overall/100) × 1.2 units',
    unitsOf(match) === Math.round(16 * 1.0 * 1.2),
    JSON.stringify(match),
  );
  check('a match pays mostly Mind', (match.mind ?? 0) >= unitsOf(match) * 0.55);
  check(
    'a serving-led match pays more Power than Quickness',
    (match.power ?? 0) > (match.quickness ?? 0),
    JSON.stringify(match),
  );

  console.log('\n── the Develop badge ──');
  const seenAll = playerWith({ power: 10, quickness: 10, technique: 10, mind: 10 });
  const quiet = { ...seenAll, walletSeen: { ...seenAll.wallet } };
  check('no badge when nothing is new, however much is affordable', !hasNewCurrency(quiet));
  const earned = { ...quiet, wallet: { ...quiet.wallet, power: 15 } };
  check('new currency that buys something lights it', hasNewCurrency(earned));
  check('it counts only what is new', newCurrency(earned).power === 5 && !newCurrency(earned).mind);
  const spent = { ...quiet, wallet: { ...quiet.wallet, power: 2 } };
  check('spending is not new currency', !hasNewCurrency(spent));
  const broke = {
    ...quiet,
    wallet: { power: 1, quickness: 0, technique: 0, mind: 0 },
    walletSeen: { power: 0, quickness: 0, technique: 0, mind: 0 },
  };
  check('new currency that buys nothing stays quiet', !hasNewCurrency(broke));

  console.log('\n── what a payout buys ──');
  const serveBuys = statsFedBy(trainingPayout('serve', 3));
  check(
    'serve training pays for serve and strength',
    serveBuys.includes('serve') && serveBuys.includes('strength'),
    serveBuys.join(', '),
  );
  check(
    'return training pays for return',
    statsFedBy(trainingPayout('return', 3)).includes('return'),
  );
  check('an empty payout buys nothing', statsFedBy({}).length === 0);

  console.log('\n── content ──');
  const grant = contentCurrency({ focus: 5, serve: 2 });
  check(
    'a story grant pays each point through its recipe at 1.2',
    grant.mind === 12 && grant.power === 7 && grant.technique === 2,
    JSON.stringify(grant),
  );
  const penalty = contentCurrency({ focus: -3 });
  check('a penalty becomes a loss', penalty.mind === -7, JSON.stringify(penalty));
  check(
    'a loss bigger than the balance clamps at zero',
    applyCurrency({ power: 0, quickness: 0, technique: 0, mind: 4 }, penalty).mind === 0,
  );
  check(
    'gains and penalties net per currency',
    contentCurrency({ focus: 2, tactics: -1 }).technique === -1,
    JSON.stringify(contentCurrency({ focus: 2, tactics: -1 })),
  );

  console.log('\n── abilities ──');
  const hh = ABILITY_DEFINITIONS.heavy_hitter;
  const learn = abilityPrice(hh, 0);
  check(
    'a common on-court ability costs 15 of its currency and 70 XP',
    learn.currency.power === 15 && learn.xp === 70,
    JSON.stringify(learn),
  );
  const level2 = abilityPrice(hh, 1);
  check(
    'the next level costs base × 2.25',
    level2.currency.power === 34 && level2.xp === 158,
    JSON.stringify(level2),
  );
  const offCourt = abilityPrice(ABILITY_DEFINITIONS.grinder, 0);
  check(
    'an off-court ability costs XP only',
    Object.keys(offCourt.currency).length === 0 && offCourt.xp === 250,
    JSON.stringify(offCourt),
  );
  check(
    'every priced ability exists',
    Object.keys(ABILITY_CURRENCY).every((id) => ABILITY_DEFINITIONS[id] !== undefined),
  );
  const stock = generateDailyShopItems();
  check(
    'the shop sells no stats',
    stock.every((i) => i.category !== ('stat_increase' as string)),
    stock.map((i) => i.category).join(', '),
  );

  console.log('\n── match pay, line by line ──');
  let mismatches = 0;
  for (let i = 0; i < 200; i++) {
    const r = (): number => Math.round(Math.random() * 100);
    const pf = {
      servingScore: r(),
      returningScore: r(),
      rallyScore: r(),
      netPlayScore: i % 3 === 0 ? 0 : r(),
      mentalScore: r(),
      overallScore: r(),
    };
    const total = matchPayout(pf);
    const lines = matchPayoutLines(pf);
    for (const c of CURRENCIES) {
      const summed = lines.reduce((s, l) => s + (l.amounts[c] ?? 0), 0);
      if (summed !== (total[c] ?? 0)) mismatches++;
    }
  }
  check(
    'the lines add up to the pay exactly, for 200 random matches',
    mismatches === 0,
    `${mismatches} mismatches`,
  );
  const flat = matchPayoutLines({
    servingScore: 50,
    returningScore: 0,
    rallyScore: 0,
    netPlayScore: 0,
    mentalScore: 0,
    overallScore: 50,
  });
  check(
    'the flat Mind share is its own line, and a scoreless area has none',
    flat[0].label === 'For playing' &&
      (flat[0].amounts.mind ?? 0) > 0 &&
      !flat.some((l) => l.label === 'Returning'),
    JSON.stringify(flat),
  );
  const empty = matchPayoutLines({
    servingScore: 0,
    returningScore: 0,
    rallyScore: 0,
    netPlayScore: 0,
    mentalScore: 0,
    overallScore: 0,
  });
  check('a match with no scored areas pays it all for playing', empty.length === 1);

  console.log(
    failures === 0
      ? '\n✅ all checks passed\n'
      : `\n❌ ${failures} check${failures === 1 ? '' : 's'} failed\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
