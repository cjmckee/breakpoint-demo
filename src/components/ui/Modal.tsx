/**
 * Modal Component
 *
 * Two sizes, so a chain of modals (story event → result → item → hangout) does
 * not grow and shrink around the player:
 * - `notice`: a single fact to acknowledge — an item, a hangout, a training result.
 * - `scene`: something to read or decide — story events and their results, key
 *   moments, match results.
 *
 * Modals hang from a fixed top edge rather than centring, so when one replaces
 * another of a different height the title and the start of the text stay put.
 */

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  size?: 'notice' | 'scene';
  belowContent?: React.ReactNode;
  /** Stable hook for e2e. See the test id convention in CLAUDE.md. */
  testId?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  size = 'notice',
  belowContent,
  testId,
}) => {
  if (!isOpen) return null;

  const sizeStyles = {
    notice: 'max-w-2xl',
    scene: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-[6vh]"
      role="dialog"
      aria-modal="true"
      aria-label={title || undefined}
      data-testid={testId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={showCloseButton ? onClose : undefined}
      />

      {/* Modal content + optional below-content */}
      <div className={`relative flex flex-col items-center ${sizeStyles[size]} w-full mx-4`}>
        <div className="bg-pixel-bg border-8 border-pixel-border w-full max-h-[calc(100vh-2rem)] sm:max-h-[88vh] overflow-y-auto">
          {/* Header — omitted when there's no title and no close button */}
          {(title || (showCloseButton && onClose)) && (
            <div className="bg-pixel-card border-b-4 border-pixel-border p-4 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-pixel-text">{title}</h2>
              {showCloseButton && onClose && (
                <button
                  onClick={onClose}
                  className="text-pixel-text hover:text-pixel-accent text-3xl font-bold leading-none"
                  aria-label="Close modal"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-6">{children}</div>
        </div>

        {belowContent && <div className="w-full mt-3">{belowContent}</div>}
      </div>
    </div>
  );
};
