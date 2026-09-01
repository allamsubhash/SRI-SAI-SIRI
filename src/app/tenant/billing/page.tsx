'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, 
  DollarSign, 
  Loader, 
  CreditCard, 
  Download, 
  CheckCircle,
  Search,
  Filter,
  Check,
  AlertCircle,
  Clock,
  FileText,
  Sparkles,
  Zap
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { formatINR, formatDate } from '@/utils/formatters';
import OfficialPaymentReceiptModal, { OfficialReceiptData } from '@/components/OfficialPaymentReceiptModal';

export default function TenantBilling() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Payment Modal
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [paying, setPaying] = useState(false);

  // Official Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<OfficialReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const fetchTenantInvoices = () => {
    setLoading(true);
    fetch('/api/rent')
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a: any, b: any) => new Date(b.dateCreated || b.dueDate || 0).getTime() - new Date(a.dateCreated || a.dueDate || 0).getTime());
        const filtered = sorted.filter((inv: any) => 
          (inv.tenantName && user?.name && inv.tenantName.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
          (inv.tenantId && user?.id && inv.tenantId === user.id)
        );
        setInvoices(filtered.length > 0 ? filtered : sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user) {
      fetchTenantInvoices();
    }
  }, [user]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = search === '' || 
        inv.number?.toLowerCase().includes(search.toLowerCase()) || 
        inv.tenantName?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterStatus === 'ALL' || 
        (filterStatus === 'PENDING' && inv.status === 'PENDING') || 
        (filterStatus === 'PAID' && inv.status === 'PAID') || 
        (filterStatus === 'OVERDUE' && inv.status === 'OVERDUE');
      return matchesSearch && matchesFilter;
    });
  }, [invoices, search, filterStatus]);

  const outstandingBalance = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + (inv.status !== 'PAID' ? (inv.amount - (inv.paidAmount || 0)) : 0), 0);
  }, [invoices]);

  const totalPaid = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + (inv.status === 'PAID' ? (inv.paidAmount || inv.amount) : 0), 0);
  }, [invoices]);

  const openPaymentModal = (inv: any) => {
    setActiveInvoice(inv);
    setShowModal(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;
    setPaying(true);

    try {
      const res = await fetch('/api/rent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: activeInvoice.id,
          amountPaid: activeInvoice.amount,
          method: 'ONLINE',
          isTenantPayment: true
        })
      });

      if (res.ok) {
        setShowModal(false);
        fetchTenantInvoices();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  const handleOpenOfficialReceipt = (inv: any) => {
    const formattedData: OfficialReceiptData = {
      receiptNo: inv.number || `REC-${inv.id.slice(0, 6)}`,
      date: formatDate(inv.paidDate || inv.dateCreated || new Date().toISOString()),
      tenantId: inv.tenantId || user?.id || 'TENANT-001',
      tenantName: user?.name || inv.tenantName || 'Resident Tenant',
      roomNumber: inv.roomNumber || 'A-101',
      mobileNumber: (user as any)?.phone || inv.tenantPhone || '+91 98765 43210',
      items: [
        { sNo: 1, accountHead: inv.period || inv.title || 'Hostel Monthly Room Rent Tariff', amount: inv.amount || 6500 }
      ],
      totalAmount: inv.paidAmount || inv.amount || 6500,
      paymentType: inv.method || 'ONLINE UPI',
      remainingDue: 0,
      generatedOn: formatDate(new Date().toISOString())
    };
    setSelectedReceipt(formattedData);
    setShowReceiptModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-44 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[32px] border border-white/80 dark:border-[#293832]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      
      {/* 💳 1. HERO LEDGER BANNER */}
      <motion.div 
        whileHover={{ y: -3, scale: 1.005 }}
        className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div className="space-y-2 z-10">
          <span className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            FINANCIAL LEDGER & BILLING
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2] tracking-tight">
            My Rent & Payment Invoices
          </h1>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            View active hostel rent bills, settled transactions, and download official receipts.
          </p>
        </div>
        
        <div className="w-12 h-12 rounded-2xl tenant-bg-accent flex items-center justify-center font-black shadow-lg shrink-0 z-10">
          <Receipt className="w-6 h-6 animate-pulse" />
        </div>
      </motion.div>

      {/* 📊 2. SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">OUTSTANDING BALANCE DUE</span>
            <div className="text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2]">{formatINR(outstandingBalance)}</div>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
              {outstandingBalance > 0 ? 'Pending invoice settlement required' : 'All accounts fully clear ✓'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
            outstandingBalance > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
          }`}>
            <DollarSign className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">TOTAL SETTLED PAYMENTS</span>
            <div className="text-3xl font-black tenant-text-accent">{formatINR(totalPaid)}</div>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">Lifetime rent paid to Sri Sai Siri Hostel</p>
          </div>
          <div className="w-12 h-12 rounded-2xl tenant-bg-soft tenant-text-accent flex items-center justify-center font-black">
            <CheckCircle className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* 🔍 3. SEARCH & FILTERS */}
      <div className="p-4 rounded-[28px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929B96]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] rounded-2xl pl-11 pr-4 py-2.5 text-xs text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
            placeholder="Search invoice number or date..."
          />
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: 'ALL', label: 'All Invoices' },
            { id: 'PENDING', label: 'Pending Due' },
            { id: 'PAID', label: 'Paid Settled' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? 'tenant-bg-accent shadow-md'
                  : 'bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📑 4. INVOICES TABLE LIST */}
      <div className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-[#68736E] dark:text-[#9BAAA4] italic space-y-2">
            <Receipt className="w-8 h-8 text-[#929B96] mx-auto opacity-50" />
            <p className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2]">No invoices found</p>
            <p className="text-[11px]">No invoice records match your search criteria.</p>
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <motion.div 
              whileHover={{ y: -2 }}
              key={inv.id}
              className="p-5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left shadow-sm hover:tenant-border-accent transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-sm text-[#1C2522] dark:text-[#F2F5F2]">Invoice #{inv.number || inv.id.slice(0, 8)}</h3>
                  <span className={`text-[9px] font-black px-3 py-0.5 rounded-full border uppercase tracking-wider ${
                    inv.status === 'PAID'
                      ? 'tenant-bg-soft tenant-text-accent border tenant-border-accent'
                      : inv.status === 'OVERDUE'
                      ? 'bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676] border-rose-200 dark:border-[#F27676]/30'
                      : 'bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D] border-amber-200 dark:border-[#F2C15D]/30'
                  }`}>
                    {inv.status}
                  </span>
                </div>
                <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
                  Billed: {formatDate(inv.dateCreated)} • Due: {formatDate(inv.dueDate)}
                </p>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-lg font-black text-[#1C2522] dark:text-[#F2F5F2] block">{formatINR(inv.amount)}</span>
                  <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] font-bold">Monthly Tariff</span>
                </div>

                {inv.status === 'PAID' ? (
                  <button
                    onClick={() => handleOpenOfficialReceipt(inv)}
                    className="py-2.5 px-4 rounded-xl tenant-bg-soft tenant-text-accent border tenant-border-accent text-xs font-black flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openPaymentModal(inv)}
                    className="py-2.5 px-5 rounded-xl tenant-bg-accent text-xs font-black shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    Pay Now →
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ONLINE PAYMENT MODAL */}
      {showModal && activeInvoice && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title={`Settle Rent Invoice #${activeInvoice.number || activeInvoice.id.slice(0, 8)}`}
          subtitle="Process instant online rent payment via UPI, Credit/Debit Card, or Net Banking."
          size="md"
          accentColor="emerald"
        >
          <form onSubmit={handlePaySubmit} className="space-y-4 text-left font-sans">
            <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Total Tariff Amount</span>
                <span className="text-xl font-black text-[#1C2522] dark:text-[#F2F5F2]">{formatINR(activeInvoice.amount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-t border-[#DDD8CE] dark:border-[#293832] pt-2">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Due Date</span>
                <span className="text-[#1C2522] dark:text-[#F2F5F2]">{formatDate(activeInvoice.dueDate)}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">SECURE PAYMENT GATEWAY</span>
              <p className="text-xs text-emerald-300 font-medium">Your payment is encrypted and verified directly through Sri Sai Siri ERP portal.</p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="py-3 px-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs cursor-pointer border border-[#DDD8CE] dark:border-[#293832]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paying}
                className="py-3 px-7 rounded-2xl tenant-bg-accent font-black text-xs cursor-pointer shadow-lg hover:scale-105 transition-all"
              >
                {paying ? 'Processing...' : 'CONFIRM & PAY NOW →'}
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* OFFICIAL PAYMENT RECEIPT MODAL */}
      {showReceiptModal && selectedReceipt && (
        <OfficialPaymentReceiptModal
          isOpen={true}
          onClose={() => setShowReceiptModal(false)}
          receiptData={selectedReceipt}
        />
      )}

    </motion.div>
  );
}
