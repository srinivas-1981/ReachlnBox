'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import { User } from '@/types';
import { authService } from '@/services/api/auth';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  user: User;
  collapsed?: boolean;
  onNavigate?: () => void;
  position?: 'right' | 'bottom';
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  collapsed = false,
  onNavigate,
  position = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authService.logout();
  };

  return (
    <div className="relative" ref={menuRef}>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer',
          collapsed ? 'justify-center p-1.5' : ''
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User navigation menu"
      >
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
              {user.name.charAt(0)}
            </div>
          )}
        </div>

        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                {user.email}
              </p>
            </div>
            <ChevronDown
              className={cn('h-4 w-4 text-slate-400 transition-transform duration-150', isOpen && 'rotate-180')}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            'w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-150',
            position === 'bottom'
              ? 'absolute right-0 top-full mt-2'
              : 'absolute md:left-full md:bottom-0 md:ml-3 md:right-auto md:mb-0 left-0 bottom-full mb-2 right-auto'
          )}
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-900 truncate">{user.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            {user.role && (
              <span className="inline-block mt-1 text-[10px] uppercase font-semibold tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {user.role}
              </span>
            )}
          </div>

          <div className="py-1">
            <Link
              href="/dashboard/settings"
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Settings</span>
            </Link>
          </div>

          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowLogoutModal(true);
              }}
              className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-rose-500" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign out of ReachInbox?"
        description="You will be returned to the login screen and will need to authenticate with Google again."
        confirmLabel="Sign out"
        confirmVariant="danger"
        isConfirmLoading={isLoggingOut}
        onConfirm={handleLogout}
      />
    </div>
  );
};
