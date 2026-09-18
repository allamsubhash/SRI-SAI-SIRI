'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, 
  Receipt, 
  FileText, 
  Plus, 
  Edit2, 
  ChevronRight
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
  const [livePayments, setLivePayments] = useState<PaymentTransaction[]>(allTransactions);
  const [liveBills, setLiveBills] = useState<UnifiedBill[]>(allBills);

  useEffect(() => {
    if (isOpen && tenant) {
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
    }
  }, [isOpen, tenant, allBills, allTransactions]);

  // Authoritative billing calculation for this tenant
  const billingState = useMemo(() => {
    if (!tenant) return null;
    return computeTenantBillingState(tenant, liveBills, livePayments, []);
  }, [tenant, liveBills, livePayments]);

  if (!isOpen || !tenant) return null;

  const tenantName = tenant.name || (tenant.profile?.firstName ? `${tenant.profile?.firstName || ''} ${tenant.profile?.lastName || ''}`.trim() : 'Resident');
  const roomNumber = tenant.roomNumber || tenant.room?.number || 'A-101';
  const bedNumber = tenant.bedNumber || tenant.bed?.number || 'Bed A';
  const buildingName = tenant.buildingName || tenant.building?.name || (roomNumber.startsWith('B') ? 'Block B - Classic Standard' : 'Block A - Premium Executive');
  const phone = tenant.phone || tenant.profile?.phone || '+91 98765 43210';
  const email = tenant.email || tenant.user?.email || 'resident@srisaisiri.com';
  const moveInDate = tenant.moveInDate || tenant.joiningDate || tenant.createdAt || '15 Jan 2026';
  const monthlyRent = Number(tenant.rentAmount || tenant.rent || billingState?.monthlyRent || 8500);

  // Derived financial metrics
  const totalPaid = billingState ? billingState.totalApprovedPaid : (tenant.status === 'PAID' ? monthlyRent : 0);
  const remainingDue = billingState ? billingState.remainingOutstanding : (tenant.status === 'PAID' ? 0 : monthlyRent);
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
    const isPaid = totalPaid >= monthlyRent || (targetTxn && (targetTxn.status === 'APPROVED' || targetTxn.status === 'PAID'));
    
    const receiptData: OfficialReceiptData = {
      receiptNo: targetTxn?.receiptNumber || `SSR-RCP-${Date.now().toString().slice(-6)}`,
      date: formatDate(targetTxn?.date || targetTxn?.createdAt || new Date()),
      verifiedDate: targetTxn?.updatedAt ? formatDate(targetTxn.updatedAt) : undefined,
      tenantId: tenant.id || 'TEN-001',
      tenantName: tenantName,
      roomNumber: roomNumber,
      buildingName: buildingName,
      mobileNumber: phone,
      billingPeriod: billingState?.currentBill?.billingPeriod || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      paymentMethod: targetTxn?.paymentMethod || (isPaid ? 'UPI' : 'OFFICIAL TARIFF'),
      referenceId: targetTxn?.referenceId || (isPaid ? 'SSR-VERIFIED-TXN' : 'OFFICIAL_INVOICE'),
      recordedBy: targetTxn?.recordedBy || 'Sri Sai Siri Management',
      paymentStatus: isPaid ? 'PAID' : remainingDue < monthlyRent && remainingDue > 0 ? 'PARTIAL' : 'DUE',
      billAmount: monthlyRent,
      previousPaid: Math.max(0, totalPaid - (targetTxn?.amount || 0)),
      currentPayment: targetTxn?.amount || (isPaid ? monthlyRent : totalPaid > 0 ? totalPaid : monthlyRent),
      items: [
        {
          sNo: 1,
          accountHead: targetTxn?.notes || `Room Rent & Boarding (${billingState?.currentBill?.billingPeriod || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})`,
          amount: targetTxn?.amount || (isPaid ? monthlyRent : monthlyRent)
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
        title={`Resident Profile: ${tenantName}`}
        subtitle={`Room ${roomNumber} (${bedNumber}) • ${buildingName}`}
        size="md"
        accentColor="purple"
      >
        <div className="space-y-4 text-left font-sans select-none">
          
          {/* 🌟 1. COMPACT PROFILE HEADER */}
          <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-sm shrink-0">
                {tenantName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#1C2522] dark:text-[#F2F5F2] truncate">
                    {tenantName}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                    paymentStatus === 'PAID'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : paymentStatus === 'PARTIAL'
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                      : paymentStatus === 'OVERDUE'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  }`}>
                    ● {paymentStatus === 'PAID' ? 'PAID' : paymentStatus === 'PARTIAL' ? 'PARTIAL' : paymentStatus === 'OVERDUE' ? 'OVERDUE' : 'DUE'}
                  </span>
                </div>
                <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4] font-bold mt-0.5 truncate">
                  Room {roomNumber} · {bedNumber} • {buildingName.split('-')[0].trim()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`tel:${phone}`}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-sm transition-transform active:scale-95"
                title="Call Resident"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              {onEditProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditProfile(tenant);
                  }}
                  className="p-2.5 rounded-xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] text-[#1C2522] dark:text-[#F2F5F2] hover:text-purple-500 font-bold text-xs transition-all cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 📋 2. CONTACT INFO GRID */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] space-y-0.5">
              <span className="text-[10px] font-bold text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">Phone</span>
              <a href={`tel:${phone}`} className="font-bold text-[#1C2522] dark:text-[#F2F5F2] hover:text-blue-500 block truncate">
                {phone}
              </a>
            </div>

            <div className="p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] space-y-0.5">
              <span className="text-[10px] font-bold text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">Joined Date</span>
              <span className="font-bold text-[#1C2522] dark:text-[#F2F5F2] block truncate">
                {formatDate(moveInDate)}
              </span>
            </div>
          </div>

          {/* 💳 3. LIVE FINANCIAL OVERVIEW */}
          <div className="p-3.5 rounded-2xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] space-y-2.5 shadow-sm">
            <div className="flex justify-between items-center text-[11px] font-bold text-[#68736E] dark:text-[#9BAAA4]">
              <span className="uppercase tracking-wider">Financial Overview</span>
              <span>Cycle: {billingState?.currentBill?.billingPeriod || new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832]">
                <span className="text-[9px] font-bold text-[#68736E] dark:text-[#9BAAA4] uppercase block">Monthly Rent</span>
                <span className="text-sm font-black text-[#1C2522] dark:text-[#F2F5F2] font-mono block mt-0.5">
                  {formatINR(monthlyRent)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832]">
                <span className="text-[9px] font-bold text-[#68736E] dark:text-[#9BAAA4] uppercase block">Total Paid</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                  {formatINR(totalPaid)}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                remainingDue > 0 
                  ? 'bg-amber-500/10 border-amber-500/30' 
                  : 'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                <span className={`text-[9px] font-black uppercase block ${
                  remainingDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {remainingDue > 0 ? 'Due Amount' : 'Balance'}
                </span>
                <span className={`text-sm font-black font-mono block mt-0.5 ${
                  remainingDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {remainingDue > 0 ? formatINR(remainingDue) : '₹0'}
                </span>
              </div>
            </div>
          </div>

          {/* 🧾 4. GUARANTEED OFFICIAL RECEIPT ACTION CARD */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2] truncate">
                  Official Payment Receipt
                </h4>
                <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] font-medium truncate">
                  {latestApprovedPayment ? `Ref: ${latestApprovedPayment.receiptNumber || 'VERIFIED'}` : `Rent Tariff • ${roomNumber}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenOfficialReceipt()}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Receipt →</span>
            </button>
          </div>

          {/* ⚡ 5. LIFECYCLE CONTROLS & FOOTER */}
          {(onVacate || onBlacklist || onDelete) && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {onVacate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onVacate(tenant);
                  }}
                  className="py-2 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[11px] font-bold text-[#1C2522] dark:text-[#F2F5F2] hover:bg-[#DDD8CE] transition-colors cursor-pointer text-center"
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
                  className="py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer text-center"
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
                  className="py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[11px] font-bold text-rose-600 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-center"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#DDD8CE] dark:border-[#293832]">
            {onRecordPayment && remainingDue > 0 ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRecordPayment(tenant);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Payment ({formatINR(remainingDue)})</span>
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs hover:bg-[#E5E0D5] dark:hover:bg-[#25362F] transition-all cursor-pointer"
            >
              Close
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
