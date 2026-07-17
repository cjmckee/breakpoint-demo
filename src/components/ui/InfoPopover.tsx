/**
 * InfoPopover Component
 * A lightweight description reveal: shows on hover on pointer devices, and toggles
 * on tap on touch devices (tap again, tap outside, or Escape to close).
 *
 * Used as the shared "no info crammed on the face, reveal on demand" pattern across
 * stat cards, stat tiles, and ability cards.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface InfoPopoverProps {
  /** Rich content shown inside the popover panel */
  content: React.ReactNode;
  /** The trigger — the card/tile/chip face */
  children: React.ReactNode;
  /** Accessible label for the trigger button */
  ariaLabel?: string;
  /** Extra classes on the wrapper (e.g. sizing to fill a grid cell) */
  className?: string;
  /** Width/spacing classes for the popover panel */
  panelClassName?: string;
}

// Touch-only devices can't hover, so they toggle on tap instead. Evaluated once —
// pointer capability doesn't meaningfully change within a session.
const canHover =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover)').matches;

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  content,
  children,
  ariaLabel,
  className = '',
  panelClassName = 'w-56',
}) => {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Before paint, flip the panel above the trigger if it would run off the bottom of
  // the viewport (e.g. the last rows of the stat matrix).
  useLayoutEffect(() => {
    if (!open) return;
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    if (!wrapper || !panel) return;

    const triggerRect = wrapper.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Need room for the panel plus its 8px offset; prefer above only when it fits
    // better there.
    const flipAbove = spaceBelow < panelHeight + 12 && spaceAbove > spaceBelow;
    setPlacement(flipAbove ? 'top' : 'bottom');
  }, [open]);

  // On touch devices, dismiss the popover on outside tap or Escape.
  useEffect(() => {
    if (!open || canHover) return;

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const hoverHandlers = canHover
    ? {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
        onFocus: () => setOpen(true),
        onBlur: () => setOpen(false),
      }
    : {};

  const handleClick = canHover ? undefined : () => setOpen((prev) => !prev);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={handleClick}
        className="block w-full h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-pixel-accent"
        {...hoverHandlers}
      >
        {children}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="tooltip"
          className={`absolute z-50 left-1/2 -translate-x-1/2 ${
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${panelClassName} max-w-[80vw] p-3 bg-pixel-bg border-2 border-pixel-accent shadow-xl text-xs text-pixel-text leading-relaxed text-left pointer-events-none`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
