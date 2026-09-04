'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Wrench, 
  Briefcase, 
  Warehouse, 
  DollarSign, 
  Megaphone, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  User, 
  Loader, 
  Sun, 
  Moon, 
  Laptop,
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  BarChart3, 
  ChevronDown,
  Palette,
  Shield,
  UserCheck
} from 'lucide-react';
import GlobalSearchModal from '@/components/GlobalSearchModal';
import QuickActionSpeedDial from '@/components/QuickActionSpeedDial';
import { ToastProvider } from '@/components/ToastProvider';
import { AccentProvider } from '@/context/AccentContext';
import IOSLiquidGlassDock from '@/components/IOSLiquidGlassDock';
import ThemeToggleSwitch from '@/components/ThemeToggleSwitch';
import { TenantAppearanceProvider } from '@/context/TenantAppearanceContext';
import TenantAppearanceSettings from '@/components/TenantAppearanceSettings';
import LiveBackground, { BackgroundVariant } from '@/components/backgrounds/LiveBackground';
import NeonModal from '@/components/NeonModal';

function OwnerLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [bubbleActionsOpen, setBubbleActionsOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [pendingCount, setPendingCount] = useState(0);
  const [hostelName, setHostelName] = useState('Sri Sai Siri Boys Hostel');

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const fetchOwnerNotifications = () => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadNotifCount(data.unreadCount || 0);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchOwnerNotifications();
    const interval = setInterval(fetchOwnerNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkNotifRead = async (id?: string, markAll: boolean = false) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, markAll })
      });
      if (res.ok) {
        fetchOwnerNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Dynamically fetch active pending complaints count
    fetch('/api/complaints')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const pending = data.filter((c: any) => c.status === 'PENDING').length;
          setPendingCount(pending);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const updateHostelName = () => {
    const savedName = localStorage.getItem('hostelName');
    if (savedName) setHostelName(savedName);
  };

  const applyThemeMode = (mode: string) => {
    setTheme(mode);
    localStorage.setItem('theme', mode);
    const html = document.documentElement;
    if (mode === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) html.classList.add('dark');
      else html.classList.remove('dark');
    } else if (mode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    applyThemeMode(saved);

    updateHostelName();
    window.addEventListener('settingsUpdated', updateHostelName);
    return () => {
      window.removeEventListener('settingsUpdated', updateHostelName);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'OWNER') {
        router.replace('/tenant/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'OWNER') {
    return (
      <div className="min-h-screen bg-[#0D1411] flex flex-col items-center justify-center space-y-3 text-slate-200">
        <Loader className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-xs font-bold text-slate-400">Authenticating Session...</span>
      </div>
    );
  }

  const menuItems = [
    { label: 'Buildings & Rooms', icon: <Building className="w-4 h-4" />, href: '/owner/buildings' },
    { label: 'Tenant Registry', icon: <Users className="w-4 h-4" />, href: '/owner/tenants' },
    { label: 'Visitors Gate Pass', icon: <UserCheck className="w-4 h-4" />, href: '/owner/visitors' },
    { label: 'Rent & Billing', icon: <Receipt className="w-4 h-4" />, href: '/owner/rent' },
    { label: 'Complaints', icon: <Wrench className="w-4 h-4" />, href: '/owner/complaints', badge: pendingCount },
    { label: 'Staff Management', icon: <Briefcase className="w-4 h-4" />, href: '/owner/employees' },
    { label: 'Inventory Stock', icon: <Warehouse className="w-4 h-4" />, href: '/owner/inventory' },
    { label: 'Expenses', icon: <DollarSign className="w-4 h-4" />, href: '/owner/expenses' },
    { label: 'Notice Board', icon: <Megaphone className="w-4 h-4" />, href: '/owner/notices' },
    { label: 'Reports & Analytics', icon: <BarChart3 className="w-4 h-4" />, href: '/owner/reports' },
    { label: 'Settings', icon: <Settings className="w-4 h-4" />, href: '/owner/settings' },
  ];

  const dockItems = [
    { label: 'Buildings', icon: <Building className="w-5 h-5" />, href: '/owner/buildings' },
    { label: 'Tenants', icon: <Users className="w-5 h-5" />, href: '/owner/tenants' },
    { label: 'Rent', icon: <Receipt className="w-5 h-5" />, href: '/owner/rent' },
    { label: 'Complaints', icon: <Wrench className="w-5 h-5" />, href: '/owner/complaints', badge: pendingCount },
  ];

  const getBackgroundVariant = (): BackgroundVariant => {
    if (pathname.includes('/owner/dashboard')) return 'dashboard';
    if (pathname.includes('/owner/buildings')) return 'rooms';
    if (pathname.includes('/owner/tenants')) return 'tenants';
    if (pathname.includes('/owner/visitors')) return 'warden';
    if (pathname.includes('/owner/rent')) return 'payments';
    if (pathname.includes('/owner/complaints')) return 'complaints';
    if (pathname.includes('/owner/employees')) return 'attendance';
    if (pathname.includes('/owner/inventory')) return 'owner';
    if (pathname.includes('/owner/expenses')) return 'payments';
    if (pathname.includes('/owner/notices')) return 'owner';
    if (pathname.includes('/owner/reports')) return 'reports';
    if (pathname.includes('/owner/settings')) return 'settings';
    return 'owner';
  };

  return (
    <ToastProvider>
      <AccentProvider>
        <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0D1411] text-[#1C2522] dark:text-[#F2F5F2] flex p-3 md:p-4 gap-4 transition-colors relative">
          
          {/* Universal Live Background */}
          <LiveBackground variant={getBackgroundVariant()} />
        
        {/* FLOATING GLASS SIDEBAR (DESKTOP) */}
        <aside 
          className={`hidden md:flex flex-col justify-between bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm transition-all duration-300 sticky top-4 h-[calc(100vh-2rem)] rounded-[28px] z-40 ${
            sidebarCollapsed ? 'w-20 p-3' : 'w-64 p-4 sm:p-5'
          }`}
        >
          <div className="space-y-6">
            {/* Logo Brand Header */}
            <div className="flex items-center justify-between px-1">
              <Link href="/owner/dashboard" className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105">
                  <Building className="w-5 h-5 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                    Sri Sai Siri<span className="text-blue-600 dark:text-cyan-400">.</span>
                  </span>
                )}
              </Link>
              
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Navigation Item List */}
            <nav className="space-y-1 max-h-[calc(100vh-15rem)] overflow-y-auto pr-1">
              {menuItems.map((item, idx) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                      active 
                        ? 'text-white font-extrabold shadow-md' 
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 hover:translate-x-1'
                    }`}
                  >
                    {/* Animated Active Indicator Pill */}
                    {active && (
                      <motion.div 
                        layoutId="activeDesktopNavTab"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="absolute inset-0 bg-blue-600 dark:bg-blue-600 rounded-2xl z-0 shadow-sm"
                      />
                    )}

                    <div className={`relative z-10 ${active ? 'text-white' : 'text-slate-400 dark:text-zinc-500'}`}>
                      {item.icon}
                    </div>
                    
                    {!sidebarCollapsed && (
                      <span className="relative z-10 flex-1 truncate">{item.label}</span>
                    )}

                    {!sidebarCollapsed && item.badge && item.badge > 0 && (
                      <span className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        active ? 'bg-white/25 text-white' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile Summary & Sign Out Section */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
            <Link
              href="/owner/profile"
              className={`flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800/90 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">{user?.name || 'Owner'}</p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate font-medium">Administrator</p>
                </div>
              )}
            </Link>

            <button
              onClick={logout}
              title={sidebarCollapsed ? "Sign Out" : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200 dark:border-rose-900/40 transition-all cursor-pointer shadow-xs ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex md:hidden text-left"
            >
              <div 
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.aside 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="relative flex flex-col w-80 bg-white dark:bg-[#121826] border-r border-slate-200 dark:border-zinc-800 p-5 justify-between h-full z-10 shadow-2xl overflow-y-auto"
              >
                <div className="space-y-5">
                  {/* Brand Header */}
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-black text-base text-slate-900 dark:text-white block leading-tight">{hostelName}</span>
                        <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-extrabold uppercase tracking-wider block">Mobile App View</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* USER PROFILE SECTION IN MOBILE DRAWER */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Manager'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">{user?.email || 'manager@srisaisiri.com'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-zinc-800">
                      <Link
                        href="/owner/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-1.5"
                      >
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        href="/owner/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-1.5"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>Settings</span>
                      </Link>
                    </div>
                  </div>

                  {/* Theme Switcher in Mobile Drawer */}
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80">
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Theme Mode</span>
                    <ThemeToggleSwitch />
                  </div>

                  {/* Navigation List */}
                  <nav className="space-y-1 pt-1">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block px-1 mb-1">Modules Navigation</span>
                    {menuItems.map((item, idx) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={idx}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                            active 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {item.icon}
                          <span className="flex-1">{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out Account</span>
                  </button>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WORKSPACE CONTENT */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen md:max-h-screen md:overflow-y-auto overflow-x-hidden">
          
          {/* STICKY TOP HEADER TOOLBAR */}
          <header className="sticky top-2 sm:top-4 z-40 bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-[#DDD8CE] dark:border-[#293832] shadow-md rounded-[28px] p-2.5 sm:p-4 mb-6 flex items-center justify-between gap-2 sm:gap-4 backdrop-blur-2xl w-full">
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl bg-indigo-600 text-white shadow-sm flex items-center justify-center cursor-pointer shrink-0"
                title="All Sections Menu"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>

              <div className="text-left min-w-0">
                <h1 className="text-xs sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1 min-w-0">
                  <span className="truncate max-w-[110px] xs:max-w-[180px] sm:max-w-none">Hi, {user?.name?.split(' ')[0] || 'Alok'}</span>
                  <span className="text-sm sm:text-base shrink-0">👋</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium hidden sm:block">
                  Here's what's happening in your hostel today.
                </p>
              </div>
            </div>

            {/* COMMAND PALETTE SEARCH BAR */}
            <div className="hidden md:flex items-center mx-3 flex-1 max-w-xs sm:max-w-md">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 text-xs font-medium transition-all cursor-pointer group shrink-0 shadow-xs"
              >
                <div className="flex items-center gap-2.5 truncate whitespace-nowrap pr-2">
                  <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                  <span className="truncate whitespace-nowrap">Search tenants, rooms, payments...</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-md border border-slate-200 dark:border-zinc-700 shrink-0">
                  ⌘ K
                </kbd>
              </button>
            </div>

            {/* ACTIONS, NOTIFICATION BELL, THEME TOGGLE, & AVATAR */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Notification Button with Badge */}
              <div className="relative">
                <button
                  onClick={() => setShowNotif(!showNotif)}
                  className="relative p-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center border-2 border-white dark:border-zinc-900 animate-pulse">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotif && (
                    <>
                      {/* Transparent click-away backdrop */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowNotif(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="fixed left-3 right-3 sm:left-auto sm:right-0 mt-3 sm:w-96 max-w-sm sm:max-w-none bg-white/95 dark:bg-[#121826]/95 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl z-50 p-4 space-y-3 text-left backdrop-blur-2xl"
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Notifications</span>
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
                            <p className="text-xs text-slate-400 italic text-center py-6">No notifications found.</p>
                          ) : (
                            notifications.map((notif) => (
                              <div 
                                key={notif.id}
                                className={`p-3 rounded-2xl border transition-all space-y-1 relative group ${
                                  notif.read
                                    ? 'bg-slate-50/50 dark:bg-zinc-900/50 border-slate-100 dark:border-zinc-800/80 opacity-70'
                                    : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-800/50 shadow-xs'
                                }`}
                              >
                                <div className="flex justify-between items-center text-[10px] font-black">
                                  <span className="text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{notif.tag}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">{notif.time}</span>
                                    {!notif.read && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkNotifRead(notif.id, false);
                                        }}
                                        className="text-[9px] text-indigo-500 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
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
                                  className="font-bold text-xs text-slate-900 dark:text-white hover:text-indigo-600 cursor-pointer"
                                >
                                  {notif.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">{notif.desc}</p>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                          <button
                            onClick={() => handleMarkNotifRead(undefined, true)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 cursor-pointer transition-colors"
                          >
                            Mark All as Read
                          </button>
                          <button
                            onClick={() => setShowNotif(false)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Done
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Appearance & Accent Color Swatches Button */}
              <button
                onClick={() => setShowAppearanceModal(true)}
                className="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Appearance & Theme Colors"
              >
                <Palette className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-bold hidden sm:inline-block">Appearance</span>
              </button>

              {/* Animated Sun/Moon Pill Theme Switcher */}
              <ThemeToggleSwitch />

              {/* User Profile Avatar Trigger */}
              <button
                onClick={() => router.push('/owner/profile')}
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-md shrink-0 cursor-pointer transition-transform hover:scale-105"
                title="My Profile"
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </button>
            </div>

          </header>

          <main className="flex-1 pb-20 md:pb-6">
            {children}
          </main>

          {/* 📱 COMPACT 4-ITEM MOBILE BOTTOM NAVIGATION BAR */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 backdrop-blur-2xl border-t border-[#DDD8CE] dark:border-[#293832] flex items-center justify-around z-40 px-2 shadow-lg">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all cursor-pointer ${
                mobileMenuOpen ? 'text-indigo-600 dark:text-cyan-400 font-black scale-105' : 'text-[#68736E] dark:text-[#9BAAA4]'
              }`}
              title="Toggle Side Navigation Bar"
            >
              <Menu className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
              <span>Nav Menu</span>
            </button>
            <Link
              href="/owner/buildings"
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                pathname === '/owner/buildings' ? 'text-indigo-600 dark:text-cyan-400 font-black scale-105' : 'text-[#68736E] dark:text-[#9BAAA4]'
              }`}
            >
              <Building className="w-5 h-5" />
              <span>Rooms</span>
            </Link>
            <Link
              href="/owner/tenants"
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                pathname === '/owner/tenants' ? 'text-indigo-600 dark:text-cyan-400 font-black scale-105' : 'text-[#68736E] dark:text-[#9BAAA4]'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Tenants</span>
            </Link>
            <Link
              href="/owner/profile"
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                pathname === '/owner/profile' ? 'text-indigo-600 dark:text-cyan-400 font-black scale-105' : 'text-[#68736E] dark:text-[#9BAAA4]'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
          </nav>
        </div>

        {/* REUSABLE FLOATING RADIAL BUBBLE ACTION MENU SYSTEM */}
        <div className="fixed bottom-24 sm:bottom-28 right-6 z-50 pointer-events-auto">
          <AnimatePresence>
            {bubbleActionsOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                className="absolute bottom-16 right-0 space-y-2.5 mb-2 flex flex-col items-end min-w-[200px]"
              >
                <motion.button
                  whileHover={{ scale: 1.05, x: -4 }}
                  onClick={() => { setBubbleActionsOpen(false); router.push('/owner/tenants'); }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-[#121826] border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-bold shadow-2xl backdrop-blur-xl cursor-pointer"
                >
                  <span>Add Tenant</span>
                  <div className="w-7 h-7 rounded-full bg-purple-500/15 text-purple-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, x: -4 }}
                  onClick={() => { setBubbleActionsOpen(false); router.push('/owner/buildings'); }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-[#121826] border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-bold shadow-2xl backdrop-blur-xl cursor-pointer"
                >
                  <span>Add Room</span>
                  <div className="w-7 h-7 rounded-full bg-blue-500/15 text-blue-600 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, x: -4 }}
                  onClick={() => { setBubbleActionsOpen(false); router.push('/owner/rent'); }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-[#121826] border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-bold shadow-2xl backdrop-blur-xl cursor-pointer"
                >
                  <span>Record Payment</span>
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, x: -4 }}
                  onClick={() => { setBubbleActionsOpen(false); router.push('/owner/complaints'); }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-[#121826] border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-bold shadow-2xl backdrop-blur-xl cursor-pointer"
                >
                  <span>New Complaint</span>
                  <div className="w-7 h-7 rounded-full bg-orange-500/15 text-orange-600 flex items-center justify-center">
                    <Wrench className="w-4 h-4" />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, x: -4 }}
                  onClick={() => { setBubbleActionsOpen(false); router.push('/owner/notices'); }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-[#121826] border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-bold shadow-2xl backdrop-blur-xl cursor-pointer"
                >
                  <span>Send Notice</span>
                  <div className="w-7 h-7 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setBubbleActionsOpen(!bubbleActionsOpen)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-2xl border-2 border-white/40 dark:border-zinc-700/60 cursor-pointer"
          >
            <motion.span animate={{ rotate: bubbleActionsOpen ? 45 : 0 }}>
              +
            </motion.span>
          </motion.button>
        </div>

        <GlobalSearchModal 
          isOpen={searchOpen} 
          onClose={() => setSearchOpen(false)} 
        />

        {/* 🎨 OWNER PORTAL APPEARANCE & ACCENT SWATCHES MODAL */}
        {showAppearanceModal && (
          <NeonModal
            isOpen={true}
            onClose={() => setShowAppearanceModal(false)}
            title="Appearance & Theme Customization"
            subtitle="Personalize theme mode and live accent colors for your portal."
            size="md"
            accentColor="teal"
          >
            <TenantAppearanceSettings />
          </NeonModal>
        )}

        </div>
      </AccentProvider>
    </ToastProvider>
  );
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <TenantAppearanceProvider>
      <OwnerLayoutContent>{children}</OwnerLayoutContent>
    </TenantAppearanceProvider>
  );
}
