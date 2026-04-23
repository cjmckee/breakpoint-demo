/**
 * Key Moment Modal Component
 * Two-phase: decision (pick a tactic) → result (see what happened).
 * The modal stays open through both phases; the result requires explicit Continue.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './ui/Modal';
import { KeyMoment } from '../types/keyMoments';
import { TacticalOption, SecondaryEffect } from '../data/tacticalOptions';
import { ARCHETYPE_DATA, getRelevantTendency } from '../data/archetypes';
import { KeyMomentResolver, KeyMomentResult, AppliedEffect } from '../game/KeyMomentResolver';
import { useMatchStore } from '../stores/matchStore';
import { PlayerStats } from '../types/game';

// ─── Key moment inline spotlight steps ────────────────────────────────────────
type KmTarget = 'header' | 'options-matchup' | 'options-effects';
type KmResultTarget = 'outcome' | 'tactic' | 'effects';

interface KmTutorialStep {
  target: KmTarget;
  title: string;
  body: string;
}

interface KmResultTutorialStep {
  target: KmResultTarget;
  title: string;
  body: string;
}

const KM_TUTORIAL_STEPS: KmTutorialStep[] = [
  {
    target: 'header',
    title: 'The Situation',
    body: 'This shows the type of key moment, your opponent\'s playing style, and current conditions like momentum and energy that affect your odds. Always consider your opponent\'s archetype and attack their weakness!',
  },
  {
    target: 'options-matchup',
    title: 'Matchup Indicator',
    body: '"you X ← Y them" shows your weighted stats vs. theirs for this tactic — ← means you have the edge, → means they do. Each option uses different stats, so the matchup shifts per choice!',
  },
  {
    target: 'options-effects',
    title: 'Secondary Effects',
    body: 'Each tactic carries bonuses that apply win or loss — momentum swings, energy shifts, mood changes. Pick the tactic that best counters their style, but nothing is guaranteed!',
  }
];

const KM_RESULT_STEPS: KmResultTutorialStep[] = [
  {
    target: 'outcome',
    title: 'The Result',
    body: 'Win or lose the point is shown here. Critical outcomes (🌟 / 💥) mean your tactic landed perfectly — or backfired spectacularly. You can pick the right option and still lose! That\'s tennis, baby.',
  },
  {
    target: 'tactic',
    title: 'Matchup Indicator',
    body: 'Your chosen tactic is shown here along with whether it countered their style (🎯) or played into their strengths (⚠️). Countering improves your odds; a weak matchup hurts them — even if the point went the other way.',
  },
  {
    target: 'effects',
    title: 'Effects Applied',
    body: 'Win or lose, your tactic\'s secondary effects still apply — momentum swings, energy changes, mood and pressure shifts carry into the rest of the match. Critical success and critical failure double the effects!',
  },
];

const formatStatScore = (score: number): string => score.toFixed(0);

const getMatchupArrow = (playerScore: number, opponentScore: number): { arrow: string; color: string } => {
  const diff = playerScore - opponentScore;
  // Arrow points toward the higher rating (green toward player advantage, red toward opponent advantage)
  if (diff > 3) return { arrow: '←', color: 'text-green-500' }; // Player higher, arrow points left toward player
  if (diff < -3) return { arrow: '→', color: 'text-red-500' };   // Opponent higher, arrow points right toward opponent
  return { arrow: '═', color: 'text-yellow-500' };
};

interface KeyMomentModalProps {
  isOpen: boolean;
  keyMoment: KeyMoment | null;
}

export const KeyMomentModal: React.FC<KeyMomentModalProps> = ({ isOpen, keyMoment }) => {
  const [isHidden, setIsHidden] = useState(false);
  // Spotlight tutorial for the first key moment decision phase
  const [kmTutorialStep, setKmTutorialStep] = useState<number | null>(null);
  const kmTutorialShownRef = useRef(false);

  // Spotlight tutorial for the first key moment result phase
  const [kmResultStep, setKmResultStep] = useState<number | null>(null);
  const kmResultShownRef = useRef(false);
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

  // Auto-open the decision spotlight on the very first key moment of a tutorial match
  useEffect(() => {
    if (
      isOpen &&
      !isResultPhase &&
      matchConfig?.isTutorial &&
      keyMomentHistory.length === 0 &&
      !kmTutorialShownRef.current
    ) {
      kmTutorialShownRef.current = true;
      setKmTutorialStep(0);
    }
  }, [isOpen, isResultPhase, matchConfig?.isTutorial, keyMomentHistory.length]);

  // Auto-open the result spotlight on the first result screen of a tutorial match
  useEffect(() => {
    if (
      isOpen &&
      isResultPhase &&
      matchConfig?.isTutorial &&
      !kmResultShownRef.current
    ) {
      kmResultShownRef.current = true;
      setKmResultStep(0);
    }
  }, [isOpen, isResultPhase, matchConfig?.isTutorial]);

  const handleKmTutorialNext = () => {
    if (kmTutorialStep === null) return;
    if (kmTutorialStep < KM_TUTORIAL_STEPS.length - 1) {
      setKmTutorialStep(kmTutorialStep + 1);
    } else {
      setKmTutorialStep(null);
    }
  };

  const handleKmResultNext = () => {
    if (kmResultStep === null) return;
    if (kmResultStep < KM_RESULT_STEPS.length - 1) {
      setKmResultStep(kmResultStep + 1);
    } else {
      setKmResultStep(null);
    }
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

  // Condition icons with tooltip text
  const ctx = activeKeyMoment.matchContext;
  const modifiers = KeyMomentResolver.getContextModifiers({
    momentum: ctx.momentum,
    energy: ctx.energy,
    mood: ctx.mood,
    pressure: ctx.pressure,
  });

  const conditionIcons: Array<{ icon: string; tooltip: string; positive: boolean }> = [];
  if (Math.abs(modifiers.momentum) >= 1) {
    const positive = modifiers.momentum > 0;
    conditionIcons.push({
      icon: positive ? '📈' : '📉',
      tooltip: positive
        ? 'Momentum with you — riding a hot streak'
        : 'Momentum against you — opponent is on a run',
      positive,
    });
  }
  if (modifiers.energy <= -1) {
    conditionIcons.push({
      icon: '🔋',
      tooltip: `Energy at ${Math.round(ctx.energy)}% — fatigue is a factor`,
      positive: false,
    });
  }
  if (Math.abs(modifiers.mood) >= 1) {
    const positive = modifiers.mood > 0;
    conditionIcons.push({
      icon: positive ? '😊' : '😤',
      tooltip: positive
        ? 'Positive mood — feeling confident out there'
        : 'Frustrated — letting emotions creep in',
      positive,
    });
  }
  if (modifiers.pressure <= -2) {
    conditionIcons.push({
      icon: '😰',
      tooltip:
        modifiers.pressure <= -5
          ? 'High pressure — nerves are a major factor'
          : 'Feeling the pressure — big point nerves',
      positive: false,
    });
  }

  // ── Compact header strip (shared between phases) ────────────────────────────

  const headerStrip = (
    <div className={`border-4 ${getMomentTypeColor(activeKeyMoment.type)} bg-opacity-20 px-5 py-4`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{getMomentTypeIcon(activeKeyMoment.type)}</span>
        <h2 className="text-lg font-bold text-pixel-text">{activeKeyMoment.situation}</h2>
      </div>

      {/* Opponent Info */}
      <div className="mb-3">
        <div className="text-sm font-bold text-pixel-text-muted mb-1 uppercase tracking-wide">
          Opponent Archetype
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-pixel-accent bg-opacity-20 border border-pixel-accent text-pixel-accent font-bold whitespace-nowrap">
            {archetypeData.label}
          </span>
        </div>
        <p className="text-sm text-pixel-text-muted italic">
          "{tendency}"
        </p>
      </div>

      <div className="border-t border-pixel-border my-3" />

      {/* Modifiers */}
      <div className="flex flex-wrap items-center gap-3">
        {modifiers.momentum !== 0 && (
          <span className={`text-sm px-2 py-1 border ${modifiers.momentum > 0 ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'} bg-opacity-20 font-bold`}>
            {modifiers.momentum > 0 ? '📈' : '📉'} Momentum: {modifiers.momentum > 0 ? '+' : ''}{modifiers.momentum}
          </span>
        )}
        <span className="text-sm px-2 py-1 border border-pixel-border text-pixel-text bg-opacity-20 font-bold">
          🔋 Energy: {Math.round(ctx.energy)}%
        </span>
        {modifiers.mood !== 0 && (
          <span className={`text-sm px-2 py-1 border ${modifiers.mood > 0 ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'} bg-opacity-20 font-bold`}>
            {modifiers.mood > 0 ? '😊' : '😤'} Mood: {modifiers.mood > 0 ? '+' : ''}{modifiers.mood}
          </span>
        )}
        {modifiers.pressure !== 0 && (
          <span className="text-sm px-2 py-1 border border-red-500 text-red-500 bg-opacity-20 font-bold">
            😰 Pressure: {modifiers.pressure}
          </span>
        )}
      </div>
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

  // ── Result phase ────────────────────────────────────────────────────────────

  if (isResultPhase && lastHistoryEntry) {
    const result = lastKeyMomentResult!;
    const chosenOption = lastHistoryEntry.chosenOption;

    const getOutcomeStyle = (outcome: KeyMomentResult['outcome']) => {
      switch (outcome) {
        case 'critical-success': return { color: 'border-yellow-500 bg-yellow-500', icon: '🌟', title: 'CRITICAL SUCCESS' };
        case 'success':          return { color: 'border-green-500 bg-green-500',   icon: '✅', title: 'Success' };
        case 'failure':          return { color: 'border-red-500 bg-red-500',       icon: '❌', title: 'Failure' };
        case 'critical-failure': return { color: 'border-red-800 bg-red-800',       icon: '💥', title: 'CRITICAL FAILURE' };
      }
    };

    const style = getOutcomeStyle(result.outcome);
    const isCritical = result.outcome === 'critical-success' || result.outcome === 'critical-failure';

    const getOutcomeMessage = (): string => {
      const shot = result.shotOutcome.outcome.replace(/_/g, ' ');
      switch (result.outcome) {
        case 'critical-success': return `INCREDIBLE ${shot.toUpperCase()}! Point won.`;
        case 'success':          return `${shot} — point won.`;
        case 'failure':          return `${shot} — point lost.`;
        case 'critical-failure': return `DISASTER! ${shot.toUpperCase()}. Point lost.`;
        default: return result.pointWinner === 'player' ? 'Point won.' : 'Point lost.';
      }
    };

    const formatEffect = (effect: AppliedEffect): string => {
      const sign = effect.value > 0 ? '+' : '';
      switch (effect.type) {
        case 'momentum': return `${sign}${effect.value} Momentum`;
        case 'energy':   return `${sign}${effect.value} Energy`;
        case 'pressure': return `${sign}${effect.value} Pressure`;
        case 'mood':     return `${sign}${effect.value} Mood`;
      }
    };

    // Spotlight helpers for the result phase
    const activeResultStep = kmResultStep !== null ? KM_RESULT_STEPS[kmResultStep] : null;
    const resultSpotlit = (t: KmResultTarget) => activeResultStep?.target === t;
    const resultDimmed  = (t: KmResultTarget) => activeResultStep !== null && !resultSpotlit(t);
    const resultSectionClass = (t: KmResultTarget) => {
      if (resultSpotlit(t)) return 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-black transition-all duration-200';
      if (resultDimmed(t))  return 'opacity-25 transition-all duration-200';
      return '';
    };

    return (
      <Modal isOpen={isOpen} title="" size="xl" showCloseButton={false} belowContent={peekButton}>
        <div className="space-y-5">
          {/* ── Result spotlight callout ───────────────────────────────────────── */}
          {activeResultStep && (
            <div className="border-4 border-yellow-400 bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-yellow-400 tracking-widest uppercase">
                  Tutorial — Step {(kmResultStep ?? 0) + 1} / {KM_RESULT_STEPS.length}
                </span>
                <div className="flex gap-1">
                  {KM_RESULT_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i === kmResultStep ? 'bg-yellow-400' : 'bg-gray-600'}`}
                    />
                  ))}
                </div>
              </div>
              <h3 className="text-base font-bold text-yellow-300 mb-1">{activeResultStep.title}</h3>
              <p className="text-sm text-gray-200 leading-relaxed mb-3">{activeResultStep.body}</p>
              <button
                onClick={handleKmResultNext}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 px-4 text-sm tracking-wide transition-colors"
              >
                {kmResultStep === KM_RESULT_STEPS.length - 1 ? 'Got It' : 'Next'}
              </button>
            </div>
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
                      effect.value > 0 ? 'text-green-400' : 'text-red-400'
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
            onClick={kmResultStep === null ? hideKeyMomentResult : undefined}
            disabled={kmResultStep !== null}
            className="w-full py-4 border-4 border-pixel-accent bg-pixel-accent bg-opacity-20 text-pixel-accent font-bold hover:bg-opacity-30 transition-colors text-base disabled:opacity-40 disabled:cursor-default disabled:hover:bg-opacity-20"
          >
            Continue →
          </button>
        </div>
      </Modal>
    );
  }

  // ── Decision phase ──────────────────────────────────────────────────────────

  const getMatchupIndicator = (option: TacticalOption): { playerScore: number; opponentScore: number; arrow: string; color: string } => {
    if (!matchConfig) return { playerScore: 50, opponentScore: 50, arrow: '═', color: 'text-yellow-500' };
    const scores = KeyMomentResolver.getWeightedScores(
      matchConfig.playerStats as PlayerStats,
      matchConfig.opponentStats as PlayerStats,
      option
    );
    const { arrow, color } = getMatchupArrow(scores.playerScore, scores.opponentScore);
    return { ...scores, arrow, color };
  };

  const getEffectIcon = (effect: SecondaryEffect): string => {
    switch (effect.type) {
      case 'momentum': return effect.value > 0 ? '📈' : '📉';
      case 'energy':   return effect.value > 0 ? '⚡' : '🔋';
      case 'pressure': return '😰';
      case 'mood':     return effect.value > 0 ? '😊' : '😤';
    }
  };

  const getEffectLabel = (effect: SecondaryEffect): string => {
    const sign = effect.value > 0 ? '+' : '';
    switch (effect.type) {
      case 'momentum': return `${sign}${effect.value} Momentum`;
      case 'energy':   return `${sign}${effect.value} Energy`;
      case 'pressure': return `${sign}${effect.value} Pressure`;
      case 'mood':     return `${sign}${effect.value} Mood`;
    }
  };

  const getConditionLabel = (condition: SecondaryEffect['condition']): string => {
    switch (condition) {
      case 'always':     return '';
      case 'on_success': return 'on win';
      case 'on_failure': return 'on loss';
    }
  };

  // Helpers for the inline spotlight
  const activeKmStep = kmTutorialStep !== null ? KM_TUTORIAL_STEPS[kmTutorialStep] : null;
  const kmSpotlit = (target: KmTarget) => activeKmStep?.target === target;
  const kmDimmed  = (target: KmTarget) => activeKmStep !== null && !kmSpotlit(target);

  const kmSectionClass = (target: KmTarget) => {
    if (kmSpotlit(target)) return 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-black transition-all duration-200';
    if (kmDimmed(target))  return 'opacity-25 transition-all duration-200';
    return '';
  };

  return (
    <Modal isOpen={isOpen} title="" size="xl" showCloseButton={false} belowContent={peekButton}>
      <div className="space-y-5">
        {/* ── Inline spotlight callout ─────────────────────────────────────────── */}
        {activeKmStep && (
          <div className="border-4 border-yellow-400 bg-gray-900 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-yellow-400 tracking-widest uppercase">
                Tutorial — Step {(kmTutorialStep ?? 0) + 1} / {KM_TUTORIAL_STEPS.length}
              </span>
              <div className="flex gap-1">
                {KM_TUTORIAL_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === kmTutorialStep ? 'bg-yellow-400' : 'bg-gray-600'}`}
                  />
                ))}
              </div>
            </div>
            <h3 className="text-base font-bold text-yellow-300 mb-1">{activeKmStep.title}</h3>
            <p className="text-sm text-gray-200 leading-relaxed mb-3">{activeKmStep.body}</p>
            <button
              onClick={handleKmTutorialNext}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 px-4 text-sm tracking-wide transition-colors"
            >
              {kmTutorialStep === KM_TUTORIAL_STEPS.length - 1 ? 'Got It — Let Me Choose' : 'Next'}
            </button>
          </div>
        )}

        {/* Header strip — spotlit on step 0 */}
        <div className={kmSectionClass('header')}>
          {headerStrip}
        </div>

        {/* Tactical Options — outer ring when either options step is active */}
        <div className={
          (kmSpotlit('options-matchup') || kmSpotlit('options-effects'))
            ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-black transition-all duration-200'
            : kmDimmed('options-matchup') // both share the same dim condition
            ? 'opacity-25 transition-all duration-200'
            : ''
        }>
          <h3 className="text-base font-bold text-pixel-text mb-4">⚔️ Choose Your Tactic</h3>
          <div className="space-y-3">
            {activeKeyMoment.options.map((option, index) => {
              const matchup = getMatchupIndicator(option);
              return (
                <button
                  key={index}
                  onClick={() => kmTutorialStep === null ? handleKeyMomentChoice(option) : undefined}
                  disabled={kmTutorialStep !== null}
                  className="w-full text-left p-4 border-4 border-pixel-border bg-pixel-card hover:border-pixel-accent hover:scale-[1.01] transition-all disabled:cursor-default disabled:hover:scale-100 disabled:hover:border-pixel-border"
                >
                  {/* Option name + matchup indicator — dimmed when effects step is active */}
                  <div className={`flex items-center justify-between gap-2 mb-1 transition-opacity duration-200 ${kmSpotlit('options-effects') ? 'opacity-25' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{option.emoji}</span>
                      <h4 className="text-base font-bold text-pixel-text">{option.name}</h4>
                    </div>
                    <span className={`text-sm font-bold ${matchup.color} whitespace-nowrap`}>
                      you {formatStatScore(matchup.playerScore)} {matchup.arrow} {formatStatScore(matchup.opponentScore)} them
                    </span>
                  </div>

                  <p className={`text-sm text-pixel-text-muted mb-2 transition-opacity duration-200 ${kmSpotlit('options-effects') ? 'opacity-25' : ''}`}>{option.description}</p>

                  {/* Best against hint — dimmed when effects step is active */}
                  <p className={`text-sm text-pixel-text-muted mb-3 transition-opacity duration-200 ${kmSpotlit('options-effects') ? 'opacity-25' : ''}`}>{option.bestAgainstHint}</p>

                  {/* Secondary effects — dimmed when matchup step is active */}
                  <div className={`border-t border-pixel-border pt-2 flex flex-wrap gap-2 transition-opacity duration-200 ${kmSpotlit('options-matchup') ? 'opacity-25' : ''}`}>
                    {option.secondaryEffects.map((effect, i) => {
                      const condLabel = getConditionLabel(effect.condition);
                      return (
                        <span
                          key={i}
                          className={`text-sm px-2 py-0.5 border border-pixel-border bg-pixel-bg ${
                            effect.value > 0 ? 'text-green-400' : 'text-red-400'
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
        </div>
      </div>
    </Modal>
  );
};
