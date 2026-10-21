/**
 * Currency check — the stat-currency rules the game relies on.
 *
 *   - every stat has a recipe, and its length is a price band (2, 3 or 4 units)
 *   - the price step: ×1 below 35, ×2 from 35, ×3 from 50, ×4 from 65, ×5 from 80
 *   - a plan of +1s is priced at each point's starting value, in order
 *   - losses clamp each currency at zero, gains add
 *   - a purchase applies all of a plan or none of it, and refuses what it can't pay
 *   - training and matches pay whole units, in the shapes the economy promises
 *
 * Run: npx tsx src/test/currencyCheck.ts  (part of npm test)
 */

import type { PerformanceRewardBreakdown, Player } from '../types/game';
import {
  ABILITY_PRICES,
  ABILITY_STATS,
  STORY_PAY,
  CURRENCIES,
  MATCH_PAYOUT,
  STAT_RECIPES,
} from '../config/economy';
import { ABILITY_DEFINITIONS } from '../data/abilities';
import {
  PERFORMANCE_AREAS,
  PERFORMANCE_AREA_LABELS,
  PERFORMANCE_WEIGHTS,
  type PerformanceArea,
} from '../config/performanceScoring';
import { abilityPrice, generateDailyShopItems } from '../game/ShopSystem';
import { PlayerManager } from '../game/PlayerManager';
import { DRILL_ORDER } from '../game/TrainingSystem';
import {
  areaCurrencyMix,
  contentCurrency,
  matchPayout,
  matchPayoutLines,
  roundAmounts,
  storyPay,
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

const emptyWalletFor = (): Player['wallet'] => ({
  power: 0,
  quickness: 0,
  technique: 0,
  mind: 0,
});

function playerWith(
  wallet: Player['wallet'],
  stats?: Partial<Record<(typeof STAT_NAMES)[number], number>>,
): Player {
  const base = PlayerManager.createPlayer('Check');
  let s = base.stats;
  for (const [k, v] of Object.entries(stats ?? {}))
    s = withStat(s, k as (typeof STAT_NAMES)[number], v);
  return { ...base, stats: s, wallet };
}

/** A match's performance with these area scores (the rest 0) at the default weights. */
function perfOf(
  areas: Partial<Record<PerformanceArea, number>>,
  overallScore: number,
): PerformanceRewardBreakdown {
  return {
    areas: Object.fromEntries(PERFORMANCE_AREAS.map((a) => [a, areas[a] ?? 0])) as Record<
      PerformanceArea,
      number
    >,
    weights: { ...PERFORMANCE_WEIGHTS },
    overallScore,
  };
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
    '×1 below 35, ×2 at 35-49, ×3 at 50-64, ×4 at 65-79, ×5 from 80',
    stepMultiplier(20) === 1 &&
      stepMultiplier(34) === 1 &&
      stepMultiplier(35) === 2 &&
      stepMultiplier(49) === 2 &&
      stepMultiplier(50) === 3 &&
      stepMultiplier(65) === 4 &&
      stepMultiplier(80) === 5,
  );
  const serve45 = priceOf('serve', 45);
  check(
    'serve at 45 costs 6 Power and 2 Technique',
    serve45.power === 6 && serve45.technique === 2,
    JSON.stringify(serve45),
  );

  console.log('\n── plan cost ──');
  const stats34 = withStat(PlayerManager.createPlayer('x').stats, 'focus', 34);
  const cost = planCost(stats34, ['focus', 'focus']);
  check(
    'two focus points from 34 cost 2 + 4 Mind (the second crosses 35)',
    cost.mind === 6,
    JSON.stringify(cost),
  );
  check('an empty plan costs nothing', unitsOf(planCost(stats34, [])) === 0);

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
  const rally3 = trainingPayout('rally_rhythm', 3);
  check(
    'a clean Rally Rhythm pays its mix four times: 8 Power, 4 Technique',
    rally3.power === 8 && rally3.technique === 4 && Object.keys(rally3).length === 2,
    JSON.stringify(rally3),
  );
  check(
    'a session with no clean reps pays the mix once',
    JSON.stringify(trainingPayout('rally_rhythm', 0)) ===
      JSON.stringify({ power: 2, technique: 1 }),
  );
  check(
    'every rep adds the same currencies — no strays from rounding',
    DRILL_ORDER.every((a) =>
      [0, 1, 2, 3].every(
        (r) =>
          JSON.stringify(Object.keys(trainingPayout(a, r))) ===
          JSON.stringify(Object.keys(trainingPayout(a, 0))),
      ),
    ),
  );
  check(
    'a doubled session pays twice',
    JSON.stringify(trainingPayout('corner_paint', 2, true)) ===
      JSON.stringify({ quickness: 6, technique: 12 }),
    JSON.stringify(trainingPayout('corner_paint', 2, true)),
  );
  check(
    'every clean session pays the same total, 12 units',
    DRILL_ORDER.every((a) => unitsOf(trainingPayout(a, 3)) === 12),
  );
  const perf = perfOf(
    { serve: 80, return: 20, baseline: 20, net: 0, coverage: 20, clutch: 20 },
    50,
  );
  const lostFlat = matchPayout({ ...perf, overallScore: 0 }, false);
  check(
    'a loss with no performance still pays some of every currency: 1 Power, 1 Quickness, 2 Technique, 1 Mind',
    lostFlat.power === 1 &&
      lostFlat.quickness === 1 &&
      lostFlat.technique === 2 &&
      lostFlat.mind === 1,
    JSON.stringify(lostFlat),
  );
  const wonFlat = matchPayout({ ...perf, overallScore: 0 }, true);
  check(
    'a win raises the base by one of each',
    wonFlat.power === 2 && wonFlat.quickness === 2 && wonFlat.technique === 3 && wonFlat.mind === 2,
    JSON.stringify(wonFlat),
  );
  const match = matchPayout(perf, true);
  check(
    'performance adds a pool of 30 × overall/100 on top of the base',
    unitsOf(match) === 9 + Math.round(MATCH_PAYOUT.pool * 0.5),
    JSON.stringify(match),
  );
  check(
    'a serving-led match pays more Power than Quickness',
    (match.power ?? 0) > (match.quickness ?? 0),
    JSON.stringify(match),
  );
  const leading = (area: PerformanceArea): string => {
    const mix = areaCurrencyMix(area);
    return CURRENCIES.reduce((a, b) => ((mix[b] ?? 0) > (mix[a] ?? 0) ? b : a));
  };
  check(
    'each area pays most in the currency that buys its stats: Serving Power, Baseline Technique, Coverage Quickness, Clutch Mind',
    leading('serve') === 'power' &&
      leading('baseline') === 'technique' &&
      leading('coverage') === 'quickness' &&
      leading('clutch') === 'mind',
    PERFORMANCE_AREAS.map((a) => `${a} ${leading(a)}`).join(', '),
  );
  const stayedBack = matchPayoutLines(
    { ...perfOf({ serve: 60, net: 90 }, 50), weights: { ...PERFORMANCE_WEIGHTS, net: 0 } },
    true,
  );
  check(
    'net play that carried no weight (the player never came in) pays nothing',
    !stayedBack.some((l) => l.label === PERFORMANCE_AREA_LABELS.net),
    JSON.stringify(stayedBack),
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
    "a common on-court ability costs its rarity's units in its stats' mix, plus XP: Heavy Hitter is mostly Power",
    unitsOf(learn.currency) === ABILITY_PRICES.common.units &&
      (learn.currency.power ?? 0) > (learn.currency.technique ?? 0) &&
      !learn.currency.mind &&
      learn.xp === ABILITY_PRICES.common.xp,
    JSON.stringify(learn),
  );
  const level2 = abilityPrice(hh, 1);
  check(
    'the next level costs base × 2.25',
    unitsOf(level2.currency) === Math.round(ABILITY_PRICES.common.units * 2.25) &&
      level2.xp === Math.round(ABILITY_PRICES.common.xp * 2.25),
    JSON.stringify(level2),
  );
  const clutch = abilityPrice(ABILITY_DEFINITIONS.clutch, 0);
  check(
    'a key-moment ability is paid mostly in Mind',
    (clutch.currency.mind ?? 0) > unitsOf(clutch.currency) / 2,
    JSON.stringify(clutch),
  );
  const offCourt = abilityPrice(ABILITY_DEFINITIONS.grinder, 0);
  check(
    'an off-court ability costs XP and half its rarity in Mind',
    offCourt.currency.mind === ABILITY_PRICES.rare.units / 2 &&
      unitsOf(offCourt.currency) === offCourt.currency.mind &&
      offCourt.xp === ABILITY_PRICES.rare.xp,
    JSON.stringify(offCourt),
  );
  check(
    'every priced ability exists',
    Object.keys(ABILITY_STATS).every((id) => ABILITY_DEFINITIONS[id] !== undefined),
  );
  const stock = generateDailyShopItems();
  check(
    'the shop sells no stats',
    stock.every((i) => i.category !== ('stat_increase' as string)),
    stock.map((i) => i.category).join(', '),
  );
  const offeredRarities = (tier: 1 | 2 | 3 | 4): Set<string> => {
    const seen = new Set<string>();
    for (let day = 0; day < 200; day++) {
      for (const item of generateDailyShopItems(new Map(), tier)) {
        if (item.category === 'ability') seen.add(item.rarity);
      }
    }
    return seen;
  };
  const club = offeredRarities(1);
  const regional = offeredRarities(2);
  const tour = offeredRarities(3);
  check(
    'the Club shop sells only common abilities',
    [...club].join() === 'common',
    [...club].join(),
  );
  check(
    'Regional adds uncommons, and rares wait for the Tour',
    regional.has('uncommon') && !regional.has('rare') && tour.has('rare'),
    `regional ${[...regional].join()}, tour ${[...tour].join()}`,
  );

  console.log('\n── match pay, line by line ──');
  let mismatches = 0;
  for (let i = 0; i < 200; i++) {
    const r = (): number => Math.round(Math.random() * 100);
    const pf = perfOf(
      {
        serve: r(),
        return: r(),
        baseline: r(),
        net: i % 3 === 0 ? 0 : r(),
        coverage: r(),
        clutch: r(),
      },
      r(),
    );
    const won = i % 2 === 0;
    const total = matchPayout(pf, won);
    const lines = matchPayoutLines(pf, won);
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
  const serveOnly = matchPayoutLines(perfOf({ serve: 50 }, 50), false);
  check(
    'the base is its own line, named for the result, and a scoreless area has none',
    serveOnly[0].label === 'Lost match' &&
      serveOnly[0].amounts.mind === MATCH_PAYOUT.base.lost.mind &&
      !serveOnly.some((l) => l.label === 'Returning'),
    JSON.stringify(serveOnly),
  );
  const nothing = matchPayoutLines(perfOf({}, 0), true);
  check(
    'a match with no performance pays only the base',
    nothing.length === 1 && nothing[0].label === 'Won match',
  );

  console.log('\n── story pay ──');
  const authored = { power: 10, technique: 3, mind: -4 };
  const paid = storyPay(authored);
  check(
    'story currency pays its authored amount × STORY_PAY.scale, in whole units',
    paid.power === Math.max(1, Math.round(10 * STORY_PAY.scale)) &&
      paid.mind === -Math.max(1, Math.round(4 * STORY_PAY.scale)),
    JSON.stringify(paid),
  );
  check(
    'a small grant or penalty never rounds away to nothing',
    storyPay({ quickness: 1 }).quickness === 1 && storyPay({ quickness: -1 }).quickness === -1,
  );

  console.log('\n── direct stat changes ──');
  const lowered = PlayerManager.applyStatBoosts(playerWith(emptyWalletFor()), { focus: -50 });
  check('a stat loss bigger than the stat stops at 0', getStat(lowered.stats, 'focus') === 0);
  const raised = PlayerManager.applyStatBoosts(playerWith(emptyWalletFor(), { focus: 98 }), {
    focus: 5,
  });
  check('a stat gain stops at 100', getStat(raised.stats, 'focus') === 100);

  console.log(
    failures === 0
      ? '\n✅ all checks passed\n'
      : `\n❌ ${failures} check${failures === 1 ? '' : 's'} failed\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
