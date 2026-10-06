/**
 * Development — spend training currency on stats.
 *
 * The player builds a plan of +1s, sees what it costs and what is left, and
 * confirms it in one step (purchases are permanent; there is no respec). Each
 * row shows the stat's recipe at its current price step, so the bands and the
 * steps are visible rather than discovered.
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { StatName } from '../types';
import type { Currency, CurrencyAmounts as Amounts, Wallet } from '../types/game';
import { CURRENCIES, CURRENCY_LABELS, PRICE_STEP } from '../config/economy';
import { formatStatName, getStatIcon } from '../config/statIcons';
import { useGameStore } from '../stores/gameStore';
import { getStat, planCost, priceBand, priceOf, stepMultiplier } from '../game/StatDevelopment';
import { StatusBar } from './StatusBar';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { CurrencyAmounts, CURRENCY_STYLE } from './currency/CurrencyAmounts';

const GROUPS: Array<{ title: string; stats: StatName[] }> = [
  { title: 'Core', stats: ['serve', 'forehand', 'backhand', 'return', 'net'] },
  { title: 'Technical', stats: ['slice', 'spin', 'placement'] },
  { title: 'Physical', stats: ['speed', 'stamina', 'strength'] },
  { title: 'Mental', stats: ['focus', 'anticipation', 'tactics'] },
];

const BAND_LABEL = { cheap: 'Cheap', standard: 'Standard', premium: 'Premium' } as const;

/** Where the next price step starts above `value` (100 when it is in the top step). */
const nextStepAt = (value: number): number =>
  Math.min(100, PRICE_STEP.from + PRICE_STEP.width * (stepMultiplier(value) - 1));

/** How close to a step the row starts warning about it. */
const STEP_WARNING = 5;

/**
 * Plain-language price step for a stat about to be raised from `value`: a warning when
 * the next step is close, the multiplier while one is in force, nothing below the first
 * step until it is close.
 */
function stepNote(value: number): string | null {
  const m = stepMultiplier(value);
  const at = nextStepAt(value);
  const near = at < 100 && at - value <= STEP_WARNING;
  if (near) return m === 1 ? `Price doubles at ${at}` : `${m + 1}× price from ${at}`;
  if (m === 1) return null;
  return at < 100 ? `${m}× price until ${at}` : `${m}× price`;
}

const remaining = (wallet: Wallet, cost: Amounts): Wallet =>
  Object.fromEntries(CURRENCIES.map((c) => [c, wallet[c] - (cost[c] ?? 0)])) as Wallet;

/** Currencies a price needs more of than the wallet holds, with how much more. */
const shortfall = (price: Amounts, have: Wallet): Array<[Currency, number]> =>
  CURRENCIES.filter((c) => have[c] < (price[c] ?? 0)).map((c) => [
    c,
    Math.ceil((price[c] ?? 0) - have[c]),
  ]);

export const DevelopmentScreen: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const purchaseStats = useGameStore((state) => state.purchaseStats);

  const [plan, setPlan] = useState<StatName[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const cost = useMemo(() => (player ? planCost(player.stats, plan) : {}), [player, plan]);
  const left = useMemo(() => (player ? remaining(player.wallet, cost) : null), [player, cost]);
  const counts = useMemo(() => {
    const out: Partial<Record<StatName, number>> = {};
    for (const s of plan) out[s] = (out[s] ?? 0) + 1;
    return out;
  }, [plan]);

  const add = useCallback((stat: StatName) => {
    setPlan((p) => [...p, stat]);
    setConfirming(false);
    setMessage(null);
  }, []);
  const removeOne = useCallback((stat: StatName) => {
    setPlan((p) => {
      const i = p.lastIndexOf(stat);
      return i < 0 ? p : [...p.slice(0, i), ...p.slice(i + 1)];
    });
    setConfirming(false);
  }, []);
  const undo = useCallback(() => {
    setPlan((p) => p.slice(0, -1));
    setConfirming(false);
  }, []);
  const clear = useCallback(() => {
    setPlan([]);
    setConfirming(false);
  }, []);
  const confirm = useCallback(() => {
    const result = purchaseStats(plan);
    if (result.success) {
      setMessage({
        text: `Bought ${plan.length} stat point${plan.length === 1 ? '' : 's'}`,
        ok: true,
      });
      setPlan([]);
    } else {
      setMessage({ text: result.error ?? 'Purchase failed', ok: false });
    }
    setConfirming(false);
  }, [plan, purchaseStats]);

  if (!player || !left) return null;

  const summary = Object.entries(counts)
    .map(([s, n]) => `${formatStatName(s)} +${n}`)
    .join(', ');

  return (
    <div className="min-h-screen bg-pixel-bg">
      <StatusBar onBack={() => navigateTo('idle')} />

      <div className="max-w-4xl mx-auto px-4 pb-40">
        <h1 className="text-3xl font-bold text-pixel-text mb-1">Development</h1>
        <p className="text-sm text-pixel-text-muted mb-4">
          Spend training currency on stats. Plan a few +1s, check the cost, then confirm. Bought
          stats are permanent.
        </p>

        {/* Wallet stays pinned: every +1 is a comparison against it. */}
        <div
          className="sticky top-2 z-20 mb-6 bg-pixel-card border-4 border-pixel-border px-3 sm:px-4 py-2 flex flex-nowrap sm:flex-wrap items-center justify-between sm:justify-start gap-x-3 sm:gap-x-5 gap-y-2"
          data-testid="development-wallet"
        >
          {CURRENCIES.map((c) => (
            <span
              key={c}
              className="inline-flex items-baseline gap-1.5"
              data-currency={c}
              data-amount={Math.floor(left[c])}
            >
              <span aria-hidden="true">{CURRENCY_STYLE[c].icon}</span>
              {(cost[c] ?? 0) > 0 && (
                <span className="text-xs text-pixel-text-muted whitespace-nowrap">
                  {Math.floor(player.wallet[c])} →
                </span>
              )}
              <span className={`text-xl font-bold ${CURRENCY_STYLE[c].text}`}>
                {Math.floor(left[c])}
              </span>
              <span className="hidden sm:inline text-xs text-pixel-text-muted">
                {CURRENCY_LABELS[c]}
              </span>
            </span>
          ))}
        </div>

        {message && (
          <div
            role="status"
            data-testid="development-message"
            className={`mb-4 border-4 px-4 py-2 font-bold ${
              message.ok
                ? 'border-pixel-success text-pixel-success'
                : 'border-pixel-error text-pixel-error'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-6">
          {GROUPS.map((group) => (
            <section key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-bold text-pixel-text-muted uppercase tracking-wider mb-2">
                {group.title}
              </h2>
              <div className="grid gap-2">
                {group.stats.map((stat) => {
                  const planned = counts[stat] ?? 0;
                  const now = getStat(player.stats, stat);
                  const next = now + planned;
                  const price = priceOf(stat, next);
                  const short = shortfall(price, left);
                  const atMax = next >= 100;
                  const plannedCost = planned
                    ? planCost(player.stats, Array<StatName>(planned).fill(stat))
                    : null;
                  const reason = atMax
                    ? 'At 100'
                    : short.length
                      ? `Needs ${short.map(([c, n]) => `${n} more ${CURRENCY_LABELS[c]}`).join(' and ')}`
                      : stepNote(next);
                  return (
                    <Card key={stat} padding="sm" className={planned ? 'border-pixel-accent' : ''}>
                      <div
                        className="flex items-center gap-3"
                        data-testid={`development-stat-${stat}`}
                        data-value={now}
                        data-planned={planned}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-bold text-pixel-text">
                              <span aria-hidden="true">{getStatIcon(stat)} </span>
                              {formatStatName(stat)}
                            </span>
                            <span className="text-xl font-bold text-pixel-text">{now}</span>
                            {planned > 0 && (
                              <span className="text-xl font-bold text-pixel-accent">→ {next}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mt-1">
                            <span className="text-xs uppercase tracking-wider text-pixel-text-muted">
                              {BAND_LABEL[priceBand(stat)]}
                            </span>
                            {!atMax && (
                              <span
                                className="inline-flex items-center gap-1.5"
                                data-testid={`development-next-${stat}`}
                              >
                                <span className="text-xs text-pixel-text-muted">Next +1</span>
                                <CurrencyAmounts amounts={price} />
                              </span>
                            )}
                            {plannedCost && (
                              <span
                                className="inline-flex items-center gap-1.5"
                                data-testid={`development-planned-${stat}`}
                              >
                                <span className="text-xs text-pixel-accent">
                                  Planned +{planned}
                                </span>
                                <CurrencyAmounts amounts={plannedCost} />
                              </span>
                            )}
                          </div>
                          {reason && (
                            <div
                              className={`text-xs mt-1 ${short.length ? 'text-pixel-warning' : 'text-pixel-text-muted'}`}
                            >
                              {reason}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={planned === 0}
                          onClick={() => removeOne(stat)}
                          testId={`development-minus-${stat}`}
                        >
                          −
                        </Button>
                        <Button
                          size="sm"
                          disabled={atMax || short.length > 0}
                          onClick={() => add(stat)}
                          testId={`development-plus-${stat}`}
                        >
                          +1
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* The plan tray: what's pending, what it costs, and the one confirm. Actions sit
          right-aligned and stop short of the floating menu button in the corner. */}
      <div className="fixed left-0 right-0 bottom-0 z-30 bg-pixel-card border-t-4 border-pixel-border pl-4 pr-24 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {plan.length === 0 ? (
            <p className="text-sm text-pixel-text-muted">
              Nothing planned. Tap +1 on a stat to start a plan.
            </p>
          ) : confirming ? (
            <div className="w-full grid gap-2" data-testid="development-confirm-panel">
              <p className="text-pixel-text">
                Spend <CurrencyAmounts amounts={cost} labelled /> on {summary}?
              </p>
              <p className="text-xs text-pixel-text-muted">Stats can't be refunded once bought.</p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="success" onClick={confirm} testId="development-confirm">
                  Buy {plan.length} point{plan.length === 1 ? '' : 's'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirming(false)}
                  testId="development-cancel"
                >
                  Keep planning
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="min-w-0 w-full sm:w-auto">
                <div className="font-bold text-pixel-text" data-testid="development-plan">
                  {summary}
                </div>
                <CurrencyAmounts amounts={cost} className="text-sm" />
              </div>
              <div className="ml-auto flex flex-wrap justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={undo} testId="development-undo">
                  Undo
                </Button>
                <Button variant="secondary" size="sm" onClick={clear} testId="development-clear">
                  Clear
                </Button>
                <Button size="sm" onClick={() => setConfirming(true)} testId="development-review">
                  Review {plan.length} point{plan.length === 1 ? '' : 's'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
