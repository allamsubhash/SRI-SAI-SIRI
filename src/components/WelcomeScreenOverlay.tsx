'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  DoorOpen, 
  Users, 
  Bed, 
  DollarSign, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Settings, 
  Zap, 
  Globe, 
  Home, 
  Calendar, 
  CheckCircle2, 
  Receipt 
} from 'lucide-react';
import { formatINR } from '@/utils/formatters';

interface WelcomeScreenOverlayProps {
  isOpen: boolean;
  userRole: 'OWNER' | 'TENANT';
  userName: string;
  onEnter: () => void;
}

export default function WelcomeScreenOverlay({
  isOpen,
  userRole,
  userName,
  onEnter
}: WelcomeScreenOverlayProps) {
  if (!isOpen) return null;

  const isOwner = userRole === 'OWNER';
  const cleanFirstName = userName ? userName.split(' ')[0] : (isOwner ? 'Alok' : 'Subhash');

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-[#070C12] text-white flex flex-col justify-between p-4 sm:p-8 overflow-y-auto font-sans select-none"
      >
        {/* Top Header Badge & Logo */}
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto pt-2">
          <div className="px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-mono text-[10px] uppercase font-bold tracking-widest">
            {isOwner ? 'OWNER PORTAL WELCOME' : 'TENANT PORTAL WELCOME'}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              <Building className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-sm tracking-tight text-white">
              SRI SAI SIRI <span className="text-blue-500">BOYS HOSTEL</span>
            </span>
          </div>
        </div>

        {/* Central Content Section (Matching Reference Image media_1788241677312.jpg) */}
        <div className="w-full max-w-4xl mx-auto my-auto py-6 space-y-6 text-center">
          
          {/* Header Greeting */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {isOwner ? 'WELCOME BACK,' : 'WELCOME HOME,'}{' '}
              <span className={isOwner ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300' : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400'}>
                {userName.toUpperCase() || (isOwner ? 'ALOK SHARMA' : 'SUBHASH')} 👋
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              {isOwner ? 'Your hostel, in perfect control.' : "We're glad to have you with us."}
            </p>
          </div>

          {/* 3D Visual Section with Surrounding Stat Pills */}
          <div className="relative py-4 max-w-2xl mx-auto">
            
            {/* Visual Graphic Representation */}
            <div className="relative w-64 h-56 mx-auto rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/10 blur-2xl" />
              
              {isOwner ? (
                <div className="relative text-center space-y-2">
                  <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border-2 border-blue-500/40 mx-auto flex items-center justify-center text-blue-400 shadow-lg animate-pulse">
                    <Building className="w-10 h-10" />
                  </div>
                  <span className="text-xs font-black tracking-widest text-blue-400 uppercase block">SRI SAI SIRI HOSTEL</span>
                </div>
              ) : (
                <div className="relative text-center space-y-2">
                  <div className="w-20 h-20 rounded-3xl bg-purple-600/20 border-2 border-purple-500/40 mx-auto flex items-center justify-center text-purple-400 shadow-lg animate-pulse">
                    <Home className="w-10 h-10" />
                  </div>
                  <span className="text-xs font-black tracking-widest text-purple-400 uppercase block">ROOM A-101 (BED A)</span>
                </div>
              )}
            </div>

            {/* Surrounding Stats Callouts (Left & Right Column) */}
            {isOwner ? (
              <>
                {/* Left Side Owner Callouts */}
                <div className="hidden sm:block absolute top-2 left-0 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">BUILDINGS</span>
                  <span className="text-xs font-black text-white">2</span>
                </div>
                <div className="hidden sm:block absolute top-20 left-0 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">ROOMS</span>
                  <span className="text-xs font-black text-white">24</span>
                </div>
                <div className="hidden sm:block absolute bottom-2 left-0 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">ACTIVE RESIDENTS</span>
                  <span className="text-xs font-black text-emerald-400">18</span>
                </div>

                {/* Right Side Owner Callouts */}
                <div className="hidden sm:block absolute top-2 right-0 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-right shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">AVAILABLE BEDS</span>
                  <span className="text-xs font-black text-blue-400">6</span>
                </div>
                <div className="hidden sm:block absolute top-20 right-0 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-right shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">PENDING PAYMENTS</span>
                  <span className="text-xs font-black text-emerald-400">₹12,500</span>
                </div>
                <div className="hidden sm:block absolute bottom-2 right-0 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-right shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">OPEN COMPLAINTS</span>
                  <span className="text-xs font-black text-amber-400">2</span>
                </div>
              </>
            ) : (
              <>
                {/* Left Side Tenant Callouts */}
                <div className="hidden sm:block absolute top-2 left-0 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">ROOM</span>
                  <span className="text-xs font-black text-purple-400">A-101</span>
                </div>
                <div className="hidden sm:block absolute top-20 left-0 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">BED</span>
                  <span className="text-xs font-black text-white">A</span>
                </div>
                <div className="hidden sm:block absolute bottom-2 left-0 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">MONTHLY RENT</span>
                  <span className="text-xs font-black text-emerald-400">₹6,500</span>
                </div>

                {/* Right Side Tenant Callouts */}
                <div className="hidden sm:block absolute top-2 right-0 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-right shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">NEXT PAYMENT</span>
                  <span className="text-xs font-black text-white">30 Sep 2026</span>
                </div>
                <div className="hidden sm:block absolute top-20 right-0 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-right shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">ACCOUNT STATUS</span>
                  <span className="text-xs font-black text-emerald-400">ALL CLEAR</span>
                </div>
                <div className="hidden sm:block absolute bottom-2 right-0 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-right shadow-lg">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">JOINING DATE</span>
                  <span className="text-xs font-black text-white">15 Aug 2026</span>
                </div>
              </>
            )}

          </div>

          {/* Sub Greeting Box */}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-white">
              {isOwner ? `Good Morning, ${cleanFirstName}! ☀️` : `Welcome Home, ${cleanFirstName}! 😊`}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {isOwner ? "Everything in your hostel is under control. Here's what's happening today." : "Your stay is active and everything is up to date."}
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 max-w-sm mx-auto space-y-2">
            <button
              onClick={onEnter}
              className={`w-full py-3.5 px-8 rounded-full font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all cursor-pointer ${
                isOwner ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              <span>{isOwner ? 'ENTER MANAGEMENT PORTAL' : 'ENTER MY PORTAL'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onEnter}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer block mx-auto pt-1"
            >
              Skip for now
            </button>
          </div>

        </div>

        {/* Footer Feature Badges Bar */}
        <div className="border-t border-slate-800/80 pt-3 pb-2 w-full max-w-5xl mx-auto flex flex-wrap justify-between items-center text-[11px] text-slate-400 gap-4 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>Secure & Safe — Your data is 100% secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-purple-500" />
            <span>Smart Management — Manage everything easily</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-500" />
            <span>Real-time Updates — Live information at your fingertips</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>Anywhere Access — Access your portal from anywhere</span>
          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}
