/**
 * Development — spend training currency on stats, specialization points on
 * specialties.
 *
 * Light on copy by design: each row shows what its next point costs, and the
 * cost climbing as points are added is what teaches the price steps. The five
 * areas of the game sit pinned above the stats with the wallet, so each +1 shows
 * what it buys, often in several areas at once. Added points gather in a floating
 * bar that appears with the first one.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { StatName } from '../types';
import type { CurrencyAmounts as Amounts, Wallet } from '../types/game';
import { CURRENCIES, CURRENCY_LABELS } from '../config/economy';
import { formatStatName } from '../config/statIcons';
import { STAT_SECTIONS } from '../config/statSections';
import { useGameStore } from '../stores/gameStore';
import {
  getStat,
  planCost,
  plannedStats,
  priceOf,
  unspentSpecPoints,
} from '../game/StatDevelopment';
import { ScreenFrame } from './ui/ScreenFrame';
import { Button } from './ui/Button';
import { StatSectionHeading } from './ui/StatSectionHeading';
import { CurrencyAmounts, CurrencyIcon, CURRENCY_STYLE } from './currency/CurrencyAmounts';
import { AreaStrip } from './development/AreaStrip';
import { ArchetypeTree } from './ArchetypeTree';

/** How long the purchase confirmation stays in the floating bar. */
const MESSAGE_MS = 1800;

/** Two columns on wider screens: Core and Technical, then Physical and Mental. */
const COLUMNS = [STAT_SECTIONS.slice(0, 2), STAT_SECTIONS.slice(2)];

const remaining = (wallet: Wallet, cost: Amounts): Wallet =>
  Object.fromEntries(CURRENCIES.map((c) => [c, wallet[c] - (cost[c] ?? 0)])) as Wallet;

/** How much more of each currency a price needs than the wallet holds. */
function shortfall(price: Amounts, have: Wallet): Amounts {
  const out: Amounts = {};
  for (const c of CURRENCIES) {
    const missing = Math.ceil((price[c] ?? 0) - have[c]);
    if (missing > 0) out[c] = missing;
  }
  return out;
}

export const DevelopmentScreen: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const purchaseStats = useGameStore((state) => state.purchaseStats);
  const tab = useGameStore((state) =>
    state.gamePhase.type === 'development' ? state.gamePhase.tab : 'stats',
  );

  const [plan, setPlan] = useState<StatName[]>([]);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const cost = useMemo(() => (player ? planCost(player.stats, plan) : {}), [player, plan]);
  const after = useMemo(() => (player ? plannedStats(player.stats, plan) : null), [player, plan]);
  const left = useMemo(() => (player ? remaining(player.wallet, cost) : null), [player, cost]);
  const counts = useMemo(() => {
    const out: Partial<Record<StatName, number>> = {};
    for (const s of plan) out[s] = (out[s] ?? 0) + 1;
    return out;
  }, [plan]);

  // The confirmation shows where the plan was, then clears on its own.
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => window.clearTimeout(id);
  }, [message]);

  const add = useCallback((stat: StatName) => {
    setPlan((p) => [...p, stat]);
    setMessage(null);
  }, []);
  const removeOne = useCallback((stat: StatName) => {
    setPlan((p) => {
      const i = p.lastIndexOf(stat);
      return i < 0 ? p : [...p.slice(0, i), ...p.slice(i + 1)];
    });
  }, []);
  const clear = useCallback(() => {
    setPlan([]);
  }, []);
  const buy = useCallback(() => {
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
  }, [plan, purchaseStats]);

  if (!player || !left || !after) return null;
  const specPoints = player.archetypeProfile.specializationPoints;

  const summary = Object.entries(counts)
    .map(([s, n]) => `${formatStatName(s)} +${n}`)
    .join(', ');

  return (
    // One width for both tabs, so switching tabs never moves the tabs themselves.
    // The stats tab leaves room at the bottom for the docked plan bar.
    <ScreenFrame
      title="Development"
      onBack={() => navigateTo('idle')}
      className={tab === 'stats' ? 'pb-40' : 'pb-8'}
    >
      <div className="flex gap-2 mb-4" role="tablist">
        {(
          [
            ['stats', 'development', 'Stats'],
            ['specialties', 'archetype', 'Specialties'],
          ] as const
        ).map(([id, screen, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            data-testid={`development-tab-${id}`}
            onClick={() => navigateTo(screen)}
            className={`px-4 py-2 border-4 font-bold text-sm ${
              tab === id
                ? 'border-pixel-accent bg-pixel-card text-pixel-text'
                : 'border-pixel-border text-pixel-text-muted hover:border-pixel-accent'
            }`}
          >
            {label}
            {id === 'specialties' && unspentSpecPoints(player) > 0 && (
              <span className="ml-2 text-yellow-300">⭐{unspentSpecPoints(player)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Wallet and areas stay pinned: every +1 is a comparison against the one and a
          change to the other. */}
      <div className="sticky top-2 z-20 mb-6 bg-pixel-card border-4 border-pixel-border px-3 sm:px-4 py-2">
        <div
          className="flex flex-wrap items-center justify-between sm:justify-start gap-x-3 sm:gap-x-5 gap-y-2"
          data-testid="development-wallet"
        >
          {CURRENCIES.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5"
              data-currency={c}
              data-amount={Math.floor(left[c])}
            >
              <CurrencyIcon currency={c} scale={2} />
              {(cost[c] ?? 0) > 0 && (
                <span className="text-xs text-pixel-text-muted whitespace-nowrap">
                  {Math.floor(player.wallet[c])} →
                </span>
              )}
              <span className={`text-base sm:text-xl font-bold ${CURRENCY_STYLE[c].text}`}>
                {Math.floor(left[c])}
              </span>
              <span className="hidden sm:inline text-xs text-pixel-text-muted">
                {CURRENCY_LABELS[c]}
              </span>
            </span>
          ))}
          {/* Specialization points: the other half of development, spent on Specialties. */}
          <span
            className="inline-flex items-baseline gap-1.5 sm:ml-auto"
            data-testid="development-spec-points"
            data-amount={specPoints}
            title="Specialization points, earned by levelling up"
          >
            <span aria-hidden="true">⭐</span>
            <span className="text-base sm:text-xl font-bold text-pixel-text">{specPoints}</span>
            <span className="hidden sm:inline text-xs text-pixel-text-muted">Spec Points</span>
          </span>
        </div>
        {tab === 'stats' && (
          <div className="mt-2 pt-2 border-t-2 border-pixel-border">
            <AreaStrip stats={player.stats} planned={after} />
          </div>
        )}
      </div>

      {tab === 'specialties' ? (
        <ArchetypeTree />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-6 items-start">
            {COLUMNS.map((sections, i) => (
              <div key={i} className="grid gap-6">
                {sections.map((section) => (
                  <section key={section.id} aria-label={section.label}>
                    <StatSectionHeading section={section} />
                    <div className="divide-y-2 divide-pixel-border">
                      {section.stats.map((stat) => {
                        const planned = counts[stat] ?? 0;
                        const now = getStat(player.stats, stat);
                        const next = now + planned;
                        const price = priceOf(stat, next);
                        const needs = shortfall(price, left);
                        const short = Object.keys(needs).length > 0;
                        const atMax = next >= 100;
                        // What you can buy right now stands out (a green +1); what you
                        // cannot recedes.
                        const buyable = !short && !atMax;
                        return (
                          // Name, value and buttons on one line, the price under the name:
                          // the same two lines at every width, so rows never change height.
                          <div
                            key={stat}
                            className={`grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-2 gap-y-1 py-1.5 transition-opacity ${
                              buyable || planned ? '' : 'opacity-70'
                            }`}
                            data-testid={`development-stat-${stat}`}
                            data-value={now}
                            data-planned={planned}
                            data-buyable={buyable}
                          >
                            <span className="text-xs font-bold text-pixel-text">
                              {formatStatName(stat)}
                            </span>
                            <span
                              className="col-span-full row-start-2 flex flex-wrap items-center gap-x-2 text-xs"
                              data-testid={`development-cost-${stat}`}
                            >
                              {atMax ? (
                                <span className="text-pixel-text-muted">Max</span>
                              ) : short ? (
                                <>
                                  <span className="text-pixel-warning">Needs</span>
                                  <CurrencyAmounts
                                    amounts={needs}
                                    testId={`development-needs-${stat}`}
                                  />
                                </>
                              ) : (
                                <CurrencyAmounts amounts={price} />
                              )}
                            </span>
                            <span
                              className={`text-sm font-bold tabular-nums text-right whitespace-nowrap min-w-[6ch] ${
                                planned ? 'text-pixel-success' : 'text-pixel-text'
                              }`}
                            >
                              {planned ? `${now}→${next}` : now}
                            </span>
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
                              variant={buyable ? 'success' : 'secondary'}
                              disabled={atMax || short}
                              onClick={() => add(stat)}
                              testId={`development-plus-${stat}`}
                            >
                              +1
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Points added so far, what they cost, and the buy. Sits on the left 70% of the
          stat column, so the − / +1 buttons down the right edge stay clear and usable.
          After a purchase the same spot briefly confirms it, so nothing above the stats
          appears and pushes them down. */}
      {tab === 'stats' && (plan.length > 0 || message) && (
        <div className="fixed inset-x-0 bottom-4 z-30 pointer-events-none">
          <div className="max-w-4xl mx-auto px-4">
            {message && (
              <div
                role="status"
                data-testid="development-message"
                className={`w-[70%] mb-2 rounded-2xl bg-pixel-card border-4 shadow-2xl px-4 py-3 font-bold ${
                  message.ok
                    ? 'border-pixel-success text-pixel-success'
                    : 'border-pixel-error text-pixel-error'
                }`}
              >
                {message.text}
              </div>
            )}
            {plan.length > 0 && (
              <div
                className="pointer-events-auto w-[70%] rounded-2xl bg-pixel-card border-4 border-pixel-accent shadow-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2"
                data-testid="development-plan-bar"
              >
                <div className="min-w-0">
                  <div className="font-bold text-pixel-text" data-testid="development-plan">
                    {summary}
                  </div>
                  <CurrencyAmounts amounts={cost} className="text-sm" />
                </div>
                <div className="ml-auto flex gap-2">
                  <Button variant="secondary" size="sm" onClick={clear} testId="development-clear">
                    Clear
                  </Button>
                  <Button variant="success" size="sm" onClick={buy} testId="development-confirm">
                    Buy
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ScreenFrame>
  );
};
