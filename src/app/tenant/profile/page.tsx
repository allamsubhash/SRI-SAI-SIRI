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
  Lock, 
  LogOut, 
  Sparkles, 
  CheckCircle2, 
  Receipt,
  FileText,
  AlertCircle
} from 'lucide-react';
import { formatINR, formatDate } from '@/utils/formatters';

export default function TenantProfilePage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match!' });
      return;
    }
    setPwdSubmitting(true);
    setPwdMsg(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const result = await res.json();
      if (res.ok) {
        setPwdMsg({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMsg({ type: 'error', text: result.error || 'Failed to update password' });
      }
    } catch (e: any) {
      setPwdMsg({ type: 'error', text: e.message || 'An error occurred' });
    } finally {
      setPwdSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-44 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[32px] border border-white/80 dark:border-[#293832]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
          <div className="h-64 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
        </div>
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

      {/* 📊 2. PROFILE & LEASE DETAILS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Room Lease Specifications */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-4"
        >
          <div className="pb-3 border-b border-[#DDD8CE] dark:border-[#293832] flex justify-between items-center">
            <div>
              <h3 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2] flex items-center gap-2">
                <Building className="w-4 h-4 tenant-text-accent" />
                Room Lease Specifications
              </h3>
              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-0.5">Authoritative room & stay data</p>
            </div>
            <span className="text-[10px] font-black px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
              ACTIVE LEASE
            </span>
          </div>

          <div className="space-y-3 text-xs font-bold">
            <div className="flex justify-between p-3.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832]">
              <span className="text-[#68736E] dark:text-[#9BAAA4]">Hostel Trade Name</span>
              <span className="text-[#1C2522] dark:text-[#F2F5F2]">Sri Sai Siri Boys Hostel</span>
            </div>

            <div className="flex justify-between p-3.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832]">
              <span className="text-[#68736E] dark:text-[#9BAAA4]">Assigned Room Number</span>
              <span className="tenant-text-accent font-black">{roomNumber}</span>
            </div>

            <div className="flex justify-between p-3.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832]">
              <span className="text-[#68736E] dark:text-[#9BAAA4]">Assigned Bed Spot</span>
              <span className="tenant-text-accent font-black">Bed {bedSpot.toString().split('-').pop()}</span>
            </div>

            <div className="flex justify-between p-3.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832]">
              <span className="text-[#68736E] dark:text-[#9BAAA4]">Move-in Date</span>
              <span className="text-[#1C2522] dark:text-[#F2F5F2]">{moveInDate}</span>
            </div>

            <div className="flex justify-between p-3.5 rounded-2xl tenant-bg-soft border tenant-border-accent">
              <span className="tenant-text-accent">Monthly Rent Tariff</span>
              <span className="tenant-text-accent font-black text-sm">{formatINR(rentAmount)} / mo</span>
            </div>
          </div>
        </motion.div>

        {/* Account Security & Password Change */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-4"
        >
          <div className="pb-3 border-b border-[#DDD8CE] dark:border-[#293832]">
            <h3 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2] flex items-center gap-2">
              <Lock className="w-4 h-4 tenant-text-accent" />
              Account Security & Password
            </h3>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-0.5">Update your resident portal passkey</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            {pwdMsg && (
              <div className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                pwdMsg.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {pwdMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black uppercase text-[#68736E] dark:text-[#9BAAA4] block mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-[#DDD8CE] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-[#68736E] dark:text-[#9BAAA4] block mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-[#DDD8CE] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-[#68736E] dark:text-[#9BAAA4] block mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-[#DDD8CE] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pwdSubmitting}
                className="w-full py-3 rounded-2xl tenant-bg-accent font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
              >
                {pwdSubmitting ? 'Updating...' : 'Update Password ✓'}
              </button>
            </div>
          </form>
        </motion.div>

      </div>

    </motion.div>
  );
}
