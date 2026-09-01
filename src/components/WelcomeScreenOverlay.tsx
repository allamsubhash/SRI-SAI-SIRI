'use client';

import React, { useState, useEffect } from 'react';
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
  Clock,
  Sparkles,
  Award
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
  const [metrics, setMetrics] = useState<{
    owner: {
      buildings: number;
      rooms: number;
      activeResidents: number;
      availableBeds: number;
      pendingPayments: number;
      openComplaints: number;
    };
    tenant: {
      roomNumber: string;
      bedSpot: string;
      monthlyRent: number;
      nextPaymentDate: string;
      accountStatus: string;
      joiningDate: string;
      hasPending: boolean;
      hasOverdue: boolean;
    };
  }>({
    owner: {
      buildings: 2,
      rooms: 24,
      activeResidents: 18,
      availableBeds: 6,
      pendingPayments: 12500,
      openComplaints: 2
    },
    tenant: {
      roomNumber: 'A-101',
      bedSpot: 'A',
      monthlyRent: 6500,
      nextPaymentDate: '30 Sep 2026',
      accountStatus: 'ALL CLEAR',
      joiningDate: '15 Aug 2026',
      hasPending: false,
      hasOverdue: false
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/welcome')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setMetrics({
              owner: data.ownerMetrics || metrics.owner,
              tenant: data.tenantMetrics || metrics.tenant
            });
          }
        })
        .catch(err => console.error('Failed to fetch welcome metrics:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isOwner = userRole === 'OWNER';
  const cleanFirstName = userName ? userName.split(' ')[0] : (isOwner ? 'Alok' : 'Subhash');

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  const om = metrics.owner;
  const tm = metrics.tenant;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999999] bg-[#050B14] text-white flex flex-col justify-between p-4 sm:p-8 overflow-y-auto font-sans select-none"
      >
        {/* Background Ambient Stars & Glow Light */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 ${
            isOwner ? 'bg-blue-500' : 'bg-purple-600'
          }`} />
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
        </div>

        {/* 1. TOP HEADER BAR */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-between w-full max-w-6xl mx-auto pt-2 z-10"
        >
          {/* Badge */}
          <div className={`px-3.5 py-1 rounded-full border text-[10px] font-mono font-black uppercase tracking-widest ${
            isOwner 
              ? 'bg-blue-500/15 border-blue-400/30 text-blue-400' 
              : 'bg-purple-500/15 border-purple-400/30 text-purple-400'
          }`}>
            {isOwner ? 'OWNER PORTAL WELCOME' : 'TENANT PORTAL WELCOME'}
          </div>

          {/* Branding */}
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black shadow-md ${
              isOwner ? 'bg-blue-600' : 'bg-purple-600'
            }`}>
              <Building className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="font-black text-sm tracking-tight block leading-tight text-white">
                SRI SAI SIRI
              </span>
              <span className={`text-[9px] font-black uppercase tracking-widest block ${isOwner ? 'text-blue-400' : 'text-purple-400'}`}>
                BOYS HOSTEL
              </span>
            </div>
          </div>
        </motion.div>

        {/* 2. CENTRAL CONTENT SECTION */}
        <div className="w-full max-w-5xl mx-auto my-auto py-6 space-y-6 text-center z-10">
          
          {/* Title Header */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-1"
          >
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {isOwner ? 'WELCOME BACK,' : 'WELCOME HOME,'}{' '}
              <span className={isOwner ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500' : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400'}>
                {userName.toUpperCase() || (isOwner ? 'ALOK SHARMA' : 'SUBHASH')} 👋
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              {isOwner ? 'Your hostel, in perfect control.' : "We're glad to have you with us."}
            </p>
          </motion.div>

          {/* 3D VISUAL CENTERPIECE & SURROUNDING LIVE STAT CARDS */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative py-2 max-w-3xl mx-auto"
          >
            
            {/* 3D Visual Art Platform Box */}
            <div className={`relative w-72 sm:w-80 h-64 sm:h-72 mx-auto rounded-3xl border shadow-2xl flex flex-col items-center justify-center overflow-hidden backdrop-blur-xl transition-all ${
              isOwner 
                ? 'bg-slate-900/80 border-blue-500/30 shadow-[0_0_60px_rgba(37,99,235,0.25)]' 
                : 'bg-slate-900/80 border-purple-500/30 shadow-[0_0_60px_rgba(147,51,234,0.25)]'
            }`}>
              
              {/* Neon Glowing Platform Underneath */}
              <div className={`absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t opacity-40 blur-xl ${
                isOwner ? 'from-blue-600 via-cyan-500 to-transparent' : 'from-purple-600 via-pink-500 to-transparent'
              }`} />

              {/* 3D Graphic Representation */}
              {isOwner ? (
                /* 🏢 OWNER 3D HOSTEL BUILDING */
                <div className="relative text-center space-y-3 z-10">
                  <div className="w-24 h-24 rounded-3xl bg-blue-600/20 border-2 border-blue-400/50 mx-auto flex items-center justify-center text-blue-400 shadow-xl animate-[bounce_4s_ease-in-out_infinite]">
                    <Building className="w-12 h-12 text-blue-400" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-blue-950/80 border border-blue-400/40 text-[10px] font-black tracking-widest text-blue-300 uppercase shadow-md">
                    SRI SAI SIRI BOYS HOSTEL
                  </div>
                </div>
              ) : (
                /* 🛏 TENANT 3D ISOMETRIC BEDROOM */
                <div className="relative text-center space-y-3 z-10">
                  <div className="w-24 h-24 rounded-3xl bg-purple-600/20 border-2 border-purple-400/50 mx-auto flex items-center justify-center text-purple-400 shadow-xl animate-[bounce_4s_ease-in-out_infinite]">
                    <Home className="w-12 h-12 text-purple-400" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-400/40 text-[10px] font-black tracking-widest text-purple-300 uppercase shadow-md">
                    ROOM {tm.roomNumber} (BED {tm.bedSpot})
                  </div>
                </div>
              )}
            </div>

            {/* SURROUNDING LIVE INFORMATION CARDS (LEFT & RIGHT) WITH NEON CONNECTION LINES */}
            {isOwner ? (
              <>
                {/* Left Side Cards */}
                <div className="hidden sm:flex flex-col gap-3 absolute top-2 left-0 w-44 text-left">
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-blue-500/30 backdrop-blur-md shadow-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">BUILDINGS</span>
                      <span className="text-sm font-black text-white">{om.buildings}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-blue-500/30 backdrop-blur-md shadow-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
                      <DoorOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">ROOMS</span>
                      <span className="text-sm font-black text-white">{om.rooms}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-blue-500/30 backdrop-blur-md shadow-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">ACTIVE RESIDENTS</span>
                      <span className="text-sm font-black text-emerald-400">{om.activeResidents}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Cards */}
                <div className="hidden sm:flex flex-col gap-3 absolute top-2 right-0 w-44 text-right">
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-blue-500/30 backdrop-blur-md shadow-xl flex items-center justify-end gap-3">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">AVAILABLE BEDS</span>
                      <span className="text-sm font-black text-blue-400">{om.availableBeds}</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
                      <Bed className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-blue-500/30 backdrop-blur-md shadow-xl flex items-center justify-end gap-3">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">PENDING PAYMENTS</span>
                      <span className="text-sm font-black text-emerald-400">{formatINR(om.pendingPayments)}</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-blue-500/30 backdrop-blur-md shadow-xl flex items-center justify-end gap-3">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">OPEN COMPLAINTS</span>
                      <span className="text-sm font-black text-amber-400">{om.openComplaints}</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Left Side Tenant Cards */}
                <div className="hidden sm:flex flex-col gap-3 absolute top-2 left-0 w-44 text-left">
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-md shadow-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-black">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">ROOM</span>
                      <span className="text-sm font-black text-purple-400">{tm.roomNumber}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-md shadow-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-black">
                      <Bed className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">BED</span>
                      <span className="text-sm font-black text-white">{tm.bedSpot}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-md shadow-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">MONTHLY RENT</span>
                      <span className="text-sm font-black text-emerald-400">{formatINR(tm.monthlyRent)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Tenant Cards */}
                <div className="hidden sm:flex flex-col gap-3 absolute top-2 right-0 w-44 text-right">
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-md shadow-xl flex items-center justify-end gap-3">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">NEXT PAYMENT</span>
                      <span className="text-sm font-black text-white">{tm.nextPaymentDate}</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-black">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-md shadow-xl flex items-center justify-end gap-3">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">ACCOUNT STATUS</span>
                      <span className={`text-sm font-black ${
                        tm.accountStatus === 'ALL CLEAR' ? 'text-emerald-400' :
                        tm.accountStatus === 'OVERDUE' ? 'text-rose-500' : 'text-amber-400'
                      }`}>
                        {tm.accountStatus}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-md shadow-xl flex items-center justify-end gap-3">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">JOINING DATE</span>
                      <span className="text-sm font-black text-white">{tm.joiningDate}</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-black">
                      <Award className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </>
            )}

          </motion.div>

          {/* Sub Welcome Message & Time Greeting */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-1"
          >
            <h3 className="text-lg sm:text-xl font-black text-white">
              {isOwner 
                ? `${timeGreeting}, ${cleanFirstName}! ☀️` 
                : `Welcome Home, ${cleanFirstName}! 😊`}
            </h3>
            <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
              {isOwner 
                ? "Everything in your hostel is under control. Here's what's happening today." 
                : tm.hasOverdue 
                ? "You have an overdue payment that requires attention."
                : tm.hasPending
                ? "You have an upcoming payment due."
                : "Your stay is active and everything is up to date."}
            </p>
          </motion.div>

          {/* OWNER GLASSMORPHISM SUMMARY ROW */}
          {isOwner && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2"
            >
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-black text-white">{om.activeResidents}</div>
                  <div className="text-[10px] text-slate-400 font-bold">Active Residents</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center gap-3">
                <Bed className="w-5 h-5 text-blue-400 shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-black text-white">{om.availableBeds}</div>
                  <div className="text-[10px] text-slate-400 font-bold">Available Beds</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-black text-white">{formatINR(om.pendingPayments)}</div>
                  <div className="text-[10px] text-slate-400 font-bold">Pending Payments</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-black text-white">{om.openComplaints}</div>
                  <div className="text-[10px] text-slate-400 font-bold">Open Complaints</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PRIMARY ACTION BUTTON & SKIP OPTION */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="pt-3 max-w-sm mx-auto space-y-2"
          >
            <button
              onClick={onEnter}
              className={`w-full py-4 px-8 rounded-full font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl hover:scale-105 transition-all cursor-pointer ${
                isOwner 
                  ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/25' 
                  : 'bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-purple-500/25'
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
          </motion.div>

        </div>

        {/* 3. FOOTER FEATURE BADGES BAR */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="border-t border-slate-800/80 pt-3 pb-2 w-full max-w-5xl mx-auto flex flex-wrap justify-between items-center text-[11px] text-slate-400 gap-4 font-medium z-10"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Secure & Safe — Your data is 100% secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-purple-400" />
            <span>Smart Management — Manage everything easily</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Real-time Updates — Live information at your fingertips</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Anywhere Access — Access your portal from anywhere</span>
          </div>
        </motion.div>

      </motion.div>
    </AnimatePresence>
  );
}
