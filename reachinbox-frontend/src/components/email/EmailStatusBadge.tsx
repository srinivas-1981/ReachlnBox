import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { EmailStatus } from '@/types';

interface EmailStatusBadgeProps {
  status: EmailStatus;
  className?: string;
}

export const EmailStatusBadge: React.FC<EmailStatusBadgeProps> = ({ status, className }) => {
  return <Badge status={status} dot className={className} />;
};
