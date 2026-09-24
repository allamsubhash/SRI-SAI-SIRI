'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, 
  DollarSign, 
  CreditCard, 
  Download, 
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Sparkles,
  QrCode,
  Send,
  XCircle,
  Info,
  Copy,
  Check,
  Building,
  ShieldCheck,
  RefreshCw,
  Eye
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { formatINR, formatDate, formatDateTime } from '@/utils/formatters';
import OfficialPaymentReceiptModal, { OfficialReceiptData } from '@/components/OfficialPaymentReceiptModal';
import { computeTenantBillingState, UnifiedBill, PaymentTransaction } from '@/lib/billingService';

export default function TenantBilling() {
  const { user } = useAuth();
  const [tenantData, setTenantData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [qrSettings, setQrSettings] = useState<any>({
    qrCodeUrl: '/uploads/sample_qr.png',
    upiId: 'srisaisiri@upi',
    instructions: 'Scan QR code using any UPI app (GPay, PhonePe, Paytm) and enter the 12-digit UTR/Reference number.'
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Submit Payment Modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRefId, setPayRefId] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Official Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<OfficialReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const loadData = async (isInitial: boolean = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    try {
      // 1. Fetch current tenant profile
      const tenantRes = await fetch('/api/tenants/me');
      let currentTenant = null;
      if (tenantRes.ok) {
        const tData = await tenantRes.json();
        currentTenant = tData.tenant || tData;
        setTenantData(currentTenant);
      }

      // 2. Fetch QR Settings
      const qrRes = await fetch('/api/settings/qr');
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        if (qrData.settings) {
          setQrSettings(qrData.settings);
        }
      }

      // 3. Fetch all payments workspace or rent
      const paymentsRes = await fetch('/api/payments');
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        const allTransactions = data.transactionsLedger || [];
        const allBills = data.bills || [];

        // Match for current tenant
        const userIdentifier = currentTenant?.id || user?.id;
        const userName = currentTenant?.name || user?.name || '';

        const tenantTransactions = allTransactions.filter((tx: any) => 
          (userIdentifier && tx.tenantId === userIdentifier) ||
          (userIdentifier && tx.userId === userIdentifier) ||
          (userName && tx.tenantName && tx.tenantName.toLowerCase().trim() === userName.toLowerCase().trim())
        );

        const tenantBills = allBills.filter((b: any) =>
          (userIdentifier && b.tenantId === userIdentifier) ||
          (userName && b.tenantName && b.tenantName.toLowerCase().trim() === userName.toLowerCase().trim())
        );

        setPayments(tenantTransactions);
        setInvoices(tenantBills);
      } else {
        // Fallback to /api/rent
        const rentRes = await fetch('/api/rent');
        if (rentRes.ok) {
          const rentData = await rentRes.json();
          const rList = Array.isArray(rentData) ? rentData : [];
          setPayments(rList);
        }
      }
    } catch (e) {
      console.error("Error loading tenant billing data:", e);
    } finally {
      if (isInitial) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData(true);
      const interval = setInterval(() => loadData(false), 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Single Authoritative Billing State computation from shared engine
  const billingState = useMemo(() => {
    const tenantObj = tenantData || { id: user?.id || 'TENANT-001', name: user?.name || 'Resident', roomNumber: 'A-101' };
    return computeTenantBillingState(tenantObj, invoices, payments, []);
  }, [tenantData, invoices, payments, user]);

  const activeBill = billingState.invoices[0] || {
    id: 'BILL-CURRENT',
    number: 'INV-CURRENT',
    amount: billingState.monthlyRent || 6500,
    paidAmount: billingState.totalApprovedPaid || 0,
    outstandingAmount: billingState.remainingOutstanding,
    status: billingState.primaryStatus,
    dueDate: billingState.dueDate,
    billingMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    roomNumber: tenantData?.roomNumber || 'A-101',
    transactions: payments
  };

  const handleCopyUpi = () => {
    if (qrSettings.upiId) {
      navigator.clipboard.writeText(qrSettings.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const handleOpenPayModal = () => {
    setPayAmount(billingState.remainingOutstanding > 0 ? String(billingState.remainingOutstanding) : String(billingState.monthlyRent));
    setPayRefId('');
    setPayNotes('');
    setSubmitError('');
    setSubmitSuccess('');
    setShowPayModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    const numericAmount = Number(payAmount);
    if (!payAmount || isNaN(numericAmount) || numericAmount <= 0) {
      setSubmitError('Please enter a valid payment amount.');
      return;
    }
    if (!payRefId.trim()) {
      setSubmitError('UTR / Transaction Reference Number is required for payment verification.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantData?.id || user?.id,
          amount: numericAmount,
          paymentMethod: payMethod,
          referenceId: payRefId.trim(),
          notes: payNotes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setSubmitError(data.error || 'Failed to submit payment.');
      } else {
        setSubmitSuccess('Payment submitted successfully! Your transaction is marked as VERIFICATION PENDING.');
        if (data.payment) {
          setPayments(prev => [data.payment, ...prev.filter(p => p.id !== data.payment.id)]);
        }
        await loadData(false);
        setTimeout(() => {
          setShowPayModal(false);
        }, 1200);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while submitting payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenOfficialReceipt = (pay: any) => {
    if (billingState.primaryStatus !== 'PAID' && billingState.remainingOutstanding > 0.01) {
      alert('Receipt is available only after full payment is completed.');
      return;
    }
    const formattedData: OfficialReceiptData = {
      receiptNo: pay.receiptNumber || `SSR-RCP-${(pay.id || '000000').slice(-6).toUpperCase()}`,
      date: formatDate(pay.date || pay.createdAt),
      verifiedDate: formatDate(pay.updatedAt || pay.verifiedAt || pay.date || pay.createdAt),
      tenantId: tenantData?.id || user?.id || 'TENANT-001',
      tenantName: user?.name || tenantData?.name || 'Resident Tenant',
      roomNumber: tenantData?.roomNumber || 'A-101',
      buildingName: tenantData?.buildingName || 'Sri Sai Siri Hostel',
      mobileNumber: tenantData?.phone || (user as any)?.phone || '+91 98765 43210',
      billingPeriod: activeBill?.billingMonth || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      paymentMethod: pay.paymentMethod || pay.method || 'ONLINE UPI',
      referenceId: pay.referenceId || pay.id || 'N/A',
      recordedBy: pay.recordedBy || 'Hostel Management',
      paymentStatus: 'PAID',
      billAmount: activeBill?.amount || billingState.monthlyRent,
      previousPaid: Math.max(0, (billingState.totalApprovedPaid || 0) - (pay.amount || 0)),
      currentPayment: pay.amount || 0,
      items: [
        { sNo: 1, accountHead: pay.notes || 'Monthly Hostel Accommodation & Rent Settlement', amount: pay.amount || 0 }
      ],
      totalAmount: pay.amount || 0,
      remainingDue: billingState.remainingOutstanding,
      generatedOn: formatDateTime(new Date())
    };
    setSelectedReceipt(formattedData);
    setShowReceiptModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left p-6 font-sans">
        <div className="h-44 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[32px] border border-white/80 dark:border-[#293832]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
          <div className="h-32 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
          <div className="h-32 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
        </div>
      </div>
    );
  }

  // Find latest approved payment for quick receipt viewing
  const latestApprovedPayment = payments.find(p => p.status === 'APPROVED' || p.status === 'PAID');
  const pendingPayment = payments.find(p => p.status === 'PENDING' || p.status === 'PENDING_VERIFICATION' || p.status === 'VERIFICATION');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-7 text-left font-sans transition-colors duration-200"
    >
      
      {/* 💳 1. HERO HEADER */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              OFFICIAL RENT & BILLING DESK
            </span>
            {tenantData?.roomNumber && (
              <span className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] border border-[#DDD8CE] dark:border-[#293832]">
                Room {tenantData.roomNumber}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2] tracking-tight">
            Rent & Payment Management
          </h1>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Real-time authoritative billing ledger for Sri Sai Siri Hostel. Zero hidden charges, instant official receipts.
          </p>
        </div>

        <button 
          onClick={() => loadData(false)}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] text-[#1C2522] dark:text-[#F2F5F2] hover:bg-[#E5E0D5] dark:hover:bg-[#25362F] transition-all cursor-pointer shadow-sm shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Sync Ledger'}</span>
        </button>
      </div>

      {/* 📊 2. AUTHORITATIVE SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider">MONTHLY TARIFF</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2]">
            {formatINR(billingState.monthlyRent)}
          </div>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">
            Due on 5th of every month
          </p>
        </div>

        <div className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider">TOTAL SETTLED (PAID)</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black tenant-text-accent">
            {formatINR(billingState.totalApprovedPaid)}
          </div>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">
            Verified by hostel management
          </p>
        </div>

        <div className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider">CURRENT OUTSTANDING</span>
            <AlertCircle className={`w-5 h-5 ${billingState.remainingOutstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div className={`text-3xl font-black ${billingState.remainingOutstanding > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
            {formatINR(billingState.remainingOutstanding)}
          </div>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">
            {billingState.remainingOutstanding === 0 ? 'All rent cleared for current cycle ✓' : `Due by ${billingState.dueDate}`}
          </p>
        </div>
      </div>

      {/* 🌟 3. CENTRAL AUTHORITATIVE CURRENT BILLING CARD (SINGLE CARD - NO DUPLICATES) */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border-2 border-white/90 dark:border-[#293832] shadow-2xl backdrop-blur-2xl space-y-6">
        
        {/* State Banner Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DDD8CE] dark:border-[#293832] pb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest">
              CURRENT BILLING CYCLE • {activeBill.billingMonth || 'Active Month'}
            </span>
            <h2 className="text-xl font-black text-[#1C2522] dark:text-[#F2F5F2]">
              Hostel Rent & Accommodation Bill
            </h2>
          </div>

          {/* Dynamic Status Badge */}
          {billingState.isUnderVerification ? (
            <span className="px-4 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 animate-spin" />
              VERIFICATION PENDING
            </span>
          ) : billingState.isFullyPaid ? (
            <span className="px-4 py-1.5 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              ✓ PAID IN FULL
            </span>
          ) : billingState.isPartiallyPaid ? (
            <span className="px-4 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              PARTIAL PAYMENT
            </span>
          ) : (
            <span className="px-4 py-1.5 rounded-full bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D] border border-amber-200 dark:border-[#F2C15D]/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              PAYMENT DUE
            </span>
          )}
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832]">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider">Total Bill Amount</span>
            <div className="text-xl font-black text-[#1C2522] dark:text-[#F2F5F2]">
              {formatINR(billingState.monthlyRent)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider">Amount Paid</span>
            <div className="text-xl font-black tenant-text-accent">
              {formatINR(billingState.totalApprovedPaid)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider">Remaining Outstanding</span>
            <div className={`text-xl font-black ${billingState.remainingOutstanding > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
              {formatINR(billingState.remainingOutstanding)}
            </div>
          </div>
        </div>

        {/* Verification Pending Notice */}
        {billingState.isUnderVerification && pendingPayment && (
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs flex items-start gap-3">
            <Clock className="w-5 h-5 shrink-0 mt-0.5 animate-spin" />
            <div className="space-y-1">
              <strong className="block font-black text-sm">Payment Verification in Progress</strong>
              <p className="font-medium">
                You submitted <strong>{formatINR(pendingPayment.amount)}</strong> (UTR: <span className="font-mono">{pendingPayment.referenceId}</span>). The hostel owner has been notified and is currently verifying the transaction.
              </p>
            </div>
          </div>
        )}

        {/* Primary Action Button Bar (ONE PRIMARY BUTTON ONLY) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official digital receipts generated instantly upon payment settlement.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {billingState.isFullyPaid ? (
              latestApprovedPayment ? (
                <button
                  onClick={() => handleOpenOfficialReceipt(latestApprovedPayment)}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-2xl tenant-bg-soft tenant-text-accent border tenant-border-accent text-xs font-black shadow-md hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Official Receipt</span>
                </button>
              ) : null
            ) : (
              <button
                onClick={handleOpenPayModal}
                className="w-full sm:w-auto py-3.5 px-8 rounded-2xl tenant-bg-accent text-xs font-black shadow-xl hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {billingState.isPartiallyPaid 
                    ? `Pay Remaining ${formatINR(billingState.remainingOutstanding)} →` 
                    : `PAY NOW (${formatINR(billingState.remainingOutstanding)}) →`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 📑 4. COMPLETE PAYMENT HISTORY AUDIT TABLE */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-black text-[#1C2522] dark:text-[#F2F5F2]">Payment History & Official Receipts</h2>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">All submitted and verified transactions for your hostel residency.</p>
          </div>
          <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4] border border-[#DDD8CE] dark:border-[#293832]">
            {payments.length} Records
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center text-[#68736E] dark:text-[#9BAAA4] space-y-2 border border-dashed border-[#DDD8CE] dark:border-[#293832] rounded-2xl">
            <Receipt className="w-10 h-10 text-[#929B96] mx-auto opacity-50" />
            <p className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2]">No payment records found</p>
            <p className="text-[11px]">Payments made via UPI or cash will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((pay) => (
              <div 
                key={pay.id}
                className="p-5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left shadow-sm hover:border-emerald-500/30 transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-black text-sm text-[#1C2522] dark:text-[#F2F5F2]">
                      {formatINR(pay.amount)} • {pay.paymentMethod || pay.method || 'ONLINE UPI'}
                    </h3>
                    <span className={`text-[9px] font-black px-3 py-0.5 rounded-full border uppercase tracking-wider ${
                      pay.status === 'APPROVED' || pay.status === 'PAID'
                        ? 'tenant-bg-soft tenant-text-accent border tenant-border-accent'
                        : pay.status === 'REJECTED'
                        ? 'bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676] border-rose-200 dark:border-[#F27676]/30'
                        : pay.status === 'PENDING_VERIFICATION' || pay.status === 'VERIFICATION' || pay.status === 'PENDING'
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                        : pay.status === 'REVERSED'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700'
                        : 'bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D] border-amber-200 dark:border-[#F2C15D]/30'
                    }`}>
                      {pay.status === 'APPROVED' || pay.status === 'PAID' ? 'PAID ✓' :
                       pay.status === 'REJECTED' ? 'REJECTED ❌' :
                       pay.status === 'PENDING_VERIFICATION' || pay.status === 'VERIFICATION' || pay.status === 'PENDING' ? 'VERIFICATION 🔍' :
                       pay.status === 'REVERSED' ? 'REVERSED ↩' : 'PENDING ⏳'}
                    </span>
                  </div>

                  <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
                    Date: {formatDate(pay.date || pay.createdAt)} • Ref/UTR: <strong className="font-mono text-[#1C2522] dark:text-[#F2F5F2]">{pay.referenceId || pay.id}</strong>
                  </p>

                  {pay.rejectionReason && pay.status === 'REJECTED' && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 dark:text-rose-300 font-medium">
                      <strong>Rejection Note:</strong> {pay.rejectionReason}
                    </div>
                  )}

                  {pay.notes && (
                    <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4] italic">
                      "{pay.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {(pay.status === 'APPROVED' || pay.status === 'PAID') && (
                    <button
                      onClick={() => handleOpenOfficialReceipt(pay)}
                      className="py-2.5 px-4 rounded-xl tenant-bg-soft tenant-text-accent border tenant-border-accent text-xs font-black flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Official Receipt</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📲 SINGLE PAY NOW MODAL (WITH QR CODE & INSTANT UTR SUBMISSION) */}
      {showPayModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowPayModal(false)}
          title="Rent Payment & UTR Submission"
          subtitle="Scan official owner QR or copy UPI ID, complete transfer, and enter your 12-digit UTR reference."
          size="lg"
          accentColor="emerald"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left font-sans">
            
            {/* Left Col: Clean QR & UPI Info */}
            <div className="md:col-span-5 p-4 rounded-2xl bg-white dark:bg-[#101916] border border-[#DDD8CE] dark:border-[#293832] flex flex-col items-center justify-between space-y-4 text-center">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#68736E] dark:text-[#9BAAA4]">
                  OFFICIAL HOSTEL QR
                </span>
                <div className="w-48 h-48 bg-white p-2.5 rounded-2xl border-2 border-emerald-500/30 shadow-md flex items-center justify-center mx-auto">
                  {qrSettings.qrCodeUrl ? (
                    <img 
                      src={qrSettings.qrCodeUrl} 
                      alt="Hostel Payment QR Code" 
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <QrCode className="w-24 h-24 text-emerald-500 opacity-80" />
                  )}
                </div>
              </div>

              {/* UPI ID Copy Box */}
              <div className="w-full p-3 rounded-xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] flex items-center justify-between gap-2">
                <div className="text-left overflow-hidden">
                  <span className="text-[9px] font-bold text-[#68736E] dark:text-[#9BAAA4] block uppercase">Hostel UPI ID</span>
                  <span className="text-xs font-mono font-black text-[#1C2522] dark:text-[#F2F5F2] truncate block">
                    {qrSettings.upiId || 'srisaisiri@upi'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-2 rounded-lg tenant-bg-soft tenant-text-accent border tenant-border-accent hover:scale-105 transition-all cursor-pointer shrink-0"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Right Col: Form */}
            <form onSubmit={handlePaymentSubmit} className="md:col-span-7 space-y-4">
              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              {submitSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-white dark:bg-[#101916] border border-[#DDD8CE] dark:border-[#293832] rounded-xl px-4 py-2.5 text-sm text-[#1C2522] dark:text-[#F2F5F2] font-black focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 6500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">
                  Payment Method *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-white dark:bg-[#101916] border border-[#DDD8CE] dark:border-[#293832] rounded-xl px-4 py-2.5 text-xs text-[#1C2522] dark:text-[#F2F5F2] font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                  <option value="NET_BANKING">Net Banking / IMPS / NEFT</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CASH">Cash directly to Warden</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">
                  12-Digit UTR / Transaction Reference Number *
                </label>
                <input
                  type="text"
                  value={payRefId}
                  onChange={(e) => setPayRefId(e.target.value)}
                  className="w-full bg-white dark:bg-[#101916] border border-[#DDD8CE] dark:border-[#293832] rounded-xl px-4 py-2.5 text-xs text-[#1C2522] dark:text-[#F2F5F2] font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 423987123456"
                  required
                />
                <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] mt-1 block">
                  Find this in your UPI app transaction details as "UPI Ref No" or "UTR".
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">
                  Optional Note / Remarks
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-white dark:bg-[#101916] border border-[#DDD8CE] dark:border-[#293832] rounded-xl px-4 py-2.5 text-xs text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none"
                  placeholder="e.g. September rent advance payment"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="py-2.5 px-5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] text-xs font-bold hover:bg-[#E5E0D5] dark:hover:bg-[#25362F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-6 rounded-xl tenant-bg-accent text-xs font-black shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'SUBMIT PAYMENT →'}
                </button>
              </div>
            </form>
          </div>
        </NeonModal>
      )}

      {/* 📄 OFFICIAL PAYMENT RECEIPT MODAL */}
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
