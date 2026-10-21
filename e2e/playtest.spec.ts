import { mkdirSync, writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { startNewGame, dismissWalkthrough, setMatchSpeed, readGame, reseed } from './helpers';
import { runBot, emptyLog, type BotLog, type SpendPolicy, type StoryPolicy } from './bot';
import type { TacticPolicy } from './helpers';
import { IDENTITY_BUILDS } from '../src/test/analysis/identityBuilds';
import { STAT_NAMES, getStat } from '../src/game/StatDevelopment';
import { calculateOverallRating } from '../src/utils/overallRating';

/**
 * Whole careers, through the UI: a fresh player from the creator to the Club
 * epilogue (`thanks_for_playing`), then the end screen, screenshotted.
 *
 * A playtest rather than a check. Each run plays one career identity with its
 * own story, tactic and spending policy and writes what happened — matches,
 * story choices, the final build, any console error — to PLAYTEST_OUT for
 * reading side by side. It fails only on the things the soak run fails on
 * (softlock, unhandled phase), and writes its report first either way.
 *
 * Opt-in, since ten careers take a while: PLAYTEST=1 npx playwright test playtest
 * Env: PLAYTEST_OUT=playtest-out  PLAYTEST_RUNS=1,4 (run numbers to play)
 */

test.skip(!process.env.PLAYTEST, 'opt-in: PLAYTEST=1');

const OUT = process.env.PLAYTEST_OUT ?? 'playtest-out';
const ONLY = process.env.PLAYTEST_RUNS?.split(',').map(Number);

type Identity = keyof typeof IDENTITY_BUILDS;

/** The archetype each identity answers Coach Gonzalez with. */
const ARCHETYPE_OPTION: Record<string, string> = {
  bigServer: 'choose_all_courter',
  counter: 'choose_baseliner',
  netRusher: 'choose_net_attacker',
  baseliner: 'choose_baseliner',
};

interface RunConfig {
  run: number;
  identity: Identity;
  project: 'chromium' | 'mobile';
  tactics: TacticPolicy;
  stories: StoryPolicy['pick'];
  /** Spend toward the identity's build and take its specialties; off is the default bot. */
  shaped: boolean;
}

const RUNS: RunConfig[] = [
  {
    run: 1,
    identity: 'bigServer',
    project: 'chromium',
    tactics: 'first',
    stories: 'first',
    shaped: true,
  },
  {
    run: 2,
    identity: 'counter',
    project: 'chromium',
    tactics: 'random',
    stories: 'random',
    shaped: true,
  },
  {
    run: 3,
    identity: 'netRusher',
    project: 'chromium',
    tactics: 'first',
    stories: 'random',
    shaped: true,
  },
  {
    run: 4,
    identity: 'baseliner',
    project: 'chromium',
    tactics: 'random',
    stories: 'first',
    shaped: true,
  },
  {
    run: 5,
    identity: 'bigServer',
    project: 'chromium',
    tactics: 'random',
    stories: 'random',
    shaped: true,
  },
  {
    run: 6,
    identity: 'counter',
    project: 'chromium',
    tactics: 'first',
    stories: 'first',
    shaped: true,
  },
  {
    run: 7,
    identity: 'netRusher',
    project: 'chromium',
    tactics: 'random',
    stories: 'random',
    shaped: true,
  },
  {
    run: 8,
    identity: 'baseliner',
    project: 'chromium',
    tactics: 'first',
    stories: 'first',
    shaped: false,
  },
  {
    run: 9,
    identity: 'netRusher',
    project: 'mobile',
    tactics: 'random',
    stories: 'random',
    shaped: true,
  },
  {
    run: 10,
    identity: 'counter',
    project: 'mobile',
    tactics: 'first',
    stories: 'random',
    shaped: true,
  },
];

/** Mulberry32: the bot's own choices, seeded per run. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Spending appetite from the identity's day-23 build: its high stats most, its low ones barely. */
function spendFor(identity: Identity): SpendPolicy {
  const { stats, profile } = IDENTITY_BUILDS[identity];
  const weights = Object.fromEntries(
    STAT_NAMES.map((stat) => [stat, Math.max(1, getStat(stats, stat) - 25) ** 2]),
  );
  const specialties = Object.fromEntries(
    Object.entries(profile.phases).map(([phase, spec]) => [phase, spec!.path]),
  );
  return { weights, specialties };
}

for (const config of RUNS) {
  if (ONLY && !ONLY.includes(config.run)) continue;
  const name = `run-${String(config.run).padStart(2, '0')}-${config.identity}-${config.project}`;

  test(`playtest ${name}`, async ({ page }, info) => {
    test.skip(info.project.name !== config.project, `plays on ${config.project}`);
    // A whole Club season is ~40 in-game days, each a few dozen clicks.
    test.setTimeout(30 * 60_000);
    mkdirSync(OUT, { recursive: true });

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    const started = Date.now();
    let log: BotLog = emptyLog();
    let failure: string | null = null;
    try {
      await startNewGame(page, `Run ${config.run}`);
      await reseed(page, 1000 + config.run);
      await dismissWalkthrough(page);
      await setMatchSpeed(page, 'instant');
      log = await runBot(page, {
        untilDay: 200,
        maxActions: 20_000,
        tactics: config.tactics,
        stories: { pick: config.stories, prefer: [ARCHETYPE_OPTION[config.identity]] },
        spend: config.shaped ? spendFor(config.identity) : undefined,
        matchEvery: config.shaped ? 2 : undefined,
        rng: seeded(config.run),
        log,
      });
    } catch (err) {
      failure = err instanceof Error ? err.message : String(err);
      await page.screenshot({ path: `${OUT}/${name}-failure.png`, fullPage: true });
    }

    const end = await readGame(page);
    if (log.contentEnded) {
      await expect(page.getByTestId('content-end')).toBeVisible();
      await page.screenshot({ path: `${OUT}/${name}-end.png`, fullPage: true });
    }

    const player = end.player;
    writeFileSync(
      `${OUT}/${name}.json`,
      JSON.stringify(
        {
          config,
          minutes: +((Date.now() - started) / 60_000).toFixed(1),
          failure,
          errors,
          day: end.calendar.currentDay,
          tier: player?.tier,
          overall: player ? calculateOverallRating(player.stats) : null,
          stats: player?.stats,
          archetype: player?.archetypeProfile,
          level: player?.level,
          wallet: player?.wallet,
          abilities: player?.abilities?.map((a) => a.name),
          completedStoryEvents: end.completedStoryEvents,
          log,
        },
        null,
        2,
      ),
    );

    expect(failure, failure ?? '').toBeNull();
    expect(log.contentEnded, 'the career should reach the end screen').toBe(true);
  });
}
