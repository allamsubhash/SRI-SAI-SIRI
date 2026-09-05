'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  Megaphone, 
  Clock, 
  Loader, 
  Bed, 
  ShieldCheck, 
  Coffee,
  Calendar,
  ChevronRight,
  Plus,
  Receipt,
  Wrench,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sparkles,
  Zap,
  Award
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { formatINR, formatDate } from '@/utils/formatters';

export default function TenantDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pop-up Modals State
  const [showPayModal, setShowPayModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showComplaintsModal, setShowComplaintsModal] = useState(false);
  const [showVisitorsModal, setShowVisitorsModal] = useState(false);

  // Selected Notice
  const [selectedNotice, setSelectedNotice] = useState<any>(null);

  // Form State
  const [newComplaintTitle, setNewComplaintTitle] = useState('');
  const [newComplaintCategory, setNewComplaintCategory] = useState('WIFI');
  const [newComplaintDesc, setNewComplaintDesc] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const [newVisitorName, setNewVisitorName] = useState('');
  const [newVisitorPhone, setNewVisitorPhone] = useState('');
  const [newVisitorCheckIn, setNewVisitorCheckIn] = useState(new Date().toISOString().split('T')[0] + 'T12:00');
  const [submittingVisitor, setSubmittingVisitor] = useState(false);

  const [paying, setPaying] = useState(false);

  const fetchDashboardData = () => {
    Promise.all([
      fetch('/api/dashboard').then(res => res.json()),
      fetch('/api/rent').then(res => res.json()),
      fetch('/api/complaints').then(res => res.json()),
      fetch('/api/visitors').then(res => res.json())
    ])
      .then(([dashData, rentData, compData, visData]) => {
        setData(dashData);

        const rList = Array.isArray(rentData) ? rentData : [];
        const userInvoices = rList.filter((inv: any) => 
          (inv.tenantName && user?.name && inv.tenantName.toLowerCase().trim().includes(user.name.toLowerCase().trim())) ||
          (inv.tenantId && user?.id && inv.tenantId === user.id)
        );
        setInvoices(userInvoices.length > 0 ? userInvoices : rList);

        const cList = Array.isArray(compData) ? compData : [];
        const userComplaints = cList.filter((c: any) => 
          (c.tenantName && user?.name && c.tenantName.toLowerCase().trim().includes(user.name.toLowerCase().trim())) ||
          (c.tenantId && user?.id && c.tenantId === user.id)
        );
        setComplaints(userComplaints.length > 0 ? userComplaints : cList);

        const vList = Array.isArray(visData) ? visData : [];
        const userVisitors = vList.filter((v: any) => 
          (v.tenantName && user?.name && v.tenantName.toLowerCase().trim().includes(user.name.toLowerCase().trim())) ||
          (v.personVisiting && user?.name && v.personVisiting.toLowerCase().trim().includes(user.name.toLowerCase().trim()))
        );
        setVisitors(userVisitors.length > 0 ? userVisitors : vList);

        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const currentTenant = useMemo(() => {
    if (!data?.tenants) return null;
    const found = data.tenants.find((t: any) => 
      (user?.id && (t.userId === user.id || t.id === user.id)) ||
      (user?.email && t.email?.toLowerCase() === user.email.toLowerCase()) || 
      (user?.name && t.name?.toLowerCase() === user.name.toLowerCase())
    );
    if (found) {
      console.log("TENANT RAW DATA:", found);
      console.log("TENANT PHONE:", found.phone);
      console.log("TENANT MOVE-IN:", found.moveInDate);
      console.log("TENANT ID:", found.id);
    }
    return found;
  }, [data, user]);

  const normalizeRoom = (r?: string) => (r || '').replace(/^room\s*/i, '').trim().toLowerCase();

  const userRoom = currentTenant?.roomNumber || 'A-101';
  const userBed = currentTenant?.bedNumber || 'A';
  const moveInDate = currentTenant?.moveInDate ? formatDate(currentTenant.moveInDate) : '15 Jan 2026';
  const rentAmount = currentTenant?.rentAmount ? currentTenant.rentAmount : (invoices[0]?.amount || 6500);

  const roommates = useMemo(() => {
    if (!data?.tenants) return [];
    const targetRoomClean = normalizeRoom(userRoom);

    return data.tenants.filter((t: any) => {
      const isSameRoom = normalizeRoom(t.roomNumber) === targetRoomClean && targetRoomClean.length > 0;
      const isSelf = 
        (currentTenant && (t.id === currentTenant.id || t.userId === currentTenant.userId)) ||
        (user?.email && t.email?.toLowerCase() === user.email.toLowerCase()) ||
        (user?.name && t.name?.toLowerCase() === user.name.toLowerCase());
      const isActive = t.status === 'ACTIVE' || !t.status;
      return isActive && isSameRoom && !isSelf;
    });
  }, [data, currentTenant, userRoom, user]);

  const pendingInvoice = invoices.find(i => i.status === 'PENDING' || i.status === 'OVERDUE');
  const latestPaidInvoice = invoices.find(i => i.status === 'PAID');
  const outstandingBalance = invoices.reduce((sum, inv) => sum + (inv.status !== 'PAID' ? (inv.amount - (inv.paidAmount || 0)) : 0), 0);

  const activeComplaint = complaints.find(c => c.status !== 'RESOLVED' && c.status !== 'Resolved');
  const upcomingVisitor = visitors.find(v => v.status === 'APPROVED' || v.approvalStatus === 'APPROVED' || v.status === 'PENDING');

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingInvoice) return;
    setPaying(true);
    try {
      const res = await fetch('/api/rent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: pendingInvoice.id,
          amountPaid: pendingInvoice.amount,
          method: 'ONLINE',
          isTenantPayment: true
        })
      });
      if (res.ok) {
        setShowPayModal(false);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaying(false);
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaintTitle || !newComplaintDesc || submittingComplaint) return;

    setSubmittingComplaint(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: user?.id || 'tenant-id-fallback',
          title: newComplaintTitle,
          description: newComplaintDesc,
          category: newComplaintCategory
        })
      });
      if (res.ok) {
        setNewComplaintTitle('');
        setNewComplaintDesc('');
        setNewComplaintCategory('WIFI');
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitorName || !newVisitorPhone || submittingVisitor) return;

    setSubmittingVisitor(true);
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: user?.id || 'tenant-id-fallback',
          name: newVisitorName,
          phone: newVisitorPhone,
          personVisiting: user?.name || 'Resident',
          checkIn: newVisitorCheckIn
        })
      });
      if (res.ok) {
        setNewVisitorName('');
        setNewVisitorPhone('');
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingVisitor(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-48 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[32px] border border-white/80 dark:border-[#293832]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
          <div className="h-32 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
          <div className="h-32 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
          <div className="h-32 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
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
      
      {/* 👑 1. RESIDENT IDENTITY HERO CARD */}
      <motion.div 
        whileHover={{ y: -3, scale: 1.005 }}
        onClick={() => setShowRoomModal(true)}
        className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 text-[#1C2522] dark:text-[#F2F5F2] border border-white/80 dark:border-[#293832] shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer hover:tenant-border-accent transition-all group"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />
              RESIDENT DASHBOARD
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-black tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
              ACTIVE LEASE
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors flex items-center gap-3">
            <span>{user?.name || 'Resident Tenant'}</span>
            <span className="text-xl">👋</span>
          </h1>
          
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 tenant-text-accent" />
            <span>Resident since <strong className="text-[#1C2522] dark:text-[#F2F5F2] font-bold">{moveInDate}</strong></span>
          </p>
        </div>

        {/* Room & Bed Spot Pill Matrix */}
        <div className="flex items-center gap-3 z-10 w-full md:w-auto">
          <div className="flex-1 md:flex-none p-4.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] text-center shadow-md">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block mb-0.5">ROOM</span>
            <span className="text-2xl font-black tenant-text-accent">{userRoom}</span>
          </div>
          <div className="flex-1 md:flex-none p-4.5 rounded-2xl tenant-bg-soft border tenant-border-accent text-center shadow-md">
            <span className="text-[10px] font-black tenant-text-accent uppercase tracking-wider block mb-0.5">BED SPOT</span>
            <span className="text-2xl font-black tenant-text-accent">Bed {userBed.split('-').pop()}</span>
          </div>
        </div>
      </motion.div>

      {/* ⚠️ OUTSTANDING RENT PAYMENT DUE ALERT BANNER */}
      {(pendingInvoice || outstandingBalance > 0) && (
        <motion.div 
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-6 rounded-[32px] bg-rose-500/10 dark:bg-rose-950/40 border-2 border-rose-500/40 text-left shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>OUTSTANDING RENT PAYMENT DUE</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Rent Due: {formatINR(pendingInvoice?.amount || outstandingBalance || rentAmount)}
            </h3>
            <p className="text-xs text-rose-600/90 dark:text-rose-300 font-bold">
              Your monthly hostel rent tariff is pending. Please complete your payment to keep your account in good standing.
            </p>
          </div>

          <button
            onClick={() => { window.location.href = '/tenant/billing'; }}
            className="px-7 py-3.5 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-xl hover:bg-rose-700 hover:scale-105 transition-all cursor-pointer shrink-0"
          >
            💳 PAY RENT NOW
          </button>
        </motion.div>
      )}

      {/* 📊 2. SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => setShowRentModal(true)}
          className="p-5 rounded-[28px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl hover:tenant-border-accent transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest">MONTHLY TARIFF</span>
            <div className="w-9 h-9 rounded-2xl tenant-bg-soft tenant-text-accent flex items-center justify-center font-black shadow-sm">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
              {formatINR(rentAmount)}
            </div>
            <p className="text-[11px] font-extrabold tenant-text-accent mt-1">Monthly Room Tariff</p>
          </div>
          <div className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] h-1.5 rounded-full overflow-hidden">
            <div className="tenant-bg-accent-raw h-full rounded-full w-full" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => setShowRoomModal(true)}
          className="p-5 rounded-[28px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl hover:tenant-border-accent transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest">ASSIGNED ROOM</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-black shadow-sm">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2]">
              {userRoom}
            </div>
            <p className="text-[11px] font-extrabold text-purple-400 mt-1">Spot: Bed {userBed.split('-').pop()}</p>
          </div>
          <div className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full w-full" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => setShowRentModal(true)}
          className="p-5 rounded-[28px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl hover:tenant-border-accent transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest">ACCOUNT STATUS</span>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black shadow-sm ${
              pendingInvoice ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black ${pendingInvoice ? 'text-amber-400' : 'text-emerald-400'}`}>
              {pendingInvoice ? (pendingInvoice.status === 'OVERDUE' ? 'OVERDUE' : 'DUE') : 'ALL CLEAR'}
            </div>
            <p className="text-[11px] font-extrabold text-slate-400 mt-1">
              {pendingInvoice ? `Due: ${formatDate(pendingInvoice.dueDate)}` : 'Good Standing'}
            </p>
          </div>
          <div className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${pendingInvoice ? 'bg-amber-500 w-3/4' : 'bg-emerald-500 w-full'}`} />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => setShowRoomModal(true)}
          className="p-5 rounded-[28px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl hover:tenant-border-accent transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest">ROOMMATES</span>
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-black shadow-sm">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2]">
              {roommates.length}
            </div>
            <p className="text-[11px] font-extrabold text-cyan-400 mt-1">Co-residents sharing room</p>
          </div>
          <div className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full w-2/3" />
          </div>
        </motion.div>
      </div>

      {/* 💳 3. PROMINENT RENT & PAYMENTS CARD */}
      <motion.div 
        whileHover={{ y: -2 }}
        onClick={() => setShowRentModal(true)}
        className="p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl hover:tenant-border-accent transition-all space-y-5 cursor-pointer group"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DDD8CE] dark:border-[#293832] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Rent & Lease Payments
              </h3>
              <span className={`text-[10px] font-black px-3 py-0.5 rounded-full border ${
                pendingInvoice 
                  ? pendingInvoice.status === 'OVERDUE' ? 'bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676] border-rose-200 dark:border-[#F27676]/30' : 'bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D] border-amber-200 dark:border-[#F2C15D]/30'
                  : 'tenant-bg-soft tenant-text-accent tenant-border-accent'
              }`}>
                {pendingInvoice ? (pendingInvoice.status === 'OVERDUE' ? 'OVERDUE' : 'PAYMENT DUE') : 'PAID ✓'}
              </span>
            </div>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-0.5">Real-time invoice settlement via online banking or UPI</p>
          </div>

          {pendingInvoice && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPayModal(true);
              }}
              className="py-3.5 px-7 rounded-2xl tenant-bg-accent font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-transform cursor-pointer shrink-0"
            >
              PAY NOW →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="p-4.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">CURRENT OUTSTANDING DUE</span>
            <div className="text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2]">{formatINR(outstandingBalance)}</div>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
              {pendingInvoice ? `Due date: ${formatDate(pendingInvoice.dueDate)}` : 'All invoices cleared'}
            </p>
          </div>

          <div className="p-4.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">LAST SETTLED PAYMENT</span>
            <div className="text-3xl font-black tenant-text-accent">{latestPaidInvoice ? formatINR(latestPaidInvoice.paidAmount || latestPaidInvoice.amount) : '₹0'}</div>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
              {latestPaidInvoice ? `Paid on ${formatDate(latestPaidInvoice.dateCreated)} ✓` : 'No prior payment logs'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 👥 4. MY STAY & ROOMMATES SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* My Stay Details */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => setShowRoomModal(true)}
          className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl hover:tenant-border-accent transition-all space-y-4 cursor-pointer group"
        >
          <div className="pb-3 border-b border-[#DDD8CE] dark:border-[#293832] flex justify-between items-center">
            <div>
              <h3 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2] flex items-center gap-2 group-hover:tenant-text-accent transition-colors">
                <Home className="w-4 h-4 tenant-text-accent" />
                My Room & Stay
              </h3>
              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-0.5">Lease specifications</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#929B96] group-hover:translate-x-0.5 transition-transform" />
          </div>

          <div className="space-y-3 text-xs font-bold">
            <div className="flex justify-between p-3.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832]">
              <span className="text-[#68736E] dark:text-[#9BAAA4]">Assigned Room</span>
              <span className="text-[#1C2522] dark:text-[#F2F5F2]">{userRoom}</span>
            </div>
            <div className="flex justify-between p-3.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832]">
              <span className="text-[#68736E] dark:text-[#9BAAA4]">Assigned Bed</span>
              <span className="tenant-text-accent font-black">Bed {userBed.split('-').pop()}</span>
            </div>
            <div className="flex justify-between p-3.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832]">
              <span className="text-[#68736E] dark:text-[#9BAAA4]">Move-in Date</span>
              <span className="text-[#1C2522] dark:text-[#F2F5F2]">{moveInDate}</span>
            </div>
          </div>
        </motion.div>

        {/* Roommates Directory */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => setShowRoomModal(true)}
          className="lg:col-span-2 p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl hover:tenant-border-accent transition-all space-y-4 cursor-pointer group"
        >
          <div className="flex justify-between items-center pb-3 border-b border-[#DDD8CE] dark:border-[#293832]">
            <div>
              <h3 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2] flex items-center gap-2 group-hover:tenant-text-accent transition-colors">
                <Users className="w-4 h-4 tenant-text-accent" />
                Roommates ({roommates.length})
              </h3>
              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-0.5">Co-residents sharing Room {userRoom}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#929B96] group-hover:translate-x-0.5 transition-transform" />
          </div>

          <div className="space-y-3">
            {roommates.length === 0 ? (
              <div className="p-8 text-center bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 rounded-2xl space-y-1 border border-[#DDD8CE] dark:border-[#293832]">
                <Users className="w-8 h-8 text-[#929B96] mx-auto opacity-50" />
                <p className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2]">No roommates assigned</p>
                <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4]">Single occupancy or no active co-residents registered in Room {userRoom}.</p>
              </div>
            ) : (
              roommates.map((rm: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] text-left shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl tenant-bg-accent font-black flex items-center justify-center text-sm shadow-md shrink-0">
                      {rm.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1C2522] dark:text-[#F2F5F2] text-sm">{rm.name}</h4>
                      <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">{rm.occupation || 'Resident'} • Bed {rm.bedNumber || 'Assigned'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-3.5 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent font-black uppercase tracking-wider">
                    Active Roommate
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

      </div>

      {/* 🛠️ COMPLAINTS & 🛂 VISITORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Complaints Ticket Status */}
        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => setShowComplaintsModal(true)}
          className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl hover:tenant-border-accent transition-all space-y-4 cursor-pointer group"
        >
          <div className="flex justify-between items-center pb-3 border-b border-[#DDD8CE] dark:border-[#293832]">
            <div>
              <h3 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2] flex items-center gap-2 group-hover:tenant-text-accent transition-colors">
                <Wrench className="w-4 h-4 text-[#B7791F] dark:text-[#F2C15D]" />
                My Complaints
              </h3>
              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-0.5">Service desk tickets</p>
            </div>
            <span className="text-[11px] tenant-text-accent font-extrabold">
              Open Ticket +
            </span>
          </div>

          <div>
            {activeComplaint ? (
              <div className="p-4 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-2.5 text-left shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2]">{activeComplaint.title}</span>
                  <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D] border border-amber-200 dark:border-[#F2C15D]/30">
                    {activeComplaint.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4] line-clamp-2">{activeComplaint.description}</p>
                <div className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] pt-2 border-t border-[#DDD8CE] dark:border-[#293832] flex justify-between">
                  <span>Assigned: Maintenance Desk</span>
                  <span>{formatDate(activeComplaint.dateCreated)}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 rounded-2xl space-y-2 border border-[#DDD8CE] dark:border-[#293832]">
                <CheckCircle2 className="w-6 h-6 tenant-text-accent mx-auto" />
                <p className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2]">Everything looks good!</p>
                <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">No active support tickets pending.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Visitors Register Card */}
        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => setShowVisitorsModal(true)}
          className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl hover:tenant-border-accent transition-all space-y-4 cursor-pointer group"
        >
          <div className="flex justify-between items-center pb-3 border-b border-[#DDD8CE] dark:border-[#293832]">
            <div>
              <h3 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2] flex items-center gap-2 group-hover:tenant-text-accent transition-colors">
                <UserCheck className="w-4 h-4 tenant-text-accent" />
                Visitors
              </h3>
              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-0.5">Pre-approved guests</p>
            </div>
            <span className="text-[11px] tenant-text-accent font-extrabold">
              Register +
            </span>
          </div>

          <div>
            {upcomingVisitor ? (
              <div className="p-4 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-2 text-left shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2]">{upcomingVisitor.name}</span>
                  <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
                    APPROVED
                  </span>
                </div>
                <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4]">Scheduled: {upcomingVisitor.checkIn || 'Today'}</p>
              </div>
            ) : (
              <div className="p-6 text-center bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 rounded-2xl space-y-2 border border-[#DDD8CE] dark:border-[#293832]">
                <UserCheck className="w-6 h-6 text-[#929B96] mx-auto opacity-50" />
                <p className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2]">No upcoming visitors</p>
                <button
                  className="px-4 py-1.5 rounded-xl tenant-bg-soft tenant-text-accent text-[10px] font-black border tenant-border-accent cursor-pointer"
                >
                  Register Guest
                </button>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* ========================================================
          📌 ALL INTERACTIVE DASHBOARD POP-UP MODALS 
         ======================================================== */}

      {/* 1. RENT & BILLING POPUP MODAL */}
      {showRentModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowRentModal(false)}
          title="Rent & Billing Ledger"
          subtitle="View active rent invoices and payment history."
          size="md"
          accentColor="emerald"
        >
          <div className="space-y-4 text-left font-sans">
            <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4]">Total Outstanding Dues</span>
                <span className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2]">{formatINR(outstandingBalance)}</span>
              </div>
              {pendingInvoice && (
                <div className="flex justify-between items-center pt-2 border-t border-[#DDD8CE] dark:border-[#293832]">
                  <span className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4]">Due Date: {formatDate(pendingInvoice.dueDate)}</span>
                  <button
                    onClick={() => {
                      setShowRentModal(false);
                      setShowPayModal(true);
                    }}
                    className="py-2 px-5 rounded-xl tenant-bg-accent font-black text-xs shadow-md cursor-pointer"
                  >
                    Pay Invoice Now →
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2] block">Invoice Records</span>
              {invoices.length === 0 ? (
                <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] italic py-4 text-center">No invoices logged.</p>
              ) : (
                invoices.map((inv) => (
                  <div key={inv.id} className="p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] flex justify-between items-center text-xs font-bold">
                    <div>
                      <p className="text-[#1C2522] dark:text-[#F2F5F2]">Invoice #{inv.number || inv.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">Due: {formatDate(inv.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#1C2522] dark:text-[#F2F5F2] font-black">{formatINR(inv.amount)}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] ${
                        inv.status === 'PAID' ? 'tenant-bg-soft tenant-text-accent' : 'bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D]'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowRentModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs cursor-pointer border border-[#DDD8CE] dark:border-[#293832]"
              >
                Close
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 2. ROOM & STAY DETAILS POPUP MODAL */}
      {showRoomModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowRoomModal(false)}
          title={`Room ${userRoom} Lease Details`}
          subtitle="Specifications of your room lease allocation."
          size="md"
          accentColor="emerald"
        >
          <div className="space-y-4 text-left font-sans">
            <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Assigned Room Number</span>
                <span className="text-[#1C2522] dark:text-[#F2F5F2]">{userRoom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Assigned Bed Spot</span>
                <span className="tenant-text-accent">Bed {userBed.split('-').pop()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Move-in Date</span>
                <span className="text-[#1C2522] dark:text-[#F2F5F2]">{moveInDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Hostel Trade Name</span>
                <span className="tenant-text-accent">{data?.settings?.hostelName || 'Sri Sai Siri Boys Hostel'}</span>
              </div>
              <div className="flex justify-between border-t border-[#DDD8CE] dark:border-[#293832] pt-2">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Monthly Tariff</span>
                <span className="tenant-text-accent font-black text-sm">{formatINR(rentAmount)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2] block">Roommates Sharing Room {userRoom}</span>
              {roommates.length === 0 ? (
                <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] italic p-4 bg-[#F1EEE7] dark:bg-[#1A2621] rounded-2xl text-center">Single occupancy room or no co-residents registered.</p>
              ) : (
                roommates.map((rm: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl tenant-bg-accent font-black flex items-center justify-center text-xs">
                        {rm.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[#1C2522] dark:text-[#F2F5F2]">{rm.name}</p>
                        <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">{rm.occupation || 'Resident'} • Bed {rm.bedNumber || 'Assigned'}</p>
                      </div>
                    </div>
                    <span className="text-[9px] px-2.5 py-0.5 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">Active</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowRoomModal(false)}
                className="py-2.5 px-5 rounded-2xl tenant-bg-accent text-xs font-black cursor-pointer shadow-md"
              >
                Close Details
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 3. WARDEN ANNOUNCEMENTS POPUP MODAL */}
      {showAnnouncementsModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowAnnouncementsModal(false)}
          title="Warden Announcements & Notices"
          subtitle="Recent hostel updates broadcasted by warden management."
          size="md"
          accentColor="emerald"
        >
          <div className="space-y-3 text-left font-sans max-h-[60vh] overflow-y-auto pr-1">
            {(!data?.notices || data.notices.length === 0) ? (
              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] italic text-center py-6">No announcements broadcasted.</p>
            ) : (
              data.notices.map((note: any) => (
                <div 
                  key={note.id} 
                  className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2 text-left"
                >
                  <div className="flex justify-between items-center text-[10px] font-black">
                    <span className={note.isEmergency ? 'text-[#C94B4B] dark:text-[#F27676]' : 'tenant-text-accent'}>
                      {note.isEmergency ? 'EMERGENCY' : `TARGET: ${note.target || 'ALL'}`}
                    </span>
                    <span className="text-[#68736E] dark:text-[#9BAAA4]">{formatDate(note.createdAt)}</span>
                  </div>
                  <h4 className="font-bold text-xs text-[#1C2522] dark:text-[#F2F5F2]">{note.title}</h4>
                  <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4] leading-relaxed">{note.content}</p>
                </div>
              ))
            )}
          </div>
          <div className="pt-3 border-t border-[#DDD8CE] dark:border-[#293832] flex justify-end">
            <button
              onClick={() => setShowAnnouncementsModal(false)}
              className="py-2.5 px-5 rounded-2xl tenant-bg-accent text-xs font-black cursor-pointer shadow-md"
            >
              Close Announcements
            </button>
          </div>
        </NeonModal>
      )}

      {/* 4. COMPLAINTS TICKETS POPUP MODAL */}
      {showComplaintsModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowComplaintsModal(false)}
          title="My Maintenance Complaints"
          subtitle="File or track support tickets for room repairs."
          size="md"
          accentColor="emerald"
        >
          <div className="space-y-4 text-left font-sans">
            <form onSubmit={handleCreateComplaint} className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-3">
              <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2] block">File New Support Ticket</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newComplaintCategory}
                  onChange={(e) => setNewComplaintCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                >
                  <option value="WIFI">Wi-Fi & Internet</option>
                  <option value="PLUMBING">Plumbing / Water Tap</option>
                  <option value="ELECTRICAL">AC & Electrical Repairs</option>
                  <option value="CLEANING">Housekeeping & Cleaning</option>
                  <option value="FOOD">Mess Dining & Food</option>
                  <option value="OTHER">Other Issue</option>
                </select>

                <input
                  type="text"
                  required
                  value={newComplaintTitle}
                  onChange={(e) => setNewComplaintTitle(e.target.value)}
                  placeholder="Summary Title (e.g. AC tap leaking)"
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                />
              </div>

              <textarea
                rows={2}
                required
                value={newComplaintDesc}
                onChange={(e) => setNewComplaintDesc(e.target.value)}
                placeholder="Details about the issue..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="py-2 px-5 rounded-xl tenant-bg-accent font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingComplaint ? 'Submitting...' : 'Submit Support Ticket ✓'}
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2] block">Logged Tickets ({complaints.length})</span>
              {complaints.length === 0 ? (
                <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] italic text-center py-4">No active complaint tickets.</p>
              ) : (
                complaints.map((c) => (
                  <div key={c.id} className="p-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] flex justify-between items-center text-xs font-bold">
                    <div>
                      <p className="text-[#1C2522] dark:text-[#F2F5F2]">{c.title}</p>
                      <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">{c.category} • {formatDate(c.dateCreated || c.createdAt)}</p>
                    </div>
                    <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D]">
                      {c.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowComplaintsModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs cursor-pointer border border-[#DDD8CE] dark:border-[#293832]"
              >
                Close
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 5. VISITORS GATE PASS POPUP MODAL */}
      {showVisitorsModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowVisitorsModal(false)}
          title="Visitor Pre-Approvals & Gate Passes"
          subtitle="Issue pre-approved entry passes for family & guests."
          size="md"
          accentColor="emerald"
        >
          <div className="space-y-4 text-left font-sans">
            <form onSubmit={handleCreateVisitor} className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-3">
              <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2] block">Pre-Register Guest</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={newVisitorName}
                  onChange={(e) => setNewVisitorName(e.target.value)}
                  placeholder="Guest Full Name"
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                />

                <input
                  type="text"
                  required
                  value={newVisitorPhone}
                  onChange={(e) => setNewVisitorPhone(e.target.value)}
                  placeholder="Guest Contact Phone"
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Arrival Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newVisitorCheckIn}
                  onChange={(e) => setNewVisitorCheckIn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingVisitor}
                  className="py-2 px-5 rounded-xl tenant-bg-accent font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingVisitor ? 'Registering...' : 'Issue Gate Pass ✓'}
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2] block">Visitor Gate Passes ({visitors.length})</span>
              {visitors.length === 0 ? (
                <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] italic text-center py-4">No visitor gate passes issued.</p>
              ) : (
                visitors.map((v) => (
                  <div key={v.id} className="p-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] flex justify-between items-center text-xs font-bold">
                    <div>
                      <p className="text-[#1C2522] dark:text-[#F2F5F2]">{v.name} (📞 {v.phone})</p>
                      <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">Arrival: {v.checkIn || 'Today'}</p>
                    </div>
                    <span className="text-[9px] px-2.5 py-0.5 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
                      {v.status || v.approvalStatus || 'APPROVED'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowVisitorsModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs cursor-pointer border border-[#DDD8CE] dark:border-[#293832]"
              >
                Close
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 6. PAY RENT NOW POPUP MODAL */}
      {showPayModal && pendingInvoice && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowPayModal(false)}
          title={`Settle Rent Invoice #${pendingInvoice.number || pendingInvoice.id.slice(0, 8)}`}
          subtitle="Instant online rent payment gateway."
          size="md"
          accentColor="emerald"
        >
          <form onSubmit={handlePayNow} className="space-y-4 text-left font-sans">
            <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Total Outstanding Dues</span>
                <span className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2]">{formatINR(pendingInvoice.amount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-t border-[#DDD8CE] dark:border-[#293832] pt-2">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Due Date</span>
                <span className="text-[#1C2522] dark:text-[#F2F5F2]">{formatDate(pendingInvoice.dueDate)}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">SECURE ONLINE UPI / BANKING</span>
              <p className="text-xs text-emerald-300 font-medium">Your payment is processed securely with immediate digital receipt generation.</p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs cursor-pointer border border-[#DDD8CE] dark:border-[#293832]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paying}
                className="py-2.5 px-6 rounded-2xl tenant-bg-accent font-black text-xs cursor-pointer shadow-lg hover:scale-105 transition-all"
              >
                {paying ? 'Processing...' : 'CONFIRM & PAY NOW →'}
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* 7. NOTICE DETAIL POPUP MODAL */}
      {selectedNotice && (
        <NeonModal
          isOpen={true}
          onClose={() => setSelectedNotice(null)}
          title={selectedNotice.title}
          subtitle={`Published on ${formatDate(selectedNotice.createdAt)}`}
          size="md"
          accentColor="emerald"
        >
          <div className="space-y-4 text-left font-sans">
            <div>
              <span className={`text-[10px] px-3.5 py-1 rounded-full font-black uppercase tracking-wider ${
                selectedNotice.isEmergency ? 'bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676]' : 'tenant-bg-soft tenant-text-accent border tenant-border-accent'
              }`}>
                {selectedNotice.isEmergency ? 'EMERGENCY' : `Target: ${selectedNotice.target || 'All'}`}
              </span>
            </div>

            <div className="p-4.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832]">
              <p className="text-[#1C2522] dark:text-[#F2F5F2] text-xs leading-relaxed whitespace-pre-wrap font-medium">
                {selectedNotice.content}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedNotice(null)}
                className="py-2.5 px-6 rounded-2xl tenant-bg-accent font-black text-xs cursor-pointer shadow-md"
              >
                Close Notice
              </button>
            </div>
          </div>
        </NeonModal>
      )}

    </motion.div>
  );
}
