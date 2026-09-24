'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, Plus, RefreshCw } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmailInboxRow } from '@/components/email/EmailInboxRow';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { ScheduledEmail, SentEmail } from '@/types';
import { emailService } from '@/services/api/emails';

export default function DashboardPage() {
  const router = useRouter();
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'sent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadData = useCallback(() => {
    let ignore = false;
    Promise.all([
      emailService.getScheduledEmails(),
      emailService.getSentEmails(),
    ])
      .then(([scheduledData, sentData]) => {
        if (!ignore) {
          setScheduledEmails(scheduledData);
          setSentEmails(sentData);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setHasError(true);
          setIsLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return loadData();
  }, [loadData]);

  const handleToggleStar = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setScheduledEmails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, starred: !item.starred } : item))
    );
    setSentEmails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, starred: !item.starred } : item))
    );
    await emailService.toggleStarEmail(id);
  };

  const allEmails = [
    ...scheduledEmails.map((e) => ({ ...e, type: 'scheduled' as const })),
    ...sentEmails.map((e) => ({ ...e, type: 'sent' as const })),
  ];

  const filteredEmails = allEmails.filter((email) => {

    if (activeTab === 'scheduled' && email.type !== 'scheduled') return false;
    if (activeTab === 'sent' && email.type !== 'sent') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRecipient = email.recipient.toLowerCase().includes(q);
      const matchSubject = email.subject.toLowerCase().includes(q);
      const matchSnippet = email.snippet?.toLowerCase().includes(q);
      return matchRecipient || matchSubject || matchSnippet;
    }

    return true;
  });

  return (
    <PageContainer maxWidth="wide">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2 flex-1 max-w-lg">

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails, campaigns, or recipients..."
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-full border border-slate-200/90 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >

              </button>
            )}
          </div>

          <button
            type="button"
            className="p-1.5 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title="Filter settings"
            aria-label="Filter settings"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scheduled')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'scheduled'
                  ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Scheduled</span>
              <span className="text-[10px] px-1 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {scheduledEmails.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sent')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'sent'
                  ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Sent</span>
              <span className="text-[10px] px-1 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {sentEmails.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh inbox"
            aria-label="Refresh inbox"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <Link href="/dashboard/compose">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Compose
            </Button>
          </Link>
        </div>
      </div>

      {hasError ? (
        <div className="py-8">
          <ErrorState
            title="Unable to load inbox"
            message="We couldn't retrieve your latest email campaigns. Please check your connection."
            onRetry={loadData}
            isRetrying={isLoading}
          />
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <TableSkeleton rows={6} columns={4} />
        </div>
      ) : filteredEmails.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No matching emails' : 'Inbox is empty'}
          description={
            searchQuery
              ? `No emails or campaigns match "${searchQuery}".`
              : 'You have no emails in this view. Start by drafting a new email campaign.'
          }
          actionLabel="Compose New Email"
          onAction={() => router.push('/dashboard/compose')}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
          {filteredEmails.map((email) => (
            <EmailInboxRow
              key={email.id}
              email={email}
              onToggleStar={handleToggleStar}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
