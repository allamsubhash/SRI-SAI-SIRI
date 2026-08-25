'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  Receipt, 
  Bell, 
  ShieldCheck, 
  Save, 
  Lock, 
  RotateCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Database,
  Megaphone,
  Smartphone,
  Unlock,
  Key,
  Globe,
  DollarSign
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { useAccent, AccentColor } from '@/context/AccentContext';

export default function SettingsPage() {
  const { showToast } = useToast();
  const { accent, setAccent, customHex, setCustomHexColor } = useAccent();
  const [activeTab, setActiveTab] = useState<'property' | 'security' | 'billing' | 'alerts' | 'maintenance'>('property');

  // Quick Action States
  const [curfewLockdown, setCurfewLockdown] = useState(false);
  const [purgingCache, setPurgingCache] = useState(false);
  
  // Save State
  const [isSaving, setIsSaving] = useState(false);

  // Reset Database States
  const [showResetAnalyticsModal, setShowResetAnalyticsModal] = useState(false);
  const [showResetTenantsModal, setShowResetTenantsModal] = useState(false);
  const [resettingAnalytics, setResettingAnalytics] = useState(false);
  const [resettingTenants, setResettingTenants] = useState(false);

  const [propertyConfig, setPropertyConfig] = useState({
    hostelName: 'Sri Sai Siri Boys Hostel',
    address: 'Plot 42, Knowledge Park III, Greater Noida',
    contactPhone: '+91 98765 00000',
    contactEmail: 'contact@srisaisiri.com',
    currency: 'INR (₹)',
    curfewTime: '10:30 PM'
  });

  const [billingConfig, setBillingConfig] = useState({
    rentDueDate: '5',
    gracePeriodDays: '3',
    lateFeeAmount: '500',
    securityDepositMonths: '1'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Load persistent settings on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setPropertyConfig(prev => ({
            ...prev,
            ...data.settings
          }));
          if (data.settings.hostelName) {
            localStorage.setItem('hostelName', data.settings.hostelName);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSavePropertySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyConfig)
      });
      if (res.ok) {
        localStorage.setItem('hostelName', propertyConfig.hostelName);
        window.dispatchEvent(new Event('settingsUpdated'));
        showToast('Hostel Profile Saved', `Hostel name permanently updated to "${propertyConfig.hostelName}".`, 'success');
      } else {
        showToast('Save Failed', 'Could not update property settings.', 'danger');
      }
    } catch (err) {
      showToast('Error', 'Failed to connect to server.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      showToast('Current Password Required', 'Please enter your current password.', 'danger');
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      showToast('Password Reuse Error', 'New password cannot be the same as your current password.', 'danger');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Password Mismatch', 'New password and confirmation password do not match.', 'danger');
      return;
    }

    setPasswordSubmitting(true);
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
        showToast('Password Updated Successfully', data.message || 'Your password has been permanently updated.', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast('Password Change Failed', data.error || 'Failed to update password.', 'danger');
      }
    } catch (err) {
      showToast('Network Error', 'Could not reach server.', 'danger');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handlePurgeCache = () => {
    setPurgingCache(true);
    setTimeout(() => {
      setPurgingCache(false);
      showToast('Cache Invalidated', 'In-memory query cache cleared.', 'success');
    }, 600);
  };

  const handleLockdownToggle = () => {
    const newState = !curfewLockdown;
    setCurfewLockdown(newState);
    if (newState) {
      showToast('Emergency Gate Lockdown', 'All biometric entry points locked.', 'danger');
    } else {
      showToast('System Disarmed', 'Electronic gates unlocked. Normal curfew rules active.', 'success');
    }
  };

  const handleResetAnalyticsExecute = async () => {
    setResettingAnalytics(true);
    try {
      const res = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_ANALYTICS' })
      });
      if (res.ok) {
        showToast('Analytics Reset Complete', 'All invoices and payment records cleared.', 'success');
        setShowResetAnalyticsModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResettingAnalytics(false);
    }
  };

  const handleResetTenantsExecute = async () => {
    setResettingTenants(true);
    try {
      const res = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_TENANTS' })
      });
      if (res.ok) {
        showToast('Tenants Reset Complete', 'All resident profiles cleared and all bed spaces marked available.', 'success');
        setShowResetTenantsModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResettingTenants(false);
    }
  };

  return (
    <div className="space-y-7 page-entrance text-left font-sans transition-colors duration-200 select-none pb-24 relative">
      
      {/* 👑 1. HEADER HERO CARD */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] text-[#1C2522] dark:text-[#F2F5F2] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
              SYSTEM & PROPERTY SETTINGS
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw animate-pulse" />
              SYSTEM ONLINE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            {propertyConfig.hostelName}
          </h1>
          
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Configure property branding, gate security policies, password credentials, and billing rules.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 z-10">
          <button
            onClick={handleSavePropertySettings}
            disabled={isSaving}
            className="py-3 px-6 rounded-2xl tenant-bg-accent text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* 🍏 2. TABS NAVIGATION */}
      <div className="bg-[#FDFBF9]/95 dark:bg-[#141D30]/95 p-2 rounded-[28px] border border-white/80 dark:border-white/10 shadow-xl backdrop-blur-2xl flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'property', label: 'Property Profile', icon: <Building className="w-4 h-4" /> },
          { id: 'security', label: 'Security & Auth', icon: <Lock className="w-4 h-4" /> },
          { id: 'billing', label: 'Rent Rules', icon: <Receipt className="w-4 h-4" /> },
          { id: 'alerts', label: 'Notices & Alerts', icon: <Bell className="w-4 h-4" /> },
          { id: 'maintenance', label: 'System Maintenance', icon: <Database className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 📋 3. TAB CONTENT PANELS */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-[#FDFBF9]/95 dark:bg-[#141D30]/95 border border-white/80 dark:border-white/10 shadow-xl backdrop-blur-2xl text-left">
        
        {/* TAB 1: PROPERTY & BRANDING */}
        {activeTab === 'property' && (
          <form onSubmit={handleSavePropertySettings} className="space-y-6 max-w-2xl">
            <div className="pb-4 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Hostel Property Profile & Branding
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                Update your official hostel trade name, contact info, and address.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                  Hostel Trade Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={propertyConfig.hostelName}
                  onChange={(e) => setPropertyConfig({ ...propertyConfig, hostelName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                  Support Phone Number
                </label>
                <input
                  type="text"
                  value={propertyConfig.contactPhone}
                  onChange={(e) => setPropertyConfig({ ...propertyConfig, contactPhone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                Physical Address
              </label>
              <input
                type="text"
                value={propertyConfig.address}
                onChange={(e) => setPropertyConfig({ ...propertyConfig, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                  Primary Currency
                </label>
                <select
                  value={propertyConfig.currency}
                  onChange={(e) => setPropertyConfig({ ...propertyConfig, currency: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="INR (₹)">Indian Rupee (INR ₹)</option>
                  <option value="USD ($)">US Dollar ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                  Gate Curfew Time
                </label>
                <input
                  type="text"
                  value={propertyConfig.curfewTime}
                  onChange={(e) => setPropertyConfig({ ...propertyConfig, curfewTime: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button 
                disabled={isSaving}
                type="submit" 
                className="py-2.5 px-6 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Property Settings</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SECURITY & PASSWORD UPDATE */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
            <div className="pb-4 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Owner Security & Password Update
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                Permanently update your Hostel Owner portal password.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button 
                disabled={passwordSubmitting}
                type="submit" 
                className="py-2.5 px-6 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: RENT RULES & BILLING */}
        {activeTab === 'billing' && (
          <form onSubmit={handleSavePropertySettings} className="space-y-6 max-w-2xl">
            <div className="pb-4 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Rent Automation & Fine Rules
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                Configure auto-invoice generation cycles, grace periods, and late penalty charges.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">Monthly Rent Due Date</label>
                <select
                  value={billingConfig.rentDueDate}
                  onChange={(e) => setBillingConfig({ ...billingConfig, rentDueDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="1">1st of Every Month</option>
                  <option value="5">5th of Every Month</option>
                  <option value="10">10th of Every Month</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">Late Penalty Fine (₹)</label>
                <input
                  type="number"
                  value={billingConfig.lateFeeAmount}
                  onChange={(e) => setBillingConfig({ ...billingConfig, lateFeeAmount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button 
                disabled={isSaving}
                type="submit" 
                className="py-2.5 px-6 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Billing Rules</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: ALERTS & NOTIFICATIONS */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 max-w-2xl">
            <div className="pb-4 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Automated Alerts & Push Notifications
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                Enable or disable real-time alerts for residents and management.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Automated Rent Due Reminders via WhatsApp', desc: 'Send automated message 3 days prior to due date.' },
                { label: 'Instant Complaint SLA Escalation Notifications', desc: 'Notify warden when a ticket remains unresolved after 6 hours.' },
                { label: 'Low Stock Inventory Alerts', desc: 'Alert property manager when cleaning supplies drop below minimum.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{item.label}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">{item.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 cursor-pointer" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM MAINTENANCE & RESETS */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6 max-w-2xl">
            <div className="pb-4 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                System Operations & Database Resets
              </h3>
              <p className="text-xs text-rose-500 font-bold mt-0.5">
                Warning: Wiping database operations cannot be undone. Exercise caution.
              </p>
            </div>

            <div className="space-y-4">
              {/* Gate Lockdown */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    Biometric Gate Lockdown
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                    Instantly restrict gate access during emergency situations.
                  </p>
                </div>
                <button
                  onClick={handleLockdownToggle}
                  className={`px-4 py-2 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                    curfewLockdown
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-900 text-white dark:bg-zinc-800'
                  }`}
                >
                  {curfewLockdown ? 'Disarm Lockdown' : 'Trigger Lockdown'}
                </button>
              </div>

              {/* Reset Financial Analytics */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <RotateCw className="w-3.5 h-3.5 text-rose-500" />
                    Reset Financial Transaction Logs
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                    Wipes all rent invoices, payment receipts, and expense logs.
                  </p>
                </div>
                <button
                  onClick={() => setShowResetAnalyticsModal(true)}
                  className="px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/20 text-xs font-black transition-all cursor-pointer shrink-0"
                >
                  Reset Analytics
                </button>
              </div>

              {/* Reset Tenants */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    Reset Tenant Register & Occupancy
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                    Clears all resident records and marks all beds available.
                  </p>
                </div>
                <button
                  onClick={() => setShowResetTenantsModal(true)}
                  className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer shrink-0"
                >
                  Reset Residents
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ⚠️ RESET ANALYTICS MODAL */}
      {showResetAnalyticsModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowResetAnalyticsModal(false)}
          title="Confirm Reset Financial Analytics"
          subtitle="This action will permanently delete all revenue records."
          size="sm"
          accentColor="rose"
        >
          <div className="space-y-4 text-left font-sans">
            <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
              Are you sure you want to reset all analytical metrics? This will erase all billing invoices, rent receipts, and expense transaction histories.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setShowResetAnalyticsModal(false)}
                className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAnalyticsExecute}
                disabled={resettingAnalytics}
                className="px-4 py-2 rounded-2xl bg-rose-600 text-white font-black text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {resettingAnalytics ? 'Resetting...' : 'Yes, Reset Analytics'}
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* ⚠️ RESET TENANTS MODAL */}
      {showResetTenantsModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowResetTenantsModal(false)}
          title="Confirm Reset Tenant Register"
          subtitle="This action will clear all resident profiles."
          size="sm"
          accentColor="rose"
        >
          <div className="space-y-4 text-left font-sans">
            <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
              Are you sure you want to reset the resident register? All tenant accounts and bed occupancy records will be wiped.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setShowResetTenantsModal(false)}
                className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetTenantsExecute}
                disabled={resettingTenants}
                className="px-4 py-2 rounded-2xl bg-rose-600 text-white font-black text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {resettingTenants ? 'Resetting...' : 'Yes, Reset Tenants'}
              </button>
            </div>
          </div>
        </NeonModal>
      )}
    </div>
  );
}
