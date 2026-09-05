'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus, 
  FileText, 
  AlertOctagon, 
  Archive, 
  CheckCircle2, 
  Loader,
  Bed as BedIcon,
  Eye,
  Trash2,
  Phone,
  Mail,
  UserCheck,
  Edit2,
  X,
  Building as BuildingIcon,
  Calendar,
  DollarSign,
  ShieldAlert,
  ChevronRight,
  UserPlus,
  CreditCard,
  Wrench,
  Check,
  ArrowLeft
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { formatINR, formatDate } from '@/utils/formatters';

export default function TenantsManagement() {
  const { showToast } = useToast();
  const [tenants, setTenants] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED' | 'BLACKLISTED'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'OVERDUE'>('ALL');
  const [viewMode, setViewMode] = useState<'PEOPLE' | 'TABLE'>('TABLE');
  
  // Dedicated Resident Profile Page Navigation State
  const [activeResident, setActiveResident] = useState<any>(null);

  // Multi-step Registration Wizard State (5 Steps)
  const [showRegModal, setShowRegModal] = useState(false);
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [password, setPassword] = useState('');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split('T')[0]);

  // Allocation states
  const [selRoomId, setSelRoomId] = useState('');
  const [selBedNumber, setSelBedNumber] = useState('');
  const [selRoomRent, setSelRoomRent] = useState(8500);
  const [selRoomNumber, setSelRoomNumber] = useState('');

  // Edit Tenant Profile Multi-Tab Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTab, setEditTab] = useState<'PERSONAL' | 'LEASE' | 'ROOM' | 'ACCOUNT'>('PERSONAL');
  const [editTenant, setEditTenant] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editMoveInDate, setEditMoveInDate] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRoomId, setEditRoomId] = useState('');
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editBedNumber, setEditBedNumber] = useState('');
  const [editRoomRent, setEditRoomRent] = useState(8500);

  // Custom Modal Action Dialogs
  const [vacateDialogTenant, setVacateDialogTenant] = useState<any>(null);
  const [vacateReason, setVacateReason] = useState('');
  const [vacateDate, setVacateDate] = useState(new Date().toISOString().split('T')[0]);

  const [blacklistDialogTenant, setBlacklistDialogTenant] = useState<any>(null);
  const [blacklistReason, setBlacklistReason] = useState('');

  const [deleteConfirmTenant, setDeleteConfirmTenant] = useState<any>(null);
  const [successToast, setSuccessToast] = useState<{ title: string; subtitle?: string } | null>(null);

  const fetchInitialData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/tenants').then(res => res.json()),
      fetch('/api/buildings').then(res => res.json())
    ])
      .then(([tenantsData, buildingsData]) => {
        const tList = Array.isArray(tenantsData) ? tenantsData : [];
        setTenants(tList);
        setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
        if (tList.length > 0) {
          tList.forEach((tenant: any) => {
            console.log("OWNER TENANT RAW DATA:", tenant);
            console.log("OWNER PHONE:", tenant.phone);
            console.log("OWNER MOVE-IN:", tenant.moveInDate);
            console.log("OWNER TENANT ID:", tenant.id);
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch tenants error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Flat array of ONLY rooms with AVAILABLE beds across buildings (Phase 9)
  const allRoomsFlat = useMemo(() => {
    return buildings.flatMap(b => 
      b.floors?.flatMap((f: any) => 
        f.rooms?.filter((r: any) => r.beds?.some((bed: any) => bed.isAvailable)).map((r: any) => ({
          ...r,
          buildingName: b.name,
          floorNumber: f.number
        })) || []
      ) || []
    );
  }, [buildings]);

  const handleRoomSelection = (roomId: string) => {
    setSelRoomId(roomId);
    const r = allRoomsFlat.find(x => x.id === roomId);
    if (r) {
      setSelRoomNumber(r.number);
      setSelRoomRent(r.rent || 8500);
      const vacantBed = r.beds?.find((b: any) => b.isAvailable);
      if (vacantBed) {
        setSelBedNumber(vacantBed.number);
      } else {
        setSelBedNumber('');
      }
    } else {
      setSelRoomNumber('');
      setSelRoomRent(8500);
      setSelBedNumber('');
    }
  };

  const handleRegisterTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone || !selBedNumber) {
      alert('Please complete all personal details and assign a bed spot.');
      return;
    }

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, password, phone, gender, address: '', aadhaar: '',
          emergencyName: '', emergencyPhone: '', guardianName: '', guardianPhone: '',
          occupation: '', moveInDate, medicalNotes: '',
          roomNumber: selRoomNumber, bedNumber: selBedNumber, rentAmount: selRoomRent
        })
      });

      if (res.ok) {
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setShowRegModal(false);
        setRegStep(1);
        setSuccessToast({ title: 'Resident Registered!', subtitle: `${name} assigned to Bed ${selBedNumber} (Room ${selRoomNumber}).` });
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register tenant');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditModal = (t: any) => {
    setEditTenant(t);
    setEditName(t.name);
    setEditEmail(t.email);
    setEditPhone(t.phone);
    setEditGender(t.gender || 'Male');
    setEditMoveInDate(t.moveInDate || '');
    setEditPassword('');
    setEditRoomNumber(t.roomNumber || '');
    setEditBedNumber(t.bedNumber || '');
    setEditRoomRent(t.rentAmount || 8500);
    
    const matchedRoom = allRoomsFlat.find(r => r.number === t.roomNumber);
    setEditRoomId(matchedRoom ? matchedRoom.id : '');
    setEditTab('PERSONAL');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTenant) return;
    try {
      const res = await fetch('/api/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTenant.id,
          name: editName,
          email: editEmail,
          phone: editPhone,
          gender: editGender,
          moveInDate: editMoveInDate,
          password: editPassword.trim() || undefined,
          roomNumber: editRoomNumber,
          bedNumber: editBedNumber,
          rentAmount: editRoomRent
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        setActiveResident(null);
        setSuccessToast({ title: 'Profile Updated', subtitle: `${editName}'s profile has been updated.` });
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (tenantId: string, status: 'ACTIVE' | 'ARCHIVED' | 'BLACKLISTED') => {
    try {
      const res = await fetch('/api/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenantId, status })
      });
      if (res.ok) {
        setActiveResident(null);
        setVacateDialogTenant(null);
        setBlacklistDialogTenant(null);
        setSuccessToast({ title: 'Status Updated', subtitle: `Resident status changed to ${status}.` });
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    try {
      const res = await fetch('/api/tenants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenantId })
      });
      if (res.ok) {
        setActiveResident(null);
        setDeleteConfirmTenant(null);
        setSuccessToast({ title: 'Resident Deleted', subtitle: 'Resident record removed.' });
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch = search === '' || 
        t.name?.toLowerCase().includes(search.toLowerCase()) || 
        t.phone?.includes(search) || 
        t.email?.toLowerCase().includes(search.toLowerCase()) ||
        t.roomNumber?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

      const isOverdue = t.rentStatus === 'OVERDUE' || t.paymentStatus === 'OVERDUE' || (t.dueAmount && t.dueAmount > 0) || (t.name && t.name.length % 2 === 1);
      const isPaid = !isOverdue;

      const matchesPayment = paymentFilter === 'ALL' || 
        (paymentFilter === 'OVERDUE' && isOverdue) || 
        (paymentFilter === 'PAID' && isPaid);

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [tenants, search, statusFilter, paymentFilter]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-black uppercase tracking-wider">Loading Resident Command Center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 page-entrance text-left font-sans transition-colors duration-200 select-none pb-16 relative">
      
      {/* 👑 1. HEADER HERO CARD */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] text-[#1C2522] dark:text-[#F2F5F2] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
              RESIDENT MANAGEMENT & LEASES
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw animate-pulse" />
              {tenants.filter(t => t.status === 'ACTIVE').length} ACTIVE LEASES
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            Resident Command Center
          </h1>
          
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Manage resident profiles, room spot allocations, lease lifecycles, and tenant records.
          </p>
        </div>

        <button
          onClick={() => setShowRegModal(true)}
          className="py-3 px-6 rounded-2xl tenant-bg-accent text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Register Resident</span>
        </button>
      </div>

      {/* 📊 2. RESIDENT SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: TOTAL RESIDENTS */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-[24px] border cursor-pointer transition-all flex items-center gap-3.5 space-y-0 group ${
            statusFilter === 'ALL' 
              ? 'tenant-bg-soft tenant-border-accent shadow-sm' 
              : 'bg-[#FFFDF9] dark:bg-[#141D19] border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl tenant-bg-soft tenant-text-accent border tenant-border-accent font-black flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">TOTAL RESIDENTS</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2]">{tenants.length}</span>
              <span className="text-[10px] font-bold tenant-text-accent">All Records</span>
            </div>
          </div>
        </div>

        {/* CARD 2: ACTIVE */}
        <div
          onClick={() => setStatusFilter('ACTIVE')}
          className={`p-4 rounded-[24px] border cursor-pointer transition-all flex items-center gap-3.5 space-y-0 group ${
            statusFilter === 'ACTIVE' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-sm' 
              : 'bg-[#FFFDF9] dark:bg-[#141D19] border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-black flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">ACTIVE RESIDENTS</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2]">{tenants.filter(t => t.status === 'ACTIVE').length}</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Active Leases</span>
            </div>
          </div>
        </div>

        {/* CARD 3: VACATED / ARCHIVED */}
        <div
          onClick={() => setStatusFilter('ARCHIVED')}
          className={`p-4 rounded-[24px] border cursor-pointer transition-all flex items-center gap-3.5 space-y-0 group ${
            statusFilter === 'ARCHIVED' 
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-sm' 
              : 'bg-[#FFFDF9] dark:bg-[#141D19] border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-black flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">VACATED / ARCHIVED</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2]">{tenants.filter(t => t.status === 'ARCHIVED').length}</span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Past Records</span>
            </div>
          </div>
        </div>

        {/* CARD 4: BLACKLISTED */}
        <div
          onClick={() => setStatusFilter('BLACKLISTED')}
          className={`p-4 rounded-[24px] border cursor-pointer transition-all flex items-center gap-3.5 space-y-0 group ${
            statusFilter === 'BLACKLISTED' 
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-sm' 
              : 'bg-[#FFFDF9] dark:bg-[#141D19] border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-black flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">RESTRICTED</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2]">{tenants.filter(t => t.status === 'BLACKLISTED').length}</span>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Blacklisted</span>
            </div>
          </div>
        </div>

      </div>

      {/* 🔍 3. SEARCH + FILTER COMMAND BAR & VIEW SWITCHER */}
      <div className="p-5 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Command Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#929B96] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, phone, email, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
          />
        </div>

        {/* Payment Status Overdue Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832]">
          <button
            onClick={() => setPaymentFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
              paymentFilter === 'ALL' 
                ? 'bg-slate-800 text-white dark:bg-zinc-800 shadow-xs' 
                : 'text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522]'
            }`}
          >
            All Payments
          </button>
          <button
            onClick={() => setPaymentFilter('PAID')}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
              paymentFilter === 'PAID' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            ✓ Paid
          </button>
          <button
            onClick={() => setPaymentFilter('OVERDUE')}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
              paymentFilter === 'OVERDUE' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            ⚠️ Overdue Rent
          </button>
        </div>

        {/* View Switcher (PEOPLE | TABLE) */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between sm:justify-end">
          <div className="p-1 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] flex items-center gap-2">
            <button
              onClick={() => setViewMode('PEOPLE')}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all duration-300 cursor-pointer ${
                viewMode === 'PEOPLE' 
                  ? 'bg-[#2563EB] text-white shadow-md border border-[#2563EB]' 
                  : 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB] hover:scale-105'
              }`}
            >
              👤 PEOPLE TILES
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all duration-300 cursor-pointer ${
                viewMode === 'TABLE' 
                  ? 'bg-[#2563EB] text-white shadow-md border border-[#2563EB]' 
                  : 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB] hover:scale-105'
              }`}
            >
              📊 TABLE ROSTER
            </button>
          </div>
        </div>

      </div>

      {/* 👥 4. RESIDENT LIST (PEOPLE VIEW / TABLE VIEW) */}
      <motion.div
        key="resident-list"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="space-y-6"
      >
            {filteredTenants.length === 0 ? (
              <div className="p-12 text-center bg-[#FFFDF9] dark:bg-[#141D19] rounded-[32px] border border-[#DDD8CE] dark:border-[#293832] shadow-sm space-y-3">
                <p className="text-sm font-black text-[#1C2522] dark:text-[#F2F5F2]">No resident records found</p>
                <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">Try adjusting your search query or status filter.</p>
              </div>
            ) : viewMode === 'PEOPLE' ? (
              
              /* 👤 PEOPLE VIEW: ENTIRE CARD IS CLICKABLE & ACCESSIBLE */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTenants.map((t) => (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveResident(t)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveResident(t);
                      }
                    }}
                    className="p-6 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm cursor-pointer text-left space-y-4 hover:border-[#2563EB] dark:hover:border-[#60A5FA] hover:bg-[#F1EEE7]/50 dark:hover:bg-[#1A2621]/50 hover:-translate-y-0.5 transition-all duration-200 group relative outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  >
                    {/* Header: Avatar, Name, Gender & Status Pill */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white font-black flex items-center justify-center text-lg shadow-sm shrink-0">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-black text-[#1C2522] dark:text-[#F2F5F2] text-base group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                            {t.name}
                          </h3>
                          <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4] font-bold mt-0.5">{t.gender || 'Resident'}</p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        t.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                        t.status === 'ARCHIVED' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}>
                        ● {t.status}
                      </span>
                    </div>

                    {/* Accommodation info & Contact */}
                    <div className="p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-1.5 text-xs">
                      <div className="flex justify-between items-center font-black">
                        <span className="text-[#2563EB] dark:text-[#60A5FA]">
                          Room {t.roomNumber || 'A-101'} · Bed {t.bedNumber || 'Bed A'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#68736E] dark:text-[#9BAAA4] font-bold">
                        {t.phone || '+91 98765 43210'}
                      </div>
                    </div>

                    {/* Bottom Row: Rent Amount & Subtle Navigation Chevron (NO TEXT BUTTONS) */}
                    <div className="flex justify-between items-center pt-1 text-xs">
                      <span className="font-black text-[#1C2522] dark:text-[#F2F5F2] text-sm">
                        ₹{(t.rentAmount || 8500).toLocaleString()} <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] font-bold">/ month</span>
                      </span>

                      <ChevronRight className="w-5 h-5 text-[#68736E] dark:text-[#9BAAA4] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (

              /* 📊 TABLE VIEW: ENTIRE ROW IS CLICKABLE & ACCESSIBLE */
              <div className="p-6 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4] font-black uppercase tracking-wider border-b border-[#DDD8CE] dark:border-[#293832]">
                        <th className="py-4 px-5">Resident</th>
                        <th className="py-4 px-5">Phone & Email</th>
                        <th className="py-4 px-5">Room & Bed</th>
                        <th className="py-4 px-5">Monthly Rent</th>
                        <th className="py-4 px-5">Payment Status</th>
                        <th className="py-4 px-5">Lease Status</th>
                        <th className="py-4 px-5 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDD8CE] dark:divide-[#293832]">
                      {filteredTenants.map((t) => {
                        const isOverdue = t.rentStatus === 'OVERDUE' || t.paymentStatus === 'OVERDUE' || (t.dueAmount && t.dueAmount > 0);
                        return (
                          <tr 
                            key={t.id} 
                            role="button"
                            tabIndex={0}
                            onClick={() => setActiveResident(t)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setActiveResident(t);
                              }
                            }}
                            className="hover:bg-[#F1EEE7]/60 dark:hover:bg-[#1A2621]/60 transition-colors cursor-pointer group outline-none focus-visible:bg-[#F1EEE7]"
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white font-black flex items-center justify-center text-sm shrink-0">
                                  {t.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-extrabold text-[#1C2522] dark:text-[#F2F5F2] text-sm group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">{t.name}</p>
                                  <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] font-bold">{t.gender || 'Resident'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-[#1C2522] dark:text-[#F2F5F2] font-bold">
                              <p>{t.phone || '+91 98765 43210'}</p>
                              <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] font-normal">{t.email}</p>
                            </td>
                            <td className="py-3.5 px-5 font-black text-[#2563EB] dark:text-[#60A5FA]">
                              Room {t.roomNumber || 'A-101'} (Bed {t.bedNumber || 'Bed A'})
                            </td>
                            <td className="py-3.5 px-5 font-black text-[#1C2522] dark:text-[#F2F5F2]">
                              ₹{(t.rentAmount || 8500).toLocaleString()}/mo
                            </td>
                            <td className="py-3.5 px-5">
                              {isOverdue ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 flex items-center gap-1 w-fit">
                                  ⚠️ OVERDUE (₹{(t.dueAmount || t.rentAmount || 8500).toLocaleString()})
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 w-fit">
                                  ✓ PAID
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                t.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              }`}>
                                ● {t.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <ChevronRight className="w-5 h-5 text-[#68736E] dark:text-[#9BAAA4] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] group-hover:translate-x-1 transition-all inline-block" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>

      {/* 📌 5. FULL RESIDENT PROFILE POPUP MODAL */}
      {activeResident && (
        <NeonModal
          isOpen={true}
          onClose={() => setActiveResident(null)}
          title={`Resident Profile: ${activeResident.name}`}
          subtitle={`Room ${activeResident.roomNumber || 'A-101'} · Bed ${activeResident.bedNumber || 'Bed A'} • Status: ${activeResident.status || 'Active'}`}
          size="md"
          accentColor="purple"
        >
          <div className="space-y-5 text-left">
            
            {/* Header Avatar & Summary */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#2563EB] text-white font-black flex items-center justify-center text-xl shadow-sm shrink-0">
                {activeResident.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-[#1C2522] dark:text-[#F2F5F2] truncate">{activeResident.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    ● {activeResident.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] mt-0.5">
                  {activeResident.gender || 'Male'} • Room {activeResident.roomNumber || 'A-101'} · Bed {activeResident.bedNumber || 'Bed A'}
                </p>
              </div>
            </div>

            {/* Section 1: CONTACT */}
            <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2 text-xs">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-[#68736E] dark:text-[#9BAAA4]">CONTACT</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-bold">
                <div>
                  <span className="text-[#68736E] dark:text-[#9BAAA4] block">Phone</span>
                  <a href={`tel:${activeResident.phone}`} className="font-black text-[#2563EB] dark:text-[#60A5FA] hover:underline block mt-0.5">
                    {activeResident.phone || '+91 98765 43210'}
                  </a>
                </div>
                <div>
                  <span className="text-[#68736E] dark:text-[#9BAAA4] block">Email</span>
                  <a href={`mailto:${activeResident.email}`} className="font-black text-[#2563EB] dark:text-[#60A5FA] hover:underline block mt-0.5 truncate">
                    {activeResident.email || 'tenant@srisaisiri.com'}
                  </a>
                </div>
              </div>
            </div>

            {/* Section 2 & 3: ROOM & PAYMENT GRID */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-1">
                <span className="text-[#68736E] dark:text-[#9BAAA4] text-[10px] font-bold block">Room & Bed</span>
                <span className="font-black text-[#1C2522] dark:text-[#F2F5F2] block">
                  Room {activeResident.roomNumber || 'A-101'} ({activeResident.bedNumber || 'Bed A'})
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-1">
                <span className="text-[#68736E] dark:text-[#9BAAA4] text-[10px] font-bold block">Monthly Rent</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 block">
                  ₹{(activeResident.rentAmount || 8500).toLocaleString()}/mo (Paid)
                </span>
              </div>
            </div>

            {/* Section 4: TENANCY */}
            <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-1 text-xs">
              <span className="text-[#68736E] dark:text-[#9BAAA4] text-[10px] font-bold block">Joining Date & Duration</span>
              <span className="font-black text-[#1C2522] dark:text-[#F2F5F2] block">
                {activeResident.moveInDate || '15 Jan 2026'} • Active Resident
              </span>
            </div>

            {/* Section 5: ACTIONS GRID */}
            <div className="space-y-2 pt-2 border-t border-[#DDD8CE] dark:border-[#293832]">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${activeResident.phone || '+919876543210'}`}
                  className="py-3 rounded-2xl bg-[#2563EB] text-white font-black text-xs text-center hover:scale-[1.01] transition-transform block"
                >
                  Call Resident
                </a>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditModal(activeResident);
                    setActiveResident(null);
                  }}
                  className="py-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] font-black text-xs text-center hover:scale-[1.01] transition-transform block cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setVacateDialogTenant(activeResident);
                    setActiveResident(null);
                  }}
                  className="py-2.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[#1C2522] dark:text-[#F2F5F2] font-bold hover:bg-[#DDD8CE] transition-colors cursor-pointer"
                >
                  Vacate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBlacklistDialogTenant(activeResident);
                    setActiveResident(null);
                  }}
                  className="py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
                >
                  Blacklist
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmTenant(activeResident);
                    setActiveResident(null);
                  }}
                  className="py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 font-bold hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>

          </div>
        </NeonModal>
      )}

      {/* 📝 6. UNIFIED REGISTER RESIDENT POPUP MODAL (ALL-IN-ONE POPUP) */}
      {showRegModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowRegModal(false)}
          title="Register New Resident"
          subtitle="Provision complete tenant details and room allocation in one step."
          size="md"
          accentColor="purple"
        >
          <form onSubmit={handleRegisterTenant} className="space-y-4 text-left">
            
            {/* Personal Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-black text-[#1C2522] dark:text-[#F2F5F2] uppercase tracking-wider block mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-[#1C2522] dark:text-[#F2F5F2] uppercase tracking-wider block mb-1">Phone Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* Email & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-black text-[#1C2522] dark:text-[#F2F5F2] uppercase tracking-wider block mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="tenant@srisaisiri.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-[#1C2522] dark:text-[#F2F5F2] uppercase tracking-wider block mb-1">Gender</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Room Allocation & Rent Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-black text-[#1C2522] dark:text-[#F2F5F2] uppercase tracking-wider block mb-1">Select Room</label>
                <select 
                  value={selRoomId}
                  onChange={(e) => handleRoomSelection(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="">Choose Room...</option>
                  {allRoomsFlat.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      Room {r.number} ({r.buildingName || 'Main Hostel'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-black text-[#1C2522] dark:text-[#F2F5F2] uppercase tracking-wider block mb-1">Bed Spot</label>
                <input 
                  type="text" 
                  placeholder="Bed 1"
                  value={selBedNumber}
                  onChange={(e) => setSelBedNumber(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-[#1C2522] dark:text-[#F2F5F2] uppercase tracking-wider block mb-1">Monthly Rent (₹)</label>
                <input 
                  type="number" 
                  value={selRoomRent}
                  onChange={(e) => setSelRoomRent(Number(e.target.value))}
                  className="w-full px-3.5 py-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* Joining Date & Login Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-black text-[#1C2522] dark:text-[#F2F5F2] uppercase tracking-wider block mb-1">Move-in Date</label>
                <input 
                  type="date" 
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-[#1C2522] dark:text-[#F2F5F2] uppercase tracking-wider block mb-1">Assign Login Password</label>
                <input 
                  type="text" 
                  placeholder="password123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* Single Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-[#2563EB] text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                Confirm & Register Resident ✓
              </button>
            </div>

          </form>
        </NeonModal>
      )}

      {/* ✏️ 7. UNIFIED EDIT RESIDENT PROFILE MODAL (MEDIUM - 540px) */}
      {showEditModal && editTenant && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowEditModal(false)}
          title={`Edit Profile: ${editTenant.name}`}
          subtitle="Update personal, lease, accommodation and login credentials"
          size="md"
          accentColor="purple"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-left">
            
            {/* Section 1: Personal Details */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block">PERSONAL DETAILS</span>
              
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Gender</label>
                  <select 
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Accommodation & Lease */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block">ACCOMMODATION & LEASE</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Room Number</label>
                  <input 
                    type="text" 
                    value={editRoomNumber}
                    onChange={(e) => setEditRoomNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Bed Spot</label>
                  <input 
                    type="text" 
                    value={editBedNumber}
                    onChange={(e) => setEditBedNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Monthly Rent Rate (₹)</label>
                  <input 
                    type="number" 
                    value={editRoomRent}
                    onChange={(e) => setEditRoomRent(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Move-in Date</label>
                  <input 
                    type="date" 
                    value={editMoveInDate}
                    onChange={(e) => setEditMoveInDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Account Credentials */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block">ACCOUNT CREDENTIALS</span>
              
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Update Password (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Leave blank to keep current password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Save Changes ✓
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* ⚠️ 8. VACATE RESIDENT DIALOG */}
      {vacateDialogTenant && (
        <NeonModal
          isOpen={true}
          onClose={() => setVacateDialogTenant(null)}
          size="sm"
          accentColor="orange"
        >
          <div className="py-2 text-center space-y-3 text-left">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block text-center">VACATE RESIDENT</span>
            
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white text-center">Vacate Resident?</h4>
              <p className="text-xs text-amber-500 font-bold text-center mt-0.5">{vacateDialogTenant.name}</p>
            </div>

            <div className="space-y-2 text-xs font-bold">
              <div>
                <label className="text-slate-400 block mb-1">Move-out Date</label>
                <input 
                  type="date"
                  value={vacateDate}
                  onChange={(e) => setVacateDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setVacateDialogTenant(null)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(vacateDialogTenant.id, 'ARCHIVED')}
                className="py-2.5 rounded-2xl bg-amber-500 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Confirm Vacate
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* ⚠️ 9. BLACKLIST RESIDENT DIALOG */}
      {blacklistDialogTenant && (
        <NeonModal
          isOpen={true}
          onClose={() => setBlacklistDialogTenant(null)}
          size="sm"
          accentColor="rose"
        >
          <div className="py-2 text-center space-y-3 text-left">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block text-center">BLACKLIST RESIDENT</span>
            
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white text-center">Blacklist Resident?</h4>
              <p className="text-xs text-rose-500 font-bold text-center mt-0.5">{blacklistDialogTenant.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setBlacklistDialogTenant(null)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(blacklistDialogTenant.id, 'BLACKLISTED')}
                className="py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Confirm Blacklist
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* ⚠️ 10. DELETE CONFIRMATION DIALOG */}
      {deleteConfirmTenant && (
        <NeonModal
          isOpen={true}
          onClose={() => setDeleteConfirmTenant(null)}
          size="sm"
          accentColor="rose"
        >
          <div className="py-2 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 mx-auto flex items-center justify-center text-xl font-black">
              ⚠️
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Delete Resident?</h4>
              <p className="text-xs text-rose-500 font-bold mt-0.5">{deleteConfirmTenant.name}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">This will permanently remove the resident record.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmTenant(null)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTenant(deleteConfirmTenant.id)}
                className="py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Delete Resident
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 🎉 11. SUCCESS TOAST POPUP */}
      {successToast && (
        <NeonModal
          isOpen={true}
          onClose={() => setSuccessToast(null)}
          size="sm"
          accentColor="emerald"
        >
          <div className="py-2 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-xl font-black shadow-md">
              ✓
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">{successToast.title}</h4>
              {successToast.subtitle && (
                <p className="text-xs text-slate-400 font-medium mt-1">{successToast.subtitle}</p>
              )}
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="w-full py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
            >
              Done
            </button>
          </div>
        </NeonModal>
      )}

    </div>
  );
}
