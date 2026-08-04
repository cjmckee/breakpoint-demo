/**
 * Anchor Training Screen
 *
 * Redesigned training flow:
 *   1. Pick a CORE stat to anchor on (this is your build choice; grants +1 core).
 *   2. Play that shot's themed minigame — three pass/fail attempts, each success banks
 *      a support (0-3) — or Quick Sim for a guaranteed 1.
 *   3. Supports are drawn from a pool themed to the anchored shot.
 *
 * See docs/training-redesign.md.
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import {
  CORE_ANCHORS,
  CORE_ANCHOR_ORDER,
  ANCHOR_TRAINING_ENERGY_COST,
  buildAnchorTrainingResult,
  recentSupportsFrom,
  type CoreStat,
} from '../game/AnchorTrainingSystem';
import { EffectKey, type StatBoosts, type TrainingResult } from '../types/game';
import { EffectAggregator } from '../core/EffectAggregator';
import { StatusBar } from './StatusBar';
import { Button } from './ui/Button';
import { STAT_ICONS, formatStatName } from '../config/statIcons';
import { StatIcon } from './ui/StatIcon';
import { CoreStatPentagon } from './training/CoreStatPentagon';
import { audioManager } from '../audio/AudioManager';
import type { MinigameId } from '../game/AnchorTrainingSystem';
import type { MinigameProps } from './training/MinigameShell';
import { ServeMinigame } from './training/ServeMinigame';
import { RallyRhythmMinigame } from './training/RallyRhythmMinigame';
import { CornerPainterMinigame } from './training/CornerPainterMinigame';
import { ReadReturnMinigame } from './training/ReadReturnMinigame';
import { TouchSliceMinigame } from './training/TouchSliceMinigame';

const MINIGAMES: Record<MinigameId, React.FC<MinigameProps>> = {
  toss_and_strike: ServeMinigame,
  rally_rhythm: RallyRhythmMinigame,
  corner_paint: CornerPainterMinigame,
  read_return: ReadReturnMinigame,
  touch_slice: TouchSliceMinigame,
};

type Step = { kind: 'pick' } | { kind: 'play'; core: CoreStat };

export const AnchorTraining: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const activityHistory = useGameStore((state) => state.activityHistory);
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

  // Supports handed out in the most recent training session, so we can bias away
  // from repeating them.
  const lastTrainingBoosts: StatBoosts | undefined = activityHistory.find(
    (a): a is TrainingResult => a.type === 'training'
  )?.statBoosts;

  const resolve = (core: CoreStat, count: number): void => {
    const recent = recentSupportsFrom(lastTrainingBoosts);
    const result = buildAnchorTrainingResult(core, count, recent);
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
            Guaranteed <span className="text-green-400 font-bold">+1 {anchor.name}</span> — land
            clean reps below to earn bonus stats too.
          </p>

          {(() => {
            const Minigame = MINIGAMES[anchor.minigame];
            return (
              <Minigame
                onComplete={(count) => resolve(step.core, count)}
                windowBonus={windowBonus}
                onFirstAttempt={() => setHasAttempted(true)}
              />
            );
          })()}

          {/* Themed support pool preview */}
          <div className="bg-pixel-card border-2 border-pixel-border p-4 mt-4">
            <div className="text-xs font-bold text-pixel-text-muted mb-2 uppercase tracking-wide">
              Also improves
            </div>
            <div className="flex flex-wrap gap-2">
              {anchor.supportPool.map((stat) => (
                <StatIcon
                  key={stat}
                  stat={stat}
                  showLabel
                  className="text-xs px-2 py-1 bg-pixel-bg border border-pixel-border text-gray-300"
                />
              ))}
            </div>
          </div>

          {!hasAttempted && (
            <Button
              variant="secondary"
              fullWidth
              className="mt-4"
              disabled={!canAfford}
              onClick={() => resolve(step.core, 1)}
            >
              Quick Sim (skip · +1 bonus)
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
              Pick a shot to work on. Train well and you'll pick up bonus stats along the way.
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

          <div className="flex-1 flex flex-col gap-2.5">
            {CORE_ANCHOR_ORDER.map((core) => {
              const anchor = CORE_ANCHORS[core];
              const value = player.stats.core[core];
              return (
                <button
                  key={core}
                  onClick={() => handlePickCore(core)}
                  onMouseEnter={() => setHovered(core)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(core)}
                  onBlur={() => setHovered(null)}
                  disabled={!canAfford}
                  aria-label={`Train ${anchor.name}, currently ${value}, for +1. Also improves ${anchor.supportPool
                    .map(formatStatName)
                    .join(', ')}.`}
                  className="md:flex-1 border-4 border-pixel-border bg-pixel-card px-3 py-2.5 flex items-center gap-3 text-left cursor-pointer transition-all duration-150 hover:brightness-110 hover:border-pixel-accent focus-visible:border-pixel-accent active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:hover:brightness-100"
                >
                  <span className="text-3xl leading-none" aria-hidden="true">
                    {STAT_ICONS[core]}
                  </span>

                  <span className="flex-1 flex flex-col gap-1.5">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-pixel-text">{anchor.name}</span>
                      <span className="text-2xl font-bold text-pixel-text leading-none tabular-nums">
                        {value} <span className="text-xs font-bold text-green-400">+1</span>
                      </span>
                    </span>

                    <span className="w-full h-1.5 bg-pixel-bg border border-pixel-border">
                      <span
                        className="block h-full bg-pixel-accent"
                        style={{ width: `${value}%` }}
                      />
                    </span>

                    <span className="flex gap-1 text-[13px]">
                      {anchor.supportPool.map((stat) => (
                        <StatIcon key={stat} stat={stat} decorative className="opacity-80" />
                      ))}
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
