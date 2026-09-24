'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmailTable } from '@/components/email/EmailTable';
import { EmailSearch } from '@/components/email/EmailSearch';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SentEmail } from '@/types';
import { emailService } from '@/services/api/emails';
import { useToast } from '@/components/ui/Toast';

export default function SentEmailsPage() {
  const router = useRouter();
  const toast = useToast();
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchSent = useCallback((query = '') => {
    let ignore = false;
    emailService
      .getSentEmails(query)
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
    return fetchSent();
  }, [fetchSent]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    fetchSent(query);
  };

  const handleRetry = async (id: string) => {
    try {
      await emailService.retryFailedEmail(id);
      setEmails((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: 'sent', errorMessage: undefined } : e))
      );
      toast.success('Failed email requeued and dispatched.', 'Delivery Retried');
    } catch {
      toast.error('Failed to retry email dispatch.', 'Retry Failed');
    }
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
            Sent History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit log of dispatched and failed email deliveries.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-900">{emails.length}</span> total dispatches
        </div>
      </div>

      <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <EmailSearch
          onSearch={handleSearch}
          isSearching={isSearching}
          placeholder="Filter by recipient or subject..."
        />

        <div className="flex items-center gap-1">
          {['all', 'sent', 'failed'].map((st) => (
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
          message="We couldn't load your sent email history. Please try again."
          onRetry={() => {
            setIsLoading(true);
            setHasError(false);
            fetchSent(searchQuery);
          }}
          isRetrying={isLoading}
        />
      ) : isLoading ? (
        <div className="bg-white rounded-lg border border-slate-200">
          <TableSkeleton rows={5} columns={4} />
        </div>
      ) : filteredEmails.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No matching sent emails' : 'No sent emails'}
          description={
            searchQuery
              ? `No sent emails found matching "${searchQuery}".`
              : 'Emails will appear here once your scheduled campaigns begin dispatching.'
          }
          actionLabel={searchQuery ? undefined : 'Schedule Campaign'}
          onAction={searchQuery ? undefined : () => router.push('/dashboard/compose')}
        />
      ) : (
        <EmailTable
          type="sent"
          emails={filteredEmails}
          onRetry={handleRetry}
        />
      )}
    </PageContainer>
  );
}
