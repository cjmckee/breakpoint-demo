/**
 * Screen Frame
 * The shared page layout for every full-screen phase: the status bar, then a title
 * row, then the screen's content in one of two column widths.
 *
 * Everything that frames a screen lives here so it sits in the same place on every
 * screen. Before this, each screen placed its own back button and picked its own
 * width, so moving between screens slid the status bar sideways and moved the
 * page title anywhere from 16px to 320px from the left edge.
 */

import React from 'react';
import { StatusBar } from '../StatusBar';
import { audioManager } from '../../audio/AudioManager';

/**
 * The two content widths. `standard` suits lists, forms and reading; `wide` is for
 * screens that lay content side by side (the menu dashboard, the inventory, the court).
 * The status bar spans `wide`, so wide screens line up with it edge to edge.
 */
export const SCREEN_WIDTHS = {
  standard: 'max-w-4xl',
  wide: 'max-w-6xl',
} as const;

export type ScreenWidth = keyof typeof SCREEN_WIDTHS;

interface ScreenFrameProps {
  /** Page heading. Omit for a screen whose content carries its own header. */
  title?: React.ReactNode;
  /** Leads the title, e.g. the trained shot's icon. */
  icon?: string;
  /** One line under the title. */
  subtitle?: React.ReactNode;
  /** Renders the back control in the title row. Its slot is reserved either way. */
  onBack?: () => void;
  /** Controls at the right end of the title row. */
  actions?: React.ReactNode;
  width?: ScreenWidth;
  /** Hide the status bar — only for screens that bring their own (the live match). */
  hideStatusBar?: boolean;
  /** Signed energy change of the screen's main action, previewed on the status bar. */
  energyPreview?: number;
  /** Extra classes for the content column, e.g. bottom room for a docked bar. */
  className?: string;
  children: React.ReactNode;
}

export const ScreenFrame: React.FC<ScreenFrameProps> = ({
  title,
  icon,
  subtitle,
  onBack,
  actions,
  width = 'standard',
  hideStatusBar = false,
  energyPreview,
  className = 'pb-24 sm:pb-8',
  children,
}) => {
  return (
    <div className="min-h-screen bg-pixel-bg">
      {!hideStatusBar && <StatusBar energyPreview={energyPreview} />}

      <main className={`${SCREEN_WIDTHS[width]} mx-auto px-4 ${className}`}>
        {title !== undefined && (
          <div className="flex items-start gap-3 mb-4">
            {/* Fixed slot: the title starts at the same x whether or not there is a way back. */}
            <div className="w-10 h-10 shrink-0">
              {onBack && (
                <button
                  onClick={() => {
                    audioManager.playSfx('ui_click');
                    onBack();
                  }}
                  className="w-10 h-10 flex items-center justify-center text-xl font-bold text-pixel-text border-4 border-pixel-border bg-pixel-secondary hover:bg-pixel-secondary-light hover:border-pixel-accent transition-colors"
                  aria-label="Back"
                  title="Back"
                  data-testid="screen-back"
                >
                  ←
                </button>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h1
                className="text-2xl sm:text-3xl font-bold text-pixel-text leading-tight truncate"
                data-testid="screen-title"
              >
                {icon && (
                  <span className="mr-2" aria-hidden="true">
                    {icon}
                  </span>
                )}
                {title}
              </h1>
              {subtitle && <p className="text-sm text-pixel-text-muted mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};
