'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Receipt, 
  Megaphone, 
  Wrench, 
  UserCheck, 
  LogOut, 
  Bell, 
  Loader,
  User,
  ShieldCheck,
  Building2,
  X,
  ChevronRight,
  MoreHorizontal,
  Palette,
  Sparkles,
  Lock,
  FileText
} from 'lucide-react';
import { ToastProvider } from '@/components/ToastProvider';
import NeonModal from '@/components/NeonModal';
import ThemeToggleSwitch from '@/components/ThemeToggleSwitch';
import LiveBackground, { BackgroundVariant } from '@/components/backgrounds/LiveBackground';
import { TenantAppearanceProvider, useTenantAppearance } from '@/context/TenantAppearanceContext';
import TenantAppearanceSettings from '@/components/TenantAppearanceSettings';
import { formatDate, formatINR } from '@/utils/formatters';

function TenantLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'PROFILE_LEASE' | 'APPEARANCE'>('PROFILE_LEASE');
  const [showMobileMoreModal, setShowMobileMoreModal] = useState(false);
  const [hostelName, setHostelName] = useState('Sri Sai Siri Hostel');

  // Tenant lease details from DB
  const [tenantProfileData, setTenantProfileData] = useState<any>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const savedName = localStorage.getItem('hostelName');
    if (savedName) setHostelName(savedName);

    const updateHostelName = () => {
      const name = localStorage.getItem('hostelName');
      if (name) setHostelName(name);
    };

    window.addEventListener('settingsUpdated', updateHostelName);
    return () => window.removeEventListener('settingsUpdated', updateHostelName);
  }, []);

  const fetchTenantContextData = async () => {
    try {
      const [tenantsRes, noticesRes, rentRes, visitorsRes] = await Promise.all([
        fetch('/api/tenants'),
        fetch('/api/notices'),
        fetch('/api/rent'),
        fetch('/api/visitors')
      ]);

      if (tenantsRes.ok) {
        const tenantList = await tenantsRes.json();
        const found = tenantList.find((t: any) => 
          (user?.email && t.email?.toLowerCase() === user.email.toLowerCase()) || 
          (user?.name && t.name?.toLowerCase() === user.name.toLowerCase()) ||
          t.id === user?.id
        );
        if (found) setTenantProfileData(found);
      }

      let noticeList: any[] = [];
      let rentList: any[] = [];
      let visitorList: any[] = [];

      if (noticesRes.ok) noticeList = await noticesRes.json();
      if (rentRes.ok) rentList = await rentRes.json();
      if (visitorsRes.ok) visitorList = await visitorsRes.json();

      const combined: any[] = [];
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);

      noticeList.forEach((n: any) => {
        const createdDate = new Date(n.createdAt || n.scheduleDate || new Date());
        if (createdDate >= twoDaysAgo && (n.target === 'EVERYONE' || n.target === 'TENANTS' || n.target === 'ALL')) {
          combined.push({
            id: `notice-${n.id}`,
            title: n.title,
            desc: n.content.length > 60 ? `${n.content.slice(0, 60)}...` : n.content,
            link: '/tenant/announcements',
            tag: n.isEmergency ? 'EMERGENCY' : 'NOTICE',
            time: formatDate(n.createdAt)
          });
        }
      });

      const userInvoices = rentList.filter((r: any) => 
        (r.tenantName && user?.name && r.tenantName.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
        (r.tenantId && user?.id && r.tenantId === user.id)
      );

      userInvoices.forEach((inv: any) => {
        if (inv.status === 'PENDING' || inv.status === 'OVERDUE') {
          combined.push({
            id: `rent-${inv.id}`,
            title: inv.status === 'OVERDUE' ? 'Rent Overdue Alert' : 'Rent Invoice Due',
            desc: `Rent invoice ${inv.number} for ${formatINR(inv.amount)} is ${inv.status.toLowerCase()}.`,
            link: '/tenant/billing',
            tag: inv.status,
            time: `Due: ${formatDate(inv.dueDate)}`
          });
        }
      });

      const userVisitors = visitorList.filter((v: any) => 
        (v.tenantName && user?.name && v.tenantName.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
        (v.personVisiting && user?.name && v.personVisiting.toLowerCase().trim() === user.name.toLowerCase().trim())
      );

      userVisitors.forEach((v: any) => {
        if (v.status === 'APPROVED' || v.approvalStatus === 'APPROVED') {
          combined.push({
            id: `vis-${v.id}`,
            title: 'Visitor Pass Approved',
            desc: `Guest ${v.name} has been pre-approved for gate entry.`,
            link: '/tenant/visitors',
            tag: 'VISITOR',
            time: v.checkIn || 'Today'
          });
        }
      });

      setNotifications(combined);
      setHasUnread(combined.length > 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTenantContextData();
    }
  }, [user, pathname]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'TENANT')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || (!user || user.role !== 'TENANT')) {
    return (
      <div className="min-h-screen bg-[#F6F3EE] dark:bg-[#0C1210] flex items-center justify-center text-[#68736E] dark:text-[#9BAAA4]">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin tenant-text-accent" />
          <span className="text-xs font-black uppercase tracking-wider text-[#68736E] dark:text-[#9BAAA4]">Loading Resident Experience...</span>
        </div>
      </div>
    );
  }

  const menuItems = [
    { label: 'Home', icon: <Home className="w-4 h-4" />, href: '/tenant/dashboard' },
    { label: 'My Billing', icon: <Receipt className="w-4 h-4" />, href: '/tenant/billing' },
    { label: 'Announcements', icon: <Megaphone className="w-4 h-4" />, href: '/tenant/announcements' },
    { label: 'Complaints', icon: <Wrench className="w-4 h-4" />, href: '/tenant/complaints' },
    { label: 'Visitors', icon: <UserCheck className="w-4 h-4" />, href: '/tenant/visitors' },
  ];

  const currentHour = new Date().getHours();
  const greetingText = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  const getTenantBackgroundVariant = (): BackgroundVariant => {
    if (pathname.includes('/tenant/billing')) return 'payments';
    if (pathname.includes('/tenant/announcements')) return 'tenant';
    if (pathname.includes('/tenant/complaints')) return 'complaints';
    if (pathname.includes('/tenant/visitors')) return 'warden';
    return 'tenant';
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0D1411] text-[#1C2522] dark:text-[#F2F5F2] flex flex-col md:flex-row font-sans selection:bg-teal-500/20 select-none transition-colors duration-200 relative">
      
      {/* Universal Live Background */}
      <LiveBackground variant={getTenantBackgroundVariant()} />
      
      {/* 👑 1. UNIFIED DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 bg-[#FFFDF9] dark:bg-[#141D19] border-r border-[#DDD8CE] dark:border-[#293832] p-5 justify-between sticky top-0 h-screen z-40 text-left transition-colors duration-200 shadow-sm">
        <div className="space-y-7">
          
          {/* Top Branding */}
          <Link href="/tenant/dashboard" className="flex items-center gap-3 px-1 py-1 group">
            <div className="w-9 h-9 rounded-2xl tenant-bg-accent flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-sm text-[#1C2522] dark:text-[#F2F5F2] tracking-tight truncate leading-tight">
                {hostelName}
              </h1>
              <span className="text-[9px] font-black uppercase tracking-widest tenant-text-accent block mt-0.5">
                Resident Portal
              </span>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {menuItems.map((item, idx) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                    isActive 
                      ? 'tenant-bg-soft tenant-text-accent font-black border tenant-border-accent' 
                      : 'text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2] hover:bg-[#F1EEE7] dark:hover:bg-[#141D19] hover:translate-x-1'
                  }`}
                >
                  <span className={isActive ? 'tenant-text-accent' : 'text-[#929B96] dark:text-[#6F7D77]'}>
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Summary & Appearance Link */}
        <div className="pt-4 border-t border-[#DDD8CE] dark:border-[#293832] space-y-2">
          <button
            onClick={() => {
              setProfileModalTab('APPEARANCE');
              setShowProfileModal(true);
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-2xl tenant-bg-soft border tenant-border-accent tenant-text-accent font-extrabold text-xs cursor-pointer hover:tenant-bg-accent transition-colors"
          >
            <Palette className="w-4 h-4" />
            <span className="flex-1 text-left">Appearance</span>
          </button>

          <button
            onClick={() => {
              setProfileModalTab('PROFILE_LEASE');
              setShowProfileModal(true);
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] hover:bg-[#EAE5DC] dark:hover:bg-[#1A2621] transition-colors cursor-pointer text-left group"
          >
            <div className="w-8 h-8 rounded-xl tenant-bg-accent font-black text-xs flex items-center justify-center shrink-0 border border-[#DDD8CE] dark:border-white/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] truncate group-hover:tenant-text-accent transition-colors">
                {user?.name || 'Resident'}
              </p>
              <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] truncate font-medium">
                {tenantProfileData?.roomNumber ? `Room ${tenantProfileData.roomNumber}` : 'Tenant Resident'}
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#929B96] group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold text-[#C94B4B] dark:text-[#F27676] hover:bg-rose-50 dark:hover:bg-[#F27676]/15 border border-rose-200 dark:border-[#F27676]/30 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 📱 2. MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFFDF9]/95 dark:bg-[#101916]/95 border-t border-[#DDD8CE] dark:border-[#293832] backdrop-blur-xl px-2 py-2 flex items-center justify-around shadow-2xl">
        {[
          { label: 'Home', icon: <Home className="w-5 h-5" />, href: '/tenant/dashboard' },
          { label: 'Billing', icon: <Receipt className="w-5 h-5" />, href: '/tenant/billing' },
          { label: 'Complaints', icon: <Wrench className="w-5 h-5" />, href: '/tenant/complaints' },
          { label: 'Visitors', icon: <UserCheck className="w-5 h-5" />, href: '/tenant/visitors' },
        ].map((item, idx) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={idx}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[10px] font-extrabold transition-all cursor-pointer ${
                isActive ? 'tenant-text-accent tenant-bg-soft' : 'text-[#68736E] dark:text-[#9BAAA4]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        {/* Mobile "More" Button -> Opens Mobile Pop-Up Modal */}
        <button
          onClick={() => setShowMobileMoreModal(true)}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[10px] font-extrabold transition-all cursor-pointer ${
            showMobileMoreModal ? 'tenant-text-accent tenant-bg-soft' : 'text-[#68736E] dark:text-[#9BAAA4]'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </button>
      </div>

      {/* 📱 MOBILE MORE POP-UP MODAL */}
      {showMobileMoreModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowMobileMoreModal(false)}
          title="Resident Navigation & Options"
          subtitle={`Welcome, ${user?.name || 'Resident'}`}
          size="sm"
          accentColor="emerald"
        >
          <div className="space-y-4 text-left font-sans">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832]">
              <span className="text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]">Theme Mode</span>
              <ThemeToggleSwitch />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowMobileMoreModal(false);
                  setProfileModalTab('PROFILE_LEASE');
                  setShowProfileModal(true);
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl tenant-bg-soft border tenant-border-accent text-xs font-bold tenant-text-accent text-left cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>My Profile & Room Lease Details</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileMoreModal(false);
                  setProfileModalTab('APPEARANCE');
                  setShowProfileModal(true);
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] text-left cursor-pointer"
              >
                <Palette className="w-4 h-4 tenant-text-accent" />
                <span>Appearance & Personal Accent</span>
              </button>

              <Link
                href="/tenant/announcements"
                onClick={() => setShowMobileMoreModal(false)}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
              >
                <Megaphone className="w-4 h-4 tenant-text-accent" />
                <span>Warden Announcements</span>
              </Link>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676] border border-rose-200 dark:border-[#F27676]/30 font-bold text-xs cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out Account</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowMobileMoreModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs cursor-pointer border border-[#DDD8CE] dark:border-[#293832]"
              >
                Close
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 💻 3. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* TOP HEADER TOOLBAR */}
        <header className="sticky top-0 z-30 bg-[#FFFDF9]/90 dark:bg-[#141D19]/90 border-b border-[#DDD8CE] dark:border-[#293832] backdrop-blur-xl px-5 sm:px-8 py-4 flex items-center justify-between gap-4 transition-colors duration-200 shadow-sm">
          <div>
            <p className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] tracking-wide">
              {greetingText}, <span className="font-black text-[#1C2522] dark:text-[#F2F5F2]">{user?.name || 'HELLO'} 👋</span>
            </p>
            <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4] font-medium hidden sm:block">
              Here's what's happening with your stay.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Switch */}
            <ThemeToggleSwitch />

            {/* Appearance Trigger Button */}
            <button
              onClick={() => {
                setProfileModalTab('APPEARANCE');
                setShowProfileModal(true);
              }}
              className="p-2.5 rounded-2xl tenant-bg-soft border tenant-border-accent tenant-text-accent hover:tenant-bg-accent transition-all cursor-pointer"
              title="Personal Appearance Settings"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Notification Trigger Button */}
            <button
              onClick={() => setShowNotifDrawer(true)}
              className="relative p-2.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2] transition-all cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 tenant-text-accent" />
              {hasUnread && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full tenant-bg-accent-raw animate-pulse" />
              )}
            </button>

            {/* Profile Trigger Button */}
            <button
              onClick={() => {
                setProfileModalTab('PROFILE_LEASE');
                setShowProfileModal(true);
              }}
              className="w-9 h-9 rounded-2xl tenant-bg-accent font-black text-xs flex items-center justify-center border border-[#DDD8CE] dark:border-white/20 shadow-sm cursor-pointer hover:scale-105 transition-transform"
              title="Resident Profile & Room Lease"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT WORKSPACE */}
        <main className="flex-1 p-4 sm:p-7 md:p-8 pb-24 md:pb-12 text-left">
          {children}
        </main>
      </div>

      {/* 🔔 NOTIFICATIONS MODAL (CENTERED OVERLAY) */}
      {showNotifDrawer && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowNotifDrawer(false)}
          title="Notifications"
          subtitle="Resident alerts & updates"
          size="md"
          accentColor="emerald"
        >
          <div className="space-y-4 text-left font-sans">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] italic text-center py-8">No unread notifications.</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      setShowNotifDrawer(false);
                      router.push(notif.link);
                    }}
                    className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] hover:border-tenant-accent transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-[10px] font-black">
                      <span className="tenant-text-accent uppercase tracking-wider">{notif.tag}</span>
                      <span className="text-[#68736E] dark:text-[#9BAAA4]">{notif.time}</span>
                    </div>
                    <h4 className="font-bold text-xs text-[#1C2522] dark:text-[#F2F5F2]">{notif.title}</h4>
                    <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4] leading-relaxed">{notif.desc}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#DDD8CE] dark:border-[#293832] flex justify-between items-center">
              <button
                onClick={() => setHasUnread(false)}
                className="px-4 py-2 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] hover:bg-[#EAE5DC] dark:hover:bg-[#202D27] text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] cursor-pointer"
              >
                Mark All as Read
              </button>
              <button
                onClick={() => setShowNotifDrawer(false)}
                className="px-4 py-2 rounded-xl tenant-bg-accent text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 👤 UNIFIED RESIDENT PROFILE & ROOM LEASE POP-UP MODAL */}
      {showProfileModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowProfileModal(false)}
          title="Resident Profile & Room Lease Specifications"
          subtitle="View your combined personal information, assigned room allocation, and appearance settings."
          size="lg"
          accentColor="emerald"
        >
          <div className="space-y-5 text-left font-sans">
            
            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832]">
              {[
                { id: 'PROFILE_LEASE', label: 'Profile & Room Lease', icon: <User className="w-3.5 h-3.5" /> },
                { id: 'APPEARANCE', label: 'Appearance', icon: <Palette className="w-3.5 h-3.5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setProfileModalTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    profileModalTab === tab.id
                      ? 'tenant-bg-accent shadow-sm'
                      : 'text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* COMBINED TAB CONTENT: PERSONAL INFO + ROOM LEASE SPECIFICATIONS IN ONE POP-UP VIEW */}
            {profileModalTab === 'PROFILE_LEASE' && (
              <div className="space-y-4">
                
                {/* 1. Personal Avatar & Role Header */}
                <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl tenant-bg-accent font-black text-lg flex items-center justify-center border border-white/20 shadow-sm shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2]">{user?.name || 'Resident Tenant'}</h3>
                    <p className="text-xs tenant-text-accent font-bold mt-0.5">Resident Tenant • Active Lease</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* 2. Personal Information Card */}
                  <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2.5 text-xs font-bold">
                    <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block border-b border-[#DDD8CE] dark:border-[#293832] pb-2">
                      Personal Information
                    </span>
                    <div className="flex justify-between">
                      <span className="text-[#68736E] dark:text-[#9BAAA4]">Full Name</span>
                      <span className="text-[#1C2522] dark:text-[#F2F5F2]">{user?.name || 'Resident'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68736E] dark:text-[#9BAAA4]">Email Address</span>
                      <span className="text-[#1C2522] dark:text-[#F2F5F2]">{user?.email || 'tenant@srisaisiri.com'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68736E] dark:text-[#9BAAA4]">Phone Number</span>
                      <span className="text-[#1C2522] dark:text-[#F2F5F2]">{tenantProfileData?.phone || '+91 98765 00000'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68736E] dark:text-[#9BAAA4]">Gender</span>
                      <span className="text-[#1C2522] dark:text-[#F2F5F2]">{tenantProfileData?.gender || 'Male'}</span>
                    </div>
                  </div>

                  {/* 3. Room & Lease Specifications Card */}
                  <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2.5 text-xs font-bold">
                    <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block border-b border-[#DDD8CE] dark:border-[#293832] pb-2">
                      Room & Lease Specifications
                    </span>
                    <div className="flex justify-between">
                      <span className="text-[#68736E] dark:text-[#9BAAA4]">Hostel Name</span>
                      <span className="tenant-text-accent font-black">{hostelName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68736E] dark:text-[#9BAAA4]">Assigned Room</span>
                      <span className="text-[#1C2522] dark:text-[#F2F5F2]">{tenantProfileData?.roomNumber || 'A-101'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68736E] dark:text-[#9BAAA4]">Bed Spot</span>
                      <span className="text-[#1C2522] dark:text-[#F2F5F2]">Bed {tenantProfileData?.bedNumber || 'A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68736E] dark:text-[#9BAAA4]">Joining Date</span>
                      <span className="text-[#1C2522] dark:text-[#F2F5F2]">{formatDate(tenantProfileData?.moveInDate) || '15 Jan 2026'}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#DDD8CE] dark:border-[#293832] pt-2">
                      <span className="text-[#68736E] dark:text-[#9BAAA4]">Monthly Rent</span>
                      <span className="tenant-text-accent font-black text-sm">{formatINR(tenantProfileData?.rentAmount || 8500)}</span>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB CONTENT: APPEARANCE */}
            {profileModalTab === 'APPEARANCE' && (
              <TenantAppearanceSettings />
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="py-2.5 px-5 rounded-2xl tenant-bg-accent text-xs font-black cursor-pointer shadow-md"
              >
                Close Modal
              </button>
            </div>
          </div>
        </NeonModal>
      )}

    </div>
  );
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <TenantAppearanceProvider>
        <TenantLayoutContent>{children}</TenantLayoutContent>
      </TenantAppearanceProvider>
    </ToastProvider>
  );
}
