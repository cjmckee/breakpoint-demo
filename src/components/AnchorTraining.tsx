/**
 * Anchor Training Screen
 *
 * Redesigned training flow:
 *   1. Pick a CORE stat to anchor on (this is your build choice; grants +1 core).
 *   2. Play that shot's themed minigame — performance decides how many support stats
 *      (1-3) you earn — or Quick Sim for a guaranteed 1.
 *   3. Supports are drawn from a pool themed to the anchored shot.
 *
 * Serve is the playable vertical slice; the other cores route to Quick Sim until their
 * minigames are built. See docs/training-redesign.md.
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import {
  CORE_ANCHORS,
  CORE_ANCHOR_ORDER,
  ANCHOR_TRAINING_ENERGY_COST,
  buildAnchorTrainingResult,
  recentSupportsFrom,
  scoreToCount,
  type CoreStat,
  type SupportCount,
} from '../game/AnchorTrainingSystem';
import type { StatBoosts, TrainingResult } from '../types/game';
import { StatusBar } from './StatusBar';
import { Button } from './ui/Button';
import { STAT_ICONS, formatStatName } from './ui/StatBoostList';
import { audioManager } from '../audio/AudioManager';
import { ServeMinigame } from './training/ServeMinigame';

type Step = { kind: 'pick' } | { kind: 'play'; core: CoreStat };

export const AnchorTraining: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const activityHistory = useGameStore((state) => state.activityHistory);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const applyTrainingResult = useGameStore((state) => state.applyTrainingResult);
  const advanceTime = useGameStore((state) => state.advanceTime);

  const [step, setStep] = useState<Step>({ kind: 'pick' });

  if (!player) return null;

  const canAfford = currentStatus.energy >= ANCHOR_TRAINING_ENERGY_COST;

  // Supports handed out in the most recent training session, so we can bias away
  // from repeating them.
  const lastTrainingBoosts: StatBoosts | undefined = activityHistory.find(
    (a): a is TrainingResult => a.type === 'training'
  )?.statBoosts;

  const resolve = (core: CoreStat, count: SupportCount): void => {
    const recent = recentSupportsFrom(lastTrainingBoosts);
    const result = buildAnchorTrainingResult(core, count, recent);
    // applyTrainingResult transitions to idle with the training_result overlay,
    // then advanceTime moves the clock forward — mirrors the old training flow.
    applyTrainingResult(result);
    advanceTime();
  };

  const handlePickCore = (core: CoreStat): void => {
    audioManager.playSfx('ui_click');
    setStep({ kind: 'play', core });
  };

  if (step.kind === 'play') {
    const anchor = CORE_ANCHORS[step.core];

    return (
      <div className="min-h-screen bg-pixel-bg">
        <StatusBar onBack={() => setStep({ kind: 'pick' })} />

        <div className="max-w-2xl mx-auto px-4 pb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{anchor.icon}</span>
            <h1 className="text-3xl font-bold text-pixel-text">{anchor.name} Training</h1>
          </div>
          <p className="text-pixel-text-muted mb-6">
            Guaranteed <span className="text-green-400 font-bold">+1 {anchor.name}</span> — then earn
            1–3 support stats.
          </p>

          {anchor.playable ? (
            <ServeMinigame onComplete={(score) => resolve(step.core, scoreToCount(score))} />
          ) : (
            <div className="bg-pixel-card border-4 border-pixel-border p-6 text-center">
              <div className="text-4xl mb-3">🚧</div>
              <h3 className="text-lg font-bold text-pixel-text mb-1">
                {minigameName(anchor.minigame)} coming soon
              </h3>
              <p className="text-sm text-pixel-text-muted">
                This shot's minigame isn't built yet. Quick Sim resolves it for a guaranteed
                1 support.
              </p>
            </div>
          )}

          {/* Themed support pool preview */}
          <div className="bg-pixel-card border-2 border-pixel-border p-4 mt-4">
            <div className="text-xs font-bold text-pixel-text-muted mb-2 uppercase tracking-wide">
              Possible support stats
            </div>
            <div className="flex flex-wrap gap-2">
              {anchor.supportPool.map((stat) => (
                <span
                  key={stat}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-pixel-bg border border-pixel-border text-gray-300"
                >
                  <span>{STAT_ICONS[stat] ?? '⭐'}</span>
                  {formatStatName(stat)}
                </span>
              ))}
            </div>
          </div>

          <Button
            variant="secondary"
            fullWidth
            className="mt-4"
            disabled={!canAfford}
            onClick={() => resolve(step.core, 1)}
          >
            Quick Sim (skip · +1 support)
          </Button>
        </div>
      </div>
    );
  }

  // step.kind === 'pick'
  return (
    <div className="min-h-screen bg-pixel-bg">
      <StatusBar onBack={() => navigateTo('idle')} />

      <div className="max-w-4xl mx-auto px-4 pb-8">
        <h1 className="text-3xl font-bold text-pixel-text mb-1">Training</h1>
        <p className="text-pixel-text-muted mb-6">
          Pick the shot to build around. You'll get <span className="text-green-400 font-bold">+1</span>{' '}
          to it, then earn 1–3 related support stats.
        </p>

        {!canAfford && (
          <div className="mb-4 p-3 bg-pixel-card border-2 border-pixel-error text-pixel-error text-sm font-bold">
            Not enough energy — training costs {ANCHOR_TRAINING_ENERGY_COST}, you have{' '}
            {currentStatus.energy}. Rest to recover.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CORE_ANCHOR_ORDER.map((core) => {
            const anchor = CORE_ANCHORS[core];
            return (
              <button
                key={core}
                onClick={() => handlePickCore(core)}
                disabled={!canAfford}
                className="border-4 border-pixel-border p-4 bg-pixel-card flex flex-col text-left cursor-pointer transition-all duration-150 hover:brightness-110 hover:border-pixel-accent active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:hover:brightness-100"
              >
                <div className="flex items-start justify-between gap-3 mb-2 w-full">
                  <h3 className="text-lg font-bold text-pixel-text leading-tight flex items-center gap-2">
                    <span className="text-2xl">{anchor.icon}</span>
                    {anchor.name}
                    <span className="text-sm font-bold text-green-400">+1</span>
                  </h3>
                  <div className="shrink-0 px-2 py-1 bg-pixel-bg border-2 border-pixel-border text-sm font-bold text-pixel-text">
                    ⚡ {ANCHOR_TRAINING_ENERGY_COST}
                  </div>
                </div>

                <p className="text-xs text-pixel-text-muted mb-3">{anchor.description}</p>

                <div className="mt-auto flex flex-wrap gap-1.5">
                  {anchor.supportPool.map((stat) => (
                    <span
                      key={stat}
                      className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 bg-pixel-bg border border-pixel-border text-gray-400"
                      title={formatStatName(stat)}
                    >
                      <span>{STAT_ICONS[stat] ?? '⭐'}</span>
                      {formatStatName(stat)}
                    </span>
                  ))}
                </div>

                {!anchor.playable && (
                  <div className="text-[10px] text-pixel-text-muted mt-2 italic">
                    minigame WIP · Quick Sim available
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function minigameName(id: string): string {
  switch (id) {
    case 'toss_and_strike':
      return 'Toss & Strike';
    case 'rally_rhythm':
      return 'Rally Rhythm';
    case 'load_and_fire':
      return 'Load & Fire';
    case 'read_and_react':
      return 'Read & React';
    case 'touch_carve':
      return 'Touch & Carve';
    default:
      return 'Minigame';
  }
}
