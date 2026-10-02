import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Lock, KeyRound, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-white flex flex-col justify-between select-none">
      {/* 1. TOP BAR (h-16, Pure White, border-b border-slate-200) */}
      <header className="h-16 w-full border-b border-slate-200 px-6 sm:px-10 flex items-center justify-between shrink-0 bg-white">
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

        <button
          onClick={() => onNavigate('signin')}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer focus:outline-none"
        >
          <span>Already have an account? Sign in</span>
          <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </button>
      </header>

      {/* 2. MAIN CENTERED CARD CONTAINER */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[460px]">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            {/* Header Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 mb-3 shadow-2xs">
                <KeyRound size={20} className="text-slate-900" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Deploy your RicozInfra Workspace
              </h1>
              <p className="text-xs text-slate-500 mt-1.5 font-normal">
                Start monitoring bare-metal, networks, and cloud clusters in real time.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-900">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-900">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-900">
                  Organization / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Financial Technologies"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-900">
                  Master Security Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create secure password"
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

                {/* Password Criteria Checklist */}
                <div className="pt-1.5 grid grid-cols-2 gap-1.5 text-[11px]">
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

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer accent-[#E11D48]"
                  />
                  <span className="text-xs text-slate-500 leading-snug">
                    I agree to the{' '}
                    <span className="text-slate-900 underline">Master Services Agreement</span> and{' '}
                    <span className="text-slate-900 underline">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-60"
              >
                <span>{isLoading ? 'Generating Tenant Keys...' : 'Create Organization & Generate API Key'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="w-full py-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <Lock size={12} className="text-slate-400" />
          <span>Hardware-backed KMS</span>
        </div>
        <span className="hidden sm:inline text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>Dedicated Tenant Isolation</span>
        </div>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span>&copy; {new Date().getFullYear()} RicozInfra Inc.</span>
      </footer>
    </div>
  );
};
