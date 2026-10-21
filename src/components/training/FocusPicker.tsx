/**
 * The training focus (silver and up): which currency stands in for each drill's
 * secondary one. Picking a chip rewrites every drill's pay on the screen, so
 * the choice explains itself.
 */

import React from 'react';
import type { Currency } from '../../types/game';
import { CURRENCIES, CURRENCY_LABELS } from '../../config/economy';
import { CurrencyIcon } from '../currency/CurrencyAmounts';
import { BALL_ICON, ICON_PALETTE } from '../../data/pixelIcons';
import { PixelIcon } from '../ui/PixelIcon';
import { PixelCheckbox } from '../ui/PixelCheckbox';

interface FocusPickerProps {
  /** The focus picked, or undefined for each drill's natural mix. */
  value: Currency | undefined;
  onChange: (focus: Currency | undefined) => void;
}

export function FocusPicker({ value, onChange }: FocusPickerProps): React.JSX.Element {
  const options: Array<{
    key: Currency | undefined;
    id: string;
    label: string;
    icon: React.JSX.Element;
  }> = [
    {
      key: undefined,
      id: 'natural',
      label: 'Natural',
      icon: <PixelIcon grid={BALL_ICON} color={ICON_PALETTE.y} scale={1} />,
    },
    ...CURRENCIES.map((c) => ({
      key: c,
      id: c,
      label: CURRENCY_LABELS[c],
      icon: <CurrencyIcon currency={c} />,
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="training-focus">
      <span className="text-[10px] uppercase tracking-widest text-pixel-text-muted mr-1">
        Focus
      </span>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <button
            key={option.id}
            type="button"
            data-testid={`training-focus-${option.id}`}
            data-selected={selected}
            aria-pressed={selected}
            onClick={() => onChange(option.key)}
            className={`flex items-center gap-1.5 px-2 py-1.5 border-2 bg-pixel-card text-xs font-bold text-pixel-text transition-colors ${
              selected
                ? 'border-pixel-accent'
                : 'border-pixel-border [@media(hover:hover)]:hover:border-pixel-accent'
            }`}
          >
            <PixelCheckbox checked={selected} className="w-4 h-4" />
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
