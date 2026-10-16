/**
 * Training Screen
 *
 * Training flow:
 *   1. The time slot offers three of the six drills (trainingOffer). Each card
 *      shows the drill and what a clean session pays, in full currency names. From
 *      silver, pick a focus too: the currency that stands in for a drill's
 *      secondary one.
 *   2. Play the drill's minigame — three pass/fail attempts, each clean rep adds to
 *      the payout — or Quick Sim for a guaranteed one rep.
 *   3. The session pays the drill's currency pair (TRAINING_MIXES), to spend on the
 *      Development screen, where the area bars show what it buys.
 */

import React, { useMemo, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import {
  DRILLS,
  TRAINING_ENERGY_COST,
  TRAINING_SPEED_RAMPS,
  buildTrainingResult,
  offersFocus,
  trainingOffer,
  trainingTierFor,
  type TrainingBonuses,
} from '../game/TrainingSystem';
import { EffectKey, type Currency, type CurrencyAmounts as Amounts } from '../types/game';
import type { DrillId } from '../minigames/types';
import { EffectAggregator } from '../core/EffectAggregator';
import { ScreenFrame } from './ui/ScreenFrame';
import { Button } from './ui/Button';
import { PixelIcon } from './ui/PixelIcon';
import { DRILL_ICONS } from '../data/pixelIcons';
import { CURRENCIES, CURRENCY_LABELS } from '../config/economy';
import { trainingPayout } from '../game/CurrencyIncome';
import { CurrencyAmounts } from './currency/CurrencyAmounts';
import { FocusPicker } from './training/FocusPicker';
import { audioManager } from '../audio/AudioManager';
import { MINIGAMES } from '../minigames/registry';
import { useScrollToTopOn } from '../hooks/useScrollToTopOn';

type Step = { kind: 'pick' } | { kind: 'play'; drill: DrillId };

/** A drill's pay, biggest first: one line per currency on its card. */
function payLines(amounts: Amounts): Array<[Currency, number]> {
  return CURRENCIES.filter((c) => (amounts[c] ?? 0) > 0)
    .map((c): [Currency, number] => [c, amounts[c] ?? 0])
    .sort((a, b) => b[1] - a[1]);
}

export const TrainingScreen: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const day = useGameStore((state) => state.calendar.currentDay);
  const slot = useGameStore((state) => state.calendar.currentTimeSlot);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const applyTrainingResult = useGameStore((state) => state.applyTrainingResult);
  const advanceTime = useGameStore((state) => state.advanceTime);
  const setTrainingFocus = useGameStore((state) => state.setTrainingFocus);

  const [step, setStep] = useState<Step>({ kind: 'pick' });
  const [hasStarted, setHasStarted] = useState(false);
  // The pick list and the minigame are separate pages under one phase.
  useScrollToTopOn(step.kind === 'play' ? step.drill : 'pick');

  const playerId = player?.id;
  const offer = useMemo(
    () => (playerId ? trainingOffer(playerId, day, slot) : []),
    [playerId, day, slot],
  );

  if (!player) return null;

  const canAfford = currentStatus.energy >= TRAINING_ENERGY_COST;
  const sessionTier = trainingTierFor(player.tier);
  const hasFocus = offersFocus(sessionTier);
  const focus = hasFocus ? player.trainingFocus : undefined;
  const subtitle =
    sessionTier === 'bronze'
      ? undefined
      : `${sessionTier[0].toUpperCase()}${sessionTier.slice(1)} drills`;

  const { effects } = EffectAggregator.getActiveEffects(player);
  const windowBonus = EffectAggregator.getEffect(effects, EffectKey.MINIGAME_WINDOW_BONUS);

  // Item/ability effects that improve the session payout rather than the minigame itself.
  const trainingBonuses: TrainingBonuses = {
    doubleChance: EffectAggregator.getEffect(effects, EffectKey.TRAINING_STAT_UPGRADE_CHANCE),
    bonusRepChance: EffectAggregator.getEffect(effects, EffectKey.TRAINING_BONUS_SUPPORT_CHANCE),
  };

  const resolve = (drill: DrillId, count: number): void => {
    const result = buildTrainingResult(drill, count, trainingBonuses, {
      sessionTier,
      focus,
    });
    // applyTrainingResult transitions to idle with the training_result overlay,
    // then advanceTime moves the clock forward.
    applyTrainingResult(result);
    advanceTime();
  };

  const handlePick = (drill: DrillId): void => {
    audioManager.playSfx('ui_click');
    setHasStarted(false);
    setStep({ kind: 'play', drill });
  };

  if (step.kind === 'play') {
    // The minigame's own header names the drill, so the frame keeps the screen's title.
    return (
      <ScreenFrame
        title="Training"
        subtitle={subtitle}
        onBack={() => setStep({ kind: 'pick' })}
        energyPreview={-TRAINING_ENERGY_COST}
      >
        {/* The minigame sizes itself to its column; a narrower one keeps it on screen. */}
        <div className="max-w-2xl mx-auto">
          {(() => {
            const Minigame = MINIGAMES[step.drill];
            return (
              <Minigame
                // Training reads the score as its rep count — a clean rep is one point.
                onComplete={(score) => resolve(step.drill, score.score)}
                windowBonus={windowBonus}
                config={{ speedRamp: TRAINING_SPEED_RAMPS[sessionTier] }}
                onStart={() => setHasStarted(true)}
              />
            );
          })()}

          {/* What the session can pay, so the reps have a visible stake — and the
              Quick Sim escape hatch. Both go once the minigame starts. */}
          {!hasStarted && (
            <>
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
                      <CurrencyAmounts
                        amounts={trainingPayout(step.drill, reps, false, undefined, focus)}
                        labelled
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button
                testId="training-quick-sim"
                variant="secondary"
                fullWidth
                className="mt-4"
                disabled={!canAfford}
                onClick={() => resolve(step.drill, 1)}
              >
                Quick Sim (skip · 1 rep)
              </Button>
            </>
          )}
        </div>
      </ScreenFrame>
    );
  }

  // step.kind === 'pick'
  return (
    <ScreenFrame
      title="Training"
      subtitle={subtitle}
      onBack={() => navigateTo('idle')}
      energyPreview={-TRAINING_ENERGY_COST}
    >
      {!canAfford && (
        <div className="mt-4 p-3 bg-pixel-card border-2 border-pixel-error text-pixel-error text-sm font-bold">
          <>Not enough energy — (Need {TRAINING_ENERGY_COST})</>
        </div>
      )}

      {hasFocus && (
        <div className="mt-4">
          <FocusPicker value={focus} onChange={setTrainingFocus} />
        </div>
      )}

      {/* The slot's drills, large. Every card has the same rows (icon, a two-line name,
          theme, two pay lines), so a long name never changes a card's height. On
          phones each card is a compact row: icon beside name and theme, pay under. */}
      <div
        className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3"
        data-testid="training-offer"
      >
        {offer.map(({ drill: id }) => {
          const drill = DRILLS[id];
          const best = trainingPayout(id, 3, false, undefined, focus);
          const lines = payLines(best);
          return (
            <button
              key={id}
              data-testid={`training-drill-${id}`}
              data-drill={id}
              onClick={() => handlePick(id)}
              disabled={!canAfford}
              aria-label={`${drill.name}. A clean session pays ${lines
                .map(([c, n]) => `${n} ${CURRENCY_LABELS[c]}`)
                .join(', ')}.`}
              className="border-4 border-pixel-border bg-pixel-card p-2.5 sm:p-4 text-left cursor-pointer transition-all duration-150 [@media(hover:hover)]:hover:brightness-110 [@media(hover:hover)]:hover:border-pixel-accent focus-visible:border-pixel-accent active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 grid grid-cols-[2.75rem_minmax(0,1fr)] sm:grid-cols-1 sm:grid-rows-[3.5rem_auto_auto_1fr] gap-x-3 gap-y-1 sm:gap-y-2 items-center sm:items-start"
            >
              <span className="row-span-2 sm:row-span-1 self-start flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 bg-pixel-bg border-2 border-pixel-border text-pixel-text">
                <PixelIcon grid={DRILL_ICONS[id]} scale={3} />
              </span>
              <span className="text-sm sm:text-base font-bold text-pixel-text leading-snug sm:min-h-[2lh]">
                {drill.name}
              </span>
              <span className="text-[11px] text-pixel-text-muted">{drill.theme}</span>
              <span
                className="col-start-2 sm:col-start-1 flex flex-col gap-0.5 text-xs sm:text-sm"
                data-testid={`training-drill-pay-${id}`}
              >
                {lines.map(([c, n]) => (
                  <CurrencyAmounts key={c} amounts={{ [c]: n }} labelled />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </ScreenFrame>
  );
};
