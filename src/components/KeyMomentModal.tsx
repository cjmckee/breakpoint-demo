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
import type { KeyMomentRisk } from '../data/tacticalOptions';
import { ARCHETYPE_DATA, getRelevantTendency } from '../data/archetypes';
import { POSTURE_META, getMatchup } from '../data/postures';
import { KeyMomentResolver, KeyMomentResult, AppliedEffect } from '../game/KeyMomentResolver';
import { MatchOrchestrator } from '../game/MatchOrchestrator';
import { useMatchStore } from '../stores/matchStore';
import { PlayerStats } from '../types/game';
import { useTutorialSpotlight } from '../hooks/useTutorialSpotlight';
import { TutorialCallout } from './tutorial/TutorialCallout';
import { KM_TUTORIAL_STEPS, KM_RESULT_STEPS, KmTarget, KmResultTarget } from '../data/tutorialSteps';
import { formatStatName } from '../config/statIcons';
import { KEY_MOMENT } from '../config/shotThresholds';

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

/**
 * Short chip label for a stat: initials for multi-word keys ('shotVariety' → 'SV'),
 * first three letters otherwise ('serve' → 'SER'). Full name goes in the chip's title.
 */
const abbrevStat = (name: string): string => {
  const words = name.replace(/([A-Z])/g, ' $1').trim().split(/\s+/);
  return words.length > 1
    ? words.map((w) => w[0]).join('').toUpperCase()
    : name.slice(0, 3).toUpperCase();
};

/**
 * Stat chip label + colour, from the weighted stat differential alone.
 *
 * Deliberately NOT the full success probability. Folding the posture matchup in
 * turns the card into an answer key — measured, "take the highest verdict" beat
 * every other policy and tied even a resource-aware version of itself, so the
 * chip was solving the point rather than informing it. The matchup reaches the
 * player as prose instead ("retrievers who sit back"), which has to be mapped
 * onto the opponent in the header. That mapping is the skill.
 *
 * Labelled "Stats" so it cannot be misread as an overall verdict.
 *
 * Thresholds live in KEY_MOMENT so the wording tracks the measured spread rather
 * than a guess — see statChipThreshold for what the gap actually looks like.
 */
const statChipInfo = (diff: number): { label: string; bg: string; fg: string } => {
  const t = KEY_MOMENT.statChipThreshold;
  const label = diff > t ? 'Stats favour you' : diff < -t ? 'Stats favour them' : 'Stats even';
  const mag = Math.min(1, Math.abs(diff) / KEY_MOMENT.statChipFullScale);
  const hue = diff >= 0 ? lerp(50, 130, mag) : lerp(50, 2, mag);
  const sat = lerp(85, diff >= 0 ? 62 : 68, mag);
  const light = lerp(52, diff >= 0 ? 30 : 33, mag);
  return {
    label,
    bg: `hsl(${hue.toFixed(0)}, ${sat.toFixed(0)}%, ${light.toFixed(0)}%)`,
    fg: light < 46 ? '#ffffff' : '#2a1c02',
  };
};

/**
 * Risk indicator, from the risk tag alone.
 *
 * Names the tag rather than inventing a synonym for it — a player who reads "Bold"
 * on a card and "bold" in a tooltip is learning one word, not three. An
 * outcome-spread bar would have leaked the success probability (the split between
 * its halves *is* the win chance), so this reports only how emphatic the option
 * tends to be, in either direction.
 */
const RISK_META: Record<KeyMomentRisk, { label: string; pips: number; tone: string }> = {
  safe: { label: 'Safe', pips: 1, tone: 'text-green-400' },
  balanced: { label: 'Balanced', pips: 2, tone: 'text-yellow-400' },
  bold: { label: 'Bold', pips: 3, tone: 'text-red-400' },
};

const RiskIndicator: React.FC<{ risk: KeyMomentRisk }> = ({ risk }) => {
  const meta = RISK_META[risk];
  return (
    <span
      className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${meta.tone}`}
      title={`${meta.label} — how big the swing is either way, not how likely it is to work`}
    >
      <span className="tracking-tighter">
        {'\u25c6'.repeat(meta.pips)}
        <span className="opacity-25">{'\u25c6'.repeat(3 - meta.pips)}</span>
      </span>
      {meta.label}
    </span>
  );
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
  // Which tactic's detail is shown in the right pane. Persists so options are easy to compare
  // side by side; hover (desktop) or tap (touch) moves focus, an explicit button commits.
  const [focusIdx, setFocusIdx] = useState(0);
  const [hoveredCondition, setHoveredCondition] = useState<number | null>(null);

  // Reset focus when the modal opens or a new key moment arrives.
  useEffect(() => { setFocusIdx(0); }, [isOpen, keyMoment?.id]);

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
  // Focus and ability effects both feed the pressure term, so the strip has to
  // read them the same way the resolver does or the displayed odds drift.
  const playerFocus = matchConfig
    ? statValue(matchConfig.playerStats as PlayerStats, 'focus')
    : 50;
  const playerEffects = MatchOrchestrator.extractActiveEffects(
    matchConfig?.playerAbilities,
    matchConfig?.playerArchetypeProfile,
  );
  const modifiers = KeyMomentResolver.getContextModifiers(
    {
      momentum: ctx.momentum,
      energy: ctx.energy,
      mood: ctx.mood,
      pressure: ctx.pressure,
    },
    playerFocus,
    playerEffects,
  );

  // ── Conditions strip: "how this moment tilts the point" ─────────────────────

  interface Condition {
    icon: string;
    label: string;
    value: string;
    helps: boolean | null; // true = green, false = red, null = neutral
    modifier: number; // raw % modifier from getContextModifiers
    tooltip: string; // hover explanation
  }

  const conditions: Condition[] = [];
  if (Math.abs(modifiers.momentum) >= 1) {
    const helps = modifiers.momentum > 0;
    const sign = modifiers.momentum > 0 ? '+' : '';
    conditions.push({
      icon: helps ? '📈' : '📉',
      label: helps ? 'Momentum with you' : 'Momentum against you',
      value: `${sign}${modifiers.momentum}`,
      helps,
      modifier: modifiers.momentum,
      tooltip: `${sign}${modifiers.momentum}% from momentum`,
    });
  }
  conditions.push({
    icon: modifiers.energy >= 1 ? '⚡' : '🔋',
    label: modifiers.energy >= 1 ? 'Fresh legs' : 'Energy',
    value: `${Math.round(ctx.energy)}%`,
    helps: modifiers.energy >= 1 ? true : modifiers.energy <= -1 ? false : null,
    modifier: modifiers.energy,
    tooltip: Math.abs(modifiers.energy) >= 1
      ? `${modifiers.energy > 0 ? '+' : ''}${modifiers.energy}% from energy`
      : 'Energy is not a factor here',
  });
  if (Math.abs(modifiers.mood) >= 1) {
    const helps = modifiers.mood > 0;
    const sign = modifiers.mood > 0 ? '+' : '';
    conditions.push({
      icon: helps ? '😊' : '😤',
      label: helps ? 'Confident' : 'Frustrated',
      value: `${sign}${modifiers.mood}`,
      helps,
      modifier: modifiers.mood,
      tooltip: `${sign}${modifiers.mood}% from mood`,
    });
  }
  // Pressure is scored against focus: a composed player gains on the big points,
  // a fragile one loses. Both directions are worth showing.
  if (Math.abs(modifiers.pressure) >= 1) {
    const helps = modifiers.pressure > 0;
    const sign = helps ? '+' : '';
    conditions.push({
      icon: helps ? '🧊' : '😰',
      label: helps ? 'Ice in the veins' : 'Big-point pressure',
      value: `${sign}${modifiers.pressure}`,
      helps,
      modifier: modifiers.pressure,
      tooltip: helps
        ? `+${modifiers.pressure}% — your focus is above the pressure of this moment`
        : `${modifiers.pressure}% — this moment's pressure is above your focus`,
    });
  }

  const net = modifiers.total;
  const netTone = net > 2 ? 'text-pixel-success' : net < -2 ? 'text-pixel-error' : 'text-pixel-text-muted';

  const conditionColor = (helps: boolean | null): string =>
    helps === true
      ? 'border-green-600 text-green-400 bg-green-500 bg-opacity-10'
      : helps === false
        ? 'border-red-600 text-red-400 bg-red-500 bg-opacity-10'
        : 'border-pixel-border text-pixel-text-muted';

  const conditionsStrip = (
    <div className="px-5 py-4 border-t-2 border-pixel-border">
      <div className="flex flex-wrap gap-2 mb-3 relative">
        {conditions.map((c, i) => (
          <span
            key={i}
            className={`text-sm px-2.5 py-1.5 border-2 rounded flex items-center gap-1.5 cursor-help relative ${conditionColor(c.helps)}`}
            onMouseEnter={() => setHoveredCondition(i)}
            onMouseLeave={() => setHoveredCondition(null)}
          >
            <span>{c.icon}</span>
            {c.label}
            <span className="font-bold">{c.value}</span>
            {hoveredCondition === i && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-sm font-normal whitespace-nowrap bg-pixel-card border-2 border-pixel-border text-pixel-text rounded shadow-lg z-20 pointer-events-none">
                {c.tooltip}
                <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-pixel-border" />
              </span>
            )}
          </span>
        ))}
      </div>
      <div className={`text-xs font-bold ${netTone}`}>
        Overall effects: {net > 0 ? '+' : ''}{Math.round(net)}%
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

            {/* The choice is graded separately from the point, and graded on the
                POSTURE rather than the tactic. The lesson that transfers is "net
                play beats a retriever", not "that particular volley worked" — the
                player will never see this exact option again, but they will see
                the posture in every menu for the rest of their career. */}
            <div
              className="border-2 border-t-0 px-4 py-3 text-center text-sm"
              style={{
                borderColor: POSTURE_META[chosenOption.posture].color,
                backgroundColor: `${POSTURE_META[chosenOption.posture].color}1a`,
              }}
            >
              <span
                className="font-bold uppercase tracking-wider"
                style={{ color: POSTURE_META[chosenOption.posture].color }}
              >
                {POSTURE_META[chosenOption.posture].label}
              </span>
              <span className="text-pixel-text ml-2">
                {result.isCounter
                  ? `is strong against this kind of player.${
                      result.pointWinner === 'player' ? '' : ' The read was right — the ball was not.'
                    }`
                  : result.isWeakChoice
                    ? `plays into this kind of player.${
                        result.pointWinner === 'player' ? ' You got away with it.' : ''
                      }`
                    : 'is neither strong nor weak against this kind of player — that one came down to your stats and the conditions.'}
              </span>
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

          </div>

          {/* Applied effects — spotlit on step 2 */}
          {result.appliedEffects.length > 0 && (() => {
            // Calculate opponent energy drain (mirrors MatchOrchestrator logic)
            const energySpent = result.pointWinner === 'player'
              ? Math.abs(
                  chosenOption.secondaryEffects
                    .filter(e => e.type === 'energy' && e.value < 0)
                    .reduce((sum, e) => sum + e.value, 0)
                )
              : 0;
            const opponentDrain = energySpent * (isCritical ? 2 : 1);

            return (
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
                  {opponentDrain > 0 && (
                    <span className="text-sm px-2.5 py-1 border border-pixel-border bg-pixel-bg font-bold text-red-400">
                      −{opponentDrain} Opponent Energy
                      {isCritical && <span className="text-pixel-text-muted ml-1 font-normal">(2×)</span>}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

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

  // During the matchup/effects tutorial steps, force focus to the first option so the
  // walkthrough always points at populated detail.
  const forcedFocus = kmSpotlit('options-matchup') || kmSpotlit('options-effects') ? 0 : null;
  const activeIdx = forcedFocus ?? focusIdx;
  const activeOption = activeKeyMoment.options[activeIdx];

  // One row of grid cells for a card: composite (the value actually compared) leads, then the
  // priority stat (coloured by side to flag its weight) and supporting stats. Rendered as a
  // fragment so both sides share the parent grid's columns and their chips line up.
  const CardStatLine: React.FC<{
    option: TacticalOption;
    side: 'player' | 'opponent';
    composite: number;
  }> = ({ option, side, composite }) => {
    const stats = (side === 'player' ? matchConfig?.playerStats : matchConfig?.opponentStats) as PlayerStats | undefined;
    const weights = side === 'player' ? option.playerStatWeights : option.opponentStatWeights;
    const tone = side === 'player' ? 'text-pixel-success' : 'text-pixel-error';
    const label = side === 'player' ? 'You' : 'Opp';
    const primaryVal = stats ? statValue(stats, weights.primary) : 0;
    // Always two secondary slots so both rows fill the same columns (empty cell if a side has one).
    const secCells = [weights.secondary[0], weights.secondary[1]];
    return (
      <>
        <span className={`text-base font-bold tabular-nums ${tone}`}>{composite}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wide ${tone}`}>{label}</span>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded bg-pixel-bg whitespace-nowrap text-center ${tone}`}
          title={`${formatStatName(weights.primary)} — priority stat (weighted most)`}
        >
          ★ {abbrevStat(weights.primary)} {primaryVal}
        </span>
        {secCells.map((w, i) =>
          w ? (
            <span
              key={i}
              className="text-[10px] px-2 py-1 rounded bg-pixel-bg text-pixel-text-muted whitespace-nowrap text-center"
              title={formatStatName(w.stat)}
            >
              {abbrevStat(w.stat)} <span className="text-pixel-text">{stats ? statValue(stats, w.stat) : 0}</span>
            </span>
          ) : (
            <span key={i} />
          )
        )}
      </>
    );
  };

  // Right pane: the qualitative read on the focused tactic (matchup + effects) + commit button.
  const DetailPane: React.FC<{ option: TacticalOption }> = ({ option }) => (
    // The whole panel takes the posture's colour, not just its banner — the frame
    // around the option you are about to commit to is the strongest available cue
    // for "this is a net play", and it costs no space at all.
    <div
      className="flex flex-col border-2 rounded bg-pixel-card overflow-hidden"
      style={{ borderColor: POSTURE_META[option.posture].color }}
    >
      {/* Posture banner — the kind of play this is, and the thing the opponent's
          style is actually strong or weak against. Given its own band, in its own
          colour, because "which of the six is this" is the decision underneath the
          decision: a player who learns the colours has learned the matchup.
          Label and risk share the top line; the summary gets its own so it is not
          competing for width and truncating. */}
      <div
        className="px-3 py-2 border-b-2"
        style={{
          backgroundColor: `${POSTURE_META[option.posture].color}22`,
          borderColor: POSTURE_META[option.posture].color,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: POSTURE_META[option.posture].color }}
          >
            {POSTURE_META[option.posture].label}
          </span>
          <span className="ml-auto shrink-0">
            <RiskIndicator risk={option.risk} />
          </span>
        </div>
        <p className="text-xs text-pixel-text-muted leading-snug mt-0.5">
          {POSTURE_META[option.posture].summary}
        </p>
      </div>

      {/* Tactic header */}
      <div className="p-3 border-b-2 border-pixel-border">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-lg">{option.emoji}</span>
          <h4 className="text-base font-bold text-pixel-text">{option.name}</h4>
        </div>
        <p className="text-sm text-pixel-text-muted leading-snug">{option.description}</p>
      </div>

      {/* Matchup */}
      <div className="p-3 border-b-2 border-pixel-border flex flex-col gap-2">
        <div className="text-sm text-pixel-text leading-relaxed">
          <span className="text-xs px-1.5 py-0.5 rounded bg-green-500 bg-opacity-20 text-green-400 mr-2 uppercase">Good against</span>
          {POSTURE_META[option.posture].bestAgainstHint}
        </div>
        <div className="text-sm text-pixel-text leading-relaxed">
          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500 bg-opacity-20 text-red-400 mr-2 uppercase">Bad against</span>
          {POSTURE_META[option.posture].worstAgainstHint}
        </div>
      </div>

      {/* Secondary effects — spotlit on the effects tutorial step */}
      <div className={`p-3 ${kmSpotlit('options-effects') ? 'ring-4 ring-yellow-400 ring-inset' : ''}`}>
        <div className="text-[10px] font-bold text-pixel-text-muted uppercase tracking-wide mb-1.5">Effects (win or loss)</div>
        <div className="flex flex-wrap gap-1.5">
          {option.secondaryEffects.map((effect, i) => {
            const condLabel = getConditionLabel(effect.condition);
            return (
              <span
                key={i}
                className={`text-xs px-1.5 py-0.5 border border-pixel-border bg-pixel-bg ${
                  isBeneficial(effect) ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {getEffectIcon(effect)} {getEffectLabel(effect)}
                {condLabel && <span className="text-pixel-text-muted ml-1">({condLabel})</span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* Commit — pushed to the bottom so the pane fills the column height cleanly.
          Takes the posture's colour along with the frame; left on the app accent it
          read as an error state inside a green or blue panel. Size and position
          still carry "this is the primary action". */}
      <button
        onClick={() => (kmTutorialActive ? undefined : handleKeyMomentChoice(option))}
        disabled={kmTutorialActive}
        style={{
          borderColor: POSTURE_META[option.posture].color,
          color: POSTURE_META[option.posture].color,
          backgroundColor: `${POSTURE_META[option.posture].color}33`,
        }}
        className="mt-auto mx-3 mb-3 py-3 border-4 font-bold uppercase text-sm tracking-wide hover:brightness-125 transition-all disabled:opacity-40 disabled:cursor-default flex items-center justify-center gap-2 leading-none"
      >
        <span className="text-2xl leading-none relative -top-1">{option.emoji}</span>
        <span className="leading-none">Go!</span>
        {/* SVG triangle instead of a Unicode arrow — renders crisply regardless of the pixel font */}
        <svg viewBox="0 0 8 10" aria-hidden="true" className="w-2.5 h-2.5 fill-current shrink-0">
          <path d="M0 0 L8 5 L0 10 Z" />
        </svg>
      </button>
    </div>
  );

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
            finalLabel="Got it!"
          />
        )}

        {/* Header strip + conditions — spotlit on step 0 */}
        <div className={kmSectionClass('header')}>{headerStrip}</div>

        {/* Tactical Options — compact list (left) for at-a-glance comparison, detail pane (right) */}
        <div>
          <h3 className="text-base font-bold text-pixel-text mb-1">⚔️ Choose Your Tactic</h3>
          <p className="text-xs text-pixel-text-muted mb-4">Hover a tactic to inspect it — commit with the button in the panel.</p>
          <div
            className={`grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 ${
              kmSpotlit('options-matchup') ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-black rounded transition-all duration-200' : ''
            }`}
          >
            {/* Left: option cards — each carries its own composite + driving stats for comparison */}
            <div className="flex flex-col gap-2.5">
              {activeKeyMoment.options.map((option, index) => {
                const { playerScore, opponentScore } = scoresFor(option);
                const adv = statChipInfo(playerScore - opponentScore);
                const isActive = index === activeIdx;
                return (
                  <button
                    key={index}
                    onMouseEnter={() => setFocusIdx(index)}
                    onFocus={() => setFocusIdx(index)}
                    onClick={() => setFocusIdx(index)}
                    className={`w-full text-left p-3 border-4 bg-pixel-card transition-all ${
                      isActive ? 'border-pixel-accent' : 'border-pixel-border hover:border-pixel-accent hover:border-opacity-50'
                    }`}
                  >
                    {/* Row 1: the tactic, full width — names are long and were truncating. */}
                    <div className="flex items-center gap-2 mb-1.5 min-w-0">
                      <span className="text-xl shrink-0">{option.emoji}</span>
                      <h4 className="text-base font-bold text-pixel-text truncate">{option.name}</h4>
                    </div>
                    {/* Row 2: what kind of play it is (posture + risk), then the stat read. */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          color: POSTURE_META[option.posture].color,
                          border: `1px solid ${POSTURE_META[option.posture].color}`,
                        }}
                      >
                        {POSTURE_META[option.posture].label}
                      </span>
                      <RiskIndicator risk={option.risk} />
                      <span
                        className="ml-auto text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded whitespace-nowrap shrink-0"
                        style={{ backgroundColor: adv.bg, color: adv.fg }}
                      >
                        {adv.label}
                      </span>
                    </div>
                    {/* Composites + the stats that drive them, per side. Grid so the You/Opp rows
                        share columns and the chips line up regardless of abbreviation length. */}
                    <div className="grid grid-cols-[auto_auto_auto_auto_auto] gap-x-3 gap-y-2 items-center justify-items-start border-t border-pixel-border pt-2.5">
                      <CardStatLine option={option} side="player" composite={playerScore} />
                      <CardStatLine option={option} side="opponent" composite={opponentScore} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: detail pane for the focused tactic */}
            {activeOption && <DetailPane option={activeOption} />}
          </div>
        </div>
      </div>
    </Modal>
  );
};
