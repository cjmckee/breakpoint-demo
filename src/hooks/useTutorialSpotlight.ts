import { useState, useRef, useEffect, useCallback } from 'react';

export interface TutorialStep<T extends string> {
  target: T;
  title: string;
  body: string;
}

interface UseTutorialSpotlightResult<T extends string> {
  currentStep: number | null;
  activeStep: TutorialStep<T> | null;
  isActive: boolean;
  isSpotlit: (target: T) => boolean;
  isDimmed: (target: T) => boolean;
  next: () => void;
}

/**
 * Manages a sequential spotlight tutorial over named UI sections.
 *
 * Automatically opens (step 0) the first time `shouldOpen` is true, then
 * stays open until the user advances through all steps. A ref guard prevents
 * re-opening if `shouldOpen` toggles again after the tutorial is dismissed.
 *
 * @param steps     Ordered list of steps, each with a `target` section name.
 * @param shouldOpen  Condition under which the tutorial should auto-open.
 * @param onComplete  Optional callback fired when the last step is dismissed.
 */
export function useTutorialSpotlight<T extends string>(
  steps: TutorialStep<T>[],
  shouldOpen: boolean,
  onComplete?: () => void,
): UseTutorialSpotlightResult<T> {
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (shouldOpen && !hasOpenedRef.current) {
      hasOpenedRef.current = true;
      setCurrentStep(0);
    }
  }, [shouldOpen]);

  const activeStep = currentStep !== null ? steps[currentStep] : null;
  const isActive = currentStep !== null;

  const next = useCallback(() => {
    if (currentStep === null) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(null);
      onComplete?.();
    }
  }, [currentStep, steps.length, onComplete]);

  const isSpotlit = (target: T) => activeStep?.target === target;
  const isDimmed  = (target: T) => isActive && !isSpotlit(target);

  return { currentStep, activeStep, isActive, isSpotlit, isDimmed, next };
}
