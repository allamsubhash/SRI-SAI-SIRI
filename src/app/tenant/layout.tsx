'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, 
  Receipt, 
  Megaphone, 
  Wrench, 
  UserCheck, 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  ChevronRight,
  User,
  Building,
  Bed,
  CheckCircle2,
  Calendar,
  FileText,
  DollarSign,
  Palette,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import LiveBackground, { BackgroundVariant } from '@/components/backgrounds/LiveBackground';
import NeonModal from '@/components/NeonModal';
import { formatINR, formatDate } from '@/utils/formatters';

interface TenantLayoutProps {
  children: React.ReactNode;
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

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

  const fetchTenantNotifications = () => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifications(data.notifications || []);
          setHasUnread((data.unreadCount || 0) > 0);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (user) {
      fetchTenantNotifications();
      const interval = setInterval(fetchTenantNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkNotifRead = async (id?: string, markAll: boolean = false) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, markAll })
      });
      if (res.ok) {
        fetchTenantNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { label: 'Home', href: '/tenant/dashboard', icon: Home },
    { label: 'My Billing', href: '/tenant/billing', icon: Receipt },
    { label: 'Announcements', href: '/tenant/announcements', icon: Megaphone },
    { label: 'Complaints', href: '/tenant/complaints', icon: Wrench },
    { label: 'Visitors', href: '/tenant/visitors', icon: UserCheck },
  ];

  const getTenantBackgroundVariant = (): BackgroundVariant => {
    if (pathname.includes('/tenant/billing')) return 'payments';
    if (pathname.includes('/tenant/announcements')) return 'tenant';
    if (pathname.includes('/tenant/complaints')) return 'complaints';
    if (pathname.includes('/tenant/visitors')) return 'warden';
    return 'tenant';
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] dark:bg-[#0D1411] flex items-center justify-center text-[#68736E] dark:text-[#9BAAA4]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-wider">Verifying Resident Account...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] dark:bg-[#0D1411] text-[#1C2522] dark:text-[#F2F5F2] font-sans selection:bg-emerald-500/30 select-none relative overflow-x-hidden flex flex-col justify-between">
      
      {/* Universal Live Background */}
      <LiveBackground variant={getTenantBackgroundVariant()} />

      <div className="relative z-10 flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* 👑 1. TOP APPBAR NAVBAR */}
        <header className="w-full rounded-[28px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-[#DDD8CE] dark:border-[#293832] shadow-sm backdrop-blur-xl p-4 flex justify-between items-center mb-6">
          
          {/* Hostel Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl tenant-bg-accent flex items-center justify-center font-black shadow-sm shrink-0">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="font-black text-sm tracking-tight block text-[#1C2522] dark:text-[#F2F5F2]">
                {hostelName}
              </span>
              <span className="text-[9px] font-extrabold text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest block">
                TENANT RESIDENT PORTAL
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#F1EEE7] dark:bg-[#1A2621] p-1.5 rounded-full border border-[#DDD8CE] dark:border-[#293832]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 ${
                    isActive 
                      ? 'tenant-bg-accent shadow-sm' 
                      : 'text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons: Notification Bell, Profile Trigger */}
          <div className="flex items-center gap-3">
            
            {/* Notification Bell Icon */}
            <button
              onClick={() => setShowNotifDrawer(true)}
              className="relative p-2.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[#1C2522] dark:text-[#F2F5F2] hover:tenant-border-accent transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full tenant-bg-accent-raw animate-pulse ring-2 ring-white dark:ring-[#141D19]" />
              )}
            </button>

            {/* Profile Avatar Pill */}
            <button
              onClick={() => {
                setProfileModalTab('PROFILE_LEASE');
                setShowProfileModal(true);
              }}
              className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] hover:tenant-border-accent transition-all cursor-pointer"
            >
              <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2] hidden sm:inline-block">
                {user?.name?.split(' ')[0] || 'Resident'}
              </span>
              <div className="w-7 h-7 rounded-full tenant-bg-accent flex items-center justify-center text-xs font-black shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
              </div>
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
          subtitle="Resident alerts & real-time updates"
          size="md"
          accentColor="emerald"
        >
          <div className="space-y-4 text-left font-sans">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] italic text-center py-8">No notifications found.</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 relative ${
                      notif.read
                        ? 'bg-[#F1EEE7]/50 dark:bg-[#1A2621]/50 border-[#DDD8CE] dark:border-[#293832] opacity-70'
                        : 'bg-[#F1EEE7] dark:bg-[#1A2621] border-tenant-accent shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-black">
                      <span className="tenant-text-accent uppercase tracking-wider">{notif.tag}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#68736E] dark:text-[#9BAAA4]">{notif.time}</span>
                        {!notif.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkNotifRead(notif.id, false);
                            }}
                            className="text-[9px] text-emerald-500 hover:text-emerald-400 font-bold hover:underline cursor-pointer"
                          >
                            Mark as Read ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 
                      onClick={() => {
                        handleMarkNotifRead(notif.id, false);
                        setShowNotifDrawer(false);
                        if (notif.link) router.push(notif.link);
                      }}
                      className="font-bold text-xs text-[#1C2522] dark:text-[#F2F5F2] hover:tenant-text-accent"
                    >
                      {notif.title}
                    </h4>
                    <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4] leading-relaxed">{notif.desc}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#DDD8CE] dark:border-[#293832] flex justify-between items-center">
              <button
                onClick={() => handleMarkNotifRead(undefined, true)}
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

      {/* 📱 MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border-t border-[#DDD8CE] dark:border-[#293832] backdrop-blur-2xl p-2 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
                isActive ? 'tenant-text-accent font-black scale-105' : 'text-[#68736E] dark:text-[#9BAAA4]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
