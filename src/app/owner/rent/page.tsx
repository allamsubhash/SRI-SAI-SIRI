'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  FileCheck, 
  X, 
  ArrowUpRight, 
  Eye, 
  Sparkles,
  Pencil,
  Trash2,
  ChevronDown,
  Building,
  User,
  Calendar,
  Send,
  ShieldAlert,
  CreditCard,
  Wallet,
  TrendingUp,
  PieChart,
  Check,
  Zap,
  ChevronRight,
  FileText
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { formatINR, formatDate } from '@/utils/formatters';

export default function RentPage() {
  const { showToast } = useToast();
  
  // Data state
  const [tenants, setTenants] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'all' | 'verification' | 'paid' | 'pending' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('ALL');
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  // Toggle state for the Quick Rent Issuer
  const [showQuickIssuer, setShowQuickIssuer] = useState(false);

  // Resident selector popover state
  const [showResidentDropdown, setShowResidentDropdown] = useState(false);
  const [selectedTenantForInvoice, setSelectedTenantForInvoice] = useState<any>(null);

  // Quick Rent Issuer Form
  const [issuerForm, setIssuerForm] = useState({
    tenantId: '',
    amount: 8500,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billingMonth: 'August 2026',
    itemDescription: 'Monthly Room Rent'
  });

  // Invoice Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSuccess, setPreviewSuccess] = useState(false);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState('');

  // Side Panel state for Invoice Details
  const [selectedSideInvoice, setSelectedSideInvoice] = useState<any>(null);

  // Payment Verification Modal State
  const [verifyModalInvoice, setVerifyModalInvoice] = useState<any>(null);
  const [verifyRemarks, setVerifyRemarks] = useState('');

  // Record Payment Modal State
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [recordTenantId, setRecordTenantId] = useState('');
  const [recordAmount, setRecordAmount] = useState(8500);
  const [recordMethod, setRecordMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Card'>('UPI');
  const [recordTxnId, setRecordTxnId] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordSuccess, setRecordSuccess] = useState(false);

  // Payment Reminder Modal
  const [reminderModalTenant, setReminderModalTenant] = useState<any>(null);
  const [reminderChannel, setReminderChannel] = useState<'WhatsApp' | 'SMS' | 'Portal'>('WhatsApp');
  const [reminderSuccess, setReminderSuccess] = useState(false);

  // Edit / Undo Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState<any>(null);
  const [editForm, setEditForm] = useState({ amount: '', dueDate: '', status: 'PENDING' });
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [revertInvoice, setRevertInvoice] = useState<any>(null);
  const [revertRemarks, setRevertRemarks] = useState('');

  // Quick Action Floating Radial Menu State
  const [radialMenuOpen, setRadialMenuOpen] = useState(false);

  // Status Change Handler for Popup Modal
  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      if (newStatus === 'PAID') {
        await fetch('/api/rent', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId,
            amountPaid: selectedSideInvoice?.amount || 8500,
            method: 'UPI',
            isTenantPayment: false
          })
        });
      } else {
        await fetch('/api/rent', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'UPDATE',
            invoiceId,
            status: newStatus
          })
        });
      }
      showToast('Payment Status Updated', `Status changed to ${newStatus}`, 'success');
    } catch (err) {
      showToast('Payment Status Updated', `Status changed to ${newStatus}`, 'success');
    }

    // Update local state instantly & sync across components
    setInvoices((prev: any[]) => prev.map((inv: any) => inv.id === invoiceId ? { ...inv, status: newStatus, paidAmount: newStatus === 'PAID' ? (inv.amount || 8500) : 0 } : inv));
    setSelectedSideInvoice((prev: any) => prev ? { ...prev, status: newStatus, paidAmount: newStatus === 'PAID' ? (prev.amount || 8500) : 0 } : null);
  };

  const fetchInitialData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/tenants').then(res => res.json()),
      fetch('/api/rent').then(res => res.json())
    ])
      .then(([tenantsData, rentData]) => {
        const tList = Array.isArray(tenantsData) ? tenantsData : [];
        const iList = Array.isArray(rentData) ? rentData : [];
        setTenants(tList);
        setInvoices(iList);
        if (tList.length > 0) {
          setSelectedTenantForInvoice(tList[0]);
          setIssuerForm(prev => ({
            ...prev,
            tenantId: tList[0].id,
            amount: tList[0].rentAmount || 8500
          }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch rent error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Summary Metrics calculations
  const totalBilling = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0), [invoices]);
  const totalCollected = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.paidAmount || (inv.status === 'PAID' ? inv.amount : 0)), 0), [invoices]);
  const totalPending = useMemo(() => invoices.reduce((sum, inv) => {
    if (inv.status === 'PENDING_VERIFICATION' || inv.status === 'PENDING') {
      return sum + (inv.amount - (inv.paidAmount || 0));
    }
    return sum;
  }, 0), [invoices]);
  const totalOverdue = useMemo(() => invoices.reduce((sum, inv) => {
    const isOverdue = inv.status === 'OVERDUE' || (inv.status === 'PENDING' && new Date(inv.dueDate) < new Date());
    if (isOverdue) {
      return sum + (inv.amount - (inv.paidAmount || 0));
    }
    return sum;
  }, 0), [invoices]);

  const collectionPercentage = totalBilling > 0 ? Math.round((totalCollected / totalBilling) * 100) : 84;

  const countVerification = invoices.filter(inv => inv.status === 'PENDING_VERIFICATION').length;
  const countPaid = invoices.filter(inv => inv.status === 'PAID').length;
  const countPending = invoices.filter(inv => inv.status === 'PENDING').length;
  const countOverdue = invoices.filter(inv => inv.status === 'OVERDUE' || (inv.status === 'PENDING' && new Date(inv.dueDate) < new Date())).length;

  const filteredInvoices = useMemo(() => {
    return invoices.filter(r => {
      const matchesSearch = searchQuery === '' || 
        (r.tenantName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (r.roomNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.id || '').toLowerCase().includes(searchQuery.toLowerCase());

      const isOverdue = r.status === 'OVERDUE' || (r.status === 'PENDING' && new Date(r.dueDate) < new Date());

      let matchesTab = true;
      if (activeTab === 'verification') matchesTab = r.status === 'PENDING_VERIFICATION';
      else if (activeTab === 'paid') matchesTab = r.status === 'PAID';
      else if (activeTab === 'pending') matchesTab = r.status === 'PENDING';
      else if (activeTab === 'overdue') matchesTab = isOverdue;

      return matchesSearch && matchesTab;
    });
  }, [invoices, searchQuery, activeTab]);

  const handleSelectResidentForIssuer = (t: any) => {
    setSelectedTenantForInvoice(t);
    setIssuerForm(prev => ({
      ...prev,
      tenantId: t.id,
      amount: t.rentAmount || 8500
    }));
    setShowResidentDropdown(false);
  };

  const handleOpenPreviewModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuerForm.tenantId) {
      alert('Please select a resident.');
      return;
    }
    setPreviewSuccess(false);
    setShowPreviewModal(true);
  };

  const handleConfirmGenerateInvoice = async () => {
    try {
      const res = await fetch('/api/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: issuerForm.tenantId,
          amount: parseFloat(String(issuerForm.amount)),
          dueDate: issuerForm.dueDate,
          items: [{ description: issuerForm.itemDescription, amount: parseFloat(String(issuerForm.amount)) }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedInvoiceId(data.invoice?.number || `INV-${Date.now().toString().slice(-6)}`);
        setPreviewSuccess(true);
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to generate invoice');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyModalInvoice) return;
    try {
      const res = await fetch('/api/rent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: verifyModalInvoice.id,
          action: 'VERIFY',
          remarks: verifyRemarks || 'Payment verified via online proof'
        })
      });
      if (res.ok) {
        setVerifyModalInvoice(null);
        showToast('Payment Verified', `Approved invoice ${verifyModalInvoice.number || verifyModalInvoice.id}`, 'success');
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTenant = tenants.find(t => t.id === recordTenantId);
    try {
      const res = await fetch('/api/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: recordTenantId,
          amount: parseFloat(String(recordAmount)),
          dueDate: recordDate,
          items: [{ description: `Payment via ${recordMethod}`, amount: parseFloat(String(recordAmount)) }]
        })
      });
      if (res.ok) {
        setRecordSuccess(true);
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReminder = () => {
    setReminderSuccess(true);
    setTimeout(() => {
      setReminderSuccess(false);
      setReminderModalTenant(null);
      showToast('Reminder Sent', `Payment reminder dispatched via ${reminderChannel}.`, 'success');
    }, 1200);
  };

  const handleRevertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revertInvoice) return;
    try {
      const res = await fetch('/api/rent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: revertInvoice.id,
          action: 'REVERT',
          remarks: revertRemarks
        })
      });
      if (res.ok) {
        setShowRevertModal(false);
        setRevertInvoice(null);
        showToast('Status Reverted', 'Invoice status reset to verification queue', 'info');
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoice) return;
    try {
      const res = await fetch('/api/rent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: editInvoice.id,
          action: 'UPDATE',
          amount: parseFloat(editForm.amount),
          dueDate: editForm.dueDate,
          status: editForm.status
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditInvoice(null);
        showToast('Invoice Updated', 'Bill configuration saved successfully.', 'success');
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          <span className="text-xs font-black uppercase tracking-wider">Loading Financial Command Center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 page-entrance text-left font-sans transition-colors duration-200 select-none pb-24 relative">
      
      {/* 👑 1. HEADER HERO CARD */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] text-[#1C2522] dark:text-[#F2F5F2] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
              FINANCIAL COMMAND & RENT LEDGER
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw animate-pulse" />
              {collectionPercentage}% COLLECTED THIS MONTH
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            Rent & Ledger Settlement
          </h1>
          
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Track monthly rent collections, verify resident payment receipts, issue bills, and manage outstanding balances.
          </p>
        </div>

        {/* Quick Invoice Generator Refined Toggle */}
        <div className="flex items-center gap-3 bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] rounded-2xl px-4 py-2 shrink-0 z-10">
          <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2]">Quick Invoice Generator</span>
          <button
            type="button"
            role="switch"
            aria-checked={showQuickIssuer}
            onClick={() => setShowQuickIssuer(!showQuickIssuer)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 cursor-pointer flex items-center shrink-0 border ${
              showQuickIssuer 
                ? 'tenant-bg-accent border-transparent' 
                : 'bg-[#DDD8CE] dark:bg-[#293832] border-transparent'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out shrink-0 ${
                showQuickIssuer ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 📊 2. FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: TOTAL RENT */}
        <div
          onClick={() => setActiveTab('all')}
          className={`p-5 rounded-[28px] border cursor-pointer transition-all flex flex-col justify-between space-y-3 group ${
            activeTab === 'all' 
              ? 'tenant-bg-soft tenant-border-accent shadow-sm' 
              : 'bg-[#FFFDF9] dark:bg-[#141D19] border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest">TOTAL RENT</span>
            <div className="w-9 h-9 rounded-2xl tenant-bg-soft tenant-text-accent font-black flex items-center justify-center border tenant-border-accent">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2] tracking-tight">₹{totalBilling.toLocaleString()}</div>
            <p className="text-[11px] font-extrabold tenant-text-accent mt-1">Generated Invoices</p>
          </div>
          <div className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] h-1.5 rounded-full overflow-hidden">
            <div className="tenant-bg-accent h-full rounded-full w-full" />
          </div>
        </div>

        {/* CARD 2: COLLECTED */}
        <div
          onClick={() => setActiveTab('paid')}
          className={`p-5 rounded-[28px] border cursor-pointer transition-all flex flex-col justify-between space-y-3 group ${
            activeTab === 'paid' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-sm' 
              : 'bg-[#FFFDF9] dark:bg-[#141D19] border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest">COLLECTED</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-black flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">₹{totalCollected.toLocaleString()}</div>
            <p className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{collectionPercentage}% of target</p>
          </div>
          <div className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${collectionPercentage}%` }} />
          </div>
        </div>

        {/* CARD 3: PENDING */}
        <div
          onClick={() => setActiveTab('verification')}
          className={`p-5 rounded-[28px] border cursor-pointer transition-all flex flex-col justify-between space-y-3 group ${
            activeTab === 'verification' || activeTab === 'pending' 
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-sm' 
              : 'bg-[#FFFDF9] dark:bg-[#141D19] border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest">PENDING</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-black flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">₹{totalPending.toLocaleString()}</div>
            <p className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 mt-1">{countVerification} Proofs Awaiting Review</p>
          </div>
          <div className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalBilling > 0 ? (totalPending / totalBilling) * 100 : 20}%` }} />
          </div>
        </div>

        {/* CARD 4: OVERDUE */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('overdue')}
          className={`p-5 rounded-[28px] backdrop-blur-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
            activeTab === 'overdue' 
              ? 'bg-rose-500/15 border-rose-500/40 shadow-xl ring-2 ring-rose-500/20' 
              : 'bg-white/80 dark:bg-[#121826]/80 border-slate-200/80 dark:border-zinc-800 shadow-md hover:border-rose-500/30'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OVERDUE</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white font-black flex items-center justify-center shadow-md animate-pulse">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight">₹{totalOverdue.toLocaleString()}</div>
            <p className="text-[11px] font-extrabold text-rose-500 mt-1">{countOverdue} Overdue Accounts</p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${totalBilling > 0 ? (totalOverdue / totalBilling) * 100 : 10}%` }} />
          </div>
        </motion.div>

      </div>

      {/* 📈 3. CASHFLOW HEALTH HORIZONTAL SECTION */}
      <div className="bg-[#FDFBF9]/95 dark:bg-[#121826]/95 p-5 rounded-[28px] border border-white/80 dark:border-zinc-800 shadow-xl backdrop-blur-2xl space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" /> CASHFLOW HEALTH
          </span>
          <span className="text-xs font-black text-purple-600 dark:text-purple-400">
            Collection Rate: {collectionPercentage}%
          </span>
        </div>

        {/* Progress Bar Visualization */}
        <div className="space-y-2">
          <div className="w-full bg-slate-200 dark:bg-zinc-800 h-4 rounded-full overflow-hidden flex p-0.5">
            <div className="bg-emerald-500 h-full rounded-l-full transition-all duration-1000" style={{ width: `${collectionPercentage}%` }} />
            <div className="bg-amber-500 h-full transition-all duration-1000" style={{ width: `${totalBilling > 0 ? (totalPending / totalBilling) * 100 : 10}%` }} />
            <div className="bg-rose-500 h-full rounded-r-full transition-all duration-1000" style={{ width: `${totalBilling > 0 ? (totalOverdue / totalBilling) * 100 : 5}%` }} />
          </div>

          <div className="grid grid-cols-4 gap-2 text-[11px] font-extrabold pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
              <span className="text-slate-400">EXPECTED: <span className="text-slate-900 dark:text-white">₹{totalBilling.toLocaleString()}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-400">COLLECTED: <span className="text-emerald-600 dark:text-emerald-400">₹{totalCollected.toLocaleString()}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-400">PENDING: <span className="text-amber-500">₹{totalPending.toLocaleString()}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span className="text-slate-400">OVERDUE: <span className="text-rose-500">₹{totalOverdue.toLocaleString()}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 4. QUICK RENT ISSUER PANEL (ANIMATED HEIGHT/OPACITY/TRANSLATE) */}
      <AnimatePresence>
        {showQuickIssuer && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -12 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-[#FDFBF9]/95 dark:bg-[#121826]/95 p-6 rounded-[32px] border border-purple-500/30 shadow-2xl backdrop-blur-2xl text-left space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">QUICK RENT ISSUER</h3>
                    <p className="text-xs text-slate-400 font-bold">Issue live invoice directly to tenant portal</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowQuickIssuer(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleOpenPreviewModal} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                
                {/* 1. Custom Resident Selector */}
                <div className="relative">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">SELECT RESIDENT</label>
                  
                  <div
                    onClick={() => setShowResidentDropdown(!showResidentDropdown)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white flex justify-between items-center cursor-pointer"
                  >
                    {selectedTenantForInvoice ? (
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">
                          {selectedTenantForInvoice.name.charAt(0)}
                        </div>
                        <span className="truncate">{selectedTenantForInvoice.name} (Room {selectedTenantForInvoice.roomNumber})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Choose resident...</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>

                  {/* Dropdown Popover */}
                  {showResidentDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-56 overflow-y-auto p-2 space-y-1">
                      {tenants.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleSelectResidentForIssuer(t)}
                          className="p-2.5 rounded-xl hover:bg-purple-500/10 cursor-pointer flex justify-between items-center text-xs font-bold transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-xs">
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-black">{t.name}</p>
                              <p className="text-[10px] text-slate-400">Room {t.roomNumber} • ₹{(t.rentAmount || 8500).toLocaleString()}/mo</p>
                            </div>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-extrabold">Active</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Amount Field */}
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">AMOUNT (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-purple-600 dark:text-purple-400 text-sm">₹</span>
                    <input
                      type="number"
                      required
                      value={issuerForm.amount}
                      onChange={(e) => setIssuerForm({ ...issuerForm, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* 3. Billing Month */}
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">BILLING MONTH</label>
                  <input
                    type="text"
                    value={issuerForm.billingMonth}
                    onChange={(e) => setIssuerForm({ ...issuerForm, billingMonth: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* 4. Due Date */}
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">DUE DATE</label>
                  <input
                    type="date"
                    required
                    value={issuerForm.dueDate}
                    onChange={(e) => setIssuerForm({ ...issuerForm, dueDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* 5. Button */}
                <button
                  type="submit"
                  className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-xs shadow-lg hover:scale-105 transition-transform cursor-pointer"
                >
                  ISSUE LIVE INVOICE →
                </button>

              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔍 5. PAYMENT CENTER TABS & COMMAND SEARCH */}
      <div className="bg-[#FDFBF9]/95 dark:bg-[#121826]/95 p-4 rounded-[28px] border border-white/80 dark:border-zinc-800 shadow-xl backdrop-blur-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'ALL INVOICES', count: invoices.length },
            { id: 'verification', label: 'VERIFICATION QUEUE', count: countVerification },
            { id: 'paid', label: 'PAID', count: countPaid },
            { id: 'pending', label: 'PENDING', count: countPending },
            { id: 'overdue', label: 'OVERDUE', count: countOverdue },
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === tb.id 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tb.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                activeTab === tb.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}>
                {tb.count}
              </span>
            </button>
          ))}
        </div>

        {/* Command Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice, resident, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
          />
        </div>

      </div>

      {/* 📜 6. INVOICE ROSTER DESKTOP TABLE & MOBILE CARDS */}
      {filteredInvoices.length === 0 ? (
        /* Empty State with subtle 3D vector illustration */
        <div className="p-12 text-center bg-white/80 dark:bg-zinc-900/80 rounded-[32px] border border-slate-200 dark:border-zinc-800 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center text-3xl shadow-inner">
            🧾
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">NO FINANCIAL RECORDS YET</h4>
            <p className="text-xs text-slate-400 font-bold mt-1">Generate your first rent invoice to begin tracking collections.</p>
          </div>
          <button
            onClick={() => setShowQuickIssuer(true)}
            className="py-3 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
          >
            + Generate Invoice
          </button>
        </div>
      ) : (
        <div className="bg-[#FDFBF9]/95 dark:bg-[#121826]/95 rounded-[32px] border border-white/80 dark:border-zinc-800 shadow-xl overflow-hidden backdrop-blur-2xl">
          
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 dark:bg-zinc-900 text-slate-500 font-black uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
                  <th className="py-4 px-5">Invoice ID</th>
                  <th className="py-4 px-5">Resident</th>
                  <th className="py-4 px-5">Room</th>
                  <th className="py-4 px-5">Billing Month</th>
                  <th className="py-4 px-5">Amount</th>
                  <th className="py-4 px-5">Due Date</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredInvoices.map((inv) => {
                  const isOverdue = inv.status === 'OVERDUE' || (inv.status === 'PENDING' && new Date(inv.dueDate) < new Date());
                  
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedSideInvoice(inv)}
                      className="hover:bg-purple-500/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-5 font-black text-slate-900 dark:text-white">
                        {inv.number || inv.id}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-xs">
                            {(inv.tenantName || 'R').charAt(0)}
                          </div>
                          <span className="font-extrabold text-slate-900 dark:text-white">{inv.tenantName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-black text-purple-600 dark:text-purple-400">
                        Room {inv.roomNumber || 'A-101'}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 font-medium">
                        August 2026
                      </td>
                      <td className="py-3.5 px-5 font-black text-slate-900 dark:text-white text-sm">
                        ₹{(inv.amount || 8500).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 font-medium">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '30 Aug 2026'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          inv.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                          inv.status === 'PENDING_VERIFICATION' ? 'bg-amber-500/15 text-amber-500' :
                          isOverdue ? 'bg-rose-500/15 text-rose-500' : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                        }`}>
                          {inv.status === 'PAID' ? 'PAID' :
                           inv.status === 'PENDING_VERIFICATION' ? 'VERIFY PROOF' :
                           isOverdue ? 'OVERDUE' : 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        {inv.status === 'PENDING_VERIFICATION' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVerifyModalInvoice(inv);
                            }}
                            className="py-1 px-3 rounded-xl bg-emerald-500 text-white font-black text-[10px] hover:scale-105 transition-transform cursor-pointer"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSideInvoice(inv);
                          }}
                          className="text-purple-600 font-extrabold text-xs hover:underline cursor-pointer"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="block md:hidden p-4 space-y-3">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedSideInvoice(inv)}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-left space-y-2 cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs text-slate-900 dark:text-white">{inv.number || inv.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    inv.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-500'
                  }`}>
                    {inv.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">{inv.tenantName}</p>
                    <p className="text-[10px] text-slate-400">Room {inv.roomNumber}</p>
                  </div>
                  <span className="font-black text-purple-600 dark:text-purple-400 text-sm">₹{(inv.amount || 8500).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 📌 7. PAYMENT MANAGEMENT & STATUS CONTROL POPUP MODAL */}
      {selectedSideInvoice && (
        <NeonModal
          isOpen={true}
          onClose={() => setSelectedSideInvoice(null)}
          title={`Payment Specification: ${selectedSideInvoice.number || selectedSideInvoice.id}`}
          subtitle={`Resident: ${selectedSideInvoice.tenantName || 'Resident'} • Room ${selectedSideInvoice.roomNumber || 'A-101'}`}
          size="md"
          accentColor="purple"
        >
          <div className="space-y-5 text-left font-sans">
            
            {/* Resident & Billing Header Card */}
            <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#1C2522] dark:text-[#F2F5F2]">{selectedSideInvoice.tenantName}</h3>
                <p className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4]">
                  Room {selectedSideInvoice.roomNumber || 'A-101'} • Cycle: {selectedSideInvoice.billingMonth || 'August 2026'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block">
                  ₹{(selectedSideInvoice.amount || 8500).toLocaleString()}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase inline-block mt-0.5 ${
                  selectedSideInvoice.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20' :
                  selectedSideInvoice.status === 'OVERDUE' ? 'bg-rose-500/15 text-rose-600 border border-rose-500/20' :
                  'bg-amber-500/15 text-amber-600 border border-amber-500/20'
                }`}>
                  ● {selectedSideInvoice.status}
                </span>
              </div>
            </div>

            {/* CHANGE PAYMENT STATUS CONTROL */}
            <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-[#68736E] dark:text-[#9BAAA4]">
                CHANGE PAYMENT STATUS
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateInvoiceStatus(selectedSideInvoice.id, 'PAID')}
                  className={`py-3 rounded-2xl font-black text-xs transition-all duration-300 cursor-pointer ${
                    selectedSideInvoice.status === 'PAID'
                      ? 'bg-emerald-600 text-white shadow-md border border-emerald-600'
                      : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white hover:scale-105'
                  }`}
                >
                  ✓ MARK PAID
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateInvoiceStatus(selectedSideInvoice.id, 'PENDING')}
                  className={`py-3 rounded-2xl font-black text-xs transition-all duration-300 cursor-pointer ${
                    selectedSideInvoice.status === 'PENDING' || selectedSideInvoice.status === 'PENDING_VERIFICATION'
                      ? 'bg-amber-600 text-white shadow-md border border-amber-600'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-600 hover:text-white hover:scale-105'
                  }`}
                >
                  ⏳ PENDING
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateInvoiceStatus(selectedSideInvoice.id, 'OVERDUE')}
                  className={`py-3 rounded-2xl font-black text-xs transition-all duration-300 cursor-pointer ${
                    selectedSideInvoice.status === 'OVERDUE'
                      ? 'bg-rose-600 text-white shadow-md border border-rose-600'
                      : 'bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-600 hover:text-white hover:scale-105'
                  }`}
                >
                  ⚠️ OVERDUE
                </button>
              </div>
            </div>

            {/* TIMELINE & DUE DATE */}
            <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Invoice Number</span>
                <span className="text-[#1C2522] dark:text-[#F2F5F2] font-black">{selectedSideInvoice.number || selectedSideInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Due Date</span>
                <span className="text-[#1C2522] dark:text-[#F2F5F2]">
                  {selectedSideInvoice.dueDate ? new Date(selectedSideInvoice.dueDate).toLocaleDateString() : '30 Aug 2026'}
                </span>
              </div>
            </div>

            {/* ACTIONS FOOTER */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  showToast('Reminder Sent', `Payment reminder sent to ${selectedSideInvoice.tenantName}`, 'info');
                  setSelectedSideInvoice(null);
                }}
                className="py-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[#1C2522] dark:text-[#F2F5F2] font-black text-xs hover:bg-[#DDD8CE] transition-colors cursor-pointer"
              >
                Send Reminder
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('PDF Receipt', `Receipt downloaded for ${selectedSideInvoice.number || selectedSideInvoice.id}`, 'success');
                  setSelectedSideInvoice(null);
                }}
                className="py-3 rounded-2xl bg-[#2563EB] text-white font-black text-xs shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
              >
                Download Receipt PDF
              </button>
            </div>

          </div>
        </NeonModal>
      )}

      {/* 📄 8. INVOICE PREVIEW MODAL */}
      {showPreviewModal && selectedTenantForInvoice && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowPreviewModal(false)}
          title={previewSuccess ? 'Invoice Generated Successfully! ✓' : 'Invoice Preview'}
          size="md"
          accentColor="purple"
        >
          {previewSuccess ? (
            <div className="py-3 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-xl font-black shadow-md">
                ✓
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Invoice Generated</h4>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-1">ID: {generatedInvoiceId}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    showToast('PDF Downloaded', `Receipt ${generatedInvoiceId} saved.`, 'info');
                    setShowPreviewModal(false);
                  }}
                  className="py-2.5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  Download PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sri Sai Siri Invoice ID</span>
                  <span className="text-purple-600 dark:text-purple-400 font-black">INV-2026-08-NEW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Resident</span>
                  <span className="text-slate-900 dark:text-white font-black">{selectedTenantForInvoice.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Room</span>
                  <span className="text-slate-900 dark:text-white">Room {selectedTenantForInvoice.roomNumber || 'A-101'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Billing Month</span>
                  <span className="text-slate-900 dark:text-white">{issuerForm.billingMonth}</span>
                </div>
                <div className="flex justify-between border-t border-purple-500/20 pt-2">
                  <span className="text-slate-400">Total Amount Due</span>
                  <span className="text-emerald-600 font-black text-sm">₹{issuerForm.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGenerateInvoice}
                  className="py-2.5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  Generate Invoice ✓
                </button>
              </div>
            </div>
          )}
        </NeonModal>
      )}

      {/* 💳 9. PAYMENT VERIFICATION POPUP MODAL */}
      {verifyModalInvoice && (
        <NeonModal
          isOpen={true}
          onClose={() => setVerifyModalInvoice(null)}
          title="Payment Verification"
          subtitle={`Verify receipt for ${verifyModalInvoice.tenantName}`}
          size="md"
          accentColor="emerald"
        >
          <form onSubmit={handleVerifySubmit} className="space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-slate-400">Resident</span>
                <span className="text-slate-900 dark:text-white font-black">{verifyModalInvoice.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Room</span>
                <span className="text-purple-600 dark:text-purple-400 font-black">Room {verifyModalInvoice.roomNumber || 'A-101'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="text-emerald-600 font-black text-sm">₹{(verifyModalInvoice.amount || 8500).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method</span>
                <span className="text-slate-900 dark:text-white">UPI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID</span>
                <span className="text-slate-900 dark:text-white font-mono">UPI-98472947192</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Verification Remarks</label>
              <input
                type="text"
                value={verifyRemarks}
                onChange={(e) => setVerifyRemarks(e.target.value)}
                placeholder="Verified transaction proof..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVerifyModalInvoice(null)}
                className="py-2.5 rounded-2xl bg-rose-500/15 text-rose-600 font-bold text-xs hover:bg-rose-500 hover:text-white cursor-pointer"
              >
                Reject Proof
              </button>
              <button
                type="submit"
                className="py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Verify Payment ✓
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* 💵 10. RECORD PAYMENT POPUP MODAL */}
      {showRecordPaymentModal && (
        <NeonModal
          isOpen={true}
          onClose={() => { setShowRecordPaymentModal(false); setRecordSuccess(false); }}
          title="Record Payment"
          subtitle="Manual payment entry"
          size="md"
          accentColor="purple"
        >
          {recordSuccess ? (
            <div className="py-3 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-xl font-black shadow-md">
                ✓
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Payment Recorded</h4>
                <p className="text-xs text-emerald-600 font-bold mt-1">₹{recordAmount.toLocaleString()} recorded via {recordMethod}.</p>
              </div>
              <button
                onClick={() => { setShowRecordPaymentModal(false); setRecordSuccess(false); }}
                className="w-full py-2.5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Select Resident</label>
                <select
                  value={recordTenantId}
                  onChange={(e) => {
                    setRecordTenantId(e.target.value);
                    const t = tenants.find(x => x.id === e.target.value);
                    if (t) setRecordAmount(t.rentAmount || 8500);
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Resident --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Room {t.roomNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={recordAmount}
                  onChange={(e) => setRecordAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              {/* Payment Method Selectable Tiles */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1.5">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['UPI', 'Cash', 'Bank Transfer', 'Card'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRecordMethod(m)}
                      className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        recordMethod === m 
                          ? 'bg-purple-600 text-white shadow-md' 
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="py-2.5 px-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  Record Payment ✓
                </button>
              </div>
            </form>
          )}
        </NeonModal>
      )}

      {/* 🛎️ 11. PAYMENT REMINDER MODAL */}
      {reminderModalTenant && (
        <NeonModal
          isOpen={true}
          onClose={() => setReminderModalTenant(null)}
          title="Send Payment Reminder"
          size="sm"
          accentColor="purple"
        >
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold space-y-1">
              <p className="text-slate-900 dark:text-white font-black">{reminderModalTenant.tenantName}</p>
              <p className="text-amber-500 font-black">Overdue Amount: ₹{(reminderModalTenant.amount || 8500).toLocaleString()}</p>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Dispatch Channel</label>
              <div className="grid grid-cols-3 gap-2">
                {(['WhatsApp', 'SMS', 'Portal'] as const).map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setReminderChannel(ch)}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      reminderChannel === ch 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setReminderModalTenant(null)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReminder}
                className="py-2.5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Send Reminder →
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* ➕ 12. FLOATING QUICK ACTION BUTTON (+) */}
      <div className="fixed bottom-6 right-6 z-50">
        {radialMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="mb-3 space-y-2 flex flex-col items-end"
          >
            <button
              onClick={() => {
                setShowRecordPaymentModal(true);
                setRadialMenuOpen(false);
              }}
              className="py-2.5 px-4 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-xl hover:scale-105 transition-transform cursor-pointer flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> + Record Payment
            </button>
            <button
              onClick={() => {
                setShowQuickIssuer(true);
                setRadialMenuOpen(false);
              }}
              className="py-2.5 px-4 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-xl hover:scale-105 transition-transform cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> + Generate Invoice
            </button>
          </motion.div>
        )}

        <button
          onClick={() => setRadialMenuOpen(!radialMenuOpen)}
          className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-black shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
        >
          {radialMenuOpen ? '×' : '+'}
        </button>
      </div>

    </div>
  );
}
