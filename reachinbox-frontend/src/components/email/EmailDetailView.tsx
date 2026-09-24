'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  Tag,
  Trash2,
  ChevronDown,
  Download,
  Reply,
  Forward,
} from 'lucide-react';
import { ScheduledEmail, SentEmail } from '@/types';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/lib/utils';

interface EmailDetailViewProps {
  email: ScheduledEmail | SentEmail;
}

export const EmailDetailView: React.FC<EmailDetailViewProps> = ({ email }) => {
  const router = useRouter();
  const toast = useToast();
  const [isStarred, setIsStarred] = useState(email.starred || false);
  const [isRecipientOpen, setIsRecipientOpen] = useState(false);

  const senderName = email.senderName || 'Amanda Clark';
  const senderEmail = email.senderEmail || 'amanda@domain.com';
  const recipientName = email.recipient.includes('@') ? email.recipient.split('@')[0] : email.recipient;

  const handleDelete = () => {
    toast.info('Email deleted from workspace.');
    router.push('/dashboard');
  };

  const handleToggleStar = () => {
    setIsStarred((prev) => !prev);
    toast.success(isStarred ? 'Unstarred email' : 'Starred email');
  };

  // Date formatted like "Mar 3, 10:23 AM"
  const formattedDate = () => {
    const rawDate = 'scheduledAt' in email ? email.scheduledAt : email.sentAt;
    try {
      const d = new Date(rawDate);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return formatDateTime(rawDate);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 overflow-hidden shadow-2xs">
      {/* Top Header Controls (Matching Screenshot Panel 4) */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back to inbox"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate tracking-tight">
            {email.subject}
          </h1>
        </div>

        {/* Action Controls on Right */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleStar}
            className="p-1.5 rounded-md text-slate-400 hover:text-amber-500 hover:bg-slate-50 transition-colors cursor-pointer"
            title={isStarred ? 'Unstar' : 'Star'}
            aria-label="Star email"
          >
            <Star className={`h-4 w-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => toast.info('Tag management')}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Add label/tag"
            aria-label="Tag email"
          >
            <Tag className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete email"
            aria-label="Delete email"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Email Sender Metadata Row */}
      <div className="px-5 sm:px-8 py-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            {/* Green Circular Initial Avatar (Matching Screenshot) */}
            <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
              {senderName.charAt(0)}
            </div>

            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-900">
                  {senderName}
                </span>
                <span className="text-xs text-slate-400">
                  &lt;{senderEmail}&gt;
                </span>
              </div>

              {/* Recipient Dropdown */}
              <div className="relative mt-0.5">
                <button
                  type="button"
                  onClick={() => setIsRecipientOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <span>to me</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {isRecipientOpen && (
                  <div className="absolute top-6 left-0 z-20 bg-white border border-slate-200 rounded-md shadow-lg p-3 text-xs text-slate-600 min-w-[240px] space-y-1 animate-in fade-in-50">
                    <p><span className="font-medium text-slate-900">from:</span> {senderName} &lt;{senderEmail}&gt;</p>
                    <p><span className="font-medium text-slate-900">to:</span> {recipientName} &lt;{email.recipient}&gt;</p>
                    <p><span className="font-medium text-slate-900">subject:</span> {email.subject}</p>
                    <p><span className="font-medium text-slate-900">date:</span> {formattedDate()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="shrink-0 text-xs text-slate-400 font-medium">
            {formattedDate()}
          </div>
        </div>
      </div>

      {/* Email Body Content Area */}
      <div className="px-5 sm:px-8 py-6 space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed max-w-4xl">
        <p>Hey Oliver,</p>
        <p>You&apos;ve just RECEIVED something</p>

        {/* Yellow/Amber Highlight Callout Banner (Matching Screenshot Panel 4) */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-md p-3.5 my-3 text-xs leading-relaxed text-amber-950 font-medium space-y-1">
          <p className="flex items-center gap-1.5 font-semibold">
            <span>★</span>
            <span>Extremely Exclusive—Only 4 Spots Worldwide Per Year | $25,000 Investment</span>
            <span>★</span>
          </p>
          <p className="text-amber-900">
            To explore securing your private transformation, simply reply right now with &apos;FLY OUT FIX&apos; -
          </p>
        </div>

        <p>Your coach for world-class performance,</p>
        <p className="font-semibold text-slate-900">Grant</p>

        <p className="text-slate-600 text-xs pt-2">
          P.S. Always remember that you can develop world class technique! 🚀
        </p>

        {/* Attachment Cards (Matching Screenshot Panel 4) */}
        <div className="pt-6 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            2 Attachments
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            {/* Attachment 1 */}
            <div className="group flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="h-12 w-12 rounded-md bg-slate-200 overflow-hidden shrink-0 border border-slate-300/60 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=120&auto=format&fit=crop&q=80"
                  alt="Tennis Coach Profile"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-900 truncate">
                  Tennis_Coach_Profile.png
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  1.2 MB
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-700">
                <button
                  type="button"
                  onClick={() => toast.success('Downloading Tennis_Coach_Profile.png')}
                  className="p-1.5 hover:bg-white rounded transition-colors"
                  title="Download attachment"
                  aria-label="Download attachment"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Attachment 2 */}
            <div className="group flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="h-12 w-12 rounded-md bg-slate-200 overflow-hidden shrink-0 border border-slate-300/60 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80"
                  alt="Tennis Coach Profile 2"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-900 truncate">
                  Tennis_Coach_Profile2.png
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  1.2 MB
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-700">
                <button
                  type="button"
                  onClick={() => toast.success('Downloading Tennis_Coach_Profile2.png')}
                  className="p-1.5 hover:bg-white rounded transition-colors"
                  title="Download attachment"
                  aria-label="Download attachment"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons at Bottom */}
        <div className="pt-6 flex items-center gap-2">
          <Link href="/dashboard/compose">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Reply className="h-3.5 w-3.5" />}
            >
              Reply
            </Button>
          </Link>

          <Link href="/dashboard/compose">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Forward className="h-3.5 w-3.5" />}
            >
              Forward
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
