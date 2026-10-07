/**
 * Pre-Match Screen Component
 * Shared screen for previewing opponent and match details before starting a match.
 * Used by both tournament matches and story matches.
 */

import React, { useState } from 'react';
import { Card } from './ui/Card';
import { ScreenFrame } from './ui/ScreenFrame';
import { Button } from './ui/Button';
import { HeadToHead } from './match/HeadToHead';
import { SURFACE_EFFECTS } from '../config/shotThresholds';
import { ARCHETYPE_DATA } from '../data/archetypes';
import type { PlayerStats, PlayStyle, CourtSurface, StatName } from '../types';
import type { Modifiers, Ability, AbilityRarity } from '../types/game';
import type { ArchetypeType } from '../data/archetypes';
import { describeEffects } from '../utils/effectLabels';
import {
  calculateOverallRating,
  getSurfaceEmoji,
  getArchetypeLabel,
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
  playerOverallRating: number;
  playerStats: PlayerStats;
  playerDescription?: string;

  // Abilities
  playerAbilities?: Ability[];
  opponentAbilities?: Ability[];

  // Opponent
  opponentName: string;
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
  onBack?: () => void;
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
    case 'best-of-1':
      return 'Best of 1 Set';
    case 'best-of-3':
      return 'Best of 3 Sets';
    default:
      return format;
  }
};

const RARITY_STYLES: Record<string, { badge: string; text: string; label: string }> = {
  common: {
    badge: 'bg-pixel-bg border-pixel-border text-pixel-text-muted',
    text: 'text-pixel-text-muted',
    label: 'Common',
  },
  uncommon: {
    badge: 'bg-green-950/50 border-green-700 text-green-400',
    text: 'text-green-300',
    label: 'Uncommon',
  },
  rare: {
    badge: 'bg-blue-950/50 border-blue-700 text-blue-400',
    text: 'text-blue-300',
    label: 'Rare',
  },
  legendary: {
    badge: 'bg-yellow-950/50 border-yellow-600 text-yellow-400',
    text: 'text-yellow-300',
    label: 'Legendary',
  },
};

/** A side's abilities, compact: rarity, name, and what it does. */
function AbilityList({ title, abilities }: { title: string; abilities: Ability[] }) {
  return (
    <div className="bg-pixel-card border-2 border-pixel-border p-3">
      <div className="text-xs text-pixel-text-muted mb-1.5 uppercase tracking-wide">{title}</div>
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
  );
}

function SurfaceEffectsDisplay({ surface }: { surface: CourtSurface }) {
  const effects = getSurfaceEffects(surface);

  // A surface with no effects says nothing worth reading.
  if (effects.length === 0) return null;

  return (
    <>
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
    </>
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

function ActiveBuffsDisplay({ buffs }: { buffs: Modifiers }) {
  const statBoostEntries = Object.entries(buffs.statBoosts).filter(([, v]) => v !== 0);
  const additionalEntries = describeEffects(buffs.additional);

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
        {additionalEntries.map((effect) => (
          <div key={effect.key} className="flex justify-between items-center text-sm">
            <span className="text-yellow-300">
              {effect.icon} {effect.label}
            </span>
            <span className="text-yellow-400 font-bold">{effect.value}</span>
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
  playerOverallRating,
  playerStats,
  playerDescription,
  playerAbilities,
  opponentAbilities,
  opponentName,
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
    <ScreenFrame
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      energyPreview={-energyCost}
      actions={
        <Button
          // The screen offers the same action top and bottom, so the ids name the
          // position rather than the action — a bare `start-match` would be ambiguous.
          testId="start-match-header"
          variant="primary"
          onClick={onStartMatch}
          disabled={!canAfford}
        >
          {!canAfford ? <>Not Enough Energy ({energyCost})</> : <>🎾 Start Match</>}
        </Button>
      }
    >
      {headerContent && <div className="mb-6">{headerContent}</div>}

      <div className="mb-4">
        <HeadToHead
          playerName={playerName}
          playerOverall={playerOverallRating}
          playerStats={playerStats}
          opponentName={opponentName}
          opponentOverall={opponentOverallRating}
          opponentStats={opponentStats}
          opponentTag={
            <span className="px-2 py-0.5 text-xs font-bold border-2 border-pixel-accent text-pixel-accent">
              {getArchetypeLabel(opponentPlayStyle.type)}
            </span>
          }
        />
      </div>

      {((playerAbilities?.length ?? 0) > 0 || (opponentAbilities?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {playerAbilities && playerAbilities.length > 0 && (
            <AbilityList title="Your abilities" abilities={playerAbilities} />
          )}
          {opponentAbilities && opponentAbilities.length > 0 && (
            <AbilityList title="Their abilities" abilities={opponentAbilities} />
          )}
        </div>
      )}

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

      {/* The conditions, as one strip: format, surface (and what it changes), buffs */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
        <span className="px-2 py-1 bg-pixel-card border-2 border-pixel-border text-pixel-text font-bold">
          {getFormatLabel(matchFormat)}
        </span>
        <span className="px-2 py-1 bg-pixel-card border-2 border-pixel-border text-pixel-text font-bold capitalize">
          {getSurfaceEmoji(surface)} {surface}
        </span>
        <SurfaceEffectsDisplay surface={surface} />
      </div>

      {activeBuffs && (
        <div className="mb-4">
          <ActiveBuffsDisplay buffs={activeBuffs} />
        </div>
      )}

      <Card className="mb-6" padding="sm">
        <ScoutingReport playStyle={opponentPlayStyle} />
      </Card>

      <div className="mb-6">
        <Button
          testId="start-match-footer"
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
    </ScreenFrame>
  );
};
