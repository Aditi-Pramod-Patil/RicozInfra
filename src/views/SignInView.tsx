import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { PageView } from '../types';

interface SignInViewProps {
  onNavigate: (view: PageView) => void;
}

export const SignInView: React.FC<SignInViewProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        onNavigate('overview');
      } else {
        setErrorMessage(res.error || 'Failed to sign in. Please check your credentials.');
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSsoSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      login('sre-admin@enterprise.internal', 'SuperSecurePass123!').then(() => {
        setIsLoading(false);
        onNavigate('overview');
      });
    }, 450);
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between select-none">
      {/* 1. TOP BAR (h-16, Pure White, border-b border-slate-200) */}
      <header className="h-16 w-full border-b border-slate-200 px-6 sm:px-10 flex items-center justify-between shrink-0 bg-white">
        {/* Left: Clean Logo with Crimson Dot */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-1.5 focus:outline-none cursor-pointer group"
          title="Return to Public Website"
        >
          <span className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-slate-700 transition-colors">
            RicozInfra
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] inline-block mb-0.5" />
        </button>

        {/* Right: Create Enterprise Workspace Link */}
        <button
          onClick={() => onNavigate('signup')}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer focus:outline-none"
        >
          <span>Create enterprise workspace</span>
          <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </button>
      </header>

      {/* 2. MAIN CENTERED CARD CONTAINER */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            {/* Header / Logo Icon */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 mb-3.5 shadow-2xs">
                <ShieldCheck size={20} className="text-slate-900" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Sign in to RicozInfra Command Console
              </h1>
              <p className="text-xs text-slate-500 mt-1.5 font-normal">
                Enter your enterprise credentials to access your fleet.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Work Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-900">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                />
              </div>

              {/* Field 2: Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-900">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Password reset instructions dispatched to registered workspace administrator.')}
                    className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 px-3.5 pr-11 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer accent-[#E11D48]"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember session for 30 days</span>
                </label>
              </div>

              {/* Primary Submit Button: Full-width, h-11, Solid Crimson */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-60"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                <ArrowRight size={15} />
              </button>

              {/* Divider: Clean Horizontal Rule with Centered "OR AUTHENTICATE WITH" badge */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium tracking-wider text-[11px]">
                    OR AUTHENTICATE WITH
                  </span>
                </div>
              </div>

              {/* SSO Button: Full-width, h-11, border-slate-200, hover:bg-slate-50 with a lock icon */}
              <button
                type="button"
                onClick={handleSsoSignIn}
                disabled={isLoading}
                className="w-full h-11 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700 text-sm font-medium rounded-lg flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
              >
                <Lock size={15} className="text-slate-500" />
                <span>Sign in with SAML / Okta SSO</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* 3. FOOTER: Centered Row with SOC2 Type II and Encryption Badges */}
      <footer className="w-full py-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <Lock size={12} className="text-slate-400" />
          <span>SOC2 Type II Certified</span>
        </div>
        <span className="hidden sm:inline text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>End-to-End Encrypted Telemetry</span>
        </div>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span>&copy; {new Date().getFullYear()} RicozInfra Inc.</span>
      </footer>
    </div>
  );
};
