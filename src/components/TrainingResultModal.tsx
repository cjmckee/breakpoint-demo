/**
 * Training Result Modal
 * Shows detailed feedback after completing a training session
 */

import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { TrainingResult } from '../types/game';
import { CurrencyAmounts } from './currency/CurrencyAmounts';
import { PixelIcon } from './ui/PixelIcon';
import { GLYPHS, ICON_PALETTE, MENU_ICONS } from '../data/pixelIcons';

interface TrainingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TrainingResult | null;
}

export const TrainingResultModal: React.FC<TrainingResultModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!result) return null;

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'gold':
        return 'text-yellow-400 border-yellow-400';
      case 'silver':
        return 'text-gray-400 border-gray-400';
      case 'bronze':
        return 'text-orange-600 border-orange-600';
      default:
        return 'text-pixel-text border-pixel-border';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Training Complete!"
      size="notice"
      footer={
        <Button variant="primary" fullWidth onClick={onClose} testId="training-result-dismiss">
          Back to Menu
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Success Message */}
        <div className="text-center">
          <PixelIcon
            grid={MENU_ICONS.training}
            palette={ICON_PALETTE}
            scale={4}
            className="mx-auto mb-4"
          />
          <p className="text-xl font-bold text-pixel-text mb-2">{result.message}</p>
          <div
            className={`inline-block px-4 py-2 border-4 ${getTierColor(result.sessionTier)} font-bold text-lg`}
            data-testid="training-result-tier"
            data-tier={result.sessionTier}
          >
            {result.sessionTier.toUpperCase()} TIER
          </div>
        </div>

        {/* Currency earned is the point of the session, so it gets the room; energy
            and mood ride along as small chips underneath. */}
        <div className="bg-pixel-card border-4 border-pixel-border p-4 text-center">
          <CurrencyAmounts
            amounts={result.currencyGained}
            signed
            labelled
            className="text-2xl justify-center"
            testId="training-result-currency"
          />
          <div className="flex justify-center gap-2 mt-3 text-sm font-bold">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border-2 border-pixel-border bg-pixel-bg">
              <PixelIcon grid={GLYPHS.energy} scale={1} className="text-yellow-300" />
              <span className="text-pixel-error">-{result.energyCost}</span>
            </span>
            {result.moodChange !== 0 && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border-2 border-pixel-border bg-pixel-bg">
                <PixelIcon
                  grid={result.moodChange > 0 ? GLYPHS.smile : GLYPHS.frown}
                  scale={1}
                  className={result.moodChange > 0 ? 'text-pixel-success' : 'text-pixel-error'}
                />
                <span className={result.moodChange > 0 ? 'text-pixel-success' : 'text-pixel-error'}>
                  {result.moodChange > 0 ? '+' : ''}
                  {result.moodChange}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Ability gained */}
        {result.abilityGained && (
          <div className="bg-orange-500 bg-opacity-20 border-4 border-orange-500 p-4">
            <h3 className="text-lg font-bold text-orange-500 mb-2">NEW ABILITY UNLOCKED!</h3>
            <div className="text-2xl font-bold text-pixel-text text-center py-4">
              {result.abilityGained}
            </div>
            <p className="text-pixel-text-muted text-center text-sm">
              This ability will boost your performance in matches!
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
