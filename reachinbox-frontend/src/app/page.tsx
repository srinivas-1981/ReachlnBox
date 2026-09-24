'use client';

import React, { useState } from 'react';
import { SendHorizonal, ShieldCheck } from 'lucide-react';
import { authService } from '@/services/api/auth';

export default function LoginPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    authService.loginWithGoogle();
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-50/70">
      <div className="w-full max-w-sm">
        {/* Centered Authentication Box */}
        <div className="bg-white py-8 px-7 rounded-xl border border-slate-200/90 text-center shadow-xs">
          {/* Logo Mark */}
          <div className="mx-auto h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white mb-4 shadow-2xs">
            <SendHorizonal className="h-5 w-5 transform -rotate-12" />
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Login
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Sign in to your ReachInbox workspace
          </p>

          {/* Google OAuth Primary Action Button */}
          <div className="mt-7">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isRedirecting}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-60 cursor-pointer"
              aria-label="Login with Google"
            >
              <div className="bg-white p-1 rounded-sm shrink-0">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              </div>

              <span>{isRedirecting ? 'Connecting to Google...' : 'Login with Google'}</span>
            </button>
          </div>

          {/* Single Sign-On Info */}
          <p className="mt-4 text-[11px] text-slate-400">
            Fast, secure single sign-on backed by Google OAuth
          </p>

          {/* Trust & Security Info */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>OAuth 2.0 protected session</span>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          ReachInbox &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
