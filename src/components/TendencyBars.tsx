/**
 * Tendency Bars
 * Relative-only readout of a PlayStyle's current mechanical dials — no
 * numbers, just bar length, so it never claims a precision (or a legacy
 * archetype label) the underlying dials don't really have.
 */

import React from 'react';
import type { PlayStyle } from '../types';

const TENDENCY_DIALS: { key: keyof Pick<PlayStyle, 'aggression' | 'netApproach' | 'consistency' | 'power'>; label: string }[] = [
  { key: 'aggression', label: 'Aggression' },
  { key: 'netApproach', label: 'Net Play' },
  { key: 'consistency', label: 'Consistency' },
  { key: 'power', label: 'Power' },
];

export const TendencyBars: React.FC<{ playStyle: PlayStyle }> = ({ playStyle }) => (
  <div className="space-y-2">
    {TENDENCY_DIALS.map(({ key, label }) => (
      <div key={key}>
        <span className="text-xs text-pixel-text-muted">{label}</span>
        <div className="h-2 bg-pixel-bg border border-pixel-border mt-0.5">
          <div
            className="h-full bg-pixel-accent"
            style={{ width: `${Math.max(0, Math.min(100, playStyle[key]))}%` }}
          />
        </div>
      </div>
    ))}
  </div>
);
