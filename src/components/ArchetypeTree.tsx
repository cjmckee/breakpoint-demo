/**
 * Archetype Screen — "The Court"
 *
 * The player's phase-based identity laid out on the match-cockpit court (side
 * view): you own the left half, the opponent the right, net down the middle.
 * Phases sit where they happen — serve off your baseline, groundstrokes at
 * mid-court, net play at the net, return across the way — so the layout reads
 * left-to-right as a point plays out. Each node is colored by the tactical ROLE
 * of its chosen specialty (offense / balanced / defense); tapping a node opens a
 * detail drawer with that phase's three options, and the point/respec economy
 * lives on the option buttons themselves.
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { TendencyBars } from './TendencyBars';
import { audioManager } from '../audio/AudioManager';
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

/**
 * Where each phase sits on the court, as % of the stage (you own the LEFT half,
 * net at 50%, opponent the RIGHT). Serves stack on your baseline, groundstrokes
 * at mid-court (backhand up / forehand down, the cockpit convention), net play
 * on the net, return at the far baseline.
 */
const COURT_POS: Record<GamePhase, { x: number; y: number }> = {
  first_serve: { x: 12, y: 38 },
  second_serve: { x: 12, y: 62 },
  backhand: { x: 33, y: 29 },
  forehand: { x: 33, y: 71 },
  net: { x: 51, y: 50 },
  return: { x: 88, y: 50 },
};

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

/** Primary economy action (Specialize / Upgrade) — solid accent, cost in a pill. */
const PrimaryAction: React.FC<{
  label: string;
  cost: string;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, cost, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => { audioManager.playSfx('ui_click'); onClick(); }}
    className="w-full flex items-center justify-center gap-2 px-3 py-2 font-mono text-xs font-bold border-2 border-pixel-accent bg-pixel-accent text-white transition-[filter] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
  >
    {label}
    <span className="text-[10px] font-extrabold px-1.5 py-px rounded-full bg-white text-pixel-accent">{cost}</span>
  </button>
);

/** Respec — deliberately quiet (ghost), token cost in the currency gold. */
const RespecAction: React.FC<{ disabled?: boolean; onClick: () => void }> = ({ disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => { audioManager.playSfx('ui_click'); onClick(); }}
    className="w-full flex items-center justify-center gap-2 px-3 py-2 font-mono text-xs font-bold border-2 border-pixel-border bg-transparent text-pixel-text-muted transition-colors hover:border-pixel-text-muted hover:text-pixel-text disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-pixel-border"
  >
    Respec
    <span className="text-[10px] text-yellow-400">1 token</span>
  </button>
);

export const ArchetypeTree: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const specializePhase = useGameStore((state) => state.specializePhase);
  const upgradePhase = useGameStore((state) => state.upgradePhase);
  const respecPhase = useGameStore((state) => state.respecPhase);

  const [activePhase, setActivePhase] = useState<GamePhase | null>(null);

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

  const renderNode = (phase: GamePhase) => {
    const spec = profile.phases[phase];
    const path = spec ? PATHS_BY_PHASE[phase].find((p) => p.id === spec.path)! : null;
    const color = path ? ROLE_META[path.role].color : EMPTY_COLOR;
    const isActive = activePhase === phase;
    const pos = COURT_POS[phase];

    return (
      <button
        key={phase}
        type="button"
        onClick={() => setActivePhase(phase)}
        className="absolute w-[104px] sm:w-[112px] -translate-x-1/2 -translate-y-1/2 border-2 px-1.5 py-1.5 text-center transition-transform hover:scale-105 focus:outline-none focus:scale-105"
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          backgroundColor: 'rgba(20,22,38,0.86)',
          borderColor: isActive ? color : '#2d3748',
          boxShadow: isActive ? `0 0 0 2px ${color}, 0 0 16px -2px ${color}` : 'none',
        }}
      >
        <div className="text-[9px] uppercase tracking-wide text-pixel-text-muted font-mono">
          {PHASE_LABELS[phase]}
        </div>
        {path ? (
          <>
            <div className="text-xs font-bold font-mono mt-0.5 truncate" style={{ color }}>
              {path.label}
            </div>
            <div className="mt-1"><TierDots tier={spec!.tier} color={color} /></div>
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
            Tap a phase on the court to develop it.
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
            <span className="font-mono text-[10px] text-pixel-text-muted">— pick one to specialize</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {paths.map((path) => {
            const isChosen = chosen?.path === path.id;
            const role = ROLE_META[path.role];

            return (
              <div
                key={path.id}
                className="flex flex-col p-4 border-b border-pixel-border md:border-b-0 md:border-r md:last:border-r-0"
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
                <p className="text-xs text-pixel-text-muted mt-2 mb-3 opacity-80">⚖️ {path.tradeoff}</p>

                <div className="mt-auto flex flex-col gap-1.5">
                  {/* Specialize: phase has no pick yet */}
                  {!phaseManuallySet && (
                    <PrimaryAction
                      label="Specialize"
                      cost="1 pt"
                      disabled={points < 1}
                      onClick={() => specializePhase(activePhase, path.id as PhasePathId)}
                    />
                  )}

                  {/* Upgrade / Respec: this is the chosen specialty */}
                  {isChosen && (
                    <>
                      {chosen!.tier < 3 ? (
                        isTierCapped ? (
                          <span
                            className="font-mono text-[11px] text-center text-pixel-text-muted py-1.5"
                            title="Reach Regional Competitor to upgrade specialties past tier I"
                          >
                            Tier {chosen!.tier + 1} locked
                          </span>
                        ) : (
                          <PrimaryAction
                            label="Upgrade"
                            cost="1 pt"
                            disabled={points < 1}
                            onClick={() => upgradePhase(activePhase)}
                          />
                        )
                      ) : (
                        <span className="font-mono text-[11px] text-center text-pixel-text-muted py-1.5">Tier III · Maxed</span>
                      )}
                      <RespecAction disabled={tokens < 1} onClick={() => respecPhase(activePhase)} />
                    </>
                  )}

                  {/* Another specialty is locked in for this phase */}
                  {phaseManuallySet && !isChosen && (
                    <span className="font-mono text-[11px] text-center text-pixel-text-muted opacity-70 py-1.5">
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

        <Card title="Playing Identity" className="mb-4">
          {/* role legend */}
          <div className="flex flex-wrap gap-4 mb-3 font-mono text-[11px]">
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

          <div className="flex flex-wrap gap-4 items-stretch">
            {/* The court */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative w-full" style={{ aspectRatio: '560 / 300' }}>
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 560 300"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="courtGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#3d75bd" />
                      <stop offset="0.5" stopColor="#3a6fb4" />
                      <stop offset="1" stopColor="#33639f" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="560" height="300" fill="#26406a" />
                  <rect x="20" y="20" width="520" height="260" fill="url(#courtGrad)" />
                  <rect x="20" y="20" width="520" height="260" fill="none" stroke="#f3f6ff" strokeWidth="2.5" />
                  <line x1="20" y1="52" x2="540" y2="52" stroke="#f3f6ff" strokeWidth="2" />
                  <line x1="20" y1="248" x2="540" y2="248" stroke="#f3f6ff" strokeWidth="2" />
                  <line x1="140" y1="52" x2="140" y2="248" stroke="#f3f6ff" strokeWidth="2" />
                  <line x1="420" y1="52" x2="420" y2="248" stroke="#f3f6ff" strokeWidth="2" />
                  <line x1="140" y1="150" x2="280" y2="150" stroke="#f3f6ff" strokeWidth="2" />
                  <line x1="280" y1="150" x2="420" y2="150" stroke="#f3f6ff" strokeWidth="2" />
                  <line x1="20" y1="150" x2="32" y2="150" stroke="#f3f6ff" strokeWidth="2" />
                  <line x1="528" y1="150" x2="540" y2="150" stroke="#f3f6ff" strokeWidth="2" />
                  <line x1="280" y1="14" x2="280" y2="286" stroke="#0d1526" strokeWidth="6" opacity="0.55" />
                  <line x1="280" y1="14" x2="280" y2="286" stroke="#f3f6ff" strokeWidth="2.5" strokeDasharray="3 3" />
                </svg>
                <span className="absolute left-1/2 top-1.5 -translate-x-1/2 font-mono text-[8px] tracking-[0.2em] uppercase text-white/80 pointer-events-none">
                  — Net —
                </span>
                {ALL_PHASES.map(renderNode)}
              </div>
            </div>

            {/* Stat panel: archetype · currencies · live tendencies */}
            <aside className="w-full sm:w-56 flex flex-col gap-4 border-2 border-pixel-border bg-pixel-card p-4">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-pixel-text-muted">Archetype</div>
                <div className="font-mono text-lg font-bold text-pixel-text leading-tight mt-0.5">
                  {BROAD_ARCHETYPE_LABELS[profile.broad] ?? profile.broad}
                </div>
              </div>
              <div className="flex gap-2.5">
                <div className="flex-1 border border-pixel-border bg-pixel-bg py-2 text-center">
                  <div className="font-mono text-xl font-bold text-pixel-accent leading-none">{points}</div>
                  <div className="font-mono text-[8.5px] uppercase tracking-wide text-pixel-text-muted mt-1">Spec Points</div>
                </div>
                <div className="flex-1 border border-pixel-border bg-pixel-bg py-2 text-center">
                  <div className="font-mono text-xl font-bold text-yellow-400 leading-none">{tokens}</div>
                  <div className="font-mono text-[8.5px] uppercase tracking-wide text-pixel-text-muted mt-1">Respec Tokens</div>
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-pixel-text-muted mb-2">Current Tendencies</div>
                <TendencyBars playStyle={playStyle} />
              </div>
            </aside>
          </div>
        </Card>

        {renderDrawer()}
      </div>
    </div>
  );
};
