import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmailComposer } from '@/components/email/EmailComposer';

export default function ComposePage() {
  return (
    <PageContainer maxWidth="wide">
      <EmailComposer />
    </PageContainer>
  );
}
