'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, 
  Receipt, 
  Wrench, 
  UserCheck, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  Building, 
  User, 
  Search, 
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LiveBackground, { BackgroundVariant } from '@/components/backgrounds/LiveBackground';
import ThemeToggleSwitch from '@/components/ThemeToggleSwitch';

interface TenantLayoutProps {
  children: React.ReactNode;
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  const [hostelName, setHostelName] = useState('Sri Sai Siri Hostel');

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
          const list = data.notifications || [];
          setNotifications(list);
          const unread = list.filter((n: any) => !n.read).length;
          setUnreadNotifCount(unread);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (user) {
      fetchTenantNotifications();
      const interval = setInterval(fetchTenantNotifications, 8000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // INSTANT MARK AS READ HANDLER (Optimistic UI Update + API Persistence)
  const handleMarkNotifRead = async (id?: string, markAll: boolean = false) => {
    if (markAll) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifCount(0);
    } else if (id) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    }

    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, markAll })
      });
      fetchTenantNotifications();
    } catch (err) {
      console.error('Failed to persist mark as read:', err);
    }
  };

  // CLEAN NAVIGATION ITEMS (ANNOUNCEMENTS REMOVED)
  const navItems = [
    { label: 'Home', href: '/tenant/dashboard', icon: Home, color: 'text-emerald-500' },
    { label: 'My Billing & Rent', href: '/tenant/billing', icon: Receipt, color: 'text-[#38C7D9]' },
    { label: 'My Complaints', href: '/tenant/complaints', icon: Wrench, color: 'text-orange-500' },
    { label: 'Visitors Gate Pass', href: '/tenant/visitors', icon: UserCheck, color: 'text-purple-500' },
    { label: 'My Profile & Lease', href: '/tenant/profile', icon: User, color: 'text-cyan-500' },
  ];

  const getTenantBackgroundVariant = (): BackgroundVariant => {
    if (pathname.includes('/tenant/billing')) return 'payments';
    if (pathname.includes('/tenant/complaints')) return 'complaints';
    if (pathname.includes('/tenant/visitors')) return 'warden';
    return 'tenant';
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
    <div className="min-h-screen bg-[#FFFDF9] dark:bg-[#0D1411] text-[#1C2522] dark:text-[#F2F5F2] font-sans selection:bg-emerald-500/30 select-none relative overflow-x-hidden flex">
      
      {/* Universal 60FPS Live Background */}
      <LiveBackground variant={getTenantBackgroundVariant()} />

      <div className="relative z-10 flex-1 flex w-full min-h-screen max-w-[1600px] mx-auto p-2 sm:p-4 gap-4">
        
        {/* ========================================================
            🏛️ 1. DESKTOP SIDEBAR NAVIGATION (IDENTICAL TO OWNER PORTAL)
           ======================================================== */}
        <motion.aside 
          animate={{ width: sidebarCollapsed ? 88 : 280 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="hidden md:flex flex-col shrink-0 bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-[#DDD8CE] dark:border-[#293832] shadow-2xl backdrop-blur-2xl rounded-[32px] p-4 text-left relative z-30 justify-between overflow-hidden"
        >
          <div className="space-y-6">
            
            {/* Sidebar Header & Brand Logo */}
            <div className="flex items-center justify-between px-2 pt-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl tenant-bg-accent flex items-center justify-center font-black shadow-md shrink-0">
                  <Building className="w-6 h-6 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="min-w-0 text-left"
                  >
                    <h2 className="font-black text-sm text-[#1C2522] dark:text-[#F2F5F2] tracking-tight truncate">
                      {hostelName}
                    </h2>
                    <span className="text-[9px] font-black tenant-text-accent uppercase tracking-widest block">
                      RESIDENT PORTAL
                    </span>
                  </motion.div>
                )}
              </div>

              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2] transition-colors cursor-pointer"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Navigation Items List */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-xs transition-all relative group cursor-pointer ${
                      isActive 
                        ? 'tenant-bg-accent text-[#1C2522] dark:text-white shadow-lg' 
                        : 'text-[#68736E] dark:text-[#9BAAA4] hover:bg-[#F1EEE7] dark:hover:bg-[#1A2621] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1C2522] dark:text-white' : item.color}`} />
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

          </div>

          {/* Sidebar Bottom Actions */}
          <div className="space-y-3 pt-4 border-t border-[#DDD8CE] dark:border-[#293832]">
            <button
              onClick={logout}
              className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all cursor-pointer ${
                sidebarCollapsed ? 'px-2' : 'px-4'
              }`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </motion.aside>

        {/* ========================================================
            📱 2. MOBILE DRAWER NAVIGATION SIDEBAR
           ======================================================== */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md md:hidden flex justify-start"
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className="w-72 bg-[#FFFDF9] dark:bg-[#141D19] border-r border-[#DDD8CE] dark:border-[#293832] h-full p-5 flex flex-col justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-[#DDD8CE] dark:border-[#293832]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl tenant-bg-accent flex items-center justify-center font-black">
                        <Building className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h2 className="font-black text-sm text-[#1C2522] dark:text-[#F2F5F2]">{hostelName}</h2>
                        <span className="text-[9px] font-black tenant-text-accent uppercase">RESIDENT PORTAL</span>
                      </div>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="space-y-1.5">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all ${
                            isActive ? 'tenant-bg-accent text-[#1C2522] dark:text-white' : 'text-[#68736E] dark:text-[#9BAAA4]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <button
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500/10 text-rose-600 font-bold text-xs border border-rose-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================
            💻 3. MAIN WORKSPACE AREA & TOP HEADER TOOLBAR
           ======================================================== */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen md:max-h-screen md:overflow-y-auto overflow-x-hidden">
          
          {/* HEADER TOOLBAR (RESPONSIVE FOR MOBILE - 0 OVERFLOW) */}
          <header className="relative z-30 bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-[#DDD8CE] dark:border-[#293832] shadow-sm rounded-[28px] p-2.5 sm:p-4 mb-6 flex items-center justify-between gap-2 sm:gap-4 backdrop-blur-2xl w-full max-w-full overflow-hidden">
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl tenant-bg-accent text-white shadow-sm flex items-center justify-center cursor-pointer shrink-0"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>

              <div className="text-left min-w-0">
                <h1 className="text-xs sm:text-xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] flex items-center gap-1 min-w-0">
                  <span className="truncate max-w-[110px] xs:max-w-[180px] sm:max-w-none">Hi, {user?.name?.split(' ')[0] || 'Resident'}</span>
                  <span className="text-sm sm:text-base shrink-0">👋</span>
                </h1>
                <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium hidden sm:block">
                  Here's your resident hostel status overview today.
                </p>
              </div>
            </div>

            {/* COMMAND PALETTE SEARCH BAR */}
            <div className="hidden md:flex items-center mx-3 flex-1 max-w-xs sm:max-w-md">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2] text-xs font-medium transition-all cursor-pointer shrink-0 shadow-xs"
              >
                <div className="flex items-center gap-2.5 truncate whitespace-nowrap pr-2">
                  <Search className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate whitespace-nowrap">Search billing, complaints, gate passes...</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#FFFDF9] dark:bg-[#141D19] text-[#68736E] dark:text-[#9BAAA4] rounded-md border border-[#DDD8CE] dark:border-[#293832] shrink-0">
                  ⌘ K
                </kbd>
              </button>
            </div>

            {/* ACTIONS: NOTIFICATION BELL, THEME TOGGLE, & PROFILE AVATAR (COMPACT ON MOBILE) */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              
              {/* Notification Button with Badge */}
              <div className="relative">
                <button
                  onClick={() => setShowNotif(!showNotif)}
                  className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#F1EEE7]/80 dark:bg-[#1A2621]/80 border border-[#DDD8CE] dark:border-[#293832] text-[#1C2522] dark:text-[#F2F5F2] hover:tenant-border-accent transition-colors cursor-pointer shrink-0"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3.5 h-3.5 rounded-full tenant-bg-accent-raw text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#141D19]">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* 🔔 REAL-TIME NOTIFICATIONS DROPDOWN DRAWER */}
                <AnimatePresence>
                  {showNotif && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-[#DDD8CE] dark:border-[#293832] rounded-3xl shadow-2xl z-50 p-4 space-y-3 text-left backdrop-blur-2xl"
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-[#DDD8CE] dark:border-[#293832]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2] uppercase tracking-wider">Notifications</span>
                            {unreadNotifCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[9px] font-black">
                                {unreadNotifCount} Unread
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setShowNotif(false)}
                            className="text-[10px] bg-rose-500/10 text-rose-500 font-bold px-2 py-0.5 rounded-full hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                          >
                            Close ✕
                          </button>
                        </div>

                        <div className="space-y-2 text-xs max-h-72 overflow-y-auto pr-1">
                          {notifications.length === 0 ? (
                            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] italic text-center py-6">No notifications found.</p>
                          ) : (
                            notifications.map((notif) => (
                              <div 
                                key={notif.id}
                                className={`p-3 rounded-2xl border transition-all space-y-1 relative group ${
                                  notif.read
                                    ? 'bg-[#F1EEE7]/50 dark:bg-[#1A2621]/50 border-[#DDD8CE] dark:border-[#293832] opacity-70'
                                    : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-xs'
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
                                        className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                                      >
                                        Mark as Read ✕
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <h4 
                                  onClick={() => {
                                    handleMarkNotifRead(notif.id, false);
                                    setShowNotif(false);
                                    if (notif.link) router.push(notif.link);
                                  }}
                                  className="font-bold text-xs text-[#1C2522] dark:text-[#F2F5F2] hover:tenant-text-accent cursor-pointer"
                                >
                                  {notif.title}
                                </h4>
                                <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4] leading-relaxed">{notif.desc}</p>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#DDD8CE] dark:border-[#293832] flex justify-between items-center">
                          <button
                            onClick={() => handleMarkNotifRead(undefined, true)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] hover:bg-[#EAE5DC] dark:hover:bg-[#202D27] text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] cursor-pointer transition-colors"
                          >
                            Mark All as Read
                          </button>
                          <button
                            onClick={() => setShowNotif(false)}
                            className="px-3.5 py-1.5 rounded-xl tenant-bg-accent text-[#1C2522] dark:text-white text-xs font-bold cursor-pointer shadow-md"
                          >
                            Done
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme Switcher */}
              <div className="shrink-0 scale-90 sm:scale-100">
                <ThemeToggleSwitch />
              </div>

              {/* Profile Avatar Trigger */}
              <button
                onClick={() => router.push('/tenant/profile')}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl tenant-bg-accent text-[#1C2522] dark:text-white font-black text-xs flex items-center justify-center shadow-md shrink-0 cursor-pointer transition-transform hover:scale-105"
                title="My Profile & Lease Details"
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
              </button>

            </div>
          </header>

          {/* PAGE CONTENT WORKSPACE */}
          <main className="flex-1 pb-6">
            {children}
          </main>

        </div>

      </div>

    </div>
  );
}
