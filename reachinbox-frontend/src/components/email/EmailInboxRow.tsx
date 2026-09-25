'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScheduledEmail, SentEmail } from '@/types';
import { cn, formatDateTime } from '@/lib/utils';

interface EmailInboxRowProps {
  email: ScheduledEmail | SentEmail;
  type?: 'scheduled' | 'sent' | 'all';
  onToggleStar?: (id: string, e: React.MouseEvent) => void;
  onPause?: (id: string, e: React.MouseEvent) => void;
  onResume?: (id: string, e: React.MouseEvent) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  onRetry?: (id: string, e: React.MouseEvent) => void;
}

export const EmailInboxRow: React.FC<EmailInboxRowProps> = ({
  email,
  onToggleStar,
}) => {
  const isScheduled = 'scheduledAt' in email;
  const scheduledEmail = isScheduled ? (email as ScheduledEmail) : null;

  const formattedTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return formatDateTime(dateStr);
    }
  };

  const isSent = email.status === 'sent';
  const isFailed = email.status === 'failed';

  return (
    <Link
      href={`/dashboard/emails/${email.id}`}
      className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-white hover:bg-slate-50/80 border-b border-slate-100 transition-colors text-xs select-none cursor-pointer overflow-hidden min-w-0"
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleStar?.(email.id, e);
        }}
        className="p-1 -ml-1 text-slate-300 hover:text-amber-400 group-hover:text-slate-400 transition-colors shrink-0"
        aria-label="Star email"
      >
        <Star
          className={cn(
            'h-4 w-4 transition-colors',
            email.starred ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
          )}
        />
      </button>

      <div className="w-20 sm:w-36 shrink-0 truncate min-w-0">
        <span className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors truncate block">
          To: {email.recipient.includes('@') ? email.recipient.split('@')[0] : email.recipient}
        </span>
      </div>

      <div className="flex-1 min-w-0 flex items-center">
        {isScheduled ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80 max-w-full truncate">
            <Clock className="h-3 w-3 text-amber-600 shrink-0" />
            <span className="truncate">
              {formattedTime(scheduledEmail?.scheduledAt)} • {email.subject} • Scheduled
            </span>
          </span>
        ) : isSent ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 max-w-full truncate">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
            <span className="truncate">
              Sent: {email.subject}
            </span>
          </span>
        ) : isFailed ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/80 max-w-full truncate">
            <AlertCircle className="h-3 w-3 text-rose-600 shrink-0" />
            <span className="truncate">
              Failed: {email.subject}
            </span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 max-w-full truncate">
            <span className="truncate">
              {email.status}: {email.subject}
            </span>
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 hidden md:block">
        <span className="text-slate-500 truncate block">
          {email.snippet ? `- ${email.snippet}` : email.body ? `- ${email.body.replace(/\n+/g, ' ')}` : ''}
        </span>
      </div>

      <div className="shrink-0 text-slate-400 group-hover:text-slate-600 text-[11px] font-medium hidden sm:block">
        <span>View</span>
      </div>
    </Link>
  );
};
