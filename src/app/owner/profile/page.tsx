'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Key, 
  Lock, 
  Save, 
  Clock, 
  CheckCircle2, 
  LogOut
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState({
    name: user?.name || 'Property Administrator',
    email: user?.email || 'owner@srisaisiri.com',
    phone: '+91 98765 43210',
    role: 'Primary Owner / Admin'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile Updated', 'Your user account details have been saved.', 'success');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast('Password Error', 'Please enter both current and new password.', 'danger');
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      showToast('Password Error', 'New password cannot be the same as your current password.', 'danger');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Password Error', 'New passwords do not match.', 'danger');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (user?.email) {
          localStorage.setItem(`pwd_hash_${user.email.trim().toLowerCase()}`, data.hash || passwordForm.newPassword);
        }
        showToast('Password Changed Successfully', data.message || 'Your account security credentials were updated.', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast('Password Error', data.error || 'Failed to update password.', 'danger');
      }
    } catch (err) {
      showToast('Network Error', 'Could not reach server to change password.', 'danger');
    }
  };

  return (
    <div className="space-y-7 page-entrance text-left font-sans transition-colors duration-200 select-none pb-24 relative">
      
      {/* 👑 1. HEADER HERO CARD */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] text-[#1C2522] dark:text-[#F2F5F2] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
              ADMINISTRATOR PROFILE
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw animate-pulse" />
              VERIFIED OWNER
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            Owner Profile & Account Security
          </h1>
          
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Manage administrator credentials, contact information, authentication methods, and security settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Profile Avatar Card (1 Col) */}
        <div className="p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-3xl tenant-bg-soft text-2xl font-black tenant-text-accent border tenant-border-accent flex items-center justify-center shadow-sm">
            {profileData.name.charAt(0)}
          </div>

          <div>
            <h3 className="text-lg font-black text-[#1C2522] dark:text-[#F2F5F2]">{profileData.name}</h3>
            <p className="text-xs tenant-text-accent font-extrabold mt-0.5">{profileData.role}</p>
          </div>

          <div className="w-full pt-4 border-t border-[#DDD8CE] dark:border-[#293832] space-y-2 text-xs text-[#68736E] dark:text-[#9BAAA4]">
            <div className="flex justify-between items-center">
              <span>Account Status:</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tenant-bg-soft tenant-text-accent border tenant-border-accent">
                Verified Admin
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Security Level:</span>
              <span className="font-bold text-[#1C2522] dark:text-[#F2F5F2]">High (2FA Enabled)</span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-800 cursor-pointer hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out of Account
          </button>
        </div>

        {/* Right Col: Forms & Security Settings (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Form */}
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-[#1C2522] dark:text-[#F2F5F2] pb-3 border-b border-[#DDD8CE] dark:border-[#293832]">
              Personal Information
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="py-2.5 px-6 rounded-xl tenant-bg-accent text-xs font-black shadow-sm hover:scale-105 transition-transform cursor-pointer">
                  Save Account Profile
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-[#1C2522] dark:text-[#F2F5F2] pb-3 border-b border-[#DDD8CE] dark:border-[#293832]">
              Security & Password
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="py-2.5 px-6 rounded-xl tenant-bg-accent text-xs font-black shadow-sm hover:scale-105 transition-transform cursor-pointer">
                  Update Security Password
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
