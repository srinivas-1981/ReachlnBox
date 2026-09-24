'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmailTable } from '@/components/email/EmailTable';
import { EmailSearch } from '@/components/email/EmailSearch';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { ScheduledEmail } from '@/types';
import { emailService } from '@/services/api/emails';
import { useToast } from '@/components/ui/Toast';

export default function ScheduledEmailsPage() {
  const router = useRouter();
  const toast = useToast();
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchScheduled = useCallback((query = '') => {
    let ignore = false;
    emailService
      .getScheduledEmails(query)
      .then((data) => {
        if (!ignore) {
          setEmails(data);
          setIsLoading(false);
          setIsSearching(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setHasError(true);
          setIsLoading(false);
          setIsSearching(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return fetchScheduled();
  }, [fetchScheduled]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    fetchScheduled(query);
  };

  const handlePause = async (id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'paused' as const } : e))
    );
    await emailService.pauseScheduledEmail(id);
    toast.info('Email schedule paused.');
  };

  const handleResume = async (id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'scheduled' as const } : e))
    );
    await emailService.resumeScheduledEmail(id);
    toast.success('Email schedule resumed.');
  };

  const handleDelete = async (id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    await emailService.deleteScheduledEmail(id);
    toast.info('Scheduled email removed.');
  };

  const filteredEmails = emails.filter((email) => {
    if (statusFilter === 'all') return true;
    return email.status === statusFilter;
  });

  return (
    <PageContainer>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
            Scheduled Deliveries
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor and manage upcoming scheduled email campaigns.
          </p>
        </div>

        <Link href="/dashboard/compose">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Campaign
          </Button>
        </Link>
      </div>

      <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <EmailSearch
          onSearch={handleSearch}
          isSearching={isSearching}
          placeholder="Filter by recipient or subject..."
        />

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'scheduled', 'processing', 'paused', 'failed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {hasError ? (
        <ErrorState
          title="Something went wrong"
          message="We couldn't load your scheduled emails. Please verify your connection."
          onRetry={() => {
            setIsLoading(true);
            setHasError(false);
            fetchScheduled(searchQuery);
          }}
          isRetrying={isLoading}
        />
      ) : isLoading ? (
        <div className="bg-white rounded-lg border border-slate-200">
          <TableSkeleton rows={5} columns={4} />
        </div>
      ) : filteredEmails.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No matching emails found' : 'No scheduled emails'}
          description={
            searchQuery
              ? `No emails found matching "${searchQuery}". Try a different term or clear the filter.`
              : "You don't have any emails queued in your schedule. Create a new campaign to begin."
          }
          actionLabel={searchQuery ? undefined : 'Create Campaign'}
          onAction={searchQuery ? undefined : () => router.push('/dashboard/compose')}
        />
      ) : (
        <EmailTable
          type="scheduled"
          emails={filteredEmails}
          onPause={handlePause}
          onResume={handleResume}
          onDelete={handleDelete}
        />
      )}
    </PageContainer>
  );
}
