'use client';

import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SlackConnection } from '@/types';
import { slackService } from '@/services/api/slack';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/lib/utils';

interface SlackConnectionCardProps {
  initialConnection: SlackConnection;
}

export const SlackConnectionCard: React.FC<SlackConnectionCardProps> = ({
  initialConnection,
}) => {
  const toast = useToast();
  const [connection, setConnection] = useState<SlackConnection>(initialConnection);
  const [isLoading, setIsLoading] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const res = await slackService.connectSlack();
      setConnection(res);
      toast.success(
        `Connected to ${res.workspaceName || 'Slack'}`,
        'Slack Connected'
      );
    } catch {
      toast.error('Failed to initiate Slack OAuth. Please try again.', 'Connection Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const res = await slackService.disconnectSlack();
      setConnection(res);
      setShowDisconnectModal(false);
      toast.info('Slack integration disconnected.', 'Slack Disconnected');
    } catch {
      toast.error('Failed to disconnect Slack workspace.', 'Disconnection Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Slack Notifications</h2>
              <p className="text-xs text-slate-500">
                Receive rate-limit warnings and hourly throttle alerts directly in your team channel
              </p>
            </div>
          </div>

          <div>
            {connection.connected ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <span>Not Connected</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="py-4">
          {connection.connected ? (
            <div className="space-y-3">
              <div className="rounded-md bg-slate-50 border border-slate-200/80 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Workspace:</span>
                  <span className="font-medium text-slate-900">{connection.workspaceName}</span>
                </div>
                {connection.channelName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Alert Channel:</span>
                    <span className="font-medium text-slate-700">{connection.channelName}</span>
                  </div>
                )}
                {connection.connectedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Connected:</span>
                    <span className="text-slate-600">{formatDateTime(connection.connectedAt)}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600">
                Rate-limit notifications will automatically be posted to your configured channel.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect Slack to receive real-time notifications when an email sender reaches or approaches
                the configured hourly limit. Keep your team informed before delivery pauses occur.
              </p>

              <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50/60 p-2.5 rounded-md border border-amber-200/80">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>Connect Slack to receive rate-limit notifications.</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>OAuth 2.0 secured authentication</span>
          </div>

          {connection.connected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDisconnectModal(true)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              Disconnect Slack
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleConnect}
              isLoading={isLoading}
              loadingText="Connecting..."
            >
              Connect Slack
            </Button>
          )}
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <Modal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        title="Disconnect Slack?"
        description="Are you sure you want to disconnect Slack? Your team will stop receiving automated rate-limit warnings."
        confirmLabel="Disconnect"
        confirmVariant="danger"
        isConfirmLoading={isLoading}
        onConfirm={handleDisconnect}
      />
    </div>
  );
};
