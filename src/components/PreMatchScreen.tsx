/**
 * Pre-Match Screen Component
 * Shared screen for previewing opponent and match details before starting a match.
 * Used by both tournament matches and story matches.
 */

import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { TendencyBars } from './TendencyBars';
import { SURFACE_EFFECTS } from '../config/shotThresholds';
import { ARCHETYPE_DATA } from '../data/archetypes';
import type { PlayerStats, PlayStyle, CourtSurface, StatName } from '../types';
import type { Modifiers, Ability, AbilityRarity } from '../types/game';
import { EffectKey } from '../types/game';
import type { ArchetypeType } from '../data/archetypes';
import {
  calculateOverallRating,
  getTierLabel,
  getTierColor,
  getSurfaceEmoji,
  getArchetypeLabel,
  getTopNStats,
  getBottomNStats,
  getLetterGrade,
  STAT_LABELS,
} from '../utils/playerStats';

interface SurfaceEffectDisplay {
  label: string;
  direction: 'up' | 'down';
}

interface PreMatchScreenProps {
  title: string;
  subtitle?: string;
  headerContent?: React.ReactNode;

  // Player
  playerName: string;
  playerTier: number;
  playerOverallRating: number;
  playerStats: PlayerStats;
  playerPlayStyle: PlayStyle;
  playerDescription?: string;

  // Abilities
  playerAbilities?: Ability[];
  opponentAbilities?: Ability[];

  // Opponent
  opponentName: string;
  opponentTier: number;
  opponentDescription?: string;
  opponentStats: PlayerStats;
  opponentPlayStyle: PlayStyle;

  // Match config
  surface: CourtSurface;
  matchFormat: 'best-of-1' | 'best-of-3';
  energyCost: number;
  currentEnergy: number;

  contextContent?: React.ReactNode;
  activeBuffs?: Modifiers | null;

  onStartMatch: () => void;
  onBack: () => void;
}

function getSurfaceEffects(surface: CourtSurface): SurfaceEffectDisplay[] {
  const effects = SURFACE_EFFECTS[surface];
  const result: SurfaceEffectDisplay[] = [];

  if (effects.serveQualityMultiplier !== 1.0) {
    result.push({
      label: 'Serves',
      direction: effects.serveQualityMultiplier > 1.0 ? 'up' : 'down',
    });
  }

  if (effects.netApproachBonus !== 0) {
    result.push({
      label: 'Net Play',
      direction: effects.netApproachBonus > 0 ? 'up' : 'down',
    });
  }

  if (effects.defensiveAdjustmentMultiplier !== 1.0) {
    result.push({
      label: 'Defense',
      direction: effects.defensiveAdjustmentMultiplier > 1.0 ? 'up' : 'down',
    });
  }

  if (effects.returnAdjustmentMultiplier !== 1.0) {
    result.push({
      label: 'Returns',
      direction: effects.returnAdjustmentMultiplier > 1.0 ? 'up' : 'down',
    });
  }

  return result;
}

const getFormatLabel = (format: 'best-of-1' | 'best-of-3'): string => {
  switch (format) {
    case 'best-of-1': return 'Best of 1 Set';
    case 'best-of-3': return 'Best of 3 Sets';
    default: return format;
  }
};

const RARITY_STYLES: Record<string, { badge: string; text: string; label: string }> = {
  common:    { badge: 'bg-pixel-bg border-pixel-border text-pixel-text-muted', text: 'text-pixel-text-muted', label: 'Common' },
  uncommon:  { badge: 'bg-green-950/50 border-green-700 text-green-400',       text: 'text-green-300',       label: 'Uncommon' },
  rare:      { badge: 'bg-blue-950/50 border-blue-700 text-blue-400',          text: 'text-blue-300',        label: 'Rare' },
  legendary: { badge: 'bg-yellow-950/50 border-yellow-600 text-yellow-400',    text: 'text-yellow-300',      label: 'Legendary' },
};

interface PlayerCardProps {
  name: string;
  tier?: number;
  overallRating: number;
  stats: PlayerStats;
  playStyle: PlayStyle;
  abilities?: Ability[];
  isPlayer: boolean;
}

function PlayerCard({ name, tier, overallRating, stats, playStyle, abilities, isPlayer }: PlayerCardProps) {
  const topStats = getTopNStats(stats, 5);
  const bottomStats = getBottomNStats(stats, 5);
  // Opponents are hand-authored to a legacy archetype (drives their tactical
  // counters), so that label is trustworthy for them. For the player it's a
  // lossy projection of their real phase specialization — show the actual
  // tendencies instead of a label that can misdescribe them.
  const archetypeLabel = isPlayer ? null : getArchetypeLabel(playStyle.type);

  const borderColor = isPlayer ? 'border-blue-500' : getTierColor(tier ?? 1);
  const bgColor = isPlayer ? 'bg-blue-950/30' : 'bg-pixel-card';

  return (
    <div className={`border-4 ${borderColor} p-4 ${bgColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-pixel-text mb-1">{name}</h3>
          <div className="flex items-center gap-2">
            {tier !== undefined && (
              <span className="text-sm px-2 py-0.5 bg-pixel-bg border-2 border-pixel-border text-pixel-text uppercase">
                {getTierLabel(tier)}
              </span>
            )}
            <span className="text-sm px-2 py-0.5 bg-pixel-bg border-2 border-pixel-border text-pixel-text">
              Overall: {overallRating}
            </span>
          </div>
        </div>
        <span className="text-3xl">{isPlayer ? '🎾' : '⚔️'}</span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-pixel-text-muted mb-1 uppercase tracking-wide">Strengths</div>
          <div className="space-y-1">
            {topStats.map((stat) => {
              const grade = getLetterGrade(stat.value);
              return (
                <div key={stat.name} className="flex justify-between items-center text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="text-green-600">▲</span>
                    {stat.label}
                  </span>
                  <span className="text-green-400 font-bold flex items-center gap-2">
                    <span className="text-green-400/70">{stat.value}</span>
                    <span style={{ color: grade.color }} className="w-6 text-right">{grade.grade}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs text-pixel-text-muted mb-1 uppercase tracking-wide">Weaknesses</div>
          <div className="space-y-1">
            {bottomStats.map((stat) => {
              const grade = getLetterGrade(stat.value);
              return (
                <div key={stat.name} className="flex justify-between items-center text-sm">
                  <span className="text-orange-400 flex items-center gap-1">
                    <span className="text-orange-600">▼</span>
                    {stat.label}
                  </span>
                  <span className="text-orange-400 font-bold flex items-center gap-2">
                    <span className="text-orange-400/70">{stat.value}</span>
                    <span style={{ color: grade.color }} className="w-6 text-right">{grade.grade}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs text-pixel-text-muted mb-1 uppercase tracking-wide">
            {isPlayer ? 'Tendencies' : 'Playstyle'}
          </div>
          {isPlayer ? (
            <TendencyBars playStyle={playStyle} />
          ) : (
            <div className="text-sm">
              <div className="text-pixel-text font-medium">{archetypeLabel}</div>
              <div className="text-pixel-text-muted text-xs">{playStyle.description}</div>
            </div>
          )}
        </div>

        {abilities && abilities.length > 0 && (
          <div>
            <div className="text-xs text-pixel-text-muted mb-1 uppercase tracking-wide">Abilities</div>
            <div className="space-y-1.5">
              {abilities.map((ability) => {
                const style = RARITY_STYLES[ability.rarity as string] ?? RARITY_STYLES.common;
                return (
                  <div key={ability.name}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 border ${style.badge} shrink-0`}>
                        {style.label}
                      </span>
                      <span className={`text-sm font-medium ${style.text}`}>{ability.name}</span>
                    </div>
                    <div className="text-xs text-pixel-text-muted ml-1 mt-0.5">{ability.effects}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SurfaceEffectsDisplay({ surface }: { surface: CourtSurface }) {
  const effects = getSurfaceEffects(surface);

  if (effects.length === 0) {
    return (
      <span className="text-pixel-text-muted text-sm">No surface effects</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {effects.map((effect) => (
        <span
          key={effect.label}
          className={`px-2 py-1 text-sm font-medium ${
            effect.direction === 'up'
              ? 'bg-green-900/50 text-green-400'
              : 'bg-red-900/50 text-red-400'
          }`}
        >
          {effect.label}: {effect.direction === 'up' ? '▲' : '▼'}
        </span>
      ))}
    </div>
  );
}

function ScoutingReport({ playStyle }: { playStyle: PlayStyle }) {
  const [isOpen, setIsOpen] = useState(false);
  const archetype = ARCHETYPE_DATA[playStyle.type as ArchetypeType];

  return (
    <div className="bg-pixel-card border-2 border-pixel-border">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-pixel-bg/50 transition-colors"
      >
        <span className="text-pixel-text font-medium">Scouting Report</span>
        <span className="text-pixel-text-muted">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="p-3 pt-1 space-y-3 border-t border-pixel-border">
          <div>
            <div className="text-xs text-pixel-text-muted mb-1">Serving Style</div>
            <div className="text-sm text-pixel-text">{archetype.servingTendency}</div>
          </div>

          <div>
            <div className="text-xs text-pixel-text-muted mb-1">Returning Style</div>
            <div className="text-sm text-pixel-text">{archetype.returningTendency}</div>
          </div>

          <div>
            <div className="text-xs text-pixel-text-muted mb-1">Rally Behavior</div>
            <div className="text-sm text-pixel-text">{archetype.rallyTendency}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const ADDITIONAL_EFFECT_LABELS: Partial<Record<string, string>> = {
  // Training effects
  [EffectKey.MOOD_GAIN_BONUS]: 'Mood Gain Bonus',
  [EffectKey.ENERGY_COST_REDUCTION]: 'Energy Cost Reduction',
  [EffectKey.ENERGY_GAIN_BONUS]: 'Energy Gain Bonus',
  [EffectKey.EXPERIENCE_GAIN_BONUS]: 'Experience Gain Bonus',
  [EffectKey.TRAINING_STAT_MULTIPLIER]: 'Stat Multiplier',
  [EffectKey.TRAINING_TIER_BONUS]: 'Training Tier Bonus',
  [EffectKey.ABILITY_CHANCE_BONUS]: 'Ability Chance Bonus',
  [EffectKey.RELATIONSHIP_GAIN_BONUS]: 'Relationship Gain Bonus',
  // Match: shot quality effects
  [EffectKey.PACE]: 'Shot Pace Bonus',
  [EffectKey.SIDE_SPIN]: 'Side Spin Bonus',
  [EffectKey.TOUCH]: 'Touch & Finesse Bonus',
  [EffectKey.SMASH_POWER]: 'Smash Power Bonus',
  [EffectKey.NET_GAME]: 'Net Game Bonus',
  [EffectKey.PERFECT_TIMING]: 'Timing Precision',
  [EffectKey.RALLY_MOMENTUM]: 'Rally Momentum',
  // Match: positioning effects
  [EffectKey.REACH]: 'Extended Reach',
  [EffectKey.COURT_COVERAGE]: 'Court Coverage',
  [EffectKey.RECOVERY_SPEED]: 'Recovery Speed',
  // Match: momentum/fatigue effects
  [EffectKey.UNSTOPPABLE_MOMENTUM]: 'Unstoppable Momentum',
  [EffectKey.FOCUS_DURATION]: 'Focus Duration',
  [EffectKey.CHAMPION_AURA]: 'Champion Aura',
  // Match: key moment effects
  [EffectKey.CLUTCH_PERFORMANCE]: 'Clutch Performance',
  [EffectKey.MENTAL_RESILIENCE]: 'Mental Resilience',
};

function ActiveBuffsDisplay({ buffs }: { buffs: Modifiers }) {
  const statBoostEntries = Object.entries(buffs.statBoosts).filter(([, v]) => v !== 0);
  const additionalEntries = Object.entries(buffs.additional ?? {}).filter(([, v]) => v !== 0);

  if (statBoostEntries.length === 0 && additionalEntries.length === 0) return null;

  return (
    <div className="p-3 bg-yellow-950/30 border-2 border-yellow-500">
      <div className="text-xs text-yellow-400 uppercase tracking-wide font-bold mb-2">
        ⚡ Active Consumable Buff
      </div>
      <div className="space-y-1">
        {statBoostEntries.map(([stat, value]) => (
          <div key={stat} className="flex justify-between items-center text-sm">
            <span className="text-yellow-300">{STAT_LABELS[stat as StatName] ?? stat}</span>
            <span className="text-yellow-400 font-bold">+{value}</span>
          </div>
        ))}
        {additionalEntries.map(([key, value]) => (
          <div key={key} className="flex justify-between items-center text-sm">
            <span className="text-yellow-300">{ADDITIONAL_EFFECT_LABELS[key] ?? key}</span>
            <span className="text-yellow-400 font-bold">+{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const PreMatchScreen: React.FC<PreMatchScreenProps> = ({
  title,
  subtitle,
  headerContent,
  playerName,
  playerTier,
  playerOverallRating,
  playerStats,
  playerPlayStyle,
  playerDescription,
  playerAbilities,
  opponentAbilities,
  opponentName,
  opponentTier,
  opponentDescription,
  opponentStats,
  opponentPlayStyle,
  surface,
  matchFormat,
  energyCost,
  currentEnergy,
  contextContent,
  activeBuffs,
  onStartMatch,
  onBack,
}) => {
  const canAfford = currentEnergy >= energyCost;

  const opponentOverallRating = calculateOverallRating(opponentStats);

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="secondary" onClick={onBack}>
            ← Back to Menu
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onStartMatch}
            disabled={!canAfford}
          >
            {!canAfford ? (
              <>Not Enough Energy ({energyCost})</>
            ) : (
              <>🎾 Start Match</>
            )}
          </Button>
        </div>

        {headerContent ?? (
          <Card title={title} className="mb-6">
            {subtitle && (
              <p className="text-pixel-text-muted mb-4">{subtitle}</p>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <PlayerCard
            name={playerName}
            tier={playerTier}
            overallRating={playerOverallRating}
            stats={playerStats}
            playStyle={playerPlayStyle}
            abilities={playerAbilities}
            isPlayer={true}
          />

          <PlayerCard
            name={opponentName}
            tier={opponentTier}
            overallRating={opponentOverallRating}
            stats={opponentStats}
            playStyle={opponentPlayStyle}
            abilities={opponentAbilities}
            isPlayer={false}
          />
        </div>

        {playerDescription && opponentDescription ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-blue-950/30 border-2 border-blue-500">
              <p className="text-sm text-pixel-text-muted">{playerDescription}</p>
            </div>
            <div className="p-3 bg-pixel-card border-2 border-pixel-border">
              <p className="text-sm text-pixel-text-muted">{opponentDescription}</p>
            </div>
          </div>
        ) : playerDescription ? (
          <div className="mb-6">
            <div className="p-3 bg-blue-950/30 border-2 border-blue-500">
              <p className="text-sm text-pixel-text-muted">{playerDescription}</p>
            </div>
          </div>
        ) : opponentDescription ? (
          <div className="mb-6">
            <div className="p-3 bg-pixel-card border-2 border-pixel-border">
              <p className="text-sm text-pixel-text-muted">{opponentDescription}</p>
            </div>
          </div>
        ) : null}

        <Card title="Surface" className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-pixel-text font-bold">
              {getSurfaceEmoji(surface)} {surface.toUpperCase()}
            </span>
          </div>
          <SurfaceEffectsDisplay surface={surface} />
        </Card>

        <Card className="mb-6">
          <ScoutingReport playStyle={opponentPlayStyle} />
        </Card>

        <Card title="Match Details" className="mb-6">
          <div className="space-y-3">
            <div className="p-3 bg-pixel-card border-2 border-pixel-border">
              <div className="flex justify-between items-center">
                <span className="text-pixel-text-muted">Energy Cost:</span>
                <span className={`text-xl font-bold ${canAfford ? 'text-green-500' : 'text-red-500'}`}>
                  {energyCost} Energy
                </span>
              </div>
              <div className="mt-1 text-xs text-pixel-text-muted">
                You have {currentEnergy} / 100 energy available
              </div>
            </div>

            <div className="p-3 bg-pixel-card border-2 border-pixel-border">
              <div className="flex justify-between items-center">
                <span className="text-pixel-text-muted">Match Format:</span>
                <span className="text-pixel-text font-bold">{getFormatLabel(matchFormat)}</span>
              </div>
            </div>

            {activeBuffs && <ActiveBuffsDisplay buffs={activeBuffs} />}
          </div>
        </Card>

        <div className="mb-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onStartMatch}
            disabled={!canAfford}
          >
            {!canAfford ? (
              <>Not Enough Energy (Need {energyCost})</>
            ) : (
              <>🎾 Start Match vs {opponentName}</>
            )}
          </Button>
        </div>

        {contextContent}
      </div>
    </div>
  );
};