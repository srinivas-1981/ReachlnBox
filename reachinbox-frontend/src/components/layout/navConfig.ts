import {
  LayoutDashboard,
  CalendarClock,
  Send,
  MessageSquare,
  Settings,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: number | string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    name: 'Scheduled',
    href: '/dashboard/scheduled',
    icon: CalendarClock,
    exact: true,
  },
  {
    name: 'Sent',
    href: '/dashboard/sent',
    icon: Send,
    exact: true,
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    name: 'Slack',
    href: '/dashboard/slack',
    icon: MessageSquare,
    exact: true,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    exact: true,
  },
];
