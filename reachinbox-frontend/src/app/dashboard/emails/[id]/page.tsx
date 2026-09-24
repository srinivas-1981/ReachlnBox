'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmailDetailView } from '@/components/email/EmailDetailView';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ScheduledEmail, SentEmail } from '@/types';
import { emailService } from '@/services/api/emails';

export default function EmailDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [email, setEmail] = useState<ScheduledEmail | SentEmail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    emailService
      .getEmailById(id)
      .then((data) => {
        if (!ignore) {
          setEmail(data);
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
  }, [id]);

  return (
    <PageContainer maxWidth="wide">
      {hasError ? (
        <ErrorState
          title="Unable to load email"
          message="We couldn't retrieve the details for this email. Please try again."
          onRetry={() => {
            setHasError(false);
            setIsLoading(true);
            emailService.getEmailById(id).then((res) => {
              setEmail(res);
              setIsLoading(false);
            });
          }}
          isRetrying={isLoading}
        />
      ) : isLoading ? (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      ) : email ? (
        <EmailDetailView email={email} />
      ) : null}
    </PageContainer>
  );
}
