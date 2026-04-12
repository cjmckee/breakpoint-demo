/**
 * Feedback Modal
 *
 * Embeds the Giscus comment widget so users can leave feedback.
 * Comments are stored in GitHub Discussions on the project's repo, which
 * means moderation is done from the GitHub UI (delete/lock posts there).
 *
 * SETUP REQUIRED before this works in production:
 * 1. The repo must be PUBLIC.
 * 2. Enable "Discussions" on the repo (Settings → Features → Discussions).
 * 3. Install the giscus app on the repo: https://github.com/apps/giscus
 * 4. Visit https://giscus.app, enter the repo, choose a Discussion category
 *    (the "Announcements" type is recommended so only maintainers can start
 *    new threads — users will reply to a single pinned thread per page).
 * 5. Copy the generated `data-repo-id` and `data-category-id` values into
 *    the GISCUS_CONFIG constant below.
 */

import React, { useEffect, useRef } from 'react';
import { Modal } from './ui/Modal';

// ---------------------------------------------------------------------------
// Giscus configuration — fill these in after running through giscus.app
// ---------------------------------------------------------------------------
const GISCUS_CONFIG = {
  repo: 'cjmckee/breakpoint-demo',
  repoId: 'R_kgDOQQI31w',
  category: 'General',
  categoryId: 'DIC_kwDOQQI3184C6sQg',
  mapping: 'pathname',
  strict: '0',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'top',
  theme: 'dark_dimmed',
  lang: 'en',
} as const;

const GISCUS_SCRIPT_SRC = 'https://giscus.app/client.js';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Inject the Giscus script once the modal opens. Giscus reads its config
  // from data-* attributes on its own <script> tag, so we recreate the script
  // each time the container mounts.
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = GISCUS_SCRIPT_SRC;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', GISCUS_CONFIG.repo);
    script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId);
    script.setAttribute('data-category', GISCUS_CONFIG.category);
    script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId);
    script.setAttribute('data-mapping', GISCUS_CONFIG.mapping);
    script.setAttribute('data-strict', GISCUS_CONFIG.strict);
    script.setAttribute('data-reactions-enabled', GISCUS_CONFIG.reactionsEnabled);
    script.setAttribute('data-emit-metadata', GISCUS_CONFIG.emitMetadata);
    script.setAttribute('data-input-position', GISCUS_CONFIG.inputPosition);
    script.setAttribute('data-theme', GISCUS_CONFIG.theme);
    script.setAttribute('data-lang', GISCUS_CONFIG.lang);

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Feedback & Comments" size="lg">
      <div className="space-y-4">
        <div className="text-sm text-pixel-text-muted space-y-2">
          <p>
            Have a bug to report, an idea for the game, or just want to say hi?
            Leave a comment below — you'll need a free GitHub account to post.
          </p>
          <p>
            Comments are public and stored in this project's GitHub Discussions.
          </p>
        </div>

        <div
          ref={containerRef}
          className="bg-pixel-card border-2 border-pixel-border p-3 min-h-[200px]"
        />
      </div>
    </Modal>
  );
};
