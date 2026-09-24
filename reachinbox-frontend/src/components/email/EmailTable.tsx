'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, Trash2, RotateCcw } from 'lucide-react';
import { ScheduledEmail, SentEmail, EmailStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';

export type TableEmail = ScheduledEmail | SentEmail;

interface EmailTableProps {
  type: 'scheduled' | 'sent';
  emails: TableEmail[];
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
}

export const EmailTable: React.FC<EmailTableProps> = ({
  type,
  emails,
  onPause,
  onResume,
  onDelete,
  onRetry,
}) => {
  const router = useRouter();
  const isScheduled = type === 'scheduled';

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-medium text-[11px]">
            <tr>
              <th scope="col" className="py-2.5 px-4 sm:px-6 font-medium w-[26%] min-w-[180px]">Recipient</th>
              <th scope="col" className="py-2.5 px-4 sm:px-6 font-medium w-[38%] min-w-[240px]">Subject</th>
              <th scope="col" className="py-2.5 px-4 sm:px-6 font-medium w-[18%] min-w-[150px]">
                {isScheduled ? 'Scheduled For' : 'Sent Date'}
              </th>
              <th scope="col" className="py-2.5 px-4 sm:px-6 font-medium w-[10%] min-w-[100px]">Status</th>
              <th scope="col" className="py-2.5 px-4 sm:px-6 font-medium text-right w-[8%] min-w-[80px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {emails.map((email) => {
              const scheduledEmail = isScheduled ? (email as ScheduledEmail) : null;
              const sentEmail = !isScheduled ? (email as SentEmail) : null;
              const timeString = isScheduled ? scheduledEmail?.scheduledAt : sentEmail?.sentAt;

              return (
                <tr
                  key={email.id}
                  onClick={() => router.push(`/dashboard/emails/${email.id}`)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >

                  <td className="py-2.5 px-4 sm:px-6 font-medium text-slate-900 group-hover:text-emerald-700 max-w-sm truncate">
                    <span title={email.recipient}>{email.recipient}</span>
                  </td>

                  <td className="py-2.5 px-4 sm:px-6 text-slate-600 max-w-lg truncate">
                    <span title={email.subject}>{email.subject}</span>
                    {sentEmail?.errorMessage && (
                      <p className="text-[10px] text-rose-600 truncate mt-0.5">
                        {sentEmail.errorMessage}
                      </p>
                    )}
                  </td>

                  <td className="py-2.5 px-4 sm:px-6 text-slate-500 whitespace-nowrap">
                    {timeString ? formatDateTime(timeString) : '—'}
                  </td>

                  <td className="py-2.5 px-4 sm:px-6 whitespace-nowrap">
                    <Badge status={email.status as EmailStatus} dot />
                  </td>

                  <td className="py-2.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {isScheduled && scheduledEmail && (
                        <>
                          {scheduledEmail.status === 'scheduled' && onPause && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPause(email.id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              title="Pause scheduling"
                              aria-label="Pause email"
                            >
                              <Pause className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {scheduledEmail.status === 'paused' && onResume && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onResume(email.id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              title="Resume scheduling"
                              aria-label="Resume email"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {onDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(email.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete scheduled email"
                              aria-label="Delete email"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}

                      {!isScheduled && sentEmail && sentEmail.status === 'failed' && onRetry && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetry(email.id);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          aria-label="Retry failed email"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
