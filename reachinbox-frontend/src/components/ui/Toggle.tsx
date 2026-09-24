'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  showStatusBadge?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  showStatusBadge = true,
  className,
}) => {
  const generatedId = React.useId();
  const toggleId = id || generatedId;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className={cn('flex items-start justify-between gap-4 py-2.5', className)}>
      {(label || description) && (
        <div className="flex-1 pr-2 select-none">
          {label && (
            <label
              htmlFor={toggleId}
              className={cn(
                'text-xs font-medium text-slate-900 block',
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={cn('text-[11px] text-slate-500 mt-0.5', disabled && 'opacity-60')}>
              {description}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 shrink-0">
        {showStatusBadge && (
          <span
            aria-hidden="true"
            className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded border select-none transition-colors',
              checked
                ? 'bg-slate-100 text-slate-800 border-slate-200'
                : 'bg-white text-slate-400 border-slate-200'
            )}
          >
            {checked ? 'ON' : 'OFF'}
          </span>
        )}

        <button
          type="button"
          role="switch"
          id={toggleId}
          aria-checked={checked}
          aria-label={label || 'Toggle switch'}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onClick={() => onChange(!checked)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400',
            disabled && 'opacity-50 cursor-not-allowed',
            checked ? 'bg-slate-900' : 'bg-slate-200'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-2xs ring-0 transition duration-200 ease-in-out',
              checked ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>
    </div>
  );
};
