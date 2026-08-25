'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Key, 
  User, 
  CheckCircle2, 
  Compass, 
  Sun, 
  Moon, 
  X,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import LiveBackground from '@/components/backgrounds/LiveBackground';

export type PortalRole = 'OWNER' | 'TENANT' | 'WARDEN';

export default function LoginPage() {
  const { login } = useAuth();

  // Primary State
  const [selectedRole, setSelectedRole] = useState<PortalRole>('OWNER');
  const [hoveredRole, setHoveredRole] = useState<PortalRole | null>(null);
  
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
  const [portalExpanding, setPortalExpanding] = useState(false);

  // Forgot Password In-Orb View State
  const [viewState, setViewState] = useState<'LOGIN' | 'FORGOT_PASSWORD'>('LOGIN');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Demo Access Toggle
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  // Theme State (Default Dark, synced with localStorage and HTML class)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Mouse Parallax & Ambient Aura Follower State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorHovered, setCursorHovered] = useState(false);
  
  // Canvas Ref for 3D Flowing Silk Mesh Ribbons
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Mouse move handler for parallax and ambient glow ring
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 🎨 60 FPS HTML5 CANVAS 3D VOLUMETRIC SILK RIBBON SIMULATOR
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let step = 0;

    // Render 4 Volumetric Fluid Silk Ribbons
    const render = () => {
      step += 0.006;
      ctx.clearRect(0, 0, width, height);

      // Ribbon Configs (Adaptive to Dark vs Light Mode)
      const ribbons = [
        {
          yOffset: height * 0.4,
          amplitude: 90,
          frequency: 0.002,
          color1: isDarkMode ? 'rgba(37, 99, 235, 0.45)' : 'rgba(37, 99, 235, 0.2)', 
          color2: isDarkMode ? 'rgba(56, 199, 217, 0.35)' : 'rgba(56, 199, 217, 0.2)', 
          speed: step * 0.8,
        },
        {
          yOffset: height * 0.55,
          amplitude: 110,
          frequency: 0.0015,
          color1: isDarkMode ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.18)', 
          color2: isDarkMode ? 'rgba(217, 70, 239, 0.3)' : 'rgba(217, 70, 239, 0.15)', 
          speed: step * 1.1,
        },
        {
          yOffset: height * 0.7,
          amplitude: 80,
          frequency: 0.0025,
          color1: isDarkMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.15)', 
          color2: isDarkMode ? 'rgba(52, 211, 153, 0.25)' : 'rgba(52, 211, 153, 0.15)', 
          speed: step * 0.6,
        },
      ];

      ribbons.forEach((r) => {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, r.color1);
        grad.addColorStop(1, r.color2);
        ctx.fillStyle = grad;

        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 15) {
          const y =
            r.yOffset +
            Math.sin(x * r.frequency + r.speed) * r.amplitude +
            Math.cos(x * 0.001 + r.speed * 0.5) * (r.amplitude * 0.5);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  // Role Selection Handler
  const handleSelectRole = (role: PortalRole) => {
    setSelectedRole(role);
    setErrorMsg('');
  };

  const handleAutofillDemo = (role: PortalRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'TENANT') {
      setEmail('tenant@srisaisiri.com');
      setPassword('password123');
    } else {
      setEmail('owner@srisaisiri.com');
      setPassword('password123');
    }
  };

  // Handle Form Submission with Cinematic Portal Entry Transition
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || authSuccess) return;

    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setSubmitting(true);

    try {
      const targetRole = selectedRole === 'WARDEN' ? 'OWNER' : selectedRole;
      const res = await login(email, password, targetRole);
      
      if (res.success) {
        setAuthSuccess(true);
        // Cinematic Portal Entry Expansion Transition (600ms)
        setPortalExpanding(true);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
        setSubmitting(false);
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred.');
      setSubmitting(false);
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

  // Parallax Calculation
  const parallaxX = (mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * 0.015;
  const parallaxY = (mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * 0.015;

  return (
    <div className={`min-h-screen w-full relative overflow-hidden flex flex-col justify-between transition-colors duration-700 font-sans selection:bg-[#3B82F6]/30 select-none ${
      isDarkMode ? 'bg-[#020306] text-[#F8FAFC]' : 'bg-[#F1F5F9] text-[#0F172A]'
    }`}>
      
      {/* ================================================== */}
      {/* 🔮 1. HIGH-VISIBILITY GLOWING CURSOR FOLLOWER RING */}
      {/* ================================================== */}
      <motion.div
        animate={{
          x: mousePos.x - 16,
          y: mousePos.y - 16,
          scale: cursorHovered ? 1.6 : 1,
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        className={`fixed w-8 h-8 rounded-full border-2 pointer-events-none z-[9999] hidden sm:block ${
          isDarkMode 
            ? 'border-[#38C7D9] bg-[#38C7D9]/15 shadow-[0_0_15px_#38C7D9]' 
            : 'border-[#2563EB] bg-[#2563EB]/15 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
        }`}
      />

      {/* ================================================== */}
      {/* 🌊 2. UNIVERSAL LIVE BACKGROUND SYSTEM            */}
      {/* ================================================== */}
      <LiveBackground variant={selectedRole === 'WARDEN' ? 'warden' : selectedRole === 'TENANT' ? 'tenant' : 'portal'} />

      {/* ================================================== */}
      {/* 🏛️ 3. MINIMAL BRAND HEADER                         */}
      {/* ================================================== */}
      <header className="w-full max-w-7xl mx-auto px-8 py-8 flex justify-between items-center relative z-20">
        <div 
          onMouseEnter={() => setCursorHovered(true)}
          onMouseLeave={() => setCursorHovered(false)}
          className="flex items-center gap-3 cursor-pointer"
        >
          {/* Minimalist Architectural Symbol Icon */}
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
              BOYS HOSTEL OPERATIONS
            </span>
          </div>
        </div>

        {/* Theme Button */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          onMouseEnter={() => setCursorHovered(true)}
          onMouseLeave={() => setCursorHovered(false)}
          className={`p-2.5 rounded-full border backdrop-blur-md text-xs transition-all cursor-pointer flex items-center gap-2 font-bold ${
            isDarkMode 
              ? 'border-white/10 bg-white/5 text-slate-300 hover:text-white' 
              : 'border-slate-300 bg-white text-slate-700 hover:text-slate-900 shadow-sm'
          }`}
          aria-label="Toggle Color Theme"
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

      {/* ================================================== */}
      {/* 🔮 4. CENTRAL SUSPENDED FROSTED GLASS ORB PORTAL  */}
      {/* ================================================== */}
      <main className="w-full max-w-7xl mx-auto px-4 py-4 my-auto relative z-20 flex flex-col items-center justify-center">
        
        {/* 🛸 FLOATING PORTAL ROLE ACCESS POINTS */}
        <div className="w-full max-w-md flex justify-between items-center mb-6 px-4 relative z-30">
          {[
            { role: 'OWNER' as PortalRole, label: 'OWNER', color: isDarkMode ? 'text-[#3B82F6] border-[#3B82F6]' : 'text-[#2563EB] border-[#2563EB]' },
            { role: 'TENANT' as PortalRole, label: 'TENANT', color: isDarkMode ? 'text-[#38C7D9] border-[#38C7D9]' : 'text-[#0284C7] border-[#0284C7]' },
            { role: 'WARDEN' as PortalRole, label: 'WARDEN', color: isDarkMode ? 'text-[#34D399] border-[#34D399]' : 'text-[#059669] border-[#059669]' }
          ].map((item) => {
            const isSelected = selectedRole === item.role;
            const isHovered = hoveredRole === item.role;
            return (
              <button
                key={item.role}
                onClick={() => handleSelectRole(item.role)}
                onMouseEnter={() => { setHoveredRole(item.role); setCursorHovered(true); }}
                onMouseLeave={() => { setHoveredRole(null); setCursorHovered(false); }}
                className={`text-xs font-black tracking-widest px-4 py-2 rounded-full border transition-all duration-300 cursor-pointer relative ${
                  isSelected 
                    ? (isDarkMode ? `bg-white/15 ${item.color} shadow-lg backdrop-blur-md scale-110` : `bg-[#0F172A] text-white border-[#0F172A] shadow-md scale-110`) 
                    : isHovered 
                    ? (isDarkMode ? `bg-white/10 ${item.color} -translate-y-1` : `bg-slate-200/60 ${item.color} -translate-y-1`) 
                    : (isDarkMode ? 'bg-transparent border-transparent text-[#94A3B8] hover:text-white' : 'bg-transparent border-transparent text-[#64748B] hover:text-[#0F172A]')
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* 🔮 THE FROSTED GLASS ORB CONTAINER */}
        <motion.div
          animate={{
            rotateX: parallaxY * -1.5,
            rotateY: parallaxX * 1.5,
            scale: portalExpanding ? 1.15 : 1,
            opacity: portalExpanding ? 0.9 : 1,
          }}
          transition={{ type: 'spring', stiffness: 50, damping: 25 }}
          style={{ transformStyle: 'preserve-3d' }}
          className={`w-full max-w-[440px] sm:max-w-[480px] aspect-square rounded-full p-8 sm:p-12 backdrop-blur-3xl border transition-all duration-500 flex flex-col justify-center items-center text-center relative overflow-hidden ${
            isDarkMode 
              ? 'bg-[#020306]/75 border-white/15 text-white shadow-[0_25px_80px_rgba(0,0,0,0.9)]' 
              : 'bg-white/85 border-slate-300/80 text-[#0F172A] shadow-[0_20px_50px_rgba(0,0,0,0.08)]'
          }`}
        >
          {/* Travelling Specular Rim Glare */}
          <div className={`absolute inset-0 rounded-full border pointer-events-none animate-[spin_12s_linear_infinite] ${
            isDarkMode ? 'border-white/20 bg-gradient-to-tr from-transparent via-white/10 to-transparent' : 'border-slate-300/50 bg-gradient-to-tr from-transparent via-slate-200/30 to-transparent'
          }`} />

          {/* DYNAMIC REFRACTION TINT SPILL */}
          <div className={`absolute inset-0 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
            selectedRole === 'OWNER' 
              ? (isDarkMode ? 'bg-[#3B82F6]/10' : 'bg-[#2563EB]/08') 
              : selectedRole === 'TENANT' 
              ? (isDarkMode ? 'bg-[#38C7D9]/10' : 'bg-[#0284C7]/08') 
              : (isDarkMode ? 'bg-[#34D399]/10' : 'bg-[#059669]/08')
          }`} />

          {/* IN-ORB VIEW STAGES */}
          <AnimatePresence mode="wait">
            {viewState === 'LOGIN' ? (
              <motion.div
                key="orb-login"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-xs flex flex-col items-center space-y-4 my-auto relative z-10"
              >
                {/* Header */}
                <div className="space-y-1 text-center">
                  <span className={`text-[10px] font-black uppercase tracking-[3px] block ${isDarkMode ? 'text-[#38C7D9]' : 'text-[#2563EB]'}`}>
                    {selectedRole} PORTAL
                  </span>
                  <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                    Enter Your Space
                  </h2>
                </div>

                {/* ERROR BANNER */}
                {errorMsg && (
                  <div className="w-full p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-[10px] font-bold flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* FORM */}
                <form onSubmit={handleSubmit} className="w-full space-y-3 text-left">
                  
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
                      onMouseEnter={() => setCursorHovered(true)}
                      onMouseLeave={() => setCursorHovered(false)}
                      placeholder="person@srisaisiri.com"
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
                      <button
                        type="button"
                        onClick={() => setViewState('FORGOT_PASSWORD')}
                        onMouseEnter={() => setCursorHovered(true)}
                        onMouseLeave={() => setCursorHovered(false)}
                        className={`text-[10px] transition-colors font-bold cursor-pointer ${
                          isDarkMode ? 'text-[#94A3B8] hover:text-[#38C7D9]' : 'text-[#64748B] hover:text-[#2563EB]'
                        }`}
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onMouseEnter={() => setCursorHovered(true)}
                        onMouseLeave={() => setCursorHovered(false)}
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
                        onMouseEnter={() => setCursorHovered(true)}
                        onMouseLeave={() => setCursorHovered(false)}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer p-1 ${
                          isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* REMEMBER DEVICE TOGGLE */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRememberMe(!rememberMe)}
                      onMouseEnter={() => setCursorHovered(true)}
                      onMouseLeave={() => setCursorHovered(false)}
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                        rememberMe 
                          ? (isDarkMode ? 'bg-[#38C7D9] border-[#38C7D9] text-black' : 'bg-[#2563EB] border-[#2563EB] text-white') 
                          : (isDarkMode ? 'border-white/20 bg-transparent' : 'border-slate-300 bg-transparent')
                      }`}
                    >
                      {rememberMe && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </button>
                    <span 
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`text-[10px] font-bold cursor-pointer select-none ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}
                    >
                      Remember device
                    </span>
                  </div>

                  {/* CTA ACTION BUTTON */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={submitting || authSuccess}
                      onMouseEnter={() => setCursorHovered(true)}
                      onMouseLeave={() => setCursorHovered(false)}
                      className={`w-full py-3 rounded-full border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer group shadow-md ${
                        isDarkMode 
                          ? 'bg-white/10 hover:bg-[#38C7D9] hover:text-black border-white/20 text-white' 
                          : 'bg-[#2563EB] hover:bg-[#1D4ED8] border-[#2563EB] text-white'
                      }`}
                    >
                      {submitting ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : authSuccess ? (
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Entry Granted</span>
                      ) : (
                        <>
                          <span>ENTER PORTAL</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                </form>

                {/* TRY DEMO ACTION LINK */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowDemoMenu(!showDemoMenu)}
                    onMouseEnter={() => setCursorHovered(true)}
                    onMouseLeave={() => setCursorHovered(false)}
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
                      isDarkMode ? 'text-[#94A3B8] hover:text-white' : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    TRY DEMO ACCESS
                  </button>
                  
                  {showDemoMenu && (
                    <div className="flex justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleAutofillDemo('OWNER')}
                        onMouseEnter={() => setCursorHovered(true)}
                        onMouseLeave={() => setCursorHovered(false)}
                        className={`text-[10px] font-bold hover:underline cursor-pointer ${isDarkMode ? 'text-[#3B82F6]' : 'text-[#2563EB]'}`}
                      >
                        ⚡ Autofill Owner Demo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutofillDemo('TENANT')}
                        onMouseEnter={() => setCursorHovered(true)}
                        onMouseLeave={() => setCursorHovered(false)}
                        className={`text-[10px] font-bold hover:underline cursor-pointer ${isDarkMode ? 'text-[#38C7D9]' : 'text-[#0284C7]'}`}
                      >
                        ⚡ Autofill Tenant Demo
                      </button>
                    </div>
                  )}
                </div>

              </motion.div>
            ) : (
              /* FORGOT PASSWORD IN-ORB VIEW */
              <motion.div
                key="orb-forgot"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-xs space-y-4 my-auto text-center relative z-10"
              >
                <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                  Reset Password
                </h3>
                {forgotSuccess ? (
                  <div className="space-y-3">
                    <p className="text-xs text-emerald-500 font-bold">Reset token dispatched to {forgotEmail}.</p>
                    <button
                      type="button"
                      onClick={() => { setViewState('LOGIN'); setForgotSuccess(false); }}
                      onMouseEnter={() => setCursorHovered(true)}
                      onMouseLeave={() => setCursorHovered(false)}
                      className={`text-xs font-black hover:underline cursor-pointer ${isDarkMode ? 'text-[#38C7D9]' : 'text-[#2563EB]'}`}
                    >
                      Return to Portal
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-3">
                    <p className={`text-xs font-medium leading-relaxed ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                      Enter your email address to generate an instant reset token.
                    </p>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      onMouseEnter={() => setCursorHovered(true)}
                      onMouseLeave={() => setCursorHovered(false)}
                      placeholder="person@srisaisiri.com"
                      className={`w-full border-b py-2.5 px-2 text-xs font-bold focus:outline-none transition-colors cursor-text ${
                        isDarkMode 
                          ? 'bg-white/5 border-white/20 text-white placeholder-slate-400 focus:border-[#38C7D9]' 
                          : 'bg-slate-100/90 border-slate-300 text-[#0F172A] placeholder-slate-400 focus:border-[#2563EB]'
                      }`}
                    />
                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => setViewState('LOGIN')}
                        onMouseEnter={() => setCursorHovered(true)}
                        onMouseLeave={() => setCursorHovered(false)}
                        className={`text-xs font-bold cursor-pointer ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotSubmitting}
                        onMouseEnter={() => setCursorHovered(true)}
                        onMouseLeave={() => setCursorHovered(false)}
                        className={`text-xs font-black hover:underline cursor-pointer ${isDarkMode ? 'text-[#38C7D9]' : 'text-[#2563EB]'}`}
                      >
                        {forgotSubmitting ? 'Dispatching...' : 'SEND LINK &rarr;'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>

      </main>

      {/* ================================================== */}
      {/* 📜 5. MINIMAL FOOTER                               */}
      {/* ================================================== */}
      <footer className={`w-full max-w-7xl mx-auto px-8 py-6 text-center text-[10px] font-black uppercase tracking-[3px] relative z-20 ${
        isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'
      }`}>
        SRI SAI SIRI BOYS HOSTEL • ENTER YOUR SPACE
      </footer>

    </div>
  );
}
