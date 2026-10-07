/**
 * Relationships Component
 * Everyone the player has met. This is also the hangout menu: a key character with
 * a new tier event floats to the top with a Hang Out button. Key characters show a
 * bond track with an icon per tier; everyone else is a compact row below.
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ScreenFrame } from './ui/ScreenFrame';
import { CHARACTERS } from '../data/characters';
import {
  HANGOUT_CHARACTERS,
  HANGOUT_ENERGY_COST,
  getHangoutTier,
  hasUnseenTierEvent,
} from '../data/hangoutCharacters';
import { TimeSlot } from '../types/game';

export const Relationships: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const relationships = useGameStore((state) => state.relationships);
  const hangoutThresholdsSeen = useGameStore((state) => state.hangoutThresholdsSeen);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const calendar = useGameStore((state) => state.calendar);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const hangoutWithCharacter = useGameStore((state) => state.hangoutWithCharacter);

  if (!player) return null;

  const isNightTime = calendar.currentTimeSlot === TimeSlot.NIGHT;
  const canAffordHangout = currentStatus.energy >= HANGOUT_ENERGY_COST;

  const metCharacterIds = Object.keys(relationships);
  const metCharacters = metCharacterIds
    .map((id) => CHARACTERS[id])
    .filter((c): c is NonNullable<typeof c> => c !== undefined)
    .filter((c) => c.role !== 'Opponent');

  const isHangoutReady = (characterId: string): boolean => {
    const isUnlocked =
      calendar.currentDay >= 6 && player.flags[`hangoutUnlocked_${characterId}`] === true;
    return (
      isUnlocked &&
      hasUnseenTierEvent(characterId, relationships[characterId] ?? 0, hangoutThresholdsSeen)
    );
  };

  // Sort: hangout-ready first (the actionable ones), then key characters, then others
  const sorted = [...metCharacters].sort((a, b) => {
    const aReady = isHangoutReady(a.id);
    const bReady = isHangoutReady(b.id);
    if (aReady !== bReady) return aReady ? -1 : 1;
    if (a.isKeyCharacter !== b.isKeyCharacter) return a.isKeyCharacter ? -1 : 1;
    return 0;
  });

  const keyCharacters = sorted.filter((c) => c.isKeyCharacter === true);
  const others = sorted.filter((c) => c.isKeyCharacter !== true);
  const isHangoutDisabled = isNightTime || !canAffordHangout;

  return (
    <ScreenFrame title="Relationships" onBack={() => navigateTo('idle')}>
      {sorted.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-pixel-text-muted">You'll meet people as the story goes on.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            {keyCharacters.map((character) => {
              const value = relationships[character.id] ?? 0;
              const config = HANGOUT_CHARACTERS[character.id];
              const ready = isHangoutReady(character.id);
              return (
                <Card
                  key={character.id}
                  padding="sm"
                  className={ready ? 'border-pixel-accent' : ''}
                >
                  <div
                    className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-3"
                    data-testid={`relationship-${character.id}`}
                    data-value={value}
                    data-tier={getHangoutTier(character.id, value)}
                  >
                    <div className="flex items-center gap-3 min-w-0 sm:w-44 shrink-0">
                      <span className="text-3xl" aria-hidden="true">
                        {roleIcon(character.role)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-pixel-text truncate">{character.name}</div>
                        <div className="text-xs text-pixel-text-muted">{character.role}</div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-[12rem] order-last sm:order-none basis-full sm:basis-auto">
                      {config && <BondTrack value={value} thresholds={config.thresholds} />}
                    </div>

                    {/* The action column is reserved on every card, so the tracks (and their tier
                        icons) line up down the list whether or not a hangout is ready. */}
                    <div className="ml-auto sm:ml-0 shrink-0 sm:w-48 flex sm:justify-end">
                      {ready && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isHangoutDisabled}
                          onClick={() => hangoutWithCharacter(character.id)}
                          testId={`relationship-hangout-${character.id}`}
                        >
                          {isNightTime ? '🌙 Tomorrow' : `★ Hang Out · ⚡${HANGOUT_ENERGY_COST}`}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* People without a bond track: just who they are and how it's going. */}
          {others.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {others.map((character) => {
                const value = relationships[character.id] ?? 0;
                return (
                  <div
                    key={character.id}
                    className="flex items-center gap-3 bg-pixel-card border-2 border-pixel-border px-3 py-2"
                    data-testid={`relationship-${character.id}`}
                    data-value={value}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {roleIcon(character.role)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-pixel-text truncate">{character.name}</div>
                      <div className="text-xs text-pixel-text-muted">{character.role}</div>
                    </div>
                    <Mood value={value} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </ScreenFrame>
  );
};

const ROLE_ICONS: Record<string, string> = {
  Coach: '👨‍🏫',
  Rival: '⚔️',
  Family: '👨‍👩‍👧',
  Friend: '🤝',
  Sponsor: '💼',
  Career: '📈',
  Media: '📰',
  Official: '🏆',
  Romance: '💖',
};
const roleIcon = (role: string | undefined): string => (role && ROLE_ICONS[role]) || '🎾';

/** One icon and name per hangout tier, so a tier reads as a place, not a number. */
const TIERS = [
  { icon: '🤝', label: 'Acquaintance' },
  { icon: '😊', label: 'Friend' },
  { icon: '💛', label: 'Close' },
  { icon: '💎', label: 'Trusted' },
] as const;

/**
 * The bond with a key character, 0–100, cut at the hangout thresholds. Each
 * threshold carries the icon of the tier it opens: reached tiers are lit, the next
 * one says how far off it is. A bond below zero shows as strained rather than as
 * a bar running backwards from a centre line.
 */
const BondTrack: React.FC<{ value: number; thresholds: readonly number[] }> = ({
  value,
  thresholds,
}) => {
  const tier = thresholds.filter((t) => value >= t).length;
  const next = thresholds[tier];
  const fill = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <span className="font-bold text-pixel-text">
          <span aria-hidden="true">{TIERS[tier].icon} </span>
          {TIERS[tier].label}
        </span>
        {value < 0 ? (
          <span className="font-bold text-pixel-error">🧊 Strained {value}</span>
        ) : next !== undefined ? (
          <span className="text-pixel-text-muted">
            {TIERS[tier + 1].icon} in {next - value}
          </span>
        ) : (
          <span className="text-pixel-text-muted">Max</span>
        )}
      </div>
      <div className="relative h-3 bg-pixel-bg border-2 border-pixel-border">
        <div className="h-full bg-pixel-accent transition-all" style={{ width: `${fill}%` }} />
        {thresholds.map((t, i) => {
          const reached = value >= t;
          return (
            <span
              key={t}
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-sm border-2 ${
                reached
                  ? 'bg-pixel-card border-pixel-accent'
                  : 'bg-pixel-bg border-pixel-border grayscale opacity-60'
              }`}
              style={{ left: `${t}%` }}
              title={`${TIERS[i + 1].label} at ${t}`}
              aria-hidden="true"
            >
              {TIERS[i + 1].icon}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** For people without tiers: one word for how it's going. */
const Mood: React.FC<{ value: number }> = ({ value }) =>
  value > 10 ? (
    <span className="text-xs font-bold text-pixel-success">Warm</span>
  ) : value < -10 ? (
    <span className="text-xs font-bold text-pixel-error">Cold</span>
  ) : (
    <span className="text-xs font-bold text-pixel-text-muted">Neutral</span>
  );
