import React from 'react';
import { cn } from '@/lib/utils';

interface StatItemProps {
  label: string;
  value: number | string;
  subtext?: string;
  className?: string;
}

export const StatCard: React.FC<StatItemProps> = ({
  label,
  value,
  subtext,
  className,
}) => {
  return (
    <div className={cn('px-4 py-2 sm:py-0', className)}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-semibold text-slate-900 tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {subtext && (
          <span className="text-xs text-slate-400 font-normal">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
