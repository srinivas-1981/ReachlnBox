import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReachInbox - Email Scheduling Platform',
  description: 'Email scheduling made simple and reliable for high-deliverability outreach.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <body className="min-h-full flex flex-col font-sans text-slate-900 bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
