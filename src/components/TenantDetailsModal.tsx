'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  Mail, 
  Building, 
  Calendar, 
  CreditCard, 
  Receipt, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Plus, 
  Edit2, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Printer,
  Download,
  Share2
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { formatINR, formatDate, formatDateTime } from '@/utils/formatters';
import OfficialPaymentReceiptModal, { OfficialReceiptData } from '@/components/OfficialPaymentReceiptModal';
import { computeTenantBillingState, UnifiedBill, PaymentTransaction } from '@/lib/billingService';

interface TenantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: any;
  allBills?: UnifiedBill[];
  allTransactions?: PaymentTransaction[];
  onRecordPayment?: (tenant: any) => void;
  onEditProfile?: (tenant: any) => void;
  onVacate?: (tenant: any) => void;
  onBlacklist?: (tenant: any) => void;
  onDelete?: (tenant: any) => void;
}

export default function TenantDetailsModal({
  isOpen,
  onClose,
  tenant,
  allBills = [],
  allTransactions = [],
  onRecordPayment,
  onEditProfile,
  onVacate,
  onBlacklist,
  onDelete
}: TenantDetailsModalProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<OfficialReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [livePayments, setLivePayments] = useState<PaymentTransaction[]>(allTransactions);
  const [liveBills, setLiveBills] = useState<UnifiedBill[]>(allBills);

  useEffect(() => {
    if (isOpen && tenant) {
      setLoadingDetails(true);
      // Realistic smooth load
      const timer = setTimeout(() => {
        setLoadingDetails(false);
      }, 350);

      // If bills/transactions weren't provided or need fresh sync, fetch from API
      if (allTransactions.length === 0 || allBills.length === 0) {
        fetch('/api/payments')
          .then(res => res.json())
          .then(data => {
            if (data.bills) setLiveBills(data.bills);
            if (data.transactionsLedger) setLivePayments(data.transactionsLedger);
          })
          .catch(err => console.error('Error fetching tenant billing details:', err));
      } else {
        setLiveBills(allBills);
        setLivePayments(allTransactions);
      }

      return () => clearTimeout(timer);
    }
  }, [isOpen, tenant, allBills, allTransactions]);

  // Authoritative billing calculation for this tenant
  const billingState = useMemo(() => {
    if (!tenant) return null;
    return computeTenantBillingState(tenant, liveBills, livePayments, []);
  }, [tenant, liveBills, livePayments]);

  if (!isOpen || !tenant) return null;

  const tenantName = tenant.name || tenant.profile?.firstName ? `${tenant.profile?.firstName || ''} ${tenant.profile?.lastName || ''}`.trim() : 'Resident';
  const roomNumber = tenant.roomNumber || tenant.room?.number || 'A-101';
  const bedNumber = tenant.bedNumber || tenant.bed?.number || 'Bed A';
  const buildingName = tenant.buildingName || tenant.building?.name || (roomNumber.startsWith('B') ? 'Block B - Classic Standard' : 'Block A - Premium Executive');
  const phone = tenant.phone || tenant.profile?.phone || '+91 98765 43210';
  const email = tenant.email || tenant.user?.email || 'resident@srisaisiri.com';
  const moveInDate = tenant.moveInDate || tenant.joiningDate || tenant.createdAt || '15 Jan 2026';
  const monthlyRent = Number(tenant.rentAmount || tenant.rent || billingState?.monthlyRent || 8500);

  // Derived financial metrics
  const totalPaid = billingState ? billingState.totalApprovedPaid : 0;
  const remainingDue = billingState ? billingState.remainingOutstanding : 0;
  const paymentStatus = billingState ? billingState.primaryStatus : (tenant.status === 'PAID' ? 'PAID' : 'DUE');

  // Find latest approved transaction for receipt
  const tenantTxns = (livePayments || []).filter((p: any) => 
    p.tenantId === tenant.id || 
    (tenant.userId && p.tenantId === tenant.userId) ||
    (p.tenantName && p.tenantName.toLowerCase().trim() === tenantName.toLowerCase().trim())
  );

  const latestApprovedPayment = tenantTxns.find((p: any) => p.status === 'APPROVED' || p.status === 'PAID') || tenantTxns[0];

  const handleOpenOfficialReceipt = (txn?: any) => {
    const targetTxn = txn || latestApprovedPayment;
    const receiptData: OfficialReceiptData = {
      receiptNo: targetTxn?.receiptNumber || `SSR-RCP-${Date.now().toString().slice(-6)}`,
      date: formatDate(targetTxn?.date || targetTxn?.createdAt || new Date()),
      verifiedDate: formatDate(targetTxn?.updatedAt || targetTxn?.date || new Date()),
      tenantId: tenant.id,
      tenantName: tenantName,
      roomNumber: roomNumber,
      buildingName: buildingName,
      mobileNumber: phone,
      billingPeriod: billingState?.currentBill?.billingPeriod || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      paymentMethod: targetTxn?.paymentMethod || 'UPI',
      referenceId: targetTxn?.referenceId || 'OFFICIAL_RECORDED',
      recordedBy: targetTxn?.recordedBy || 'Hostel Management',
      paymentStatus: 'PAID',
      billAmount: monthlyRent,
      previousPaid: Math.max(0, totalPaid - (targetTxn?.amount || 0)),
      currentPayment: targetTxn?.amount || monthlyRent,
      items: [
        {
          sNo: 1,
          accountHead: targetTxn?.notes || `Monthly Room Rent & Tariff (${billingState?.currentBill?.billingPeriod || 'Current Month'})`,
          amount: targetTxn?.amount || monthlyRent
        }
      ],
      totalAmount: targetTxn?.amount || monthlyRent,
      remainingDue: remainingDue,
      generatedOn: formatDateTime(new Date())
    };

    setSelectedReceipt(receiptData);
    setShowReceiptModal(true);
  };

  return (
    <>
      <NeonModal
        isOpen={isOpen}
        onClose={onClose}
        title="Resident Details & Billing"
        subtitle={`Room ${roomNumber} · ${bedNumber} • ${buildingName}`}
        size="lg"
        accentColor="purple"
      >
        <div className="space-y-6 text-left font-sans select-none">
          
          {/* 🌟 1. PROFILE HEADER CARD */}
          <div className="p-5 rounded-3xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-md shrink-0">
                {tenantName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg sm:text-xl font-black text-[#1C2522] dark:text-[#F2F5F2] truncate">
                    {tenantName}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    paymentStatus === 'PAID'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : paymentStatus === 'PARTIAL'
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                      : paymentStatus === 'OVERDUE'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse'
                      : paymentStatus === 'VERIFICATION_PENDING'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  }`}>
                    ● {paymentStatus === 'PAID' ? 'RENT PAID' : paymentStatus === 'PARTIAL' ? 'PARTIAL' : paymentStatus === 'OVERDUE' ? 'OVERDUE' : paymentStatus === 'VERIFICATION_PENDING' ? 'VERIFICATION' : 'PAYMENT DUE'}
                  </span>
                </div>
                <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium flex items-center gap-2">
                  <span>Room {roomNumber} ({bedNumber})</span>
                  <span>•</span>
                  <span>{buildingName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`tel:${phone}`}
                className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
              {onEditProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditProfile(tenant);
                  }}
                  className="py-2 px-3.5 rounded-xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs hover:bg-[#E5E0D5] transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 📋 2. CONTACT & RESIDENCY INFORMATION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
              <span className="text-[10px] font-bold text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">Phone Number</span>
              <a href={`tel:${phone}`} className="font-bold text-[#1C2522] dark:text-[#F2F5F2] hover:text-blue-500 block truncate">
                {phone}
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
              <span className="text-[10px] font-bold text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">Email Address</span>
              <a href={`mailto:${email}`} className="font-bold text-[#1C2522] dark:text-[#F2F5F2] hover:text-blue-500 block truncate">
                {email}
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
              <span className="text-[10px] font-bold text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">Joining Date</span>
              <span className="font-bold text-[#1C2522] dark:text-[#F2F5F2] block truncate">
                {formatDate(moveInDate)}
              </span>
            </div>
          </div>

          {/* 💳 3. LIVE PAYMENT & BILLING SUMMARY */}
          <div className="p-5 rounded-3xl bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-[#DDD8CE] dark:border-[#293832] space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-[#DDD8CE] dark:border-[#293832] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1C2522] dark:text-[#F2F5F2]">
                  Rent & Payment Status
                </h4>
              </div>
              <span className="text-[11px] font-bold text-[#68736E] dark:text-[#9BAAA4]">
                Cycle: {billingState?.currentBill?.billingPeriod || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
                <span className="text-[10px] font-bold text-[#68736E] dark:text-[#9BAAA4] uppercase block">Monthly Rent</span>
                <div className="text-base font-black text-[#1C2522] dark:text-[#F2F5F2] font-mono">
                  {formatINR(monthlyRent)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
                <span className="text-[10px] font-bold text-[#68736E] dark:text-[#9BAAA4] uppercase block">Amount Paid</span>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatINR(totalPaid)}
                </div>
              </div>

              {/* Due Amount (Rendered ONLY when remainingDue > 0) */}
              {remainingDue > 0 ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase block">Due Amount</span>
                  <div className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                    {formatINR(remainingDue)}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase block">Outstanding</span>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹0 (Settled)
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-1">
                <span className="text-[10px] font-bold text-[#68736E] dark:text-[#9BAAA4] uppercase block">Last Paid Date</span>
                <div className="text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] truncate mt-1">
                  {latestApprovedPayment?.date ? formatDate(latestApprovedPayment.date) : 'No payments yet'}
                </div>
              </div>
            </div>
          </div>

          {/* 🧾 4. PAYMENT RECEIPT SECTION */}
          <div className="p-5 rounded-3xl bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-[#DDD8CE] dark:border-[#293832] space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-[#DDD8CE] dark:border-[#293832] pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1C2522] dark:text-[#F2F5F2]">
                  Latest Payment Receipt
                </h4>
              </div>
              {latestApprovedPayment && (
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10">
                  {latestApprovedPayment.receiptNumber || 'SSR-RCP-VERIFIED'}
                </span>
              )}
            </div>

            {latestApprovedPayment ? (
              <div className="p-4 rounded-2xl bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 border border-[#DDD8CE] dark:border-[#293832] space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] block font-bold">Hostel</span>
                    <strong className="text-[#1C2522] dark:text-[#F2F5F2]">Sri Sai Siri Hostel</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] block font-bold">Payment Date</span>
                    <strong className="text-[#1C2522] dark:text-[#F2F5F2]">{formatDate(latestApprovedPayment.date || latestApprovedPayment.createdAt)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] block font-bold">Amount Paid</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatINR(latestApprovedPayment.amount)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] block font-bold">Payment Method</span>
                    <strong className="text-[#1C2522] dark:text-[#F2F5F2]">{latestApprovedPayment.paymentMethod || 'ONLINE UPI'}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DDD8CE] dark:border-[#293832] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-[11px] text-[#68736E] dark:text-[#9BAAA4]">
                    Reference / UTR: <span className="font-mono font-bold text-[#1C2522] dark:text-[#F2F5F2]">{latestApprovedPayment.referenceId || 'N/A'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenOfficialReceipt(latestApprovedPayment)}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Official Receipt →</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#68736E] dark:text-[#9BAAA4] rounded-2xl bg-[#F1EEE7]/50 dark:bg-[#1A2621]/50 border border-dashed border-[#DDD8CE] dark:border-[#293832] space-y-1">
                <Receipt className="w-8 h-8 text-slate-400 mx-auto opacity-40 mb-2" />
                <p className="font-bold text-[#1C2522] dark:text-[#F2F5F2]">No payments recorded yet</p>
                <p className="text-[11px]">Once a payment is recorded or approved, the official receipt will be available here.</p>
              </div>
            )}
          </div>

          {/* ⚡ 5. MODAL FOOTER ACTIONS */}
          {(onVacate || onBlacklist || onDelete) && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {onVacate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onVacate(tenant);
                  }}
                  className="py-2.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] hover:bg-[#DDD8CE] transition-colors cursor-pointer text-center"
                >
                  Vacate Room
                </button>
              )}
              {onBlacklist && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBlacklist(tenant);
                  }}
                  className="py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer text-center"
                >
                  Blacklist
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete(tenant);
                  }}
                  className="py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs font-bold text-rose-600 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-center"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#DDD8CE] dark:border-[#293832]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onRecordPayment && remainingDue > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRecordPayment(tenant);
                  }}
                  className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Payment ({formatINR(remainingDue)})</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs hover:bg-[#E5E0D5] dark:hover:bg-[#25362F] transition-all cursor-pointer"
            >
              Close Details
            </button>
          </div>

        </div>
      </NeonModal>

      {/* Official Receipt Sub-Modal */}
      {showReceiptModal && selectedReceipt && (
        <OfficialPaymentReceiptModal
          isOpen={true}
          onClose={() => setShowReceiptModal(false)}
          receiptData={selectedReceipt}
        />
      )}
    </>
  );
}
