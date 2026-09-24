'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { SlackConnectionCard } from '@/components/slack/SlackConnectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { SlackConnection } from '@/types';
import { slackService } from '@/services/api/slack';
import { mockSlackConnection } from '@/lib/mockData';

export default function SlackPage() {
  const [connection, setConnection] = useState<SlackConnection>(mockSlackConnection);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchStatus = useCallback(() => {
    let ignore = false;
    slackService
      .getSlackStatus()
      .then((data) => {
        if (!ignore) {
          setConnection(data);
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
    return fetchStatus();
  }, [fetchStatus]);

  return (
    <PageContainer maxWidth="wide">
      <div className="pb-3 border-b border-slate-200 mb-4 max-w-3xl">
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
          Slack Integration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Connect your team’s Slack workspace to receive automated alerts when hourly limits are reached.
        </p>
      </div>

      {hasError ? (
        <ErrorState
          title="Could not load Slack integration details"
          message="We were unable to reach the integration service. Please try again."
          onRetry={() => {
            setIsLoading(true);
            setHasError(false);
            fetchStatus();
          }}
          isRetrying={isLoading}
        />
      ) : isLoading ? (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3 max-w-3xl">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-8 w-28" />
        </div>
      ) : (
        <SlackConnectionCard initialConnection={connection} />
      )}
    </PageContainer>
  );
}
