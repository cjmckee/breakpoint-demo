/**
 * Tutorial Guide Modal
 * Standalone, replayable walkthrough of the match tutorial content — lets a
 * player revisit how match mechanics work without needing to replay a match.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { TutorialCallout } from './TutorialCallout';
import { LIVE_MATCH_TUTORIAL_STEPS, KM_TUTORIAL_STEPS, KM_RESULT_STEPS } from '../../data/tutorialSteps';

interface GuideSection {
  title: string;
  steps: { title: string; body: string }[];
}

const SECTIONS: GuideSection[] = [
  { title: 'During the Match', steps: LIVE_MATCH_TUTORIAL_STEPS },
  { title: 'Making a Decision', steps: KM_TUTORIAL_STEPS },
  { title: 'After the Point', steps: KM_RESULT_STEPS },
];

interface TutorialGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialGuideModal: React.FC<TutorialGuideModalProps> = ({ isOpen, onClose }) => {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSectionIndex(0);
      setStepIndex(0);
    }
  }, [isOpen]);

  const section = SECTIONS[sectionIndex];
  const step = section.steps[stepIndex];
  const isLastStepInSection = stepIndex === section.steps.length - 1;
  const isLastSection = sectionIndex === SECTIONS.length - 1;
  const canGoBack = sectionIndex > 0 || stepIndex > 0;

  const handleNext = () => {
    if (!isLastStepInSection) {
      setStepIndex(stepIndex + 1);
    } else if (!isLastSection) {
      setSectionIndex(sectionIndex + 1);
      setStepIndex(0);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else if (sectionIndex > 0) {
      const prevSection = SECTIONS[sectionIndex - 1];
      setSectionIndex(sectionIndex - 1);
      setStepIndex(prevSection.steps.length - 1);
    }
  };

  const nextLabel = isLastStepInSection ? (isLastSection ? 'Finish' : 'Next Section →') : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Match Tutorial" size="md">
      <div className="space-y-3">
        <div className="text-xs font-bold text-pixel-text-muted uppercase tracking-wider">
          Section {sectionIndex + 1} of {SECTIONS.length}: {section.title}
        </div>
        <TutorialCallout
          step={stepIndex}
          totalSteps={section.steps.length}
          title={step.title}
          body={step.body}
          onNext={handleNext}
          onBack={handleBack}
          canGoBack={canGoBack}
          nextLabel={nextLabel}
        />
      </div>
    </Modal>
  );
};
