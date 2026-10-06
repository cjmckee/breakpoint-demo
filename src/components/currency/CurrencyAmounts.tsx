/**
 * Currency display shared by every screen that shows training currency: the
 * Development screen, the wallet chip, and (later in the stack) training,
 * match, story and shop results.
 */

import React from 'react';
import type { Currency, CurrencyAmounts as Amounts } from '../../types/game';
import { CURRENCIES, CURRENCY_LABELS } from '../../config/economy';

/**
 * One look per currency, used everywhere the currency appears. None of them is
 * red: red is reserved for a loss, so a loss reads as one at a glance.
 */
export const CURRENCY_STYLE: Record<Currency, { icon: string; text: string; short: string }> = {
  power: { icon: '💪', text: 'text-orange-400', short: 'P' },
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
}

/** A row of amounts in currency order, skipping zeros. Renders nothing when all are zero. */
export const CurrencyAmounts: React.FC<CurrencyAmountsProps> = ({
  amounts,
  signed = false,
  labelled = false,
  className = '',
  testId,
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
            className={`inline-flex items-center gap-0.5 font-bold ${v < 0 ? 'text-pixel-error' : style.text}`}
            title={CURRENCY_LABELS[c]}
            data-currency={c}
            data-amount={v}
            data-loss={v < 0 || undefined}
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
