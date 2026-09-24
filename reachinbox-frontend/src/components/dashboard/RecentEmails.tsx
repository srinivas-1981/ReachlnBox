import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ScheduledEmail } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';

interface RecentEmailsProps {
  emails: ScheduledEmail[];
}

export const RecentEmails: React.FC<RecentEmailsProps> = ({ emails }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100">
        <div>
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Recent Campaigns & Deliveries
          </h2>
        </div>
        <Link
          href="/dashboard/scheduled"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-medium text-[11px]">
            <tr>
              <th scope="col" className="py-2.5 px-4 sm:px-6 font-medium w-[28%] min-w-[180px]">Recipient</th>
              <th scope="col" className="py-2.5 px-4 sm:px-6 font-medium w-[42%] min-w-[240px]">Subject</th>
              <th scope="col" className="py-2.5 px-4 sm:px-6 font-medium w-[20%] min-w-[150px]">Scheduled For</th>
              <th scope="col" className="py-2.5 px-4 sm:px-6 font-medium text-right w-[10%] min-w-[90px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {emails.slice(0, 5).map((email) => (
              <tr key={email.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-4 sm:px-6 font-medium text-slate-900 truncate max-w-xs">
                  {email.recipient}
                </td>
                <td className="py-2.5 px-4 sm:px-6 text-slate-600 truncate max-w-md">
                  {email.subject}
                </td>
                <td className="py-2.5 px-4 sm:px-6 text-slate-500 whitespace-nowrap">
                  {formatDateTime(email.scheduledAt)}
                </td>
                <td className="py-2.5 px-4 sm:px-6 text-right whitespace-nowrap">
                  <Badge status={email.status} dot />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
