'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { User } from '@/types';

interface HeaderProps {
  user: User;
  onOpenMobileNav: () => void;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenMobileNav,
  title,
  description,
  action,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80">
      <div className="flex items-center justify-between h-11 sm:h-12 px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Left Side: Mobile Hamburger & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300"
            aria-label="Open mobile navigation drawer"
          >
            <Menu className="h-5 w-5" />
          </button>

          {title && (
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-slate-900 truncate">
                {title}
              </h1>
              {description && (
                <p className="hidden sm:block text-xs text-slate-500 truncate">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Page Actions & User Menu */}
        <div className="flex items-center gap-2.5">
          {action && <div className="shrink-0">{action}</div>}
          <div className="shrink-0 md:hidden">
            <UserMenu user={user} collapsed position="bottom" />
          </div>
        </div>
      </div>
    </header>
  );
};
