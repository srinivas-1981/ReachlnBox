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

  // Sidebar must always start collapsed on initial mount / refresh
  // Route change automatically collapses the sidebar
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSidebarCollapsed(true);
  }, [pathname]);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

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

    // Check if token was provided in redirect URL after Google OAuth callback
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('token');
      if (token) {
        try {
          localStorage.setItem('reachinbox_auth_token', token);
        } catch {
          // Ignore storage error
        }
        // Clean URL to remove token query parameter
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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar
        user={user}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        metrics={metrics}
      />

      {/* Mobile Slide-in Drawer */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        user={user}
        metrics={metrics}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          user={user}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
