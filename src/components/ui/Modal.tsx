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
 *
 * `footer` is for the modal's main action (Confirm, Continue, Go). It sits outside
 * the scrolling body, so it is on screen however long the content runs — a modal
 * should never need text telling the player where its button is.
 */

import React, { useEffect } from 'react';

/**
 * Marks the body while any modal is open. On a phone the floating menu button
 * sits exactly where a modal's footer and the Peek/Hide bar dock, so CSS hides it
 * while this is set (index.css). Counted, because modals can stack.
 */
function useModalOpenMarker(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) return;
    const body = document.body;
    body.dataset.openModals = String(Number(body.dataset.openModals ?? 0) + 1);
    return () => {
      const left = Number(body.dataset.openModals ?? 1) - 1;
      if (left > 0) body.dataset.openModals = String(left);
      else delete body.dataset.openModals;
    };
  }, [isOpen]);
}

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  size?: 'notice' | 'scene';
  belowContent?: React.ReactNode;
  /** The main action, docked under the body so it never scrolls out of view. */
  footer?: React.ReactNode;
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
  footer,
  testId,
}) => {
  useModalOpenMarker(isOpen);

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
        {/* The box stops short of the viewport bottom by enough to keep belowContent
            (Peek / Hide) on screen too. */}
        <div
          className={`bg-pixel-bg border-8 border-pixel-border w-full flex flex-col ${
            belowContent
              ? 'max-h-[calc(100dvh-6rem)] sm:max-h-[calc(94vh-5rem)]'
              : 'max-h-[calc(100dvh-2rem)] sm:max-h-[88vh]'
          }`}
        >
          {/* Header — omitted when there's no title and no close button */}
          {(title || (showCloseButton && onClose)) && (
            <div className="bg-pixel-card border-b-4 border-pixel-border p-4 flex items-center justify-between shrink-0">
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
          <div className="p-4 sm:p-6 overflow-y-auto min-h-0">{children}</div>

          {footer && (
            <div className="shrink-0 border-t-4 border-pixel-border bg-pixel-card px-4 py-3 sm:px-6">
              {footer}
            </div>
          )}
        </div>

        {belowContent && <div className="w-full mt-3">{belowContent}</div>}
      </div>
    </div>
  );
};
