import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Lock, ArrowRight, Building2 } from 'lucide-react';
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
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 select-none">
      {/* Top Brand Nav */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-1.5 focus:outline-none cursor-pointer group"
          title="Return to Public Website"
        >
          <span className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-slate-700 transition-colors">
            RicozInfra
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block mb-0.5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>SSO Gateways: 99.99% Nominal</span>
        </div>
      </div>

      {/* Main Centered Sign In Card */}
      <div className="w-full max-w-md mx-auto my-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-xs">
          {/* Logo & Headings */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 mb-4 shadow-2xs">
              <ShieldCheck size={22} className="text-slate-900" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Sign in to RicozInfra Command Console
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-normal">
              Enter your enterprise credentials to access your fleet.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-900">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions dispatched to registered workspace administrators.');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                />
                <span className="text-xs text-slate-600 font-medium">Remember session for 30 days</span>
              </label>
            </div>

            {/* Primary Action Button: Solid Crimson */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-70"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight size={15} />
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                  Or authenticate with
                </span>
              </div>
            </div>

            {/* SSO Action Button: Slate Outline */}
            <button
              type="button"
              onClick={handleSsoSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
            >
              <Building2 size={16} className="text-slate-500" />
              <span>Sign in with SAML / Okta SSO</span>
            </button>
          </form>

          {/* Bottom Account Creation Link */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have a workspace?{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="font-semibold text-rose-600 hover:text-rose-700 cursor-pointer transition-colors"
              >
                Create an enterprise account
              </button>
            </p>
          </div>
        </div>

        {/* Security & Compliance Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <Lock size={12} /> SOC2 Type II Certified
          </span>
          <span>•</span>
          <span>End-to-End Encrypted Telemetry</span>
        </div>
      </div>

      {/* Subtle Copyright Bottom */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} RicozInfra Inc. All rights reserved.
      </div>
    </div>
  );
};
