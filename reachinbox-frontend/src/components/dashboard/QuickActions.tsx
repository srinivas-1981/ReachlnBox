import React from 'react';
import Link from 'next/link';
import { CalendarClock, Send, MessageSquare } from 'lucide-react';

export const QuickActions: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
      <span className="text-slate-400 font-medium mr-1">Shortcuts:</span>
      <Link
        href="/dashboard/scheduled"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
      >
        <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
        <span>Scheduled Deliveries</span>
      </Link>
      <Link
        href="/dashboard/sent"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
      >
        <Send className="h-3.5 w-3.5 text-slate-400" />
        <span>Sent History</span>
      </Link>
      <Link
        href="/dashboard/slack"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
      >
        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
        <span>Slack Alerts</span>
      </Link>
    </div>
  );
};
