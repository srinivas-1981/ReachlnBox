'use client';

import React from 'react';
import { Menu, X } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { User } from '@/types';

interface HeaderProps {
  user: User;
  onOpenMobileNav: () => void;
  isMobileNavOpen?: boolean;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenMobileNav,
  isMobileNavOpen = false,
  title,
  description,
  action,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 shrink-0">
      <div className="flex items-center justify-between h-12 sm:h-12 px-3 sm:px-6 lg:px-8 xl:px-10">
        {/* Left Side: Mobile Hamburger & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="md:hidden flex items-center justify-center h-10 w-10 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-colors cursor-pointer"
            aria-label={isMobileNavOpen ? 'Close navigation drawer' : 'Open mobile navigation drawer'}
            aria-expanded={isMobileNavOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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

        {/* Right Side: Actions & Mobile Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {action && <div className="shrink-0">{action}</div>}
          <div className="shrink-0 md:hidden">
            <UserMenu user={user} collapsed position="bottom" />
          </div>
        </div>
      </div>
    </header>
  );
};
