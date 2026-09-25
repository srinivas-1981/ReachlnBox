'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Paperclip,
  Clock,
  Send,
  Upload,
  Calendar,
  X,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Heading,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LeadUploader } from './LeadUploader';
import { ScheduleConfiguration, ScheduleConfigValues } from './ScheduleConfiguration';
import { LeadsUploadResult } from '@/types';
import { campaignService } from '@/services/api/campaigns';
import { authService } from '@/services/api/auth';
import { useToast } from '@/components/ui/Toast';
import { formatDateForInput } from '@/lib/utils';

interface FormErrors {
  subject?: string;
  body?: string;
  leads?: string;
  startTime?: string;
  delaySeconds?: string;
  hourlyLimit?: string;
}

export const EmailComposer: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fromEmail, setFromEmail] = useState('');
  const [toInput, setToInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [uploadResult, setUploadResult] = useState<LeadsUploadResult | null>(null);

  useEffect(() => {
    let ignore = false;
    authService
      .getCurrentUser()
      .then((user) => {
        if (!ignore && user?.email) {
          setFromEmail(user.email);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfigValues>(() => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 10);
    return {
      startTime: formatDateForInput(futureDate),
      delaySeconds: 2,
      hourlyLimit: 200,
    };
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendMode, setSendMode] = useState<'later' | 'now'>('later');
  const [isSendLaterOpen, setIsSendLaterOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ name: string; size: string; previewUrl?: string }>>([]);

  const handleConfigChange = (field: keyof ScheduleConfigValues, value: string | number) => {
    setScheduleConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    setRecipients((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const handleAddRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = toInput.trim().replace(',', '');
      if (trimmed && trimmed.includes('@')) {
        if (!recipients.includes(trimmed)) {
          setRecipients((prev) => [...prev, trimmed]);
        }
        setToInput('');
      }
    }
  };

  const handleInputBlur = () => {
    const trimmed = toInput.trim().replace(',', '');
    if (trimmed && trimmed.includes('@')) {
      if (!recipients.includes(trimmed)) {
        setRecipients((prev) => [...prev, trimmed]);
      }
      setToInput('');
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setAttachments((prev) => [
      ...prev,
      {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        previewUrl,
      },
    ]);
    toast.success(`Attached ${file.name}`);
  };

  const applyPreset = (presetHours: number, label: string) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(presetHours, 0, 0, 0);
    handleConfigChange('startTime', formatDateForInput(d));
    setIsSendLaterOpen(false);
    toast.success(`Scheduled for ${label}`);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required.';
    }

    if (!body.trim()) {
      newErrors.body = 'Email body cannot be empty.';
    }

    if (recipients.length === 0 && (!uploadResult || uploadResult.detectedCount === 0)) {
      newErrors.leads = 'Please add recipients or upload a leads file.';
    }

    if (sendMode === 'later' && !scheduleConfig.startTime) {
      newErrors.startTime = 'Start time is required for scheduled send.';
    }

    if (!scheduleConfig.delaySeconds || scheduleConfig.delaySeconds < 1) {
      newErrors.delaySeconds = 'Delay must be at least 1 second.';
    }

    if (!scheduleConfig.hourlyLimit || scheduleConfig.hourlyLimit < 1) {
      newErrors.hourlyLimit = 'Hourly limit must be at least 1.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (mode: 'now' | 'later') => {
    setSendMode(mode);

    if (!validate()) {
      toast.error('Please review the errors below.', 'Form Incomplete');
      return;
    }

    setIsSubmitting(true);

    const effectiveRecipients = recipients.length > 0
      ? recipients
      : (uploadResult?.sampleEmails && uploadResult.sampleEmails.length > 0 ? uploadResult.sampleEmails : []);

    if (effectiveRecipients.length === 0) {
      toast.error('Please add recipients or upload a leads file.', 'No Recipients');
      setIsSubmitting(false);
      return;
    }

    let effectiveStartTime: string;
    if (mode === 'now') {
      effectiveStartTime = new Date().toISOString();
    } else {
      const parsedDate = new Date(scheduleConfig.startTime);
      if (isNaN(parsedDate.getTime())) {
        toast.error('Invalid start date selected.', 'Validation Error');
        setIsSubmitting(false);
        return;
      }
      effectiveStartTime = parsedDate.toISOString();
    }

    try {
      await campaignService.scheduleEmailCampaign({
        subject,
        body,
        recipients: effectiveRecipients,
        status: mode === 'now' ? 'sent' : 'scheduled',
        detectedLeadsCount: effectiveRecipients.length,
        startTime: effectiveStartTime,
        delaySeconds: scheduleConfig.delaySeconds,
        hourlyLimit: scheduleConfig.hourlyLimit,
        attachments: attachments.map((a) => ({ name: a.name, size: a.size })),
      });

      toast.success(
        mode === 'now'
          ? 'Campaign dispatched immediately!'
          : `Campaign scheduled for ${effectiveRecipients.length} recipients.`,
        mode === 'now' ? 'Sent' : 'Campaign Scheduled'
      );

      router.push(mode === 'now' ? '/dashboard/sent' : '/dashboard/scheduled');
    } catch {
      toast.error('Failed to schedule campaign. Please try again.', 'Scheduling Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-200 bg-white px-2">
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard"
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back to inbox"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">
            Compose New Email
          </h1>
        </div>

        <div className="flex items-center gap-2 relative flex-wrap sm:flex-nowrap">

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleAttachmentUpload}
            className="hidden"
            aria-label="Upload email attachment"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Attach file"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSendLaterOpen((prev) => !prev)}
              className="p-1.5 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Schedule / Send Later"
              aria-label="Schedule / Send Later"
            >
              <Clock className="h-4 w-4" />
            </button>

            {isSendLaterOpen && (
              <div className="absolute right-0 top-9 z-30 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-lg border border-slate-200 p-4 shadow-xl text-xs space-y-3 animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-900">Send Later</span>
                  <button
                    type="button"
                    onClick={() => setIsSendLaterOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Pick date & time
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-md p-1.5 bg-slate-50">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <input
                      type="datetime-local"
                      value={scheduleConfig.startTime}
                      onChange={(e) => handleConfigChange('startTime', e.target.value)}
                      className="bg-transparent text-xs text-slate-800 focus:outline-none w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Quick Presets
                  </p>
                  <button
                    type="button"
                    onClick={() => applyPreset(9, 'Tomorrow')}
                    className="w-full text-left px-2 py-1 rounded hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(10, 'Tomorrow, 10:00 AM')}
                    className="w-full text-left px-2 py-1 rounded hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    Tomorrow, 10:00 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(11, 'Tomorrow, 11:00 AM')}
                    className="w-full text-left px-2 py-1 rounded hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    Tomorrow, 11:00 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(14, 'Tomorrow, 2:00 PM')}
                    className="w-full text-left px-2 py-1 rounded hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    Tomorrow, 2:00 PM
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSendLaterOpen(false)}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsSendLaterOpen(false);
                      toast.success('Schedule timestamp saved.');
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSubmit('now')}
              disabled={isSubmitting}
              leftIcon={<Send className="h-3 w-3" />}
            >
              Send Now
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSubmit('later')}
              isLoading={isSubmitting}
              loadingText="Scheduling..."
              leftIcon={<Clock className="h-3.5 w-3.5" />}
            >
              Send Later
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs divide-y divide-slate-100">

            <div className="flex items-center px-4 py-2.5 text-xs">
              <span className="w-16 text-slate-400 font-medium shrink-0">From</span>
              <div className="flex items-center gap-1.5 font-medium text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded text-xs">
                <span>{fromEmail}</span>
                <span className="text-slate-400 text-[10px]"></span>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-2 text-xs gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                <span className="w-16 text-slate-400 font-medium shrink-0">To</span>

                {recipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 max-w-[200px] sm:max-w-xs"
                  >
                    <span className="truncate">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(email)}
                      className="hover:text-rose-600 transition-colors shrink-0"
                      aria-label={`Remove ${email}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}

                <input
                  type="email"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  onKeyDown={handleAddRecipient}
                  onBlur={handleInputBlur}
                  placeholder={recipients.length === 0 ? "Add recipients... (press Enter)" : "Add more..."}
                  className="flex-1 min-w-[140px] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none py-1 bg-transparent"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowUploadModal((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors shrink-0 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload List</span>
              </button>
            </div>

            <div className="flex items-center px-4 py-2.5 text-xs">
              <span className="w-16 text-slate-400 font-medium shrink-0">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
                }}
                placeholder="Subject"
                className="flex-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 px-4 py-2 bg-slate-50/50 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Delay between 2 emails:</span>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={scheduleConfig.delaySeconds}
                  onChange={(e) => handleConfigChange('delaySeconds', parseInt(e.target.value, 10) || 0)}
                  className="w-12 px-2 py-0.5 text-xs text-center font-medium bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400">sec</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Hourly Limit:</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={scheduleConfig.hourlyLimit}
                  onChange={(e) => handleConfigChange('hourlyLimit', parseInt(e.target.value, 10) || 0)}
                  className="w-16 px-2 py-0.5 text-xs text-center font-medium bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-4 space-y-3">
              <textarea
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  if (errors.body) setErrors((prev) => ({ ...prev, body: undefined }));
                }}
                placeholder="Type Your Reply..."
                rows={13}
                className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-y bg-transparent"
              />

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-slate-500 text-xs">
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => toast.info('Undo')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    title="Undo"
                    aria-label="Undo"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info('Redo')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    title="Redo"
                    aria-label="Redo"
                  >
                    <Redo2 className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-3.5 w-px bg-slate-200 mx-1" />

                  <button
                    type="button"
                    onClick={() => toast.info('Heading format')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    title="Heading"
                    aria-label="Heading"
                  >
                    <Heading className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-3.5 w-px bg-slate-200 mx-1" />

                  <button
                    type="button"
                    onClick={() => toast.info('Bold format')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors font-bold"
                    title="Bold"
                    aria-label="Bold"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info('Italic format')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors italic"
                    title="Italic"
                    aria-label="Italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info('Underline format')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors underline"
                    title="Underline"
                    aria-label="Underline"
                  >
                    <Underline className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info('Strikethrough format')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors line-through"
                    title="Strikethrough"
                    aria-label="Strikethrough"
                  >
                    <Strikethrough className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-3.5 w-px bg-slate-200 mx-1" />

                  <button
                    type="button"
                    onClick={() => toast.info('Align Left')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    title="Align Left"
                    aria-label="Align Left"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info('Align Center')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    title="Align Center"
                    aria-label="Align Center"
                  >
                    <AlignCenter className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info('Align Right')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    title="Align Right"
                    aria-label="Align Right"
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-3.5 w-px bg-slate-200 mx-1" />

                  <button
                    type="button"
                    onClick={() => toast.info('Bullet List')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    title="Bullet List"
                    aria-label="Bullet List"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info('Ordered List')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    title="Ordered List"
                    aria-label="Ordered List"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info('Blockquote')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    title="Quote"
                    aria-label="Quote"
                  >
                    <Quote className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-3.5 w-px bg-slate-200 mx-1" />

                  <button
                    type="button"
                    onClick={() => toast.info('Insert link')}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    title="Insert Link"
                    aria-label="Insert Link"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    title="Insert Image"
                    aria-label="Insert Image"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-400">
                  {body.length} characters
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="pt-3 border-t border-slate-100 flex items-center gap-3 flex-wrap">
                  {attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-1.5 pr-2.5 rounded border border-slate-200 bg-slate-50 text-xs"
                    >
                      {att.previewUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={att.previewUrl}
                          alt={att.name}
                          className="h-8 w-8 rounded object-cover border border-slate-200"
                        />
                      ) : (
                        <Paperclip className="h-4 w-4 text-slate-400" />
                      )}
                      <div>
                        <p className="font-medium text-slate-800 text-[11px] truncate max-w-[120px]">
                          {att.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{att.size}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-rose-600 ml-1"
                        aria-label="Remove attachment"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">

          <div className="bg-white rounded-lg border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Audience & Leads
              </h3>
              {Math.max(recipients.length, uploadResult?.detectedCount || 0) > 0 && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {Math.max(recipients.length, uploadResult?.detectedCount || 0)} Recipients
                </span>
              )}
            </div>

            <LeadUploader
              onLeadsDetected={(res) => {
                setUploadResult(res);
                if (res?.sampleEmails && res.sampleEmails.length > 0) {
                  setRecipients(res.sampleEmails);
                } else if (!res) {
                  setRecipients([]);
                }
              }}
              error={errors.leads}
            />
          </div>

          <ScheduleConfiguration
            values={scheduleConfig}
            errors={{
              startTime: errors.startTime,
              delaySeconds: errors.delaySeconds,
              hourlyLimit: errors.hourlyLimit,
            }}
            onChange={handleConfigChange}
          />

          <div className="bg-white rounded-lg border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                disabled={isSubmitting}
                className="w-1/3"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleSubmit('later')}
                isLoading={isSubmitting}
                loadingText="Scheduling..."
                className="w-2/3"
              >
                Schedule Campaign
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Pacing and limits protect sender inbox reputation.
            </p>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-5 max-w-lg w-full max-h-[90dvh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Upload Leads CSV / List</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <LeadUploader
              onLeadsDetected={(res) => {
                setUploadResult(res);
                if (res?.sampleEmails && res.sampleEmails.length > 0) {
                  setRecipients(res.sampleEmails);
                } else if (!res) {
                  setRecipients([]);
                }
                setShowUploadModal(false);
              }}
              error={errors.leads}
            />
          </div>
        </div>
      )}
    </div>
  );
};
