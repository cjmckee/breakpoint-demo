/**
 * Currency display shared by every screen that shows training currency: the
 * Development screen, the wallet chip, and (later in the stack) training,
 * match, story and shop results.
 */

import React from 'react';
import type { Currency, CurrencyAmounts as Amounts } from '../../types/game';
import { CURRENCIES, CURRENCY_LABELS } from '../../config/economy';

/** One look per currency, used everywhere the currency appears. */
export const CURRENCY_STYLE: Record<Currency, { icon: string; text: string; short: string }> = {
  power: { icon: '💪', text: 'text-red-400', short: 'P' },
  quickness: { icon: '⚡', text: 'text-green-400', short: 'Q' },
  technique: { icon: '🎯', text: 'text-purple-300', short: 'T' },
  mind: { icon: '🧠', text: 'text-yellow-300', short: 'M' },
};

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
            className={`inline-flex items-center gap-0.5 font-bold ${style.text} ${
              short.includes(c) ? 'ring-2 ring-pixel-error px-1' : ''
            }`}
            data-short={short.includes(c) || undefined}
            title={CURRENCY_LABELS[c]}
            data-currency={c}
            data-amount={v}
          >
            <span aria-hidden="true">{style.icon}</span>
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
