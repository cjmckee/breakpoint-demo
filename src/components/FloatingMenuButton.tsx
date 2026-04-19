/**
 * Floating Menu Button
 * Global menu access button visible on all screens
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMenuModal } from '../hooks/useMenuModal';
import { UnseenBadge } from './ui/UnseenBadge';

export const FloatingMenuButton: React.FC = () => {
  const { openMenu, hasAnyNewSection } = useMenuModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const button = (
    <button
      onClick={() => openMenu()}
      className="fixed w-14 h-14 bg-pixel-card border-4 border-pixel-border rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-pixel-secondary transition-colors"
      style={{ bottom: '1.5rem', right: '1.5rem', zIndex: 40 }}
      title="Open Menu (ESC)"
    >
      ☰
      {hasAnyNewSection && (
        <UnseenBadge className="absolute -top-2 -right-2" />
      )}
    </button>
  );

  return createPortal(button, document.body);
};

export const FloatingMenuButtonWithPointerEvents: React.FC = () => {
  const { openMenu, closeMenu, isOpen, hasAnyNewSection } = useMenuModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleClick = () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const button = (
    <button
      onClick={handleClick}
      className="fixed w-14 h-14 bg-pixel-card border-4 border-pixel-border rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-pixel-secondary transition-colors"
      style={{ bottom: '1.5rem', right: '1.5rem', zIndex: 99999, pointerEvents: 'auto' }}
      title={isOpen ? "Close Menu (ESC)" : "Open Menu (ESC)"}
    >
      ☰
      {hasAnyNewSection && (
        <UnseenBadge className="absolute -top-2 -right-2" />
      )}
    </button>
  );

  return createPortal(button, document.body);
};
