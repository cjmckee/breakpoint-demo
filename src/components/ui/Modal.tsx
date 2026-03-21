/**
 * Modal Component
 * Modal dialog for key moments and other important choices
 */

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={showCloseButton ? onClose : undefined}
      />

      {/* Modal content */}
      <div
        className={`relative bg-pixel-bg border-8 border-pixel-border ${sizeStyles[size]} w-full mx-4 max-h-[90vh] overflow-y-auto`}
      >
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
    </div>
  );
};
