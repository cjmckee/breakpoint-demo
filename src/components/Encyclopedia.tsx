/**
 * Encyclopedia Component
 * Sections containing tennis terms, stats guide, etc.
 */

import React, { useState, useEffect } from 'react';
import { useMenuModal, type EncyclopediaSectionId } from '../hooks/useMenuModal';
import { UnseenBadge } from './ui/UnseenBadge';
import { TENNIS_TERMS, STATS_GUIDE, SURFACE_GUIDE, SCORING_GUIDE, type GlossarySection } from '../data/glossary';

const SECTION_CONTENT: Record<EncyclopediaSectionId, GlossarySection[]> = {
  'scoring': SCORING_GUIDE,
  'tennis-terms': TENNIS_TERMS,
  'stats-guide': STATS_GUIDE,
  'surface-guide': SURFACE_GUIDE,
  'relationships': [],
};

export const Encyclopedia: React.FC = () => {
  const { encyclopediaSections, markSectionSeen } = useMenuModal();
  const revealedSections = encyclopediaSections.filter((s) => s.isRevealed);
  const [activeSection, setActiveSection] = useState<EncyclopediaSectionId | null>(
    revealedSections[0]?.id || null
  );

  // Mark the first section as seen when encyclopedia opens
  useEffect(() => {
    if (revealedSections.length > 0 && revealedSections[0].isNew) {
      markSectionSeen(revealedSections[0].id);
    }
  }, []);

  const handleSectionClick = (sectionId: EncyclopediaSectionId) => {
    setActiveSection(sectionId);
    markSectionSeen(sectionId);
  };

  if (revealedSections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-pixel-text-muted">No encyclopedia sections available yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-pixel-border shrink-0">
        {revealedSections.map((section) => (
          <button
            key={section.id}
            onClick={() => handleSectionClick(section.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm font-bold transition-colors ${
                activeSection === section.id
                  ? 'bg-pixel-accent text-white'
                  : 'bg-pixel-bg-dark text-pixel-text-muted hover:text-pixel-text'
            }`}
          >
            <span>{section.icon}</span>
            <span>{section.label}</span>
            {section.isNew && <UnseenBadge size="sm" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection && SECTION_CONTENT[activeSection]?.length > 0 ? (
          <GlossaryContent sections={SECTION_CONTENT[activeSection]} />
        ) : activeSection === 'relationships' ? (
          <div className="text-center py-8">
            <p className="text-pixel-text-muted">Relationships system coming soon!</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-pixel-text-muted">Select a section to view its content.</p>
          </div>
        )}
      </div>
    </div>
  );
};

function GlossaryContent({ sections }: { sections: GlossarySection[] }) {
  return (
    <div className="space-y-6 pb-4">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-bold text-pixel-accent mb-3 uppercase tracking-wider sticky top-0 bg-pixel-card pb-2">
            {section.title}
          </h3>
          <div className="space-y-3">
            {section.entries.map((entry) => (
              <div key={entry.term} className="bg-pixel-bg-dark rounded p-3">
                <div className="font-bold text-pixel-text mb-1">{entry.term}</div>
                <div className="text-sm text-pixel-text-muted">{entry.definition}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
