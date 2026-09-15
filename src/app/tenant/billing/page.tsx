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
  QrCode,
  Send,
  XCircle,
  Info
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { formatINR, formatDate } from '@/utils/formatters';
import OfficialPaymentReceiptModal, { OfficialReceiptData } from '@/components/OfficialPaymentReceiptModal';
import { calculateMonthlyDues } from '@/lib/rentCalculator';

export default function TenantBilling() {
  const { user } = useAuth();
  const [tenantData, setTenantData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [qrSettings, setQrSettings] = useState<any>({
    qrCodeUrl: '/uploads/sample_qr.png',
    upiId: 'srisaisiri@upi',
    instructions: 'Scan QR code using any UPI app (GPay, PhonePe, Paytm) and enter the 12-digit UTR/Reference number.'
  });
  const [loading, setLoading] = useState(true);

  // Submit Payment Modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('ONLINE');
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
    try {
      // 1. Fetch current tenant profile
      const tenantRes = await fetch('/api/tenants/me');
      if (tenantRes.ok) {
        const tData = await tenantRes.json();
        setTenantData(tData.tenant || tData);
      }

      // 2. Fetch QR Settings
      const qrRes = await fetch('/api/settings/qr');
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        if (qrData.settings) {
          setQrSettings(qrData.settings);
        }
      }

      // 3. Fetch Tenant Payment History & Invoices
      const rentRes = await fetch('/api/rent');
      if (rentRes.ok) {
        const rentData = await rentRes.json();
        const rList = Array.isArray(rentData) ? rentData : [];
        const userPayments = rList.filter((inv: any) => 
          (inv.tenantName && user?.name && inv.tenantName.toLowerCase().trim().includes(user.name.toLowerCase().trim())) ||
          (inv.tenantId && user?.id && inv.tenantId === user.id) ||
          (inv.userId && user?.id && inv.userId === user.id) ||
          (tenantData && inv.tenantId === tenantData.id)
        );
        setPayments(userPayments.length > 0 ? userPayments : rList);
      }
    } catch (e) {
      console.error("Error loading billing data:", e);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData(true);
      const interval = setInterval(() => loadData(false), 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Calculate monthly dues strictly from moveInDate to current date
  const duesCalculation = useMemo(() => {
    return calculateMonthlyDues(tenantData, payments);
  }, [tenantData, payments]);

  const handleOpenPayModal = () => {
    setPayAmount(duesCalculation.totalDues > 0 ? String(duesCalculation.totalDues) : String(duesCalculation.monthlyRent));
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

    if (!payAmount || Number(payAmount) <= 0) {
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
          amount: Number(payAmount),
          paymentMethod: payMethod,
          referenceId: payRefId.trim(),
          notes: payNotes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setSubmitError(data.error || 'Failed to submit payment.');
      } else {
        setSubmitSuccess('Payment submitted successfully! Your payment is under PENDING status and pending owner verification.');
        // append to local payments
        if (data.payment) {
          setPayments(prev => [data.payment, ...prev]);
        }
        setTimeout(() => {
          setShowPayModal(false);
        }, 1500);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while submitting payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenOfficialReceipt = (pay: any) => {
    const formattedData: OfficialReceiptData = {
      receiptNo: `REC-${pay.id.slice(-6).toUpperCase()}`,
      date: formatDate(pay.date || pay.createdAt),
      tenantId: tenantData?.id || user?.id || 'TENANT-001',
      tenantName: user?.name || tenantData?.name || 'Resident Tenant',
      roomNumber: tenantData?.roomNumber || 'A-101',
      mobileNumber: tenantData?.phone || (user as any)?.phone || '+91 98765 43210',
      items: [
        { sNo: 1, accountHead: pay.notes || 'Monthly Hostel Rent Tariff Settlement', amount: pay.amount || 6500 }
      ],
      totalAmount: pay.amount || 6500,
      paymentType: pay.paymentMethod || 'ONLINE UPI',
      remainingDue: duesCalculation.totalDues,
      generatedOn: formatDate(new Date().toISOString())
    };
    setSelectedReceipt(formattedData);
    setShowReceiptModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left p-6">
        <div className="h-44 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[32px] border border-white/80 dark:border-[#293832]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      transition={{ duration: 0.4 }}
      className="space-y-7 text-left font-sans transition-colors duration-200"
    >
      
      {/* 💳 1. HERO LEDGER BANNER */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2 z-10">
          <span className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            FINANCIAL LEDGER & BILLING
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2] tracking-tight">
            Rent Payment & Billing Desk
          </h1>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Scan official owner QR code, submit transaction UTRs, and track your complete payment history.
          </p>
        </div>
        
        {duesCalculation.totalPendingApproval > 0 ? (
          <div className="py-3 px-6 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-black flex items-center gap-2 z-10 shrink-0 shadow-md">
            <Clock className="w-4 h-4 animate-spin text-purple-500" />
            <span>PAYMENT SUBMITTED & AWAITING VERIFICATION ⏳</span>
          </div>
        ) : (
          <button
            onClick={handleOpenPayModal}
            className="py-3.5 px-7 rounded-2xl tenant-bg-accent text-xs font-black shadow-lg hover:scale-105 transition-all cursor-pointer flex items-center gap-2.5 z-10 shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            <span>PAY RENT NOW →</span>
          </button>
        )}
      </div>

      {/* ⌛ PENDING PAYMENT VERIFICATION CARD */}
      {duesCalculation.totalPendingApproval > 0 && (
        <div className="p-6 rounded-[32px] bg-purple-500/10 border border-purple-500/30 shadow-xl backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-purple-500/20 text-purple-500 dark:text-purple-400">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-purple-700 dark:text-purple-300">
                PAYMENT SUBMITTED & AWAITING VERIFICATION ⏳
              </h3>
              <p className="text-xs text-purple-600/90 dark:text-purple-200/90 font-medium">
                Submitted Amount: <strong>{formatINR(duesCalculation.totalPendingApproval)}</strong> • Ref/UTR: <strong>{payments.find(p => p.status === 'PENDING' || p.status === 'PENDING_VERIFICATION' || p.status === 'VERIFICATION')?.referenceId || 'Submitted'}</strong>. The hostel owner is currently reviewing your transaction.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 shrink-0">
            OWNER VERIFICATION IN PROGRESS
          </span>
        </div>
      )}

      {/* 📊 2. AUTOMATIC DUES SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider">MONTHLY RENT TARIFF</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2]">
            {formatINR(duesCalculation.monthlyRent)}
          </div>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">
            Move-in Date: <strong className="text-[#1C2522] dark:text-[#F2F5F2]">{duesCalculation.moveInDate}</strong> ({duesCalculation.monthsElapsed} month(s))
          </p>
        </div>

        <div className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider">TOTAL APPROVED PAYMENTS</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black tenant-text-accent">
            {formatINR(duesCalculation.totalApprovedPaid)}
          </div>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">
            Settled and verified by hostel management
          </p>
        </div>

        <div className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider">CURRENT OUTSTANDING DUES</span>
            <AlertCircle className={`w-5 h-5 ${duesCalculation.totalDues > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div className={`text-3xl font-black ${duesCalculation.totalDues > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
            {formatINR(duesCalculation.totalDues)}
          </div>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">
            {duesCalculation.totalDues === 0 ? 'All rent dues cleared ✓' : `Due by 5th of current month`}
          </p>
        </div>
      </div>

      {/* 📲 3. QR CODE PAYMENT SETTINGS SECTION */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl tenant-bg-soft tenant-text-accent border tenant-border-accent">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#1C2522] dark:text-[#F2F5F2]">Official Owner Payment QR & UPI Details</h2>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">Pay your rent directly using any standard UPI mobile application.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#101916] rounded-2xl border border-[#DDD8CE] dark:border-[#293832] space-y-3">
            <div className="w-44 h-44 bg-emerald-500/10 rounded-xl flex items-center justify-center p-2 overflow-hidden border border-emerald-500/20">
              {qrSettings.qrCodeUrl ? (
                <img 
                  src={qrSettings.qrCodeUrl} 
                  alt="Owner QR Code" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback visual QR preview if image not uploaded yet
                    (e.target as HTMLElement).style.display = 'none';
                  }} 
                />
              ) : null}
              <div className="text-center p-4">
                <QrCode className="w-16 h-16 text-emerald-500 mx-auto opacity-70" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mt-2">OFFICIAL QR CODE</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#68736E] dark:text-[#9BAAA4]">Scan to Pay via UPI</span>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="p-4 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
              <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">OFFICIAL HOSTEL UPI ID</span>
              <div className="text-lg font-black text-[#1C2522] dark:text-[#F2F5F2] font-mono select-all">
                {qrSettings.upiId || 'srisaisiri@upi'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                <Info className="w-4 h-4" />
                <span>Payment Instructions</span>
              </div>
              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] leading-relaxed font-medium">
                {qrSettings.instructions || 'Pay via any UPI app (GPay, PhonePe, Paytm) and enter the 12-digit UTR/Reference number.'}
              </p>
            </div>

            <button
              onClick={handleOpenPayModal}
              className="py-3 px-6 rounded-2xl tenant-bg-accent text-xs font-black shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Payment UTR Reference →</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📑 4. PERSISTENT PAYMENT HISTORY TABLE */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-[#1C2522] dark:text-[#F2F5F2]">Complete Payment History Audit</h2>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">All past submitted payments are retained permanently for record transparency.</p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center text-[#68736E] dark:text-[#9BAAA4] space-y-2">
            <Receipt className="w-10 h-10 text-[#929B96] mx-auto opacity-50" />
            <p className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2]">No payment records found</p>
            <p className="text-[11px]">Submit your first payment above using the official QR code or UPI ID.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((pay) => (
              <div 
                key={pay.id}
                className="p-5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-sm text-[#1C2522] dark:text-[#F2F5F2]">
                      {formatINR(pay.amount)} • {pay.paymentMethod || 'ONLINE'}
                    </h3>
                    <span className={`text-[9px] font-black px-3 py-0.5 rounded-full border uppercase tracking-wider ${
                      pay.status === 'APPROVED' || pay.status === 'PAID'
                        ? 'tenant-bg-soft tenant-text-accent border tenant-border-accent'
                        : pay.status === 'REJECTED'
                        ? 'bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676] border-rose-200 dark:border-[#F27676]/30'
                        : pay.status === 'PENDING_VERIFICATION' || pay.status === 'VERIFICATION'
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                        : pay.status === 'OVERDUE'
                        ? 'bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676] border-rose-200 dark:border-[#F27676]/30'
                        : 'bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D] border-amber-200 dark:border-[#F2C15D]/30'
                    }`}>
                      {pay.status === 'APPROVED' || pay.status === 'PAID' ? 'PAID ✓' :
                       pay.status === 'REJECTED' ? 'REJECTED ❌' :
                       pay.status === 'PENDING_VERIFICATION' || pay.status === 'VERIFICATION' ? 'VERIFICATION 🔍' :
                       pay.status === 'OVERDUE' ? 'OVERDUE ⚠️' : 'PENDING ⏳'}
                    </span>
                  </div>
                  <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
                    Submitted: {formatDate(pay.date || pay.createdAt)} • Ref/UTR: <strong className="font-mono text-[#1C2522] dark:text-[#F2F5F2]">{pay.referenceId || 'N/A'}</strong>
                  </p>
                  {pay.rejectionReason && pay.status === 'REJECTED' && (
                    <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
                      <strong>Rejection Note:</strong> {pay.rejectionReason}
                    </div>
                  )}
                  {pay.notes && (
                    <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4] italic">
                      "{pay.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {(pay.status === 'APPROVED' || pay.status === 'PAID') && (
                    <button
                      onClick={() => handleOpenOfficialReceipt(pay)}
                      className="py-2.5 px-4 rounded-xl tenant-bg-soft tenant-text-accent border tenant-border-accent text-xs font-black flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download Receipt</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBMIT PAYMENT MODAL */}
      {showPayModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowPayModal(false)}
          title="Submit Rent Payment UTR Details"
          subtitle="After completing the UPI payment via QR code, enter your transaction reference number."
          size="md"
          accentColor="emerald"
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-4 text-left font-sans">
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
                className="w-full bg-white dark:bg-[#101916] border border-[#DDD8CE] dark:border-[#293832] rounded-xl px-4 py-2.5 text-xs text-[#1C2522] dark:text-[#F2F5F2] font-black focus:outline-none"
                placeholder="Enter amount (e.g. 6500)"
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
                className="w-full bg-white dark:bg-[#101916] border border-[#DDD8CE] dark:border-[#293832] rounded-xl px-4 py-2.5 text-xs text-[#1C2522] dark:text-[#F2F5F2] font-bold focus:outline-none"
              >
                <option value="ONLINE">UPI / GPay / PhonePe / Paytm</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="CASH">Cash directly to Warden</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">
                UTR / Transaction Reference Number *
              </label>
              <input
                type="text"
                value={payRefId}
                onChange={(e) => setPayRefId(e.target.value)}
                className="w-full bg-white dark:bg-[#101916] border border-[#DDD8CE] dark:border-[#293832] rounded-xl px-4 py-2.5 text-xs text-[#1C2522] dark:text-[#F2F5F2] font-mono focus:outline-none"
                placeholder="Enter 12-digit UPI UTR / Ref ID"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">
                Optional Payment Note
              </label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full bg-white dark:bg-[#101916] border border-[#DDD8CE] dark:border-[#293832] rounded-xl px-4 py-2.5 text-xs text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none"
                placeholder="e.g. September rent payment"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="py-2.5 px-5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-6 rounded-xl tenant-bg-accent text-xs font-black shadow-md hover:scale-105 transition-all"
              >
                {submitting ? 'Submitting...' : 'SUBMIT PAYMENT →'}
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
