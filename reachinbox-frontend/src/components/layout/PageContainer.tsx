import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'wide' | 'full';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  maxWidth = 'wide',
}) => {
  const maxWidths = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-7xl',
    wide: 'max-w-[1600px] w-full',
    full: 'max-w-full w-full',
  };

  return (
    <main className="flex-1 min-w-0">
      <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-3 sm:pt-4 pb-6 sm:pb-8', maxWidths[maxWidth], className)}>
        {children}
      </div>
    </main>
  );
};
