/**
 * Match Toasts
 * Transient "big beat" notifications rendered over the court — ace, double fault, break of
 * serve, set win, match win. Driven off the store's lastPointResult / currentScore so they
 * fire once per point. Ordinary rally points stay silent (the log + stat flashes cover those).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useMatchStore } from '../../stores/matchStore';
import { PointType } from '../../types';

type Tone = 'good' | 'bad' | 'big';

interface Toast {
  id: number;
  text: string;
  tone: Tone;
  dying: boolean;
}

interface MatchToastsProps {
  playerName: string;
  opponentName: string;
}

const TONE_CLASS: Record<Tone, string> = {
  good: 'text-pixel-success border-pixel-success',
  bad: 'text-pixel-error border-pixel-error',
  big: 'text-pixel-warning border-pixel-warning',
};

export const MatchToasts: React.FC<MatchToastsProps> = ({ playerName, opponentName }) => {
  // Key the effect on currentScore: it's the last thing to update each point (after
  // lastPointResult), so when it changes both the result and the score are current.
  const currentScore = useMatchStore((s) => s.currentScore);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const seenSeq = useRef(0);
  const prevSetsLen = useRef(0);
  const prevGames = useRef<{ player: number; opponent: number }>({ player: 0, opponent: 0 });

  const push = (text: string, tone: Tone): void => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, text, tone, dying: false }].slice(-3));
    window.setTimeout(() => setToasts((t) => t.map((x) => x.id === id ? { ...x, dying: true } : x)), 1000);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2000);
  };

  useEffect(() => {
    const { lastPointResult: r, pointSeq, matchLog } = useMatchStore.getState();
    if (!currentScore || !r || pointSeq === seenSeq.current) return;
    seenSeq.current = pointSeq;

    // Use the latest narration from the match log as the toast text.
    const narration = matchLog.length > 0 ? matchLog[matchLog.length - 1] : null;

    const nameOf = (side: 'player' | 'opponent'): string => (side === 'player' ? playerName : opponentName);

    // ── Set / match win (a completed set was just recorded) ──────────────────
    const setsLen = currentScore.sets.length;
    if (setsLen > prevSetsLen.current) {
      prevSetsLen.current = setsLen;
      prevGames.current = { player: 0, opponent: 0 };
      const set = currentScore.sets[setsLen - 1];
      const setWinner: 'player' | 'opponent' = set.player > set.opponent ? 'player' : 'opponent';
      if (currentScore.isComplete) {
        push(`${nameOf(setWinner)} wins the match!`, setWinner === 'player' ? 'big' : 'bad');
      } else {
        push(`${nameOf(setWinner)} takes the set`, setWinner === 'player' ? 'good' : 'bad');
      }
      return;
    }

    // ── Break of serve (a game just went to the returner) ────────────────────
    const games = currentScore.currentSet;
    const gained: 'player' | 'opponent' | null =
      games.player > prevGames.current.player
        ? 'player'
        : games.opponent > prevGames.current.opponent
          ? 'opponent'
          : null;
    prevGames.current = { player: games.player, opponent: games.opponent };
    if (gained && r.server && gained !== r.server) {
      push(narration ?? `${nameOf(gained)} breaks serve!`, gained === 'player' ? 'good' : 'bad');
      return;
    }

    // ── Point-level beats (use narration for richer commentary) ──────────────
    switch (r.outcome) {
      case PointType.ACE:
        push(narration ?? `${nameOf(r.winner)} ace!`, r.winner === 'player' ? 'good' : 'bad');
        break;
      case PointType.DOUBLE_FAULT:
        push(narration ?? `Double fault`, r.winner === 'player' ? 'good' : 'bad');
        break;
      case PointType.WINNER:
        push(narration ?? `${nameOf(r.winner)} winner!`, r.winner === 'player' ? 'good' : 'bad');
        break;
      case PointType.FORCED_ERROR:
        push(narration ?? `${nameOf(r.winner)} forces an error`, r.winner === 'player' ? 'good' : 'bad');
        break;
      case PointType.UNFORCED_ERROR:
        push(narration ?? `Unforced error`, r.winner === 'player' ? 'good' : 'bad');
        break;
      default:
        break;
    }
  }, [currentScore, playerName, opponentName]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none absolute top-2 left-0 right-0 z-10 flex flex-col items-center gap-2 px-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`transition-opacity duration-1000 ease-out ${t.dying ? 'opacity-0' : 'opacity-100'} px-4 py-2 rounded-full border-2 bg-pixel-bg bg-opacity-90 text-xs font-bold uppercase tracking-wide ${TONE_CLASS[t.tone]}`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
};
