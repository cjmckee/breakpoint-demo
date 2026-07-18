/**
 * Archetype Tree Screen — "Court Hexagon"
 *
 * The player's phase-based identity, laid out as a hexagon in point-flow order
 * (first serve → second serve → return → forehand → backhand → net). Each node
 * is colored by the tactical ROLE of its chosen specialty (offense / balanced /
 * defense), so the whole build reads as a color-lean at a glance rather than a
 * wall of text. Tapping a node opens a detail drawer with that phase's three
 * options — the prose lives behind the interaction, one phase at a time.
 */

import React, { useMemo, useState } from 'react';
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
import type {
  GamePhase,
  PhasePathId,
  SpecialtyRole,
  SpecialtyTier,
} from '../types/archetype';

/** Presentation for each tactical role. Colors are UI-only; role lives in data. */
const ROLE_META: Record<SpecialtyRole, { label: string; color: string }> = {
  offense: { label: 'Offense', color: '#e94560' }, // pixel-accent
  balanced: { label: 'Balanced', color: '#f39c12' }, // pixel-warning
  defense: { label: 'Defense', color: '#4aa3df' }, // court blue
};
const EMPTY_COLOR = '#6b6b85';

/** Ring geometry: 6 phases, first serve at top, clockwise, in point-flow order. */
const RING_RADIUS = 41; // % of half-stage
const NODE_POSITIONS = ALL_PHASES.map((_, i) => {
  const angle = ((-90 + i * 60) * Math.PI) / 180;
  return {
    x: 50 + Math.cos(angle) * RING_RADIUS,
    y: 50 + Math.sin(angle) * RING_RADIUS,
  };
});

const TierDots: React.FC<{ tier: SpecialtyTier; color: string }> = ({ tier, color }) => (
  <span className="inline-flex gap-0.5 align-middle">
    {[1, 2, 3].map((t) => (
      <span
        key={t}
        className="inline-block w-2 h-2 border"
        style={{
          borderColor: t <= tier ? color : '#3d4a63',
          backgroundColor: t <= tier ? color : 'transparent',
        }}
      />
    ))}
  </span>
);

export const ArchetypeTree: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const specializePhase = useGameStore((state) => state.specializePhase);
  const upgradePhase = useGameStore((state) => state.upgradePhase);
  const respecPhase = useGameStore((state) => state.respecPhase);

  const [activePhase, setActivePhase] = useState<GamePhase | null>(null);

  // Build-lean summary: tally the role of every specialized phase.
  const lean = useMemo(() => {
    const tally: Record<SpecialtyRole, number> = { offense: 0, balanced: 0, defense: 0 };
    if (!player) return tally;
    for (const phase of ALL_PHASES) {
      const spec = player.archetypeProfile.phases[phase];
      if (spec) tally[PATHS_BY_PHASE[phase].find((p) => p.id === spec.path)!.role]++;
    }
    return tally;
  }, [player]);

  if (!player) return null;

  const profile = player.archetypeProfile;
  const points = profile.specializationPoints;
  const tokens = profile.respecTokens;
  const playStyle = buildPlayStyle(profile);
  // Club Player (tier 1) is capped at specialty tier I — upgrading unlocks at Regional Competitor.
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

  const totalSpecialized = lean.offense + lean.balanced + lean.defense;
  const leanReadout = ((): { label: string; color: string } => {
    if (totalSpecialized === 0) return { label: 'Undeclared', color: EMPTY_COLOR };
    const max = Math.max(lean.offense, lean.balanced, lean.defense);
    const ties = [lean.offense, lean.balanced, lean.defense].filter((v) => v === max).length;
    if (ties > 1) return { label: 'All-Court', color: ROLE_META.balanced.color };
    if (max === lean.offense) return { label: 'Aggressor', color: ROLE_META.offense.color };
    if (max === lean.defense) return { label: 'Grinder', color: ROLE_META.defense.color };
    return { label: 'All-Court', color: ROLE_META.balanced.color };
  })();

  const webPolygon = NODE_POSITIONS.map((p) => `${p.x},${p.y}`).join(' ');

  const renderNode = (phase: GamePhase, index: number) => {
    const spec = profile.phases[phase];
    const path = spec ? PATHS_BY_PHASE[phase].find((p) => p.id === spec.path)! : null;
    const color = path ? ROLE_META[path.role].color : EMPTY_COLOR;
    const isActive = activePhase === phase;
    const pos = NODE_POSITIONS[index];

    return (
      <button
        key={phase}
        type="button"
        onClick={() => setActivePhase(phase)}
        className="absolute w-[116px] sm:w-[128px] -translate-x-1/2 -translate-y-1/2 border-2 bg-pixel-card px-1.5 py-2 text-center transition-transform hover:scale-105 focus:outline-none focus:scale-105"
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          borderColor: isActive ? color : '#2d3748',
          boxShadow: isActive ? `0 0 0 2px ${color}, 0 0 16px -2px ${color}` : 'none',
        }}
      >
        <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-pixel-text-muted font-mono">
          {PHASE_LABELS[phase]}
        </div>
        {path ? (
          <>
            <div className="text-xs sm:text-sm font-bold font-mono mt-0.5 truncate" style={{ color }}>
              {path.label}
            </div>
            <div className="mt-1">
              <TierDots tier={spec!.tier} color={color} />
            </div>
          </>
        ) : (
          <div className="text-[11px] font-mono font-bold mt-0.5" style={{ color: EMPTY_COLOR }}>
            — Open —
          </div>
        )}
      </button>
    );
  };

  const renderDrawer = () => {
    if (!activePhase) {
      return (
        <div className="border-2 border-pixel-border bg-pixel-bg p-8 text-center">
          <span className="font-mono text-sm text-pixel-text-muted tracking-wide">
            Select a phase on the ring to develop it.
          </span>
        </div>
      );
    }

    const paths = PATHS_BY_PHASE[activePhase];
    const chosen = profile.phases[activePhase];
    const phaseManuallySet = !!chosen;

    return (
      <div className="border-2 border-pixel-border bg-pixel-bg">
        <div className="border-b border-pixel-border px-4 py-2.5 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-pixel-text-muted">
            {PHASE_LABELS[activePhase]}
          </span>
          {!phaseManuallySet && (
            <span className="font-mono text-[10px] text-pixel-text-muted">
              — pick one ({points} pt{points === 1 ? '' : 's'} available)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {paths.map((path) => {
            const isChosen = chosen?.path === path.id;
            const role = ROLE_META[path.role];

            return (
              <div
                key={path.id}
                className="p-4 border-b border-pixel-border md:border-b-0 md:border-r md:last:border-r-0"
                style={{ borderTop: isChosen ? `3px solid ${role.color}` : '3px solid transparent' }}
              >
                <div className="font-mono text-[9px] uppercase tracking-widest" style={{ color: role.color }}>
                  {role.label}
                </div>
                <div className="font-mono font-bold text-sm mt-1.5 flex items-center gap-2 text-pixel-text">
                  {path.label}
                  {isChosen && <TierDots tier={chosen!.tier} color={role.color} />}
                </div>
                <p className="text-sm text-pixel-text-muted mt-2">{path.description}</p>
                <p className="text-xs text-pixel-text-muted mt-2 opacity-80">⚖️ {path.tradeoff}</p>

                <div className="mt-3 flex flex-col gap-1.5">
                  {/* Specialize: phase has no pick yet */}
                  {!phaseManuallySet && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={points < 1}
                      onClick={() => specializePhase(activePhase, path.id as PhasePathId)}
                    >
                      Specialize (1)
                    </Button>
                  )}

                  {/* Upgrade / Respec: this is the chosen specialty */}
                  {isChosen && (
                    <>
                      {chosen!.tier < 3 ? (
                        isTierCapped ? (
                          <span
                            className="text-xs text-center text-pixel-text-muted"
                            title="Reach Regional Competitor to upgrade specialties past tier I"
                          >
                            Tier {chosen!.tier + 1} locked
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="success"
                            disabled={points < 1}
                            onClick={() => upgradePhase(activePhase)}
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
                        onClick={() => respecPhase(activePhase)}
                      >
                        Respec
                      </Button>
                    </>
                  )}

                  {/* Another specialty is locked in for this phase */}
                  {phaseManuallySet && !isChosen && (
                    <span className="text-xs text-center text-pixel-text-muted opacity-70">
                      Respec to switch
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="secondary" onClick={() => navigateTo('idle')}>← Back to Menu</Button>
        </div>

        {/* Header: identity at a glance — currencies + live tendencies, no wall of text */}
        <Card className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm text-pixel-text-muted">Archetype</div>
              <div className="text-xl font-bold text-pixel-text mb-3">
                {BROAD_ARCHETYPE_LABELS[profile.broad] ?? profile.broad}
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
            <div className="w-full max-w-xs">
              <div className="text-sm text-pixel-text-muted mb-1.5">Current Tendencies</div>
              <TendencyBars playStyle={playStyle} />
            </div>
          </div>
        </Card>

        {/* The Court Hexagon */}
        <Card title="Playing Identity" className="mb-4">
          {/* role legend */}
          <div className="flex flex-wrap gap-4 mb-2 font-mono text-[11px]">
            {(Object.keys(ROLE_META) as SpecialtyRole[]).map((r) => (
              <span key={r} className="inline-flex items-center gap-1.5 uppercase tracking-wide text-pixel-text-muted">
                <span
                  className="inline-block w-3 h-3"
                  style={{ backgroundColor: ROLE_META[r].color, boxShadow: `0 0 8px ${ROLE_META[r].color}` }}
                />
                {ROLE_META[r].label}
              </span>
            ))}
          </div>

          <div className="relative mx-auto w-full max-w-[560px]" style={{ aspectRatio: '1 / 0.92' }}>
            <svg
              className="absolute inset-0 w-full h-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points={webPolygon} fill="rgba(233,69,96,0.03)" stroke="#2d3748" strokeWidth={0.4} />
              {NODE_POSITIONS.map((p, i) => (
                <line key={i} x1={50} y1={50} x2={p.x} y2={p.y} stroke="#222c44" strokeWidth={0.3} />
              ))}
            </svg>

            {/* center core: build lean */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] rounded-full flex flex-col items-center justify-center text-center border-2 border-pixel-border"
              style={{
                background: 'radial-gradient(circle at 50% 40%, #202a4a, #131a30)',
                boxShadow: 'inset 0 0 24px rgba(0,0,0,0.5)',
              }}
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-pixel-text-muted">Build lean</span>
              <span className="font-mono font-bold text-base my-1" style={{ color: leanReadout.color }}>
                {leanReadout.label}
              </span>
              <div className="flex gap-1 items-end h-8">
                {(['offense', 'balanced', 'defense'] as SpecialtyRole[]).map((r) => (
                  <span
                    key={r}
                    className="w-2.5 block"
                    style={{
                      height: `${6 + lean[r] * 8}px`,
                      backgroundColor: ROLE_META[r].color,
                      boxShadow: `0 0 6px ${ROLE_META[r].color}`,
                    }}
                  />
                ))}
              </div>
            </div>

            {ALL_PHASES.map((phase, i) => renderNode(phase, i))}
          </div>
        </Card>

        {renderDrawer()}
      </div>
    </div>
  );
};
