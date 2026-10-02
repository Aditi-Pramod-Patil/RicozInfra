import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { PageView } from '../types';

interface SignUpViewProps {
  onNavigate: (view: PageView) => void;
}

export const SignUpView: React.FC<SignUpViewProps> = ({ onNavigate }) => {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Real-time password strength validation criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!agreeTerms) {
      setErrorMessage('Please accept the Master Services Agreement to create a workspace.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Please meet all password security requirements before proceeding.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await signup(fullName, email, orgName, password);
      if (res.success) {
        // Enforce strict zero-data landing on first signup!
        onNavigate('overview');
      } else {
        setErrorMessage(res.error || 'Failed to initialize workspace.');
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          <span>Provisioning Engine: Ready</span>
        </div>
      </div>

      {/* Main Centered Sign Up Card */}
      <div className="w-full max-w-lg mx-auto my-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-xs">
          {/* Logo & Headings */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 mb-4 shadow-2xs">
              <KeyRound size={22} className="text-slate-900" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Deploy your RicozInfra Workspace
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-normal">
              Start monitoring bare-metal, networks, and cloud clusters in real time.
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                Organization / Company Name
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Financial Technologies"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create high-entropy password"
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

              {/* Real-time Password Strength Criteria */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasUppercase ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>Numeric digit</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasSpecial ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>Special character</span>
                </div>
              </div>
            </div>

            {/* Terms and Privacy Disclaimer */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                />
                <span className="text-xs text-slate-500 leading-snug">
                  I agree to the{' '}
                  <a href="#terms" className="text-slate-900 underline hover:text-slate-700">Master Services Agreement</a> and{' '}
                  <a href="#privacy" className="text-slate-900 underline hover:text-slate-700">Privacy Policy</a>. Provisioned keys are non-transferable.
                </span>
              </label>
            </div>

            {/* Primary Action Button: Solid Crimson */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-70"
              >
                <span>{isLoading ? 'Generating Tenant Keys...' : 'Create Organization & Generate API Key'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>

          {/* Bottom Sign In Link */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <button
                onClick={() => onNavigate('signin')}
                className="font-semibold text-rose-600 hover:text-rose-700 cursor-pointer transition-colors"
              >
                Sign in to existing workspace
              </button>
            </p>
          </div>
        </div>

        {/* Security & Compliance Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <Lock size={12} /> Hardware-backed KMS
          </span>
          <span>•</span>
          <span>Dedicated Tenant Isolation</span>
        </div>
      </div>

      {/* Subtle Copyright Bottom */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} RicozInfra Inc. All rights reserved.
      </div>
    </div>
  );
};
