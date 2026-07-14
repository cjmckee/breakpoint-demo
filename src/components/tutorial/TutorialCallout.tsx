import React from 'react';

interface TutorialCalloutProps {
  step: number;
  totalSteps: number;
  title: string;
  body: string;
  onNext: () => void;
  /** When provided, a Back button is shown alongside Next (hidden if canGoBack is false). */
  onBack?: () => void;
  canGoBack?: boolean;
  /** Label for the button on the final step. Defaults to 'Got It'. */
  finalLabel?: string;
  /** Overrides the automatic Next/finalLabel text entirely, e.g. for multi-section flows. */
  nextLabel?: string;
}

/**
 * The yellow bordered step card used by tutorial spotlights.
 * Handles the step counter, dot indicators, title, body, and Back/Next buttons.
 * Positioning (inline vs fixed overlay) is left to the caller.
 */
export const TutorialCallout: React.FC<TutorialCalloutProps> = ({
  step,
  totalSteps,
  title,
  body,
  onNext,
  onBack,
  canGoBack = false,
  finalLabel = 'Got It',
  nextLabel,
}) => {
  const buttonLabel = nextLabel ?? (step === totalSteps - 1 ? finalLabel : 'Next');

  return (
    <div className="border-4 border-yellow-400 bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-yellow-400 tracking-widest uppercase">
          Tutorial — Step {step + 1} / {totalSteps}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i === step ? 'bg-yellow-400' : 'bg-gray-600'}`}
            />
          ))}
        </div>
      </div>
      <h3 className="text-base font-bold text-yellow-300 mb-1">{title}</h3>
      <p className="text-sm text-gray-200 leading-relaxed mb-3">{body}</p>
      {onBack ? (
        <div className="flex justify-between gap-3">
          {canGoBack ? (
            <button
              onClick={onBack}
              className="flex-1 border-2 border-yellow-400 hover:bg-yellow-400 hover:bg-opacity-10 text-yellow-400 font-bold py-2 px-4 text-sm tracking-wide transition-colors"
            >
              Back
            </button>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={onNext}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 px-4 text-sm tracking-wide transition-colors"
          >
            {buttonLabel}
          </button>
        </div>
      ) : (
        <button
          onClick={onNext}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 px-4 text-sm tracking-wide transition-colors"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
};
