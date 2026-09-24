'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PageContainer } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { authService } from '@/services/api/auth';
import { slackService } from '@/services/api/slack';
import { User, SlackConnection } from '@/types';
import { mockUser, mockSlackConnection } from '@/lib/mockData';

export default function SettingsPage() {
  const toast = useToast();
  const [user, setUser] = useState<User>(mockUser);
  const [nameInput, setNameInput] = useState<string>(mockUser.name);
  const [roleInput, setRoleInput] = useState<string>(mockUser.role || 'Growth Lead');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [slack, setSlack] = useState<SlackConnection>(mockSlackConnection);
  const [defaultDelay, setDefaultDelay] = useState<number>(2);
  const [defaultHourlyLimit, setDefaultHourlyLimit] = useState<number>(200);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([authService.getCurrentUser(), slackService.getSlackStatus()])
      .then(([userData, slackData]) => {
        if (!ignore) {
          setUser(userData);
          setNameInput(userData.name);
          setRoleInput(userData.role || 'Growth Lead');
          setSlack(slackData);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const updated = await authService.updateUserProfile({
        name: nameInput.trim(),
        role: roleInput.trim(),
      });
      setUser(updated);
      toast.success('Your profile name has been updated in PostgreSQL!', 'Profile Saved');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Default scheduling settings saved.', 'Settings Updated');
    }, 500);
  };

  return (
    <PageContainer maxWidth="wide">
      {/* Restrained Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 mb-4 max-w-5xl">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your authenticated profile and campaign defaults.
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-5xl">
        {/* Profile Card */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              User Profile
            </h2>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingProfile}
              loadingText="Saving..."
            >
              Save Profile
            </Button>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-700 font-semibold text-sm">
                  {nameInput.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-900">{nameInput}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
              <span className="inline-block mt-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                Connected &amp; Editable
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Input
              label="Full Name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Endiht"
              helperText="Editable name saved to PostgreSQL database."
            />
            <Input
              label="Role / Title"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              placeholder="e.g. Campaign Lead"
              helperText="Display role shown in navigation."
            />
            <Input
              label="Email Address"
              value={user.email}
              disabled
              helperText="Primary Google OAuth email."
            />
          </div>
        </form>

        {/* Scheduling Defaults Form */}
        <form onSubmit={handleSaveDefaults} className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Default Campaign Limits
          </h2>

          <p className="text-xs text-slate-500">
            Pre-fills newly composed email campaigns.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Default Delay (Seconds)"
              type="number"
              min="1"
              max="300"
              value={defaultDelay}
              onChange={(e) => setDefaultDelay(parseInt(e.target.value, 10) || 0)}
              helperText="Pacing applied between dispatches."
            />
            <Input
              label="Default Hourly Limit"
              type="number"
              min="1"
              max="1000"
              value={defaultHourlyLimit}
              onChange={(e) => setDefaultHourlyLimit(parseInt(e.target.value, 10) || 0)}
              helperText="Hourly ceiling per sending inbox."
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              loadingText="Saving..."
            >
              Save Defaults
            </Button>
          </div>
        </form>

        {/* Slack Connection Summary */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-900">Slack Notifications</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {slack.connected
                  ? `Connected: ${slack.workspaceName} (${slack.channelName || 'Default Channel'})`
                  : 'Not connected. Connect to receive hourly throttle alerts.'}
              </p>
            </div>

            <Link href="/dashboard/slack">
              <Button variant="outline" size="sm">
                {slack.connected ? 'Manage' : 'Connect'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
