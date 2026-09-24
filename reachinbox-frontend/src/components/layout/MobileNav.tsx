'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X, SendHorizonal } from 'lucide-react';
import { MAIN_NAV_ITEMS, SECONDARY_NAV_ITEMS } from './navConfig';
import { UserMenu } from './UserMenu';
import { User } from '@/types';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  metrics?: {
    scheduledEmailsCount: number;
    sentEmailsCount: number;
  };
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, user, metrics }) => {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isLinkActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const getItemBadge = (itemHref: string) => {
    if (itemHref === '/dashboard/scheduled') {
      return metrics?.scheduledEmailsCount ?? 0;
    }
    if (itemHref === '/dashboard/sent') {
      return metrics?.sentEmailsCount ?? 0;
    }
    return undefined;
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
      {/* Subtle Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer from Left */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
                <SendHorizonal className="h-3.5 w-3.5 transform -rotate-12" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 tracking-tight">ReachInbox</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close navigation drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* User Card */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="relative h-8 w-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-emerald-100 text-emerald-700 font-semibold text-xs">
                  {user.name.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          {/* Compose Button */}
          <Link
            href="/dashboard/compose"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-emerald-50 text-emerald-700 border border-emerald-300/80 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <span className="text-base font-bold leading-none">+</span>
            <span>Compose</span>
          </Link>
        </div>

        {/* Links List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          <div>
            <p className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Core
            </p>
            <nav className="space-y-0.5" aria-label="Mobile Main Navigation">
              {MAIN_NAV_ITEMS.map((item) => {
                const active = isLinkActive(item.href, item.exact);
                const Icon = item.icon;
                const badge = getItemBadge(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors',
                      active
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn('h-4 w-4 shrink-0', active ? 'text-emerald-700' : 'text-slate-400')}
                      />
                      <span>{item.name}</span>
                    </div>

                    {badge !== undefined && (
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                          active
                            ? 'bg-emerald-100/80 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Configuration
            </p>
            <nav className="space-y-0.5" aria-label="Mobile Secondary Navigation">
              {SECONDARY_NAV_ITEMS.map((item) => {
                const active = isLinkActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors',
                      active
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <Icon
                      className={cn('h-4 w-4 shrink-0', active ? 'text-emerald-700' : 'text-slate-400')}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <UserMenu user={user} onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
};
