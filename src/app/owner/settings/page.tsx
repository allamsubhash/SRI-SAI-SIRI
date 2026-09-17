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
  DollarSign,
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { useAccent, AccentColor } from '@/context/AccentContext';

export default function SettingsPage() {
  const { showToast } = useToast();
  const { accent, setAccent, customHex, setCustomHexColor } = useAccent();
  const [activeTab, setActiveTab] = useState<'property' | 'guidelines' | 'qr' | 'security' | 'billing' | 'alerts' | 'maintenance'>('property');

  // QR Settings State
  const [qrForm, setQrForm] = useState({
    qrCodeUrl: '/uploads/sample_qr.png',
    upiId: 'srisaisiri@upi',
    instructions: 'Pay via any UPI app (GPay, PhonePe, Paytm) and enter the 12-digit UTR/Reference number.'
  });
  const [qrSaving, setQrSaving] = useState(false);
  const [selectedQRFile, setSelectedQRFile] = useState<File | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [qrDeleting, setQrDeleting] = useState(false);

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

  // Guidelines Management State
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [guidelinesLoading, setGuidelinesLoading] = useState(false);
  const [guidelineModalOpen, setGuidelineModalOpen] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState<any | null>(null);
  const [gTitle, setGTitle] = useState('');
  const [gContent, setGContent] = useState('');
  const [gCategory, setGCategory] = useState('CLEANLINESS');
  const [gOrder, setGOrder] = useState<number>(0);
  const [gIsActive, setGIsActive] = useState(true);
  const [gSubmitting, setGSubmitting] = useState(false);

  const fetchSettingsGuidelines = async () => {
    setGuidelinesLoading(true);
    try {
      const res = await fetch('/api/guidelines?all=true');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setGuidelines(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGuidelinesLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'guidelines') {
        setActiveTab('guidelines');
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'guidelines') {
      fetchSettingsGuidelines();
    }
  }, [activeTab]);

  const openCreateGuidelineModal = () => {
    setEditingGuideline(null);
    setGTitle('');
    setGContent('');
    setGCategory('CLEANLINESS');
    setGOrder(guidelines.length + 1);
    setGIsActive(true);
    setGuidelineModalOpen(true);
  };

  const openEditGuidelineModal = (item: any) => {
    setEditingGuideline(item);
    setGTitle(item.title);
    setGContent(item.content);
    setGCategory(item.category || 'CLEANLINESS');
    setGOrder(item.order);
    setGIsActive(item.isActive);
    setGuidelineModalOpen(true);
  };

  const handleSaveGuideline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gTitle || !gContent) {
      showToast('Validation Error', 'Title and content are required.', 'danger');
      return;
    }
    setGSubmitting(true);
    try {
      const url = '/api/guidelines';
      const method = editingGuideline ? 'PUT' : 'POST';
      const bodyPayload = editingGuideline
        ? { id: editingGuideline.id, title: gTitle, content: gContent, category: gCategory, order: gOrder, isActive: gIsActive }
        : { title: gTitle, content: gContent, category: gCategory, order: gOrder, isActive: gIsActive };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Success', editingGuideline ? 'Guideline updated.' : 'Guideline created.', 'success');
        setGuidelineModalOpen(false);
        fetchSettingsGuidelines();
      } else {
        showToast('Error', data.error || 'Failed to save guideline.', 'danger');
      }
    } catch (err) {
      showToast('Error', 'An error occurred.', 'danger');
    } finally {
      setGSubmitting(false);
    }
  };

  const toggleGuidelineStatus = async (item: any) => {
    try {
      const res = await fetch('/api/guidelines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive })
      });
      if (res.ok) {
        fetchSettingsGuidelines();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGuideline = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hostel guideline?')) return;
    try {
      const res = await fetch('/api/guidelines', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast('Deleted', 'Guideline deleted.', 'success');
        fetchSettingsGuidelines();
      }
    } catch (err) {
      console.error(err);
    }
  };

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

    fetch('/api/settings/qr')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setQrForm(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  const handleQRFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedQRFile(file);
      setQrPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveQRSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setQrSaving(true);
    try {
      const formData = new FormData();
      formData.append('upiId', qrForm.upiId);
      formData.append('instructions', qrForm.instructions);
      if (selectedQRFile) {
        formData.append('qrFile', selectedQRFile);
      } else if (qrForm.qrCodeUrl) {
        formData.append('qrCodeUrl', qrForm.qrCodeUrl);
      }

      const res = await fetch('/api/settings/qr', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.settings) setQrForm(data.settings);
        setSelectedQRFile(null);
        showToast('QR Settings Saved', 'QR code image, UPI ID, and payment instructions updated.', 'success');
      } else {
        showToast('Save Failed', data.error || 'Could not update QR settings.', 'danger');
      }
    } catch (err) {
      showToast('Error', 'Network request failed.', 'danger');
    } finally {
      setQrSaving(false);
    }
  };

  const handleDeleteQR = async () => {
    if (!confirm('Are you sure you want to remove the payment QR code?')) return;
    setQrDeleting(true);
    try {
      const res = await fetch('/api/settings/qr', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.settings) setQrForm(data.settings);
        setSelectedQRFile(null);
        setQrPreviewUrl('');
        showToast('QR Code Removed', 'Payment QR code image has been cleared.', 'success');
      } else {
        showToast('Delete Failed', data.error || 'Could not delete QR code.', 'danger');
      }
    } catch (err) {
      showToast('Error', 'Network request failed.', 'danger');
    } finally {
      setQrDeleting(false);
    }
  };

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
          { id: 'guidelines', label: 'Hostel Guidelines', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'qr', label: 'QR Payment Settings', icon: <Receipt className="w-4 h-4" /> },
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

        {/* TAB: HOSTEL GUIDELINES MANAGEMENT */}
        {activeTab === 'guidelines' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  Hostel Guidelines Management
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                  Add, edit, reorder, or toggle guidelines displayed on the public website and resident portals.
                </p>
              </div>

              <button
                onClick={openCreateGuidelineModal}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Guideline</span>
              </button>
            </div>

            {guidelinesLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs font-bold">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading guidelines from database...
              </div>
            ) : guidelines.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-slate-400 text-xs font-medium">
                No guidelines found. Click "Add Guideline" above to publish your first rule.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guidelines.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                      item.isActive
                        ? 'bg-slate-50/60 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800'
                        : 'bg-slate-100/40 dark:bg-zinc-900/20 border-slate-200/50 dark:border-zinc-800/50 opacity-60'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-600 dark:text-cyan-400 text-xs font-black flex items-center justify-center">
                            #{item.order || idx + 1}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                        </div>
                        <button
                          onClick={() => toggleGuidelineStatus(item)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                            item.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'
                          }`}
                        >
                          {item.isActive ? 'ACTIVE' : 'DISABLED'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed pl-8">
                        {item.content}
                      </p>
                    </div>

                    <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-200/60 dark:border-zinc-800">
                      <button
                        onClick={() => openEditGuidelineModal(item)}
                        className="p-2 rounded-xl bg-slate-200/60 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-blue-600 cursor-pointer transition-colors"
                        title="Edit Rule"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGuideline(item.id)}
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white cursor-pointer transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GUIDELINE CREATE / EDIT MODAL */}
        <AnimatePresence>
          {guidelineModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setGuidelineModalOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#141D19] border border-slate-200 dark:border-[#293832] shadow-2xl z-10 space-y-4"
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                    {editingGuideline ? 'Edit Guideline Rule' : 'Add New Guideline Rule'}
                  </h3>
                  <button onClick={() => setGuidelineModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveGuideline} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Rule Title</label>
                    <input
                      type="text"
                      required
                      value={gTitle}
                      onChange={(e) => setGTitle(e.target.value)}
                      placeholder="e.g. Cleanliness & Hygiene"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Rule Content & Description</label>
                    <textarea
                      required
                      rows={4}
                      value={gContent}
                      onChange={(e) => setGContent(e.target.value)}
                      placeholder="Provide full rule details and instructions..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Category / Theme Icon</label>
                    <select
                      value={gCategory}
                      onChange={(e) => setGCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-medium focus:outline-none"
                    >
                      <option value="CLEANLINESS">🧹 Cleanliness & Hygiene</option>
                      <option value="VISITORS">👥 Visitor Rules & Timings</option>
                      <option value="PAYMENTS">₹ Rent Payment & Schedule</option>
                      <option value="SAFETY">🛡 Safety First & Instructions</option>
                      <option value="APPLIANCES">⚡ Electrical Appliances Usage</option>
                      <option value="PROPERTY">🏠 Respect Hostel Property</option>
                      <option value="SILENCE">🔇 Maintain Silence & Timings</option>
                      <option value="ENVIRONMENT">🍃 Healthy Green Environment</option>
                      <option value="RESPECT">❤️ Be Respectful & Kind</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Display Order</label>
                      <input
                        type="number"
                        value={gOrder}
                        onChange={(e) => setGOrder(parseInt(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-medium focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Status</label>
                      <select
                        value={gIsActive ? 'ACTIVE' : 'INACTIVE'}
                        onChange={(e) => setGIsActive(e.target.value === 'ACTIVE')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-medium focus:outline-none"
                      >
                        <option value="ACTIVE">Active (Public)</option>
                        <option value="INACTIVE">Inactive (Disabled)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setGuidelineModalOpen(false)}
                      className="px-4 py-2 rounded-full border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={gSubmitting}
                      className="px-5 py-2 rounded-full bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-700"
                    >
                      {gSubmitting ? 'Saving...' : 'Save Rule'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* TAB: QR PAYMENT SETTINGS */}
        {activeTab === 'qr' && (
          <form onSubmit={handleSaveQRSettings} className="space-y-6 max-w-2xl">
            <div className="pb-4 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Official Payment QR Code & UPI Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                Upload, preview, replace, or remove your hostel payment QR code served dynamically to resident portals.
              </p>
            </div>

            {/* QR CODE PREVIEW & UPLOAD SECTION */}
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300">
                Payment QR Code Image Preview & Upload
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="w-36 h-36 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 flex items-center justify-center p-2 relative overflow-hidden shrink-0 shadow-inner">
                  {(qrPreviewUrl || qrForm.qrCodeUrl) ? (
                    <img 
                      src={qrPreviewUrl || qrForm.qrCodeUrl} 
                      alt="Payment QR Code" 
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 text-center">No QR Code Uploaded</span>
                  )}
                </div>

                <div className="space-y-3 flex-1 text-left">
                  <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                    Upload a high-resolution QR image (PNG, JPG, SVG) for Paytm, PhonePe, Google Pay, or BHIM.
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-all shadow-sm">
                      <span>{qrForm.qrCodeUrl || qrPreviewUrl ? 'Replace QR Image' : 'Upload QR Image'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleQRFileChange} 
                        className="hidden" 
                      />
                    </label>

                    {(qrForm.qrCodeUrl || qrPreviewUrl) && (
                      <button
                        type="button"
                        onClick={handleDeleteQR}
                        disabled={qrDeleting}
                        className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/20 text-xs font-bold cursor-pointer transition-all"
                      >
                        {qrDeleting ? 'Removing...' : 'Delete QR Code'}
                      </button>
                    )}
                  </div>

                  {selectedQRFile && (
                    <p className="text-[11px] font-bold text-emerald-500">
                      Selected File: {selectedQRFile.name} (Click "Save QR Settings" to upload)
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                QR Code Image URL / Path (Manual Fallback)
              </label>
              <input
                type="text"
                value={qrForm.qrCodeUrl}
                onChange={(e) => setQrForm({ ...qrForm, qrCodeUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                placeholder="/uploads/sample_qr.png"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                Official UPI ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={qrForm.upiId}
                onChange={(e) => setQrForm({ ...qrForm, upiId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white font-mono"
                placeholder="srisaisiri@upi"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                Tenant Payment Instructions
              </label>
              <textarea
                rows={3}
                value={qrForm.instructions}
                onChange={(e) => setQrForm({ ...qrForm, instructions: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                placeholder="Pay via any UPI app (GPay, PhonePe, Paytm) and enter the 12-digit UTR/Reference number."
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button 
                disabled={qrSaving}
                type="submit" 
                className="py-2.5 px-6 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{qrSaving ? 'Saving...' : 'Save QR Payment Settings'}</span>
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
