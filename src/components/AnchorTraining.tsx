/**
 * Anchor Training Screen
 *
 * Training flow:
 *   1. Pick a CORE shot to work on.
 *   2. Play that shot's themed minigame — three pass/fail attempts, each clean rep
 *      adds to the payout — or Quick Sim for a guaranteed one rep.
 *   3. The session pays training currency, mostly in the shot's recipe currencies,
 *      to spend on the Development screen.
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import {
  CORE_ANCHORS,
  CORE_ANCHOR_ORDER,
  ANCHOR_TRAINING_ENERGY_COST,
  buildAnchorTrainingResult,
  type CoreStat,
  type TrainingBonuses,
} from '../game/AnchorTrainingSystem';
import { EffectKey, type CurrencyAmounts as Amounts } from '../types/game';
import { EffectAggregator } from '../core/EffectAggregator';
import { StatusBar } from './StatusBar';
import { Button } from './ui/Button';
import { STAT_ICONS } from '../config/statIcons';
import { CURRENCIES, CURRENCY_LABELS } from '../config/economy';
import { trainingPayout } from '../game/CurrencyIncome';
import { CurrencyAmounts } from './currency/CurrencyAmounts';
import { CoreStatPentagon } from './training/CoreStatPentagon';
import { audioManager } from '../audio/AudioManager';
import { MINIGAMES } from '../minigames/registry';

type Step = { kind: 'pick' } | { kind: 'play'; core: CoreStat };

export const AnchorTraining: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const applyTrainingResult = useGameStore((state) => state.applyTrainingResult);
  const advanceTime = useGameStore((state) => state.advanceTime);

  const [step, setStep] = useState<Step>({ kind: 'pick' });
  const [hasAttempted, setHasAttempted] = useState(false);
  /** Shot under the cursor/focus on the pick screen — drives the pentagon highlight. */
  const [hovered, setHovered] = useState<CoreStat | null>(null);

  if (!player) return null;

  const canAfford = currentStatus.energy >= ANCHOR_TRAINING_ENERGY_COST;

  const { effects } = EffectAggregator.getActiveEffects(player);
  const windowBonus = EffectAggregator.getEffect(effects, EffectKey.MINIGAME_WINDOW_BONUS);

  // Item/ability effects that improve the session payout rather than the minigame itself.
  const trainingBonuses: TrainingBonuses = {
    doubleChance: EffectAggregator.getEffect(effects, EffectKey.TRAINING_STAT_UPGRADE_CHANCE),
    bonusRepChance: EffectAggregator.getEffect(effects, EffectKey.TRAINING_BONUS_SUPPORT_CHANCE),
  };
  /** What a clean three-for-three session on `core` pays — the card's headline. */
  const bestPayout = (core: CoreStat): Amounts => trainingPayout(core, 3);

  const resolve = (core: CoreStat, count: number): void => {
    const result = buildAnchorTrainingResult(core, count, trainingBonuses);
    // applyTrainingResult transitions to idle with the training_result overlay,
    // then advanceTime moves the clock forward — mirrors the old training flow.
    applyTrainingResult(result);
    advanceTime();
  };

  const handlePickCore = (core: CoreStat): void => {
    audioManager.playSfx('ui_click');
    setHasAttempted(false);
    setStep({ kind: 'play', core });
  };

  if (step.kind === 'play') {
    const anchor = CORE_ANCHORS[step.core];

    return (
      <div className="min-h-screen bg-pixel-bg">
        <StatusBar onBack={() => setStep({ kind: 'pick' })} />

        <div className="max-w-2xl mx-auto px-4 pb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{STAT_ICONS[step.core]}</span>
            <h1 className="text-3xl font-bold text-pixel-text">{anchor.name} Training</h1>
          </div>
          <p className="text-pixel-text-muted mb-6">
            Every session pays training currency. Land clean reps below to earn more.
          </p>

          {(() => {
            const Minigame = MINIGAMES[anchor.minigame];
            return (
              <Minigame
                // Training reads the score as its rep count — a clean rep is one point.
                onComplete={(score) => resolve(step.core, score.score)}
                windowBonus={windowBonus}
                onFirstAttempt={() => setHasAttempted(true)}
              />
            );
          })()}

          {/* What the session can pay, so the reps have a visible stake */}
          <div
            className="bg-pixel-card border-2 border-pixel-border p-4 mt-4"
            data-testid="training-payout-preview"
          >
            <div className="text-xs font-bold text-pixel-text-muted mb-2 uppercase tracking-wide">
              Pays
            </div>
            <div className="grid gap-1 text-sm">
              {[0, 1, 2, 3].map((reps) => (
                <div key={reps} className="flex items-center gap-3">
                  <span className="w-16 text-pixel-text-muted">
                    {reps} rep{reps === 1 ? '' : 's'}
                  </span>
                  <CurrencyAmounts amounts={trainingPayout(step.core, reps)} />
                </div>
              ))}
            </div>
          </div>

          {!hasAttempted && (
            <Button
              testId="training-quick-sim"
              variant="secondary"
              fullWidth
              className="mt-4"
              disabled={!canAfford}
              onClick={() => resolve(step.core, 1)}
            >
              Quick Sim (skip · 1 rep)
            </Button>
          )}
        </div>
      </div>
    );
  }

  // step.kind === 'pick'
  return (
    <div className="min-h-screen bg-pixel-bg">
      <StatusBar onBack={() => navigateTo('idle')} />

      <div className="max-w-5xl mx-auto px-4 pb-8">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <h1 className="text-3xl font-bold text-pixel-text">Training</h1>
            <p className="text-pixel-text-muted mt-1">
              Pick a shot to work on. Each pays training currency — mostly in what that shot is made
              of — to spend on stats in Development.
            </p>
          </div>
          {/* The cost is the same for every shot, so it belongs here and not on all five cards. */}
          <div className="shrink-0 px-3 py-1.5 bg-pixel-card border-2 border-pixel-border text-sm font-bold text-pixel-text">
            <span className="block text-[10px] uppercase tracking-widest text-pixel-text-muted font-normal">
              Each session
            </span>
            ⚡ {ANCHOR_TRAINING_ENERGY_COST} · 1 slot
          </div>
        </div>

        {!canAfford && (
          <div className="mt-4 p-3 bg-pixel-card border-2 border-pixel-error text-pixel-error text-sm font-bold">
            <>Not enough energy — (Need {ANCHOR_TRAINING_ENERGY_COST})</>
          </div>
        )}

        {/* Desktop: pentagon on the left, the shot stack on the right, both the same
            height. Mobile: pentagon on top, stack below. */}
        <div className="mt-5 flex flex-col md:flex-row md:items-stretch gap-4 md:gap-6">
          <div className="md:w-[56%] flex items-center justify-center max-w-[320px] mx-auto md:max-w-none md:mx-0">
            <CoreStatPentagon core={player.stats.core} highlighted={hovered} />
          </div>

          {/* auto-rows-fr keeps every card the height of the tallest, so a
              description that wraps to two lines doesn't break the alignment. */}
          <div className="flex-1 grid auto-rows-fr gap-2.5">
            {CORE_ANCHOR_ORDER.map((core) => {
              const anchor = CORE_ANCHORS[core];
              const value = player.stats.core[core];
              const best = bestPayout(core);
              return (
                <button
                  key={core}
                  data-testid={`training-anchor-${core}`}
                  onClick={() => handlePickCore(core)}
                  onMouseEnter={() => setHovered(core)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(core)}
                  onBlur={() => setHovered(null)}
                  disabled={!canAfford}
                  aria-label={`Train ${anchor.name}, currently ${value}. A clean session pays ${CURRENCIES.filter(
                    (c) => best[c],
                  )
                    .map((c) => `${best[c]} ${CURRENCY_LABELS[c]}`)
                    .join(', ')}.`}
                  className="border-4 border-pixel-border bg-pixel-card px-3 py-2.5 flex items-center gap-3 text-left cursor-pointer transition-all duration-150 hover:brightness-110 hover:border-pixel-accent focus-visible:border-pixel-accent active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:hover:brightness-100"
                >
                  <span className="text-3xl leading-none" aria-hidden="true">
                    {STAT_ICONS[core]}
                  </span>

                  <span className="flex-1 flex flex-col gap-1.5">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-pixel-text">{anchor.name}</span>
                      <span className="text-2xl font-bold text-pixel-text leading-none tabular-nums">
                        {value}
                      </span>
                    </span>

                    <span className="text-[11px] text-pixel-text-muted leading-snug">
                      {anchor.description}
                    </span>

                    <span className="flex items-center gap-2 text-[13px]">
                      <span className="text-[10px] uppercase tracking-wider text-pixel-text-muted">
                        Up to
                      </span>
                      <CurrencyAmounts amounts={best} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
