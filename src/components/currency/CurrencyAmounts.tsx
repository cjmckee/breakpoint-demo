/**
 * Currency display shared by every screen that shows training currency: the
 * Development screen, the wallet chip, and (later in the stack) training,
 * match, story and shop results.
 */

import React from 'react';
import type { Currency, CurrencyAmounts as Amounts } from '../../types/game';
import { CURRENCIES, CURRENCY_LABELS } from '../../config/economy';
import { CURRENCY_ICONS } from '../../data/pixelIcons';
import { PixelIcon } from '../ui/PixelIcon';

/**
 * One look per currency, used everywhere the currency appears. None of them is
 * red: red is reserved for a loss, so a loss reads as one at a glance. `colour` is
 * `text` as a hex, for the icon, which keeps its colour when the amount turns red.
 */
export const CURRENCY_STYLE: Record<Currency, { text: string; colour: string; short: string }> = {
  power: { text: 'text-orange-400', colour: '#fb923c', short: 'P' },
  quickness: { text: 'text-green-400', colour: '#4ade80', short: 'Q' },
  technique: { text: 'text-purple-300', colour: '#d8b4fe', short: 'T' },
  mind: { text: 'text-yellow-300', colour: '#fde047', short: 'M' },
};

/** A currency's pixel icon in its own colour. `scale` 1 sits in small text, 2 in headings. */
export const CurrencyIcon: React.FC<{ currency: Currency; scale?: number; className?: string }> = ({
  currency,
  scale = 1,
  className,
}) => (
  <PixelIcon
    grid={CURRENCY_ICONS[currency]}
    color={CURRENCY_STYLE[currency].colour}
    scale={scale}
    className={className}
  />
);

interface CurrencyAmountsProps {
  amounts: Amounts;
  /** Show a + on gains (results), or plain numbers (prices). */
  signed?: boolean;
  /** Full currency names instead of icons alone. */
  labelled?: boolean;
  className?: string;
  testId?: string;
  /** Currencies the viewer can't cover, outlined in the error colour (prices only). */
  short?: readonly Currency[];
}

/** A row of amounts in currency order, skipping zeros. Renders nothing when all are zero. */
export const CurrencyAmounts: React.FC<CurrencyAmountsProps> = ({
  amounts,
  signed = false,
  labelled = false,
  className = '',
  testId,
  short = [],
}) => {
  const shown = CURRENCIES.filter((c) => Math.round(amounts[c] ?? 0) !== 0);
  if (shown.length === 0) return null;
  return (
    <span
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}
      data-testid={testId}
    >
      {shown.map((c) => {
        const v = Math.round(amounts[c] ?? 0);
        const style = CURRENCY_STYLE[c];
        return (
          <span
            key={c}
            className={`inline-flex items-center gap-0.5 font-bold ${
              v < 0 ? 'text-pixel-error' : style.text
            } ${short.includes(c) ? 'ring-2 ring-pixel-error px-1' : ''}`}
            data-short={short.includes(c) || undefined}
            title={CURRENCY_LABELS[c]}
            data-currency={c}
            data-amount={v}
            data-loss={v < 0 || undefined}
          >
            <CurrencyIcon currency={c} />
            {signed && v > 0 ? '+' : ''}
            {v}
            {labelled && (
              <span className="font-normal text-pixel-text-muted ml-0.5">{CURRENCY_LABELS[c]}</span>
            )}
          </span>
        );
      })}
    </span>
  );
};
