'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { User } from '@/types';
import { authService } from '@/services/api/auth';
import { emailService } from '@/services/api/emails';

const initialEmptyUser: User = {
  id: '',
  name: '',
  email: '',
  avatarUrl: '',
  role: 'Growth Lead',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User>(initialEmptyUser);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [metrics, setMetrics] = useState({ scheduledEmailsCount: 0, sentEmailsCount: 0 });

  // Collapse desktop sidebar on navigation if expanded
  useEffect(() => {
    setIsSidebarCollapsed(true);
    setIsMobileNavOpen(false);
  }, [pathname]);

  const handleToggleCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const handleOpenMobileNav = useCallback(() => {
    setIsMobileNavOpen(true);
  }, []);

  const handleCloseMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  const fetchMetrics = useCallback(() => {
    emailService
      .getDashboardMetrics()
      .then((m) => {
        setMetrics({
          scheduledEmailsCount: m.scheduledEmailsCount || 0,
          sentEmailsCount: m.sentEmailsCount || 0,
        });
      })
      .catch(() => {
        setMetrics({ scheduledEmailsCount: 0, sentEmailsCount: 0 });
      });
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [pathname, fetchMetrics]);

  useEffect(() => {
    let ignore = false;

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('token');
      if (token) {
        try {
          localStorage.setItem('reachinbox_auth_token', token);
        } catch {
          // localStorage disabled / inaccessible
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (!ignore && currentUser) setUser(currentUser);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  // Listen for window resize to auto-close mobile nav if viewport widens to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Desktop Persistent Sidebar */}
      <Sidebar
        user={user}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        metrics={metrics}
      />

      {/* Mobile Off-Canvas Navigation Drawer */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={handleCloseMobileNav}
        user={user}
        metrics={metrics}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          user={user}
          onOpenMobileNav={handleOpenMobileNav}
          isMobileNavOpen={isMobileNavOpen}
        />

        <div className="flex-1 overflow-y-auto min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
