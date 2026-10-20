/**
 * The end of the written story. Shown in place of the menu once the closing event
 * has played and the player's new season isn't written yet, so a promoted player
 * isn't left training on an empty calendar.
 *
 * It closes on the career: who the player became (rating, areas, all fourteen
 * stats), how the season went (record, team matches, tournaments) and what they
 * did along the way, laid out to read as one card a player can screenshot. The
 * way on is a new career.
 */

import React, { useMemo, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { usePlayerAppearance } from '../hooks/usePlayerAppearance';
import { ScreenFrame } from './ui/ScreenFrame';
import { Button } from './ui/Button';
import { StatSectionHeading } from './ui/StatSectionHeading';
import { PixelSprite } from './sprites/PixelSprite';
import { formatAbilityName } from './AbilityDisplay';
import { careerSummary, type CareerSummary } from '../game/CareerSummary';
import { GAME_AREAS, GAME_AREA_LABELS } from '../core/gameAreas';
import { STAT_SECTIONS } from '../config/statSections';
import { formatStatName } from '../config/statIcons';
import { getStat } from '../game/StatDevelopment';
import { getLetterGrade } from '../utils/playerStats';
import type { PlayerStats } from '../types';

export function ContentEnd(): React.JSX.Element {
  const player = useGameStore((state) => state.player);
  const calendar = useGameStore((state) => state.calendar);
  const completedStoryEvents = useGameStore((state) => state.completedStoryEvents);
  const completedChallenges = useGameStore((state) => state.completedChallenges);
  const relationships = useGameStore((state) => state.relationships);
  const clearAllData = useGameStore((state) => state.clearAllData);
  const appearance = usePlayerAppearance();
  const [confirming, setConfirming] = useState(false);

  const summary = useMemo(
    () =>
      player
        ? careerSummary(player, {
            calendar,
            completedStoryEvents,
            completedChallenges,
            relationships,
          })
        : null,
    [player, calendar, completedStoryEvents, completedChallenges, relationships],
  );

  return (
    <ScreenFrame title="Thanks for playing!">
      <div className="flex flex-col gap-4" data-testid="content-end">
        {summary && player && (
          <>
            <CareerHeader summary={summary} appearance={appearance} />
            <CareerRecord summary={summary} />
            <CareerStats stats={player.stats} />
            <CareerHighlights summary={summary} />
            {(summary.abilities.length > 0 || summary.friends.length > 0) && (
              <CareerExtras summary={summary} />
            )}
          </>
        )}

        <div className="bg-pixel-card border-4 border-pixel-border p-4 flex flex-col items-center gap-4 text-center">
          <p className="text-pixel-text">
            {summary?.name ?? ''}'s story continues in the Regional season, coming soon.
          </p>
          {!confirming ? (
            <Button testId="content-end-new-career" onClick={() => setConfirming(true)}>
              Start a new career
            </Button>
          ) : (
            <div className="w-full max-w-md flex flex-col gap-2">
              <Button
                testId="content-end-confirm"
                variant="danger"
                fullWidth
                onClick={clearAllData}
              >
                Yes, delete this save
              </Button>
              <Button
                testId="content-end-cancel"
                variant="secondary"
                fullWidth
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </ScreenFrame>
  );
}

function Panel({
  title,
  testId,
  children,
}: {
  title?: string;
  testId?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="bg-pixel-card border-4 border-pixel-border p-4" data-testid={testId}>
      {title && <h3 className="text-sm font-bold text-pixel-text mb-3">{title}</h3>}
      {children}
    </section>
  );
}

function CareerHeader({
  summary,
  appearance,
}: {
  summary: CareerSummary;
  appearance: ReturnType<typeof usePlayerAppearance>;
}): React.JSX.Element {
  return (
    <Panel testId="career-header">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <PixelSprite appearance={appearance} pose="cheer" scale={5} />
        <div className="flex-1 flex flex-col items-center sm:items-start gap-1 text-center sm:text-left">
          <span className="text-xl font-bold text-pixel-text">{summary.name}</span>
          <span className="text-xs text-pixel-text-muted">
            {summary.tier} · Level {summary.level} · {summary.archetype}
          </span>
          <span className="text-xs text-pixel-text-muted">Day {summary.days}</span>
        </div>
        <div className="flex flex-col items-center">
          <span
            className="text-5xl font-bold text-pixel-accent leading-none"
            data-testid="career-overall"
          >
            {summary.overall}
          </span>
          <span className="text-[10px] text-pixel-text-muted uppercase tracking-wide mt-1">
            Overall
          </span>
        </div>
      </div>
      {/* Phones: two columns of name · letter rows. Wider: five tiles, letter on top. */}
      <div
        className="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-5 sm:gap-2 mt-4"
        data-testid="career-areas"
      >
        {GAME_AREAS.map((area) => {
          const { grade, color } = getLetterGrade(summary.areas[area]);
          return (
            <div
              key={area}
              data-testid={`career-area-${area}`}
              data-grade={grade}
              className="flex items-center justify-between gap-2 bg-pixel-bg border-2 border-pixel-border px-2 py-1 sm:flex-col-reverse sm:justify-center sm:gap-1.5 sm:py-2"
            >
              <span className="text-[8px] sm:text-[10px] text-pixel-text-muted">
                {GAME_AREA_LABELS[area]}
              </span>
              <span className="text-base sm:text-2xl font-bold leading-none" style={{ color }}>
                {grade}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function CareerRecord({ summary }: { summary: CareerSummary }): React.JSX.Element {
  const { matches } = summary;
  return (
    <Panel title="Record" testId="career-record">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-2" data-testid="career-win-loss">
          <span className="text-3xl font-bold text-green-500">{matches.won}</span>
          <span className="text-pixel-text-muted">–</span>
          <span className="text-3xl font-bold text-red-500">{matches.lost}</span>
        </div>
        <span className="text-sm text-pixel-text-muted">
          {matches.played > 0 ? `${matches.winRate}% won` : 'No matches played'}
        </span>
        {summary.form.length > 0 && (
          <div className="flex gap-0.5" data-testid="career-form">
            {summary.form.map((result, i) => (
              <div
                key={i}
                className={`w-4 h-4 border-2 border-pixel-border ${
                  result === 'win' ? 'bg-green-500' : 'bg-red-500'
                }`}
                title={result === 'win' ? 'Win' : 'Loss'}
              />
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-pixel-text-muted mt-4 mb-2">Team matches</div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {summary.teamMatches.map((match, i) => (
          <div
            key={i}
            data-testid={`career-team-match-${i + 1}`}
            data-result={match.result ?? 'unplayed'}
            className={`flex flex-col items-center gap-1 border-2 px-2 py-2 text-center ${
              match.result === 'win'
                ? 'border-green-500'
                : match.result === 'loss'
                  ? 'border-red-500'
                  : 'border-pixel-border'
            }`}
          >
            <span className="text-xs text-pixel-text">{match.opponent}</span>
            <span
              className={`text-sm font-bold ${
                match.result === 'win'
                  ? 'text-green-500'
                  : match.result === 'loss'
                    ? 'text-red-500'
                    : 'text-pixel-text-muted'
              }`}
            >
              {match.result === 'win' ? 'Won' : match.result === 'loss' ? 'Lost' : '—'}
            </span>
          </div>
        ))}
      </div>

      {summary.tournaments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {summary.tournaments.map((t, i) => (
            <span
              key={i}
              data-testid={`career-tournament-${i}`}
              className={`text-xs border-2 px-2 py-1 ${
                t.won ? 'border-yellow-500 text-yellow-500' : 'border-pixel-border text-pixel-text'
              }`}
            >
              {t.name}: {t.won ? 'Champion' : 'Played'}
            </span>
          ))}
        </div>
      )}
    </Panel>
  );
}

function CareerStats({ stats }: { stats: PlayerStats }): React.JSX.Element {
  return (
    <Panel title="Stats" testId="career-stats">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STAT_SECTIONS.map((section) => (
          <div key={section.id}>
            <StatSectionHeading section={section} className="mb-2" />
            <div className="flex flex-col gap-1">
              {section.stats.map((stat) => {
                const value = getStat(stats, stat);
                const { grade, color } = getLetterGrade(value);
                return (
                  <div
                    key={stat}
                    data-testid={`career-stat-${stat}`}
                    className="flex items-center justify-between gap-2 bg-pixel-bg border-2 border-pixel-border px-2 py-1"
                  >
                    <span className="text-xs text-pixel-text">{formatStatName(stat)}</span>
                    <span className="flex items-baseline gap-2 shrink-0">
                      <span className="text-sm font-bold w-8 text-center" style={{ color }}>
                        {grade}
                      </span>
                      <span className="text-xs text-pixel-text-muted tabular-nums w-8 text-right">
                        {value}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CareerHighlights({ summary }: { summary: CareerSummary }): React.JSX.Element {
  const h = summary.highlights;
  const tiles: Array<{ id: string; label: string; value: number }> = [
    { id: 'aces', label: 'Aces', value: h.aces },
    { id: 'winners', label: 'Winners', value: h.winners },
    { id: 'net-points', label: 'Net points won', value: h.netPoints },
    { id: 'breaks', label: 'Breaks of serve', value: h.breakPoints },
    { id: 'rallies', label: 'Rallies won', value: h.longRallies },
    { id: 'training', label: 'Drills played', value: h.trainingSessions },
    { id: 'story', label: 'Story events', value: h.storyEvents },
    { id: 'challenges', label: 'Challenges done', value: h.challenges },
    { id: 'xp', label: 'XP earned', value: h.experience },
  ];
  return (
    <Panel title="Highlights" testId="career-highlights">
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            data-testid={`career-highlight-${tile.id}`}
            className="flex flex-col items-center gap-1 bg-pixel-bg border-2 border-pixel-border py-2 px-1 text-center"
          >
            <span className="text-lg font-bold text-pixel-text tabular-nums">{tile.value}</span>
            <span className="text-[10px] text-pixel-text-muted">{tile.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CareerExtras({ summary }: { summary: CareerSummary }): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {summary.abilities.length > 0 && (
        <Panel title="Abilities" testId="career-abilities">
          <div className="flex flex-wrap gap-2">
            {summary.abilities.map((a) => (
              <span
                key={a.name}
                data-rarity={a.rarity}
                className="text-xs text-pixel-text border-2 border-pixel-border px-2 py-1"
              >
                {formatAbilityName(a.name)}
                {a.level > 1 && <span className="text-pixel-text-muted"> Lv {a.level}</span>}
              </span>
            ))}
          </div>
        </Panel>
      )}
      {summary.friends.length > 0 && (
        <Panel title="Closest friends" testId="career-friends">
          <div className="flex flex-col gap-1">
            {summary.friends.map((f) => (
              <span key={f.name} className="text-xs text-pixel-text">
                {f.name}
              </span>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
