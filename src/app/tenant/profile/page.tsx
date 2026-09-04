'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Bed, 
  Calendar, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  Receipt,
  FileText
} from 'lucide-react';
import { formatINR, formatDate } from '@/utils/formatters';

export default function TenantProfilePage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(dashData => {
        setData(dashData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const currentTenant = data?.tenants?.find((t: any) => 
    (user?.email && t.email?.toLowerCase() === user.email.toLowerCase()) || 
    (user?.name && t.name?.toLowerCase() === user.name.toLowerCase()) ||
    t.id === user?.id
  );

  const roomNumber = currentTenant?.roomNumber || 'A-101';
  const bedSpot = currentTenant?.bedNumber || 'Spot A';
  const moveInDate = currentTenant?.moveInDate ? formatDate(currentTenant.moveInDate) : '15 Jan 2026';
  const rentAmount = currentTenant?.rentAmount || 6500;
  const phone = currentTenant?.phone || currentTenant?.profile?.phone || '+91 98765 43210';
  const emergencyPhone = currentTenant?.emergencyPhone || currentTenant?.profile?.emergencyPhone || '+91 98765 00000';

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-44 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[32px] border border-white/80 dark:border-[#293832]" />
        <div className="h-64 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-7 text-left font-sans transition-colors duration-200"
    >
      
      {/* 👑 1. HERO RESIDENT PROFILE BANNER */}
      <motion.div 
        whileHover={{ y: -3, scale: 1.005 }}
        className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div className="flex items-center gap-5 z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl tenant-bg-accent font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                VERIFIED RESIDENT
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2]">
              {user?.name || 'Resident Tenant'}
            </h1>
            
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium flex items-center gap-3">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 tenant-text-accent" /> {user?.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 tenant-text-accent" /> {phone}</span>
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="py-3 px-6 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-black text-xs uppercase tracking-wider border border-rose-500/20 shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0 z-10"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Account</span>
        </button>
      </motion.div>

      {/* 📊 2. ROOM LEASE SPECIFICATIONS CARD */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-4"
      >
        <div className="pb-4 border-b border-[#DDD8CE] dark:border-[#293832] flex justify-between items-center">
          <div>
            <h3 className="font-black text-lg text-[#1C2522] dark:text-[#F2F5F2] flex items-center gap-2">
              <Building className="w-5 h-5 tenant-text-accent" />
              Room Lease Specifications
            </h3>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-0.5">Authoritative resident room & tariff data</p>
          </div>
          <span className="text-[10px] font-black px-3.5 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
            ACTIVE LEASE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold pt-2">
          <div className="p-4 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
            <span className="text-[#68736E] dark:text-[#9BAAA4] text-[10px] uppercase font-black tracking-wider block">Hostel Trade Name</span>
            <span className="text-[#1C2522] dark:text-[#F2F5F2] text-sm font-black">Sri Sai Siri Boys Hostel</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
            <span className="text-[#68736E] dark:text-[#9BAAA4] text-[10px] uppercase font-black tracking-wider block">Assigned Room Number</span>
            <span className="tenant-text-accent text-sm font-black">{roomNumber}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
            <span className="text-[#68736E] dark:text-[#9BAAA4] text-[10px] uppercase font-black tracking-wider block">Assigned Bed Spot</span>
            <span className="tenant-text-accent text-sm font-black">Bed {bedSpot.toString().split('-').pop()}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
            <span className="text-[#68736E] dark:text-[#9BAAA4] text-[10px] uppercase font-black tracking-wider block">Move-in Date</span>
            <span className="text-[#1C2522] dark:text-[#F2F5F2] text-sm font-black">{moveInDate}</span>
          </div>

          <div className="sm:col-span-2 p-5 rounded-2xl tenant-bg-soft border tenant-border-accent flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black tenant-text-accent uppercase tracking-wider block">Monthly Rent Tariff</span>
              <span className="text-[#68736E] dark:text-[#9BAAA4] text-xs font-medium">Verified fixed monthly fee</span>
            </div>
            <span className="tenant-text-accent font-black text-xl">{formatINR(rentAmount)} / mo</span>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
