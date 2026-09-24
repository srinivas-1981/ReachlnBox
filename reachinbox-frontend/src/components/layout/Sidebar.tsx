'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SendHorizonal, PanelLeftClose, PanelLeft, Menu } from 'lucide-react';
import { MAIN_NAV_ITEMS, SECONDARY_NAV_ITEMS } from './navConfig';
import { UserMenu } from './UserMenu';
import { User } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: User;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  metrics?: {
    scheduledEmailsCount: number;
    sentEmailsCount: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  isCollapsed,
  onToggleCollapse,
  metrics,
}) => {
  const pathname = usePathname();

  const isLinkActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleNavClick = () => {
    if (!isCollapsed) {
      onToggleCollapse();
    }
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
    <aside
      className={cn(
        'hidden md:flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 select-none transition-all duration-200 ease-in-out',
        isCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Brand & Compose / Hamburger Header */}
      <div className="p-3 border-b border-slate-100 space-y-3">
        <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'justify-between')}>
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            className={cn(
              'flex items-center gap-2.5 overflow-hidden group',
              isCollapsed && 'justify-center'
            )}
            title="ReachInbox"
          >
            <div className="h-7 w-7 rounded-md bg-emerald-600 flex items-center justify-center text-white shrink-0 group-hover:bg-emerald-700 transition-colors shadow-2xs">
              <SendHorizonal className="h-3.5 w-3.5 transform -rotate-12" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 tracking-tight block truncate">
                  ReachInbox
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* In collapsed mode: Hamburger menu button ☰ expands sidebar */}
        {/* In expanded mode: Compose button navigates and auto-collapses */}
        {isCollapsed ? (
          <div className="relative group/tooltip">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="h-9 w-9 mx-auto flex items-center justify-center font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300/80 transition-colors duration-150 cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-150 z-50">
              Expand sidebar
            </div>
          </div>
        ) : (
          <div className="relative group/tooltip">
            <Link
              href="/dashboard/compose"
              onClick={handleNavClick}
              className="flex items-center justify-center font-medium rounded-lg transition-colors duration-150 w-full py-2 px-3 gap-2 bg-emerald-50/70 hover:bg-emerald-100/70 active:bg-emerald-200/70 text-emerald-700 border border-emerald-300/80 text-xs font-semibold shadow-2xs"
            >
              <span className="text-base leading-none font-bold">+</span>
              <span>Compose</span>
            </Link>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
        {/* Core Items */}
        <div>
          {!isCollapsed && (
            <p className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Core
            </p>
          )}
          <nav className="space-y-0.5" aria-label="Main Navigation">
            {MAIN_NAV_ITEMS.map((item) => {
              const active = isLinkActive(item.href, item.exact);
              const Icon = item.icon;
              const badge = getItemBadge(item.href);

              return (
                <div key={item.href} className="relative group/tooltip">
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors',
                      isCollapsed ? 'justify-center px-0 h-9 w-9 mx-auto' : '',
                      active
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <div className={cn('flex items-center gap-2.5 min-w-0', isCollapsed && 'justify-center')}>
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active ? 'text-emerald-700' : 'text-slate-400'
                        )}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!isCollapsed && badge !== undefined && (
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-1.5 py-0.2 rounded-full',
                          active
                            ? 'bg-emerald-100/80 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>

                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-150 z-50">
                      {badge !== undefined ? `${item.name} (${badge})` : item.name}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Configuration Items */}
        <div>
          {!isCollapsed && (
            <p className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Configuration
            </p>
          )}
          <nav className="space-y-0.5" aria-label="Configuration Navigation">
            {SECONDARY_NAV_ITEMS.map((item) => {
              const active = isLinkActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <div key={item.href} className="relative group/tooltip">
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors',
                      isCollapsed ? 'justify-center px-0 h-9 w-9 mx-auto' : '',
                      active
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        active ? 'text-emerald-700' : 'text-slate-400'
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>

                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-150 z-50">
                      {item.name}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Collapse/Expand Toggle & User Profile Footer */}
      <div className="p-2 border-t border-slate-100 space-y-1 bg-white">
        <div className="relative group/tooltip">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer',
              isCollapsed && 'justify-center px-0 h-9 w-9 mx-auto'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span className="truncate text-slate-500">Collapse</span>
              </>
            )}
          </button>
          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-150 z-50">
              {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </div>
          )}
        </div>

        <div className="pt-1 border-t border-slate-100">
          <UserMenu user={user} collapsed={isCollapsed} onNavigate={handleNavClick} />
        </div>
      </div>
    </aside>
  );
};
