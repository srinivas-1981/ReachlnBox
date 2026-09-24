import React from 'react';
import { cn } from '@/lib/utils';
import { EmailStatus } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  status?: EmailStatus;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  status,
  dot = true,
  children,
  ...props
}) => {
  let activeVariant: 'success' | 'warning' | 'error' | 'info' | 'neutral' = 'neutral';

  if (status) {
    switch (status) {
      case 'draft':
        activeVariant = 'neutral';
        break;
      case 'scheduled':
        activeVariant = 'warning';
        break;
      case 'active':
        activeVariant = 'success';
        break;
      case 'processing':
        activeVariant = 'info';
        break;
      case 'paused':
        activeVariant = 'neutral';
        break;
      case 'completed':
        activeVariant = 'success';
        break;
      case 'sent':
        activeVariant = 'success';
        break;
      case 'failed':
        activeVariant = 'error';
        break;
    }
  } else if (variant) {
    activeVariant = variant === 'default' ? 'neutral' : variant;
  }

  const styles = {
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    error: 'bg-rose-50 text-rose-700 border-rose-100',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const dotStyles = {
    info: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    neutral: 'bg-slate-400',
  };

  const statusLabels: Record<EmailStatus, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    active: 'Active',
    processing: 'Processing',
    paused: 'Paused',
    completed: 'Completed',
    sent: 'Sent',
    failed: 'Failed',
  };

  const content = children || (status ? statusLabels[status] : '');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border capitalize select-none',
        styles[activeVariant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotStyles[activeVariant])} />}
      <span>{content}</span>
    </span>
  );
};
