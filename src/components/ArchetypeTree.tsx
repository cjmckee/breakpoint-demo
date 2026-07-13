/**
 * Archetype Tree Screen
 * Lets the player view and develop their phase-based archetype identity:
 * choose a specialty per phase, upgrade its tier with specialization points,
 * and respec a phase (consuming a respec token).
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { TendencyBars } from './TendencyBars';
import { buildPlayStyle } from '../core/PlayerProfile';
import {
  ALL_PHASES,
  PHASE_LABELS,
  PATHS_BY_PHASE,
  BROAD_ARCHETYPE_LABELS,
} from '../data/archetypeTree';
import type { GamePhase, PhasePathId, SpecialtyTier } from '../types/archetype';

const TierDots: React.FC<{ tier: SpecialtyTier }> = ({ tier }) => {
  return (
    <span className="inline-flex gap-0.5 align-middle">
      {[1, 2, 3].map((t) => (
        <span
          key={t}
          className={`inline-block w-2 h-2 border border-pixel-border ${
            t <= tier ? 'bg-pixel-accent' : 'bg-pixel-bg'
          }`}
        />
      ))}
    </span>
  );
};

export const ArchetypeTree: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const specializePhase = useGameStore((state) => state.specializePhase);
  const upgradePhase = useGameStore((state) => state.upgradePhase);
  const respecPhase = useGameStore((state) => state.respecPhase);

  if (!player) return null;

  const profile = player.archetypeProfile;
  const points = profile.specializationPoints;
  const tokens = profile.respecTokens;
  const playStyle = buildPlayStyle(profile);
  // Club Player (tier 1) is capped at specialty tier I — upgrading past it unlocks at Regional Competitor.
  const isTierCapped = player.tier <= 1;

  if (!profile.broad) {
    return (
      <div className="min-h-screen bg-pixel-bg p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="secondary" onClick={() => navigateTo('idle')}>← Back to Menu</Button>
          </div>
          <Card title="Player Archetype">
            <p className="text-pixel-text-muted">
              You haven't defined your playing identity yet. Coach Gonzalez will help you choose
              what kind of player you want to be — come back after meeting with him.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const renderPhase = (phase: GamePhase) => {
    const chosen = profile.phases[phase]; // undefined = not yet specialized (baseline behavior)
    const phaseManuallySet = !!chosen;
    const paths = PATHS_BY_PHASE[phase];

    return (
      <Card key={phase} title={PHASE_LABELS[phase]} className="mb-4">
        <div className="space-y-3">
          {paths.map((path) => {
            const isChosen = chosen?.path === path.id;

            return (
              <div
                key={path.id}
                className={`p-3 border-2 ${
                  isChosen ? 'border-pixel-accent bg-pixel-accent bg-opacity-10' : 'border-pixel-border bg-pixel-card'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-pixel-text">{path.label}</span>
                      {isChosen && <TierDots tier={chosen!.tier} />}
                    </div>
                    <p className="text-sm text-pixel-text-muted mt-1">{path.description}</p>
                    <p className="text-xs text-pixel-accent-light mt-1">⚖️ {path.tradeoff}</p>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    {/* Specialize: phase has no pick yet */}
                    {!phaseManuallySet && (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={points < 1}
                        onClick={() => specializePhase(phase, path.id as PhasePathId)}
                      >
                        Specialize (1)
                      </Button>
                    )}

                    {/* Upgrade / Respec: this is the chosen specialty */}
                    {isChosen && (
                      <>
                        {chosen!.tier < 3 ? (
                          isTierCapped ? (
                            <span className="text-xs text-center text-pixel-text-muted" title="Reach Regional Competitor to upgrade specialties past tier I">
                              Locked until Regional Competitor
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="success"
                              disabled={points < 1}
                              onClick={() => upgradePhase(phase)}
                            >
                              Upgrade (1)
                            </Button>
                          )
                        ) : (
                          <span className="text-xs text-center text-pixel-text-muted">Maxed</span>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={tokens < 1}
                          onClick={() => respecPhase(phase)}
                        >
                          Respec
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="secondary" onClick={() => navigateTo('idle')}>← Back to Menu</Button>
        </div>

        <Card title="Player Archetype" className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm text-pixel-text-muted">Archetype</div>
              <div className="text-xl font-bold text-pixel-text">
                {BROAD_ARCHETYPE_LABELS[profile.broad] ?? profile.broad}
              </div>
            </div>
            <div className="w-full max-w-xs">
              <div className="text-sm text-pixel-text-muted mb-1.5">Current Tendencies</div>
              <TendencyBars playStyle={playStyle} />
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-pixel-accent">{points}</div>
                <div className="text-xs text-pixel-text-muted">Spec Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{tokens}</div>
                <div className="text-xs text-pixel-text-muted">Respec Tokens</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-pixel-text-muted mt-3">
            Each phase has one specialty (tiers I–III). Spend a point to lock in or upgrade a
            specialty. Switching a locked-in phase requires a respec token. Tendencies reflect how
            you actually play right now, based on the specialties you've locked in below — your
            archetype is the direction, not an automatic bonus.
          </p>
        </Card>

        {ALL_PHASES.map(renderPhase)}
      </div>
    </div>
  );
};
