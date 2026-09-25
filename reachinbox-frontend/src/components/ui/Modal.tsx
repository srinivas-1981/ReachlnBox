'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  isConfirmLoading?: boolean;
  confirmVariant?: 'primary' | 'danger';
  maxWidth?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  isConfirmLoading = false,
  confirmVariant = 'primary',
  maxWidth = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isConfirmLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isConfirmLoading, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4"
    >
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-150"
        onClick={isConfirmLoading ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className={cn(
          'relative w-full bg-white rounded-xl shadow-xl border border-slate-200 p-4 sm:p-5 z-10 text-left transition-all duration-150 animate-in fade-in zoom-in-95 max-h-[90dvh] overflow-y-auto min-w-0',
          maxWidths[maxWidth]
        )}
      >
        <div className="flex items-start justify-between pb-2.5 border-b border-slate-100">
          <div>
            <h3 id="modal-title" className="text-sm font-semibold text-slate-900">
              {title}
            </h3>
            {description && (
              <p id="modal-description" className="text-xs text-slate-500 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirmLoading}
            className="text-slate-400 hover:text-slate-600 rounded p-1 transition-colors -mr-1 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children && <div className="py-3 text-xs text-slate-600">{children}</div>}

        {(onConfirm || confirmLabel) && (
          <div className="flex items-center justify-end gap-2 pt-3 mt-1 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isConfirmLoading}
            >
              {cancelLabel}
            </Button>
            {onConfirm && (
              <Button
                variant={confirmVariant}
                size="sm"
                onClick={onConfirm}
                isLoading={isConfirmLoading}
                loadingText={confirmLabel}
              >
                {confirmLabel || 'Confirm'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
