/**
 * Key Moment Modal Component
 * Two-phase: decision (pick a tactic) → result (see what happened).
 * The modal stays open through both phases; the result requires explicit Continue.
 *
 * Decision phase: compact resting cards (tactic + one-liner + effects + an advantage chip).
 * Hovering a card opens a big modal — left = the matchup (good/bad against), right = the
 * ratings (yours + opponent's, priority stat enlarged, advantage chip between them).
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { KeyMoment } from '../types/keyMoments';
import { TacticalOption, SecondaryEffect } from '../data/tacticalOptions';
import { ARCHETYPE_DATA, getRelevantTendency } from '../data/archetypes';
import { KeyMomentResolver, KeyMomentResult, AppliedEffect } from '../game/KeyMomentResolver';
import { useMatchStore } from '../stores/matchStore';
import { PlayerStats } from '../types/game';
import { useTutorialSpotlight } from '../hooks/useTutorialSpotlight';
import { TutorialCallout } from './tutorial/TutorialCallout';
import { KM_TUTORIAL_STEPS, KM_RESULT_STEPS, KmTarget, KmResultTarget } from '../data/tutorialSteps';

// ── Helpers ───────────────────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Read a stat value from PlayerStats by weight name (e.g. 'shotVariety', 'dropShot'). */
const statValue = (stats: PlayerStats, name: string): number => {
  const norm = name.toLowerCase().replace(/_/g, '');
  for (const cat of ['core', 'technical', 'physical', 'mental'] as const) {
    const c = stats[cat] as unknown as Record<string, number> | undefined;
    if (!c) continue;
    if (name in c) return c[name] ?? 0;
    for (const k of Object.keys(c)) {
      if (k.toLowerCase().replace(/_/g, '') === norm) return c[k] ?? 0;
    }
  }
  return 0;
};

/** camelCase stat key → display label ('shotVariety' → 'Shot Variety'). */
const formatStatName = (name: string): string => {
  const spaced = name.replace(/([A-Z])/g, ' $1');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/**
 * Advantage chip label + colour. Yellow at "Even", deepening to forest green as the player's
 * weighted edge grows and to deep scarlet as the disadvantage grows (continuous by score diff).
 */
const advInfo = (diff: number): { label: string; bg: string; fg: string } => {
  const label = diff > 10 ? 'Advantage' : diff < -10 ? 'Disadvantage' : 'Even';
  const mag = Math.min(1, Math.abs(diff) / 25);
  let hue: number;
  let sat: number;
  let light: number;
  if (diff >= 0) {
    hue = lerp(50, 130, mag);
    sat = lerp(85, 62, mag);
    light = lerp(52, 30, mag);
  } else {
    hue = lerp(50, 2, mag);
    sat = lerp(85, 68, mag);
    light = lerp(52, 33, mag);
  }
  return {
    label,
    bg: `hsl(${hue.toFixed(0)}, ${sat.toFixed(0)}%, ${light.toFixed(0)}%)`,
    fg: light < 46 ? '#ffffff' : '#2a1c02',
  };
};

/**
 * Whether an effect is beneficial to the player. Pressure is inverted from the other three:
 * reducing pressure (negative value) is good, so a negative pressure value is beneficial.
 */
const isBeneficial = (effect: { type: SecondaryEffect['type'] | AppliedEffect['type']; value: number }): boolean =>
  effect.type === 'pressure' ? effect.value < 0 : effect.value > 0;

interface KeyMomentModalProps {
  isOpen: boolean;
  keyMoment: KeyMoment | null;
}

export const KeyMomentModal: React.FC<KeyMomentModalProps> = ({ isOpen, keyMoment }) => {
  const [isHidden, setIsHidden] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  // On touch devices (no hover), tapping a card opens its detail modal instead of committing.
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const update = (): void => setIsTouch(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  // Reset the touch-opened detail when a new key moment arrives.
  useEffect(() => { setOpenIdx(null); }, [keyMoment?.id]);

  const handleKeyMomentChoice = useMatchStore((state) => state.handleKeyMomentChoice);
  const matchConfig = useMatchStore((state) => state.matchConfig);
  const showKeyMomentResult = useMatchStore((state) => state.showKeyMomentResult);
  const lastKeyMomentResult = useMatchStore((state) => state.lastKeyMomentResult);
  const keyMomentHistory = useMatchStore((state) => state.keyMomentHistory);
  const hideKeyMomentResult = useMatchStore((state) => state.hideKeyMomentResult);

  const isResultPhase = showKeyMomentResult && !!lastKeyMomentResult;
  const lastHistoryEntry = keyMomentHistory[keyMomentHistory.length - 1];

  // During result phase, currentKeyMoment is null — fall back to history
  const activeKeyMoment = keyMoment ?? lastHistoryEntry?.keyMoment ?? null;

  const isTutorial = !!matchConfig?.isTutorial;

  // Decision-phase spotlight: fires on the first key moment only
  const {
    currentStep: kmStep,
    activeStep: kmActiveStep,
    isActive: kmTutorialActive,
    isSpotlit: kmSpotlit,
    isDimmed: kmDimmed,
    next: kmNext,
    back: kmBack,
    canGoBack: kmCanGoBack,
  } = useTutorialSpotlight(
    KM_TUTORIAL_STEPS,
    isOpen && !isResultPhase && isTutorial && keyMomentHistory.length === 0,
  );

  // Result-phase spotlight: fires on the first result screen only
  const {
    currentStep: kmResultStep,
    activeStep: kmResultActiveStep,
    isActive: kmResultTutorialActive,
    isSpotlit: resultSpotlit,
    isDimmed: resultDimmed,
    next: kmResultNext,
    back: kmResultBack,
    canGoBack: kmResultCanGoBack,
  } = useTutorialSpotlight(
    KM_RESULT_STEPS,
    isOpen && isResultPhase && isTutorial,
  );

  const kmSectionClass = (target: KmTarget): string => {
    if (kmSpotlit(target)) return 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-black transition-all duration-200';
    if (kmDimmed(target)) return 'opacity-25 transition-all duration-200';
    return '';
  };

  const resultSectionClass = (target: KmResultTarget): string => {
    if (resultSpotlit(target)) return 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-black transition-all duration-200';
    if (resultDimmed(target)) return 'opacity-25 transition-all duration-200';
    return '';
  };

  if (!isOpen || !activeKeyMoment) return null;

  // ── Shared helpers ──────────────────────────────────────────────────────────

  const getMomentTypeIcon = (type: string): string => {
    if (type.includes('match-point')) return '👑';
    if (type.includes('set-point')) return '⭐';
    if (type.includes('break-point')) return '🔥';
    return '💡';
  };

  const getMomentTypeColor = (type: string): string => {
    if (type.includes('match-point')) return 'border-red-500 bg-red-500';
    if (type.includes('set-point')) return 'border-yellow-500 bg-yellow-500';
    if (type.includes('break-point')) return 'border-orange-500 bg-orange-500';
    return 'border-pixel-accent bg-pixel-accent';
  };

  const opponentIsServing = activeKeyMoment.matchContext.server === 'opponent';
  const archetypeData = ARCHETYPE_DATA[activeKeyMoment.opponentArchetype];
  const tendency = getRelevantTendency(activeKeyMoment.opponentArchetype, opponentIsServing);

  const ctx = activeKeyMoment.matchContext;
  const modifiers = KeyMomentResolver.getContextModifiers({
    momentum: ctx.momentum,
    energy: ctx.energy,
    mood: ctx.mood,
    pressure: ctx.pressure,
  });

  // ── Conditions strip: "how this moment tilts the point" ─────────────────────

  interface Condition {
    icon: string;
    label: string;
    value: string;
    helps: boolean | null; // true = green, false = red, null = neutral
  }

  const conditions: Condition[] = [];
  if (Math.abs(modifiers.momentum) >= 1) {
    const helps = modifiers.momentum > 0;
    conditions.push({
      icon: helps ? '📈' : '📉',
      label: helps ? 'Momentum with you' : 'Momentum against you',
      value: `${modifiers.momentum > 0 ? '+' : ''}${modifiers.momentum}`,
      helps,
    });
  }
  conditions.push({
    icon: '🔋',
    label: modifiers.energy <= -1 ? 'Fatigue' : 'Energy fine',
    value: `${Math.round(ctx.energy)}%`,
    helps: modifiers.energy <= -1 ? false : null,
  });
  if (Math.abs(modifiers.mood) >= 1) {
    const helps = modifiers.mood > 0;
    conditions.push({
      icon: helps ? '😊' : '😤',
      label: helps ? 'Confident' : 'Frustrated',
      value: `${modifiers.mood > 0 ? '+' : ''}${modifiers.mood}`,
      helps,
    });
  }
  if (modifiers.pressure <= -1) {
    conditions.push({
      icon: '😰',
      label: 'Big-point pressure',
      value: `${modifiers.pressure}`,
      helps: false,
    });
  }

  const net = modifiers.total;
  const netTone = net > 2 ? 'text-pixel-success' : net < -2 ? 'text-pixel-error' : 'text-pixel-text-muted';
  const netText =
    net > 2 ? 'plays in your favour' : net < -2 ? 'plays against you' : 'is roughly neutral';

  const conditionColor = (helps: boolean | null): string =>
    helps === true
      ? 'border-green-600 text-green-400 bg-green-500 bg-opacity-10'
      : helps === false
        ? 'border-red-600 text-red-400 bg-red-500 bg-opacity-10'
        : 'border-pixel-border text-pixel-text-muted';

  const conditionsStrip = (
    <div className="px-5 py-4 border-t-2 border-pixel-border">
      <div className="text-xs font-bold text-pixel-text-muted mb-3 uppercase tracking-wide">
        How this moment tilts the point
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {conditions.map((c, i) => (
          <span key={i} className={`text-sm px-2.5 py-1.5 border-2 rounded flex items-center gap-1.5 ${conditionColor(c.helps)}`}>
            <span>{c.icon}</span>
            {c.label}
            <span className="font-bold">{c.value}</span>
          </span>
        ))}
      </div>
      <div className="text-sm text-pixel-text-muted">
        Net: this point <span className={`font-bold ${netTone}`}>{netText}</span> — every tactic's odds already include it.
      </div>
    </div>
  );

  // ── Header strip (shared between phases) ─────────────────────────────────────

  const headerStrip = (
    <div className={`border-4 ${getMomentTypeColor(activeKeyMoment.type)} bg-opacity-20`}>
      <div className="px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{getMomentTypeIcon(activeKeyMoment.type)}</span>
          <h2 className="text-lg font-bold text-pixel-text">{activeKeyMoment.situation}</h2>
        </div>

        <div>
          <div className="text-sm font-bold text-pixel-text-muted mb-1 uppercase tracking-wide">
            Opponent Archetype
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-pixel-accent bg-opacity-20 border border-pixel-accent text-pixel-accent font-bold whitespace-nowrap">
              {archetypeData.label}
            </span>
          </div>
          <p className="text-sm text-pixel-text-muted italic">"{tendency}"</p>
        </div>
      </div>

      {conditionsStrip}
    </div>
  );

  // ── Toggle button to peek at the match behind the modal ─────────────────────
  const peekButton = (
    <button
      onClick={() => setIsHidden((h) => !h)}
      className="w-full py-5 border-4 border-pixel-border bg-pixel-card text-pixel-text font-bold text-lg hover:border-pixel-accent transition-colors"
    >
      {isHidden ? '⚡ Show Decision' : '👁 Peek at Match'}
    </button>
  );

  if (isHidden) {
    return (
      <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
        <button
          onClick={() => setIsHidden(false)}
          className="max-w-2xl w-full py-4 border-4 border-pixel-accent bg-pixel-card text-pixel-accent font-bold text-base hover:bg-pixel-accent hover:bg-opacity-20 transition-colors animate-pulse"
        >
          ⚡ Show Decision
        </button>
      </div>
    );
  }

  const getEffectIcon = (effect: SecondaryEffect): string => {
    switch (effect.type) {
      case 'momentum': return effect.value > 0 ? '📈' : '📉';
      case 'energy': return effect.value > 0 ? '⚡' : '🔋';
      case 'pressure': return effect.value < 0 ? '😌' : '😰';
      case 'mood': return effect.value > 0 ? '😊' : '😤';
    }
  };

  const getEffectLabel = (effect: SecondaryEffect): string => {
    const sign = effect.value > 0 ? '+' : '';
    switch (effect.type) {
      case 'momentum': return `${sign}${effect.value} Momentum`;
      case 'energy': return `${sign}${effect.value} Energy`;
      case 'pressure': return `${sign}${effect.value} Pressure`;
      case 'mood': return `${sign}${effect.value} Mood`;
    }
  };

  const getConditionLabel = (condition: SecondaryEffect['condition']): string => {
    switch (condition) {
      case 'always': return '';
      case 'on_success': return 'on win';
      case 'on_failure': return 'on loss';
    }
  };

  // ── Result phase ────────────────────────────────────────────────────────────

  if (isResultPhase && lastHistoryEntry) {
    const result = lastKeyMomentResult!;
    const chosenOption = lastHistoryEntry.chosenOption;

    const getOutcomeStyle = (outcome: KeyMomentResult['outcome']) => {
      switch (outcome) {
        case 'critical-success': return { color: 'border-yellow-500 bg-yellow-500', icon: '🌟', title: 'CRITICAL SUCCESS' };
        case 'success': return { color: 'border-green-500 bg-green-500', icon: '✅', title: 'Success' };
        case 'failure': return { color: 'border-red-500 bg-red-500', icon: '❌', title: 'Failure' };
        case 'critical-failure': return { color: 'border-red-800 bg-red-800', icon: '💥', title: 'CRITICAL FAILURE' };
      }
    };

    const style = getOutcomeStyle(result.outcome);
    const isCritical = result.outcome === 'critical-success' || result.outcome === 'critical-failure';

    const getOutcomeMessage = (): string => {
      const shot = result.shotOutcome.outcome.replace(/_/g, ' ');
      switch (result.outcome) {
        case 'critical-success': return `INCREDIBLE ${shot.toUpperCase()}! Point won.`;
        case 'success': return `${shot} — point won.`;
        case 'failure': return `${shot} — point lost.`;
        case 'critical-failure': return `DISASTER! ${shot.toUpperCase()}. Point lost.`;
        default: return result.pointWinner === 'player' ? 'Point won.' : 'Point lost.';
      }
    };

    const formatEffect = (effect: AppliedEffect): string => {
      const sign = effect.value > 0 ? '+' : '';
      switch (effect.type) {
        case 'momentum': return `${sign}${effect.value} Momentum`;
        case 'energy': return `${sign}${effect.value} Energy`;
        case 'pressure': return `${sign}${effect.value} Pressure`;
        case 'mood': return `${sign}${effect.value} Mood`;
      }
    };

    return (
      <Modal isOpen={isOpen} title="" size="xl" showCloseButton={false} belowContent={peekButton}>
        <div className="space-y-5">
          {kmResultActiveStep && (
            <TutorialCallout
              step={kmResultStep!}
              totalSteps={KM_RESULT_STEPS.length}
              title={kmResultActiveStep.title}
              body={kmResultActiveStep.body}
              onNext={kmResultNext}
              onBack={kmResultBack}
              canGoBack={kmResultCanGoBack}
            />
          )}

          {headerStrip}

          {/* Point result — spotlit on step 0 */}
          <div className={resultSectionClass('outcome')}>
            <div className={`border-4 ${style.color} bg-opacity-15 p-6 text-center`}>
              <div className="text-5xl mb-2">{style.icon}</div>
              <h3 className="text-2xl font-bold text-pixel-text">{style.title}</h3>
              <p className="text-base text-pixel-text mt-1">{getOutcomeMessage()}</p>
            </div>
          </div>

          {/* Chosen tactic + matchup feedback — spotlit on step 1 */}
          <div className={resultSectionClass('tactic')}>
            <div className="flex items-center gap-4 p-4 bg-pixel-bg border-2 border-pixel-border">
              <span className="text-3xl">{chosenOption.emoji}</span>
              <div>
                <div className="text-base font-bold text-pixel-text">{chosenOption.name}</div>
                <div className="text-sm text-pixel-text-muted">{chosenOption.description}</div>
              </div>
            </div>

            {result.isCounter && (
              <div className="text-base px-4 py-3 border-2 border-green-600 bg-green-600 bg-opacity-10 text-green-400 mt-3">
                🎯 Great read — your tactic countered their style.
              </div>
            )}
            {result.isWeakChoice && (
              <div className="text-base px-4 py-3 border-2 border-red-600 bg-red-600 bg-opacity-10 text-red-400 mt-3">
                ⚠️ Bad matchup — that tactic played into their strengths.
              </div>
            )}
          </div>

          {/* Applied effects — spotlit on step 2 */}
          {result.appliedEffects.length > 0 && (
            <div className={resultSectionClass('effects')}>
              <h4 className="text-sm font-bold text-pixel-text-muted mb-2 uppercase tracking-wide">
                Effects Applied
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.appliedEffects.map((effect, i) => (
                  <span
                    key={i}
                    className={`text-sm px-2.5 py-1 border border-pixel-border bg-pixel-bg font-bold ${
                      isBeneficial(effect) ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {formatEffect(effect)}
                    {isCritical && <span className="text-pixel-text-muted ml-1 font-normal">(2×)</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Continue — blocked while result tutorial is active */}
          <button
            onClick={kmResultTutorialActive ? undefined : hideKeyMomentResult}
            disabled={kmResultTutorialActive}
            className="w-full py-4 border-4 border-pixel-accent bg-pixel-accent bg-opacity-20 text-pixel-accent font-bold hover:bg-opacity-30 transition-colors text-base disabled:opacity-40 disabled:cursor-default disabled:hover:bg-opacity-20"
          >
            Continue →
          </button>
        </div>
      </Modal>
    );
  }

  // ── Decision phase ──────────────────────────────────────────────────────────

  const scoresFor = (option: TacticalOption): { playerScore: number; opponentScore: number } => {
    if (!matchConfig) return { playerScore: 50, opponentScore: 50 };
    return KeyMomentResolver.getWeightedScores(
      matchConfig.playerStats as PlayerStats,
      matchConfig.opponentStats as PlayerStats,
      option,
    );
  };

  // The hover modal opens for the hovered card; during the matchup tutorial step it auto-opens
  // on the first option so the walkthrough can point at it.
  const forcedOpen = kmSpotlit('options-matchup') ? 0 : null;
  // Desktop: informational preview on hover. Touch: an interactive modal opened by tap.
  const activeFlyout = isTouch ? openIdx : (forcedOpen ?? hoverIdx);
  const flyoutInteractive = isTouch && openIdx !== null;

  const RatingBlock: React.FC<{
    option: TacticalOption;
    side: 'player' | 'opponent';
    name: string;
    total: number;
  }> = ({ option, side, name, total }) => {
    const stats = (side === 'player' ? matchConfig?.playerStats : matchConfig?.opponentStats) as PlayerStats | undefined;
    const weights = side === 'player' ? option.playerStatWeights : option.opponentStatWeights;
    const tone = side === 'player' ? 'text-pixel-success' : 'text-pixel-error';
    const border = side === 'player' ? 'border-green-600' : 'border-red-600';
    const primaryVal = stats ? statValue(stats, weights.primary) : 0;
    const secondary = weights.secondary.slice(0, 2);
    return (
      <div className="flex flex-col gap-2">
        <div className={`text-xs font-bold uppercase tracking-wide ${tone}`}>{name} · rating {total}</div>
        <div className={`flex items-center justify-between px-3 py-2 border-2 ${border} bg-pixel-bg`}>
          <div>
            <div className="text-[10px] text-pixel-text-muted uppercase tracking-wide">Priority stat</div>
            <div className="text-sm font-bold text-pixel-text">{formatStatName(weights.primary)}</div>
          </div>
          <div className={`text-3xl font-bold ${tone}`}>{primaryVal}</div>
        </div>
        {secondary.map((w, i) => (
          <div key={i} className="flex justify-between text-sm text-pixel-text-muted px-1">
            <span>{formatStatName(w.stat)}</span>
            <span className="text-pixel-text">{stats ? statValue(stats, w.stat) : 0}</span>
          </div>
        ))}
      </div>
    );
  };

  const Flyout: React.FC<{
    option: TacticalOption;
    interactive?: boolean;
    onSelect?: () => void;
    onBack?: () => void;
  }> = ({ option, interactive, onSelect, onBack }) => {
    const { playerScore, opponentScore } = scoresFor(option);
    const diff = playerScore - opponentScore;
    const adv = advInfo(diff);
    const playerName = matchConfig?.playerName || 'You';
    const opponentName = matchConfig?.opponentName || 'Opponent';
    return (
      <div className={`absolute inset-0 z-10 flex flex-col bg-pixel-card rounded overflow-hidden border-2 border-pixel-accent ${interactive ? '' : 'pointer-events-none'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-y-auto">
          {/* Left — the matchup */}
          <div className="p-5 border-b-2 md:border-b-0 md:border-r-2 border-pixel-border flex flex-col gap-3">
            <div className="text-xs font-bold uppercase tracking-wide text-pixel-accent">The matchup</div>
            <div className="text-sm text-pixel-text leading-relaxed">
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500 bg-opacity-20 text-green-400 mr-2 uppercase">Good against</span>
              {option.bestAgainstHint.replace(/^Best against /i, '')}
            </div>
            <div className="text-sm text-pixel-text leading-relaxed">
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-500 bg-opacity-20 text-red-400 mr-2 uppercase">Bad against</span>
              {option.worstAgainstHint.replace(/^Weak against /i, '')}
            </div>
          </div>

          {/* Right — the ratings, with the advantage chip between the two blocks */}
          <div className="p-5 flex flex-col gap-3">
            <RatingBlock option={option} side="player" name={playerName} total={playerScore} />
            <div className="flex justify-center">
              <span
                className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded"
                style={{ backgroundColor: adv.bg, color: adv.fg }}
              >
                {adv.label}
              </span>
            </div>
            <RatingBlock option={option} side="opponent" name={opponentName} total={opponentScore} />
          </div>
        </div>

        {interactive ? (
          <div className="grid grid-cols-2 gap-2 p-3 border-t-2 border-pixel-border shrink-0">
            <button
              onClick={onBack}
              className="py-3 border-2 border-pixel-border text-pixel-text font-bold uppercase text-sm tracking-wide hover:border-pixel-accent transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={onSelect}
              className="py-3 border-2 border-pixel-accent bg-pixel-accent bg-opacity-20 text-pixel-accent font-bold uppercase text-sm tracking-wide hover:bg-opacity-30 transition-colors"
            >
              Play this tactic
            </button>
          </div>
        ) : (
          <div className="text-center text-[10px] text-pixel-text-muted pb-2 uppercase tracking-wide shrink-0">
            move the cursor off this tactic to close
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} title="" size="xl" showCloseButton={false} belowContent={peekButton}>
      <div className="space-y-5">
        {kmActiveStep && (
          <TutorialCallout
            step={kmStep!}
            totalSteps={KM_TUTORIAL_STEPS.length}
            title={kmActiveStep.title}
            body={kmActiveStep.body}
            onNext={kmNext}
            onBack={kmBack}
            canGoBack={kmCanGoBack}
            finalLabel="Got It — Let Me Choose"
          />
        )}

        {/* Header strip + conditions — spotlit on step 0 */}
        <div className={kmSectionClass('header')}>{headerStrip}</div>

        {/* Tactical Options */}
        <div
          className={
            kmSpotlit('options-matchup') || kmSpotlit('options-effects')
              ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-black transition-all duration-200'
              : ''
          }
        >
          <h3 className="text-base font-bold text-pixel-text mb-4">⚔️ Choose Your Tactic</h3>
          <div className="relative" onMouseLeave={() => setHoverIdx(null)}>
            <div className="space-y-3">
              {activeKeyMoment.options.map((option, index) => {
                const { playerScore, opponentScore } = scoresFor(option);
                const adv = advInfo(playerScore - opponentScore);
                return (
                  <button
                    key={index}
                    onMouseEnter={() => setHoverIdx(index)}
                    onFocus={() => setHoverIdx(index)}
                    onClick={() => {
                      if (kmTutorialActive) return;
                      // Touch: open the detail modal (explicit confirm). Desktop: commit directly.
                      if (isTouch) setOpenIdx(index);
                      else handleKeyMomentChoice(option);
                    }}
                    disabled={kmTutorialActive}
                    className="w-full text-left p-4 border-4 border-pixel-border bg-pixel-card hover:border-pixel-accent transition-all disabled:cursor-default disabled:hover:border-pixel-border"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{option.emoji}</span>
                        <h4 className="text-base font-bold text-pixel-text">{option.name}</h4>
                      </div>
                      <span
                        className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded whitespace-nowrap"
                        style={{ backgroundColor: adv.bg, color: adv.fg }}
                      >
                        {adv.label}
                      </span>
                    </div>

                    <p className="text-sm text-pixel-text-muted mb-3">{option.description}</p>

                    <div className="border-t border-pixel-border pt-2 flex flex-wrap gap-2">
                      {option.secondaryEffects.map((effect, i) => {
                        const condLabel = getConditionLabel(effect.condition);
                        return (
                          <span
                            key={i}
                            className={`text-sm px-2 py-0.5 border border-pixel-border bg-pixel-bg ${
                              isBeneficial(effect) ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {getEffectIcon(effect)} {getEffectLabel(effect)}
                            {condLabel && <span className="text-pixel-text-muted ml-1">({condLabel})</span>}
                          </span>
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>

            {activeFlyout !== null && activeKeyMoment.options[activeFlyout] && (
              <Flyout
                option={activeKeyMoment.options[activeFlyout]}
                interactive={flyoutInteractive}
                onSelect={() => (kmTutorialActive ? undefined : handleKeyMomentChoice(activeKeyMoment.options[activeFlyout]))}
                onBack={() => setOpenIdx(null)}
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
