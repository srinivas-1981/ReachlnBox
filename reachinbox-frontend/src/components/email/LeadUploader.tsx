'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Check, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LeadsUploadResult } from '@/types';
import { campaignService } from '@/services/api/campaigns';
import { formatBytes, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface LeadUploaderProps {
  onLeadsDetected: (result: LeadsUploadResult | null) => void;
  error?: string;
}

export const LeadUploader: React.FC<LeadUploaderProps> = ({ onLeadsDetected, error }) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadResult, setUploadResult] = useState<LeadsUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'txt') {
      const msg = 'Invalid file format. Please upload a CSV or TXT file.';
      setUploadError(msg);
      toast.error(msg, 'File Upload Failed');
      return;
    }

    setUploadError(null);
    setIsParsing(true);

    try {
      const result = await campaignService.uploadLeadsFile(file);
      setUploadResult(result);
      onLeadsDetected(result);

      if (result.detectedCount > 0) {
        toast.success(
          `${result.detectedCount} email addresses detected in ${file.name}`,
          'Leads Processed'
        );
      } else {
        toast.warning('No valid email addresses detected in this file.', 'Empty Leads File');
      }
    } catch {
      const msg = 'Failed to parse leads file. Please ensure valid formatting.';
      setUploadError(msg);
      toast.error(msg, 'File Processing Error');
      onLeadsDetected(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = () => {
    setUploadResult(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onLeadsDetected(null);
    setShowRemoveModal(false);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-slate-700">
          Email Leads <span className="text-rose-500">*</span>
        </label>
        <span className="text-[11px] text-slate-400">CSV, TXT</span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,text/csv,text/plain"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        id="leads-file-upload"
        aria-label="Upload email leads file"
      />

      {!uploadResult && !isParsing && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center p-5 border border-dashed rounded-md transition-colors cursor-pointer text-center bg-slate-50/50 hover:bg-slate-50',
            dragActive
              ? 'border-slate-400 bg-slate-100/50'
              : error || uploadError
              ? 'border-rose-300 bg-rose-50/10'
              : 'border-slate-200 hover:border-slate-300'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="h-5 w-5 text-slate-400 mb-1.5" />
          <p className="text-xs font-medium text-slate-700 mb-0.5">
            Drop your CSV or TXT lead file here, or browse
          </p>
          <p className="text-[11px] text-slate-400 mb-3">
            One email per line or column
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Upload File
          </Button>
        </div>
      )}

      {/* Parsing Loader State */}
      {isParsing && (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-md text-center">
          <Loader2 className="h-5 w-5 text-slate-600 animate-spin mb-1.5" />
          <p className="text-xs font-medium text-slate-900">Validating & parsing leads...</p>
        </div>
      )}

      {/* Uploaded File Summary State */}
      {uploadResult && (
        <div className="p-3 bg-white border border-slate-200 rounded-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">
                  {uploadResult.fileName}
                  <span className="text-slate-400 font-normal ml-1.5">
                    ({formatBytes(uploadResult.fileSize)})
                  </span>
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 mt-0.5">
                  <Check className="h-3 w-3" />
                  <span>{uploadResult.detectedCount} email addresses detected</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRemoveModal(true)}
              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-50 transition-colors cursor-pointer"
              title="Remove file"
              aria-label="Remove uploaded leads file"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {(error || uploadError) && (
        <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{uploadError || error}</span>
        </p>
      )}

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        title="Remove lead file?"
        description={`Remove "${uploadResult?.fileName}"? You will need to select a file before scheduling.`}
        confirmLabel="Remove"
        confirmVariant="danger"
        onConfirm={handleRemove}
      />
    </div>
  );
};
