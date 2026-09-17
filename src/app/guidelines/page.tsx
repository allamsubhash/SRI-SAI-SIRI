'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Building, 
  Home as HomeIcon, 
  FileText, 
  LogIn, 
  ArrowRight, 
  Sparkles, 
  Quote, 
  GraduationCap, 
  Phone, 
  Mail, 
  Users, 
  IndianRupee, 
  ShieldAlert, 
  Zap, 
  Home, 
  VolumeX, 
  Leaf, 
  Heart,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';

interface GuidelineItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  CLEANLINESS: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', icon: <Sparkles className="w-5 h-5 text-blue-400" /> },
  VISITORS: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: <Users className="w-5 h-5 text-emerald-400" /> },
  PAYMENTS: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', icon: <IndianRupee className="w-5 h-5 text-amber-400" /> },
  SAFETY: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', icon: <ShieldAlert className="w-5 h-5 text-rose-400" /> },
  APPLIANCES: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', icon: <Zap className="w-5 h-5 text-purple-400" /> },
  PROPERTY: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', icon: <Home className="w-5 h-5 text-cyan-400" /> },
  SILENCE: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: <VolumeX className="w-5 h-5 text-yellow-400" /> },
  ENVIRONMENT: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: <Leaf className="w-5 h-5 text-emerald-400" /> },
  RESPECT: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30', icon: <Heart className="w-5 h-5 text-indigo-400" /> }
};

function getCategoryStyle(title: string, category?: string, index: number = 0) {
  const t = (title + ' ' + (category || '')).toUpperCase();
  if (t.includes('CLEAN') || t.includes('HYGIENE')) return CATEGORY_STYLES.CLEANLINESS;
  if (t.includes('VISITOR') || t.includes('GUEST')) return CATEGORY_STYLES.VISITORS;
  if (t.includes('RENT') || t.includes('PAYMENT') || t.includes('DUE') || t.includes('FEE')) return CATEGORY_STYLES.PAYMENTS;
  if (t.includes('SAFETY') || t.includes('SECURITY') || t.includes('EMERGENCY')) return CATEGORY_STYLES.SAFETY;
  if (t.includes('ELECTRI') || t.includes('POWER') || t.includes('APPLIANCE')) return CATEGORY_STYLES.APPLIANCES;
  if (t.includes('PROPERTY') || t.includes('FURNITURE') || t.includes('DAMAGE')) return CATEGORY_STYLES.PROPERTY;
  if (t.includes('SILENCE') || t.includes('QUIET') || t.includes('NOISE') || t.includes('TIMING')) return CATEGORY_STYLES.SILENCE;
  if (t.includes('HEALTH') || t.includes('ENVIRONMENT') || t.includes('GREEN')) return CATEGORY_STYLES.ENVIRONMENT;
  if (t.includes('RESPECT') || t.includes('DISCIPLINE') || t.includes('BEHAVIOR')) return CATEGORY_STYLES.RESPECT;

  const fallbackKeys = Object.keys(CATEGORY_STYLES);
  return CATEGORY_STYLES[fallbackKeys[index % fallbackKeys.length]];
}

export default function PublicGuidelinesPage() {
  const [guidelines, setGuidelines] = useState<GuidelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/guidelines')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch guidelines');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setGuidelines(data);
        }
      })
      .catch(err => {
        console.error('Error fetching guidelines:', err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#040814] text-[#F8FAFC] font-sans selection:bg-cyan-500/30 relative overflow-x-hidden flex flex-col justify-between">
      
      {/* AMBIENT BACKGROUND GLOW EFFECTS */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-1/3 right-1/4 w-[30rem] h-[30rem] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      
      {/* 🌟 TOP NAVIGATION BAR */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-6 flex items-center justify-between relative z-30 border-b border-white/10 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#070E22] rounded-[14px] flex items-center justify-center">
              <Building className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="text-left">
            <span className="font-black text-base sm:text-lg tracking-wider text-white block leading-none">
              SRI SAI SIRI
            </span>
            <span className="text-[10px] font-black text-cyan-400 block tracking-[3px] uppercase mt-0.5">
              BOYS HOSTEL
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-full backdrop-blur-2xl">
          <Link
            href="/"
            className="px-5 py-2 rounded-full text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2"
          >
            <HomeIcon className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          
          <Link
            href="/guidelines"
            className="px-5 py-2 rounded-full text-xs font-bold text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 flex items-center gap-2 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Guidelines</span>
          </Link>

          <Link
            href="/login"
            className="ml-2 px-5 py-2 rounded-full text-xs font-black text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all flex items-center gap-2 shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 rounded-xl bg-white/10 text-white border border-white/15"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[88px] z-40 bg-[#070E22]/95 border-b border-white/15 backdrop-blur-2xl p-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 text-slate-200 text-xs font-bold"
          >
            <HomeIcon className="w-4 h-4 text-slate-400" />
            <span>Home</span>
          </Link>
          <Link
            href="/guidelines"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Guidelines</span>
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-3 rounded-2xl bg-blue-600 text-white text-xs font-black"
          >
            <div className="flex items-center gap-3">
              <LogIn className="w-4 h-4" />
              <span>Login to Resident Portal</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 🚀 HERO SECTION */}
      <section className="w-full max-w-7xl mx-auto px-6 sm:px-8 pt-10 pb-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-8 text-left space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-black tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              OUR GUIDELINES
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              A Better Stay Starts with{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                Mutual Respect
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl">
              Please read and follow the guidelines below before joining our hostel. These rules help us maintain a safe, clean and comfortable environment for everyone.
            </p>

            {/* Quote Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#091228]/80 border border-white/15 backdrop-blur-xl flex items-center justify-between gap-4 max-w-xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                  <Quote className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm font-semibold italic text-cyan-200">
                  "Discipline today, a brighter tomorrow."
                </p>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right shrink-0 border-l border-white/10 pl-3">
                SRI SAI SIRI<br /><span className="text-cyan-400">BOYS HOSTEL</span>
              </span>
            </div>
          </div>

          <div className="lg:col-span-4 hidden lg:flex flex-col items-end justify-center text-right space-y-3 border-l border-white/10 pl-8">
            <div className="text-[10px] font-black text-slate-400 tracking-[3px] uppercase space-y-1">
              <div>SAFE STAY</div>
              <div>DISCIPLINED LIFE</div>
              <div>BRIGHT FUTURE</div>
            </div>
            <div className="flex gap-1.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600/30" />
            </div>
            <p className="text-xs font-semibold text-slate-300 italic">
              More than a stay,<br />a place to grow
            </p>
          </div>

        </div>
      </section>

      {/* 📋 GUIDELINE CARDS GRID SECTION */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-8 relative z-20 flex-1">
        
        {loading ? (
          /* SKELETON LOADING STATE */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 animate-pulse space-y-4 h-52">
                <div className="flex justify-between items-center">
                  <div className="w-10 h-10 rounded-2xl bg-white/10" />
                  <div className="w-8 h-4 rounded bg-white/10" />
                </div>
                <div className="w-3/4 h-5 rounded bg-white/10" />
                <div className="w-full h-12 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="p-12 text-center rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 space-y-3 max-w-lg mx-auto my-8">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="font-black text-base">Unable to load hostel guidelines</h3>
            <p className="text-xs text-rose-300/80">Please check network connectivity or refresh the page.</p>
          </div>
        ) : guidelines.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-16 text-center rounded-3xl bg-white/5 border border-white/10 text-slate-400 space-y-3 max-w-md mx-auto my-8">
            <FileText className="w-12 h-12 text-slate-500 mx-auto opacity-50" />
            <h3 className="font-bold text-sm text-slate-200">No hostel guidelines published yet.</h3>
            <p className="text-xs text-slate-400">Hostel rules configured by management will appear here dynamically.</p>
          </div>
        ) : (
          /* DYNAMIC GUIDELINES GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guidelines.map((g, index) => {
              const style = getCategoryStyle(g.title, g.category, index);
              const numFormatted = String(g.order || index + 1).padStart(2, '0');

              return (
                <motion.div
                  key={g.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="p-6 sm:p-7 rounded-3xl bg-[#081024]/90 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 shadow-xl backdrop-blur-xl flex flex-col justify-between text-left group relative overflow-hidden"
                >
                  <div className="space-y-4 relative z-10">
                    {/* Header: Icon & Number */}
                    <div className="flex justify-between items-center">
                      <div className={`w-12 h-12 rounded-2xl ${style.bg} border ${style.border} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                        {style.icon}
                      </div>
                      <span className="font-black text-lg text-slate-400 group-hover:text-cyan-400 transition-colors">
                        {numFormatted}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-cyan-300 transition-colors">
                      {g.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      {g.content}
                    </p>
                  </div>

                  {/* Card Bottom Arrow Indicator */}
                  <div className="pt-6 flex justify-end relative z-10">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-cyan-500 group-hover:text-black group-hover:border-cyan-500 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* 🌟 BOTTOM CTA BANNER */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#091533] via-[#0E204A] to-[#091533] border border-cyan-500/30 shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-white">Together for a Better Tomorrow</h3>
              <p className="text-xs text-slate-300 font-medium">
                Your cooperation helps us create a safe, comfortable and disciplined living space for all residents.
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="px-7 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/25 shrink-0 transition-transform hover:scale-105 cursor-pointer"
          >
            <span>Go to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </main>

      {/* 🏁 FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-8 border-t border-white/10 relative z-20 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Building className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-black text-white text-sm block leading-none">SRI SAI SIRI</span>
            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mt-0.5 block">BOYS HOSTEL</span>
          </div>
        </div>

        <div className="italic text-slate-300 font-medium text-xs sm:text-sm">
          Safe Stay <span className="text-cyan-400 font-normal">|</span> Disciplined Life <span className="text-cyan-400 font-normal">|</span> Bright Future
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
            <span>+91 98765 43210</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span>info@srisaisiri.com</span>
          </div>
        </div>

      </footer>

    </div>
  );
}
