'use client';

import React from 'react';
import { Calendar, Clock, Gauge } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export interface ScheduleConfigValues {
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
}

export interface ScheduleConfigErrors {
  startTime?: string;
  delaySeconds?: string;
  hourlyLimit?: string;
}

interface ScheduleConfigurationProps {
  values: ScheduleConfigValues;
  errors: ScheduleConfigErrors;
  onChange: (field: keyof ScheduleConfigValues, value: string | number) => void;
}

export const ScheduleConfiguration: React.FC<ScheduleConfigurationProps> = ({
  values,
  errors,
  onChange,
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-2xs">
      <div>
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
          Schedule & Throttle Settings
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Configure kickoff time and delivery throttling to protect inbox deliverability.
        </p>
      </div>

      <div>
        <Input
          label="Start Time"
          type="datetime-local"
          value={values.startTime}
          onChange={(e) => onChange('startTime', e.target.value)}
          error={errors.startTime}
          helperText="Date & time when campaign dispatch begins."
          required
          leftIcon={<Calendar className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="pt-2 border-t border-slate-100">
        <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
          Advanced Sending Settings
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <div>
            <Input
              label="Delay (Seconds)"
              type="number"
              min="1"
              max="300"
              value={values.delaySeconds}
              onChange={(e) => onChange('delaySeconds', parseInt(e.target.value, 10) || 0)}
              error={errors.delaySeconds}
              helperText="Delay between sends."
              required
              leftIcon={<Clock className="h-3.5 w-3.5" />}
            />
          </div>

          <div>
            <Input
              label="Hourly Limit"
              type="number"
              min="1"
              max="1000"
              value={values.hourlyLimit}
              onChange={(e) => onChange('hourlyLimit', parseInt(e.target.value, 10) || 0)}
              error={errors.hourlyLimit}
              helperText="Max emails per hour."
              required
              leftIcon={<Gauge className="h-3.5 w-3.5" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
