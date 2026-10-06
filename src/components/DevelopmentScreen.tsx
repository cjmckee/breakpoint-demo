/**
 * Development — spend training currency on stats, specialization points on
 * specialties.
 *
 * Light on copy by design: each row shows what its next point costs, and the
 * cost climbing as points are added is what teaches the price steps. Added
 * points gather in a floating bar that appears with the first one.
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { StatName } from '../types';
import type { CurrencyAmounts as Amounts, Wallet } from '../types/game';
import { CURRENCIES, CURRENCY_LABELS } from '../config/economy';
import { formatStatName, getStatIcon } from '../config/statIcons';
import { useGameStore } from '../stores/gameStore';
import { getStat, planCost, priceOf, unspentSpecPoints } from '../game/StatDevelopment';
import { StatusBar } from './StatusBar';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { CurrencyAmounts, CURRENCY_STYLE } from './currency/CurrencyAmounts';
import { ArchetypeTree } from './ArchetypeTree';

const GROUPS: Array<{ title: string; stats: StatName[] }> = [
  { title: 'Core', stats: ['serve', 'forehand', 'backhand', 'return', 'net'] },
  { title: 'Technical', stats: ['slice', 'spin', 'placement'] },
  { title: 'Physical', stats: ['speed', 'stamina', 'strength'] },
  { title: 'Mental', stats: ['focus', 'anticipation', 'tactics'] },
];

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
  const left = useMemo(() => (player ? remaining(player.wallet, cost) : null), [player, cost]);
  const counts = useMemo(() => {
    const out: Partial<Record<StatName, number>> = {};
    for (const s of plan) out[s] = (out[s] ?? 0) + 1;
    return out;
  }, [plan]);

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

  if (!player || !left) return null;
  const specPoints = player.archetypeProfile.specializationPoints;

  const summary = Object.entries(counts)
    .map(([s, n]) => `${formatStatName(s)} +${n}`)
    .join(', ');

  return (
    <div className="min-h-screen bg-pixel-bg">
      <StatusBar onBack={() => navigateTo('idle')} />

      <div className={`${tab === 'stats' ? 'max-w-4xl pb-40' : 'max-w-7xl pb-8'} mx-auto px-4`}>
        <h1 className="text-3xl font-bold text-pixel-text mb-1">Development</h1>
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
          {/* Specialization points: the other half of development, spent on Specialties. */}
          <span
            className="inline-flex items-baseline gap-1.5 sm:ml-auto"
            data-testid="development-spec-points"
            data-amount={specPoints}
            title="Specialization points, earned by levelling up"
          >
            <span aria-hidden="true">⭐</span>
            <span className="text-xl font-bold text-pixel-text">{specPoints}</span>
            <span className="hidden sm:inline text-xs text-pixel-text-muted">Spec Points</span>
          </span>
        </div>

        {tab === 'specialties' ? (
          <ArchetypeTree embedded />
        ) : (
          <>
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
                      const needs = shortfall(price, left);
                      const short = Object.keys(needs).length > 0;
                      const atMax = next >= 100;
                      return (
                        <Card
                          key={stat}
                          padding="sm"
                          className={planned ? 'border-pixel-accent' : ''}
                        >
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
                                  <span className="text-xl font-bold text-pixel-accent">
                                    → {next}
                                  </span>
                                )}
                              </div>
                              <div
                                className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm mt-1"
                                data-testid={`development-cost-${stat}`}
                              >
                                {atMax ? (
                                  <span className="text-xs text-pixel-text-muted">Max</span>
                                ) : short ? (
                                  <>
                                    <span className="text-xs text-pixel-warning">Needs</span>
                                    <CurrencyAmounts
                                      amounts={needs}
                                      testId={`development-needs-${stat}`}
                                    />
                                  </>
                                ) : (
                                  <CurrencyAmounts amounts={price} />
                                )}
                              </div>
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
                              disabled={atMax || short}
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
          </>
        )}
      </div>

      {/* Points added so far, what they cost, and the buy. Sits on the left 70% of the
          stat column, so the − / +1 buttons down the right edge stay clear and usable. */}
      {tab === 'stats' && plan.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 pointer-events-none">
          <div className="max-w-4xl mx-auto px-4">
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
          </div>
        </div>
      )}
    </div>
  );
};
