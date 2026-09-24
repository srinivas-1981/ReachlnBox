'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharacterCount?: boolean;
  maxCharacters?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCharacterCount = false,
      maxCharacters,
      value,
      defaultValue,
      id,
      required,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [charCount, setCharCount] = React.useState<number>(() => {
      if (typeof value === 'string') return value.length;
      if (typeof defaultValue === 'string') return defaultValue.length;
      return 0;
    });

    React.useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          {label && (
            <label htmlFor={textareaId} className="block text-xs font-medium text-slate-700">
              {label}
              {required && <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>}
            </label>
          )}
          {showCharacterCount && (
            <span className="text-[11px] text-slate-400">
              {charCount} {maxCharacters ? `/ ${maxCharacters}` : 'chars'}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          className={cn(
            'block w-full rounded-md border bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-colors',
            'focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400',
            error
              ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-400'
              : 'border-slate-200 hover:border-slate-300',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed resize-y min-h-[140px]',
            className
          )}
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="mt-1 text-xs text-rose-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="mt-1 text-[11px] text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
