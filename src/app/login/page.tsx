'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  UserCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Sun, 
  Moon
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import LiveBackground from '@/components/backgrounds/LiveBackground';
import WelcomeScreenOverlay from '@/components/WelcomeScreenOverlay';

export type PortalRole = 'OWNER' | 'TENANT' | 'WARDEN';

function LoginContent() {
  const { user, loading, login, registerOwner } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Primary State
  const [selectedRole, setSelectedRole] = useState<PortalRole>('OWNER');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [ownerKey, setOwnerKey] = useState('');
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Interaction & Status State
  const [submitting, setSubmitting] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [expiredMsg, setExpiredMsg] = useState(false);

  // Welcome Screen Overlay State
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<{ name: string; role: 'OWNER' | 'TENANT' } | null>(null);

  // Forgot Password In-Orb View State
  const [viewState, setViewState] = useState<'LOGIN' | 'FORGOT_PASSWORD'>('LOGIN');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Session Check & Welcome Screen Triggering Logic
  useEffect(() => {
    if (!loading && user) {
      const welcomeSeen = typeof window !== 'undefined' ? sessionStorage.getItem('welcomeSeen') : null;
      if (welcomeSeen === 'true') {
        if (user.role === 'OWNER') {
          router.replace('/owner/reports');
        } else {
          router.replace('/tenant/dashboard');
        }
      } else {
        // Show Full-Screen Welcome Experience after login until user clicks ENTER PORTAL!
        setWelcomeUser({ name: user.name, role: user.role });
        setShowWelcomeOverlay(true);
      }
    }
  }, [user, loading, router]);

  // Check if redirected due to session expiration
  useEffect(() => {
    if (searchParams?.get('expired') === 'true') {
      setExpiredMsg(true);
    }
  }, [searchParams]);

  // Sync theme with localStorage & document element
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      setIsDarkMode(saved === 'dark');
    } else {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || authSuccess) return;

    setErrorMsg('');
    setExpiredMsg(false);

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (authMode === 'SIGN_UP') {
      if (!fullName) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!ownerKey) {
        setErrorMsg('Please enter the Owner Passkey to register an Owner account.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await registerOwner(fullName, email, password, ownerKey);
        if (res.success && res.user) {
          setAuthSuccess(true);
          setWelcomeUser({ name: res.user.name, role: res.user.role });
          setShowWelcomeOverlay(true);
        } else {
          setErrorMsg(res.error || 'Owner registration failed.');
          setSubmitting(false);
        }
      } catch (err) {
        setErrorMsg('An unexpected error occurred during registration.');
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);

    try {
      const targetRole = selectedRole === 'WARDEN' ? 'OWNER' : selectedRole;
      const res = await login(email, password, targetRole, rememberMe);
      
      if (res.success && res.user) {
        setAuthSuccess(true);
        setWelcomeUser({ name: res.user.name, role: res.user.role });
        setShowWelcomeOverlay(true);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
        setSubmitting(false);
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  // Called ONLY when user explicitly clicks "ENTER MANAGEMENT PORTAL →" or "ENTER MY PORTAL →" or "Skip for now"
  const handleEnterPortal = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('welcomeSeen', 'true');
    }
    const role = welcomeUser?.role || user?.role;
    if (role === 'OWNER') {
      router.push('/owner/reports');
    } else {
      router.push('/tenant/dashboard');
    }
  };

  // Handle Forgot Password Submit
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) return;
    setForgotSubmitting(true);
    setTimeout(() => {
      setForgotSubmitting(false);
      setForgotSuccess(true);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020306] flex items-center justify-center text-slate-300 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-wider text-slate-400">Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full relative overflow-hidden flex flex-col justify-between transition-colors duration-700 font-sans selection:bg-[#3B82F6]/30 select-none ${
      isDarkMode ? 'bg-[#020306] text-[#F8FAFC]' : 'bg-[#F1F5F9] text-[#0F172A]'
    }`}>
      
      {/* 🌟 FULL-SCREEN WELCOME EXPERIENCE OVERLAY (SHOWS AFTER LOGIN UNTIL USER CLICKS ENTER PORTAL) */}
      {(showWelcomeOverlay || (user && welcomeUser)) && (
        <WelcomeScreenOverlay
          isOpen={true}
          userRole={welcomeUser?.role || user?.role || 'OWNER'}
          userName={welcomeUser?.name || user?.name || 'User'}
          onEnter={handleEnterPortal}
        />
      )}

      {/* Universal Live Background */}
      <LiveBackground variant={selectedRole === 'WARDEN' ? 'warden' : selectedRole === 'TENANT' ? 'tenant' : 'portal'} />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-8 py-8 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center backdrop-blur-md ${
            isDarkMode ? 'bg-white/10 border-white/20 text-[#3B82F6]' : 'bg-white border-slate-300 text-[#2563EB] shadow-sm'
          }`}>
            <svg className={`w-4 h-4 ${isDarkMode ? 'text-[#38C7D9]' : 'text-[#2563EB]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M9 13h6M9 17h6" />
            </svg>
          </div>
          <div>
            <span className={`font-black text-base tracking-widest block ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
              SRI SAI SIRI BOYS HOSTEL
            </span>
            <span className={`text-[9px] font-black block uppercase tracking-[3px] ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              MANAGEMENT & RESIDENT PORTAL
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2.5 rounded-full border backdrop-blur-md text-xs transition-all cursor-pointer flex items-center gap-2 font-bold ${
            isDarkMode 
              ? 'border-white/10 bg-white/5 text-slate-300 hover:text-white' 
              : 'border-slate-300 bg-white text-slate-700 hover:text-slate-900 shadow-sm'
          }`}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-7xl mx-auto px-4 py-6 my-auto relative z-20 flex flex-col items-center justify-center">
        
        <div className={`w-full max-w-[420px] sm:max-w-[460px] rounded-[36px] sm:rounded-[44px] p-6 sm:p-10 backdrop-blur-3xl border transition-all duration-500 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-2xl ${
          isDarkMode 
            ? 'bg-[#020306]/85 border-white/15 text-white shadow-[0_25px_80px_rgba(0,0,0,0.9)]' 
            : 'bg-white/90 border-slate-300/80 text-[#0F172A] shadow-[0_20px_50px_rgba(0,0,0,0.08)]'
        }`}>

          <AnimatePresence mode="wait">
            {viewState === 'LOGIN' ? (
              <motion.div
                key="orb-login"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-xs flex flex-col items-center space-y-4 my-auto relative z-10"
              >
                {/* Mode Selector Toggle */}
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/10 border border-white/15 mb-1">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('SIGN_IN'); setErrorMsg(''); }}
                    className={`px-3 py-1 rounded-full text-[9px] font-black tracking-wider transition-all cursor-pointer ${
                      authMode === 'SIGN_IN' 
                        ? (isDarkMode ? 'bg-[#38C7D9] text-black shadow-xs' : 'bg-[#2563EB] text-white shadow-xs') 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    SIGN IN
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('SIGN_UP'); setSelectedRole('OWNER'); setErrorMsg(''); }}
                    className={`px-3 py-1 rounded-full text-[9px] font-black tracking-wider transition-all cursor-pointer ${
                      authMode === 'SIGN_UP' 
                        ? 'bg-purple-600 text-white shadow-xs' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🔑 OWNER SIGNUP
                  </button>
                </div>

                {/* Header */}
                <div className="space-y-1 text-center">
                  <span className={`text-[10px] font-black uppercase tracking-[3px] block ${isDarkMode ? 'text-[#38C7D9]' : 'text-[#2563EB]'}`}>
                    {authMode === 'SIGN_UP' ? 'OWNER REGISTRATION' : 'SRI SAI SIRI PORTAL'}
                  </span>
                  <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                    {authMode === 'SIGN_UP' ? 'Register New Owner' : 'Management Portal Login'}
                  </h2>
                </div>

                {/* EXPIRED SESSION ALERT */}
                {expiredMsg && (
                  <div className="w-full p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Your session has expired. Please sign in again.</span>
                  </div>
                )}

                {/* ERROR BANNER */}
                {errorMsg && (
                  <div className="w-full p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-[10px] font-bold flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* FORM */}
                <form onSubmit={handleSubmit} className="w-full space-y-3 text-left">
                  
                  {/* FULL NAME (ONLY ON SIGNUP) */}
                  {authMode === 'SIGN_UP' && (
                    <div className="space-y-1">
                      <label className={`text-[9px] font-black uppercase tracking-wider block ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alok Sharma"
                        className={`w-full border-b py-2 px-2 text-xs font-bold focus:outline-none transition-colors rounded-none cursor-text ${
                          isDarkMode 
                            ? 'bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-[#38C7D9]' 
                            : 'bg-slate-100/90 border-slate-300 text-[#0F172A] placeholder-slate-400 focus:border-[#2563EB]'
                        }`}
                      />
                    </div>
                  )}

                  {/* EMAIL */}
                  <div className="space-y-1">
                    <label className={`text-[9px] font-black uppercase tracking-wider block ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@srisaisiri.com or tenant@srisaisiri.com"
                      className={`w-full border-b py-2.5 px-2 text-xs font-bold focus:outline-none transition-colors rounded-none cursor-text ${
                        isDarkMode 
                          ? 'bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-[#38C7D9]' 
                          : 'bg-slate-100/90 border-slate-300 text-[#0F172A] placeholder-slate-400 focus:border-[#2563EB]'
                      }`}
                    />
                  </div>

                  {/* PASSWORD */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className={`text-[9px] font-black uppercase tracking-wider ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                        PASSWORD
                      </label>
                      {authMode === 'SIGN_IN' && (
                        <button
                          type="button"
                          onClick={() => setViewState('FORGOT_PASSWORD')}
                          className={`text-[10px] transition-colors font-bold cursor-pointer ${
                            isDarkMode ? 'text-[#94A3B8] hover:text-[#38C7D9]' : 'text-[#64748B] hover:text-[#2563EB]'
                          }`}
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full border-b py-2.5 pl-2 pr-8 text-xs font-bold focus:outline-none transition-colors rounded-none cursor-text ${
                          isDarkMode 
                            ? 'bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-[#38C7D9]' 
                            : 'bg-slate-100/90 border-slate-300 text-[#0F172A] placeholder-slate-400 focus:border-[#2563EB]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer p-1 ${
                          isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* OWNER SECURITY PASSKEY (ONLY ON SIGNUP) */}
                  {authMode === 'SIGN_UP' && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center">
                        <label className={`text-[9px] font-black uppercase tracking-wider block ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                          🔑 OWNER SECURITY PASSKEY
                        </label>
                      </div>
                      <input
                        type="password"
                        required
                        value={ownerKey}
                        onChange={(e) => setOwnerKey(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full border-b py-2 px-2 text-xs font-bold focus:outline-none transition-colors rounded-none cursor-text tracking-wider ${
                          isDarkMode 
                            ? 'bg-purple-950/20 border-purple-500/40 text-purple-200 placeholder-purple-400/50 focus:border-purple-400' 
                            : 'bg-purple-50/80 border-purple-300 text-purple-900 placeholder-purple-400 focus:border-purple-600'
                        }`}
                      />
                    </div>
                  )}

                  {/* REMEMBER DEVICE CHECKBOX */}
                  {authMode === 'SIGN_IN' && (
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setRememberMe(!rememberMe)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          rememberMe 
                            ? (isDarkMode ? 'bg-[#38C7D9] border-[#38C7D9] text-black' : 'bg-[#2563EB] border-[#2563EB] text-white') 
                            : (isDarkMode ? 'border-white/20 bg-transparent' : 'border-slate-300 bg-transparent')
                        }`}
                      >
                        {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <span 
                        onClick={() => setRememberMe(!rememberMe)}
                        className={`text-xs font-bold cursor-pointer select-none ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                      >
                        Remember Device
                      </span>
                    </div>
                  )}

                  {/* CTA ACTION BUTTON */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={submitting || authSuccess}
                      className={`w-full py-3.5 rounded-full border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer group shadow-md ${
                        authMode === 'SIGN_UP'
                          ? 'bg-purple-600 hover:bg-purple-700 border-purple-500 text-white'
                          : isDarkMode 
                          ? 'bg-white/10 hover:bg-[#38C7D9] hover:text-black border-white/20 text-white' 
                          : 'bg-[#2563EB] hover:bg-[#1D4ED8] border-[#2563EB] text-white'
                      }`}
                    >
                      {submitting ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : authSuccess ? (
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Authentication Granted</span>
                      ) : (
                        <>
                          <span>{authMode === 'SIGN_UP' ? 'CREATE OWNER ACCOUNT' : 'ENTER PORTAL'}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                </form>

              </motion.div>
            ) : (
              /* FORGOT PASSWORD IN-ORB VIEW (CONTACT ADMIN) */
              <motion.div
                key="orb-forgot"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-xs space-y-4 my-auto text-center relative z-10"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 mx-auto flex items-center justify-center font-black shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>

                <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                  Contact Hostel Admin
                </h3>

                <div className={`p-4 rounded-2xl border text-xs font-medium space-y-2 text-left shadow-sm ${
                  isDarkMode 
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' 
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <p className="font-bold text-xs">Password Reset Policy:</p>
                  <p className="leading-relaxed">
                    To reset or recover your tenant portal account passkey, please contact your <strong>Hostel Owner or Warden</strong> at the front desk.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setViewState('LOGIN')}
                  className={`w-full py-3 rounded-full border font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                    isDarkMode 
                      ? 'bg-white/10 hover:bg-[#38C7D9] hover:text-black border-white/20 text-white' 
                      : 'bg-[#2563EB] hover:bg-[#1D4ED8] border-[#2563EB] text-white'
                  }`}
                >
                  Return to Sign In →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </main>

      {/* Footer */}
      <footer className={`w-full max-w-7xl mx-auto px-8 py-6 text-center text-[10px] font-black uppercase tracking-[3px] relative z-20 ${
        isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'
      }`}>
        SRI SAI SIRI BOYS HOSTEL • ENTER YOUR SPACE
      </footer>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020306] flex items-center justify-center text-slate-300 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-wider text-slate-400">Loading Login...</span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
