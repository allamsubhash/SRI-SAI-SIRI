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
  FileText,
  ShieldCheck,
  RotateCcw,
  QrCode,
  Share2,
  Printer,
  History,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { formatINR, formatDate, formatDateTime } from '@/utils/formatters';
import OfficialPaymentReceiptModal, { OfficialReceiptData } from '@/components/OfficialPaymentReceiptModal';
import TenantDetailsModal from '@/components/TenantDetailsModal';
import { UnifiedBill, PaymentTransaction, ReminderRecord, FinancialAuditLog, calculateBillStatus } from '@/lib/billingService';

export default function OwnerPaymentsPage() {
  const { showToast } = useToast();
  
  // Primary Workspace Data
  const [bills, setBills] = useState<UnifiedBill[]>([]);
  const [allBills, setAllBills] = useState<UnifiedBill[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<PaymentTransaction[]>([]);
  const [transactionsLedger, setTransactionsLedger] = useState<PaymentTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLog[]>([]);
  const [summary, setSummary] = useState<any>({
    totalExpected: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    collectionRate: 0,
    counts: { all: 0, paid: 0, partial: 0, due: 0, overdue: 0, verificationPending: 0 }
  });
  const [loading, setLoading] = useState(true);

  // Slicers and Filters
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'bills' | 'verification' | 'ledger' | 'audit'>('bills');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE' | 'VERIFICATION_PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Side Panel State
  const [selectedBillForDetails, setSelectedBillForDetails] = useState<UnifiedBill | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedTenantForPopup, setSelectedTenantForPopup] = useState<any>(null);

  // Record Payment Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordTenantId, setRecordTenantId] = useState('');
  const [recordInvoiceId, setRecordInvoiceId] = useState('');
  const [recordAmount, setRecordAmount] = useState<number | ''>(8500);
  const [recordMethod, setRecordMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Card' | 'Other'>('UPI');
  const [recordType, setRecordType] = useState('Monthly Rent');
  const [recordTxnId, setRecordTxnId] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordNotes, setRecordNotes] = useState('');
  const [recordingLoading, setRecordingLoading] = useState(false);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    tenantName: string;
    amount: number;
    remaining: number;
    status: string;
    receiptData: OfficialReceiptData | null;
  } | null>(null);

  // Verification Review Modal
  const [selectedVerificationTxn, setSelectedVerificationTxn] = useState<PaymentTransaction | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [rejectReasonPrompt, setRejectReasonPrompt] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Transaction reference mismatch');
  const [actionLoading, setActionLoading] = useState(false);

  // Send Reminder Modal
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTargetBill, setReminderTargetBill] = useState<UnifiedBill | null>(null);
  const [reminderType, setReminderType] = useState<'Upcoming Due' | 'Due Today' | 'Overdue' | 'Manual Reminder'>('Upcoming Due');
  const [reminderChannel, setReminderChannel] = useState<'WhatsApp' | 'SMS' | 'Portal'>('WhatsApp');
  const [reminderStatusFeedback, setReminderStatusFeedback] = useState<{ alreadySent: boolean; message: string; sentAt?: string } | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);

  // Reversal / Refund Modal
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [reversalTargetTxn, setReversalTargetTxn] = useState<PaymentTransaction | null>(null);
  const [reversalReason, setReversalReason] = useState('Accidental duplicate recording');
  const [reversingLoading, setReversingLoading] = useState(false);

  // Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<OfficialReceiptData | null>(null);

  // QR Settings State
  const [qrSettings, setQrSettings] = useState({
    qrCodeUrl: '/uploads/sample_qr.png',
    upiId: 'srisaisiri@upi',
    instructions: 'Scan & Pay using any UPI app (GPay, PhonePe, Paytm) and enter 12-digit UTR reference.'
  });
  const [savingQR, setSavingQR] = useState(false);

  // Fetch Payments Workspace Data
  const fetchWorkspaceData = async (isInitial: boolean = false) => {
    if (isInitial) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth !== 'ALL') params.set('month', selectedMonth);
      if (selectedBuilding !== 'ALL') params.set('buildingId', selectedBuilding);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBills(data.bills || []);
        setAllBills(data.allBills || []);
        setSummary(data.summary || {
          totalExpected: 0,
          totalCollected: 0,
          totalOutstanding: 0,
          totalOverdue: 0,
          collectionRate: 0,
          counts: { all: 0, paid: 0, partial: 0, due: 0, overdue: 0, verificationPending: 0 }
        });
        setVerificationQueue(data.verificationQueue || []);
        setTransactionsLedger(data.transactionsLedger || []);
        setAuditLogs(data.auditLogs || []);

        // Also sync selected bill in details drawer if open
        if (selectedBillForDetails) {
          const updated = (data.allBills || []).find((b: UnifiedBill) => b.id === selectedBillForDetails.id);
          if (updated) setSelectedBillForDetails(updated);
        }
      }

      // Fetch QR Settings
      const qrRes = await fetch('/api/settings/qr');
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        if (qrData.settings) {
          setQrSettings({
            qrCodeUrl: qrData.settings.qrCodeUrl || '/uploads/sample_qr.png',
            upiId: qrData.settings.upiId || 'srisaisiri@upi',
            instructions: qrData.settings.instructions || ''
          });
        }
      }
    } catch (e) {
      console.error('Error fetching payments workspace:', e);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData(true);
    const interval = setInterval(() => fetchWorkspaceData(false), 8000);
    return () => clearInterval(interval);
  }, [selectedMonth, selectedBuilding, statusFilter, searchQuery]);

  // Available Months Generator
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    allBills.forEach(b => {
      if (b.billingMonth) set.add(b.billingMonth);
      if (b.billingPeriod) set.add(b.billingPeriod);
    });
    const list = Array.from(set);
    if (!list.includes('September 2026')) list.unshift('September 2026');
    if (!list.includes('August 2026')) list.push('August 2026');
    if (!list.includes('July 2026')) list.push('July 2026');
    return list;
  }, [allBills]);

  // Target Bill for Record Modal calculation
  const targetRecordBill = useMemo(() => {
    if (recordInvoiceId) {
      return allBills.find(b => b.id === recordInvoiceId) || null;
    }
    if (recordTenantId) {
      return allBills.find(b => b.tenantId === recordTenantId) || null;
    }
    return null;
  }, [allBills, recordInvoiceId, recordTenantId]);

  // Live calculation for Record Payment Modal
  const liveCalculation = useMemo(() => {
    const totalBill = targetRecordBill ? targetRecordBill.amount : 8500;
    const alreadyPaid = targetRecordBill ? targetRecordBill.paidAmount : 0;
    const payment = Number(recordAmount) || 0;
    const cleanTotal = Number(Number(totalBill).toFixed(2));
    const cleanPaid = Number((alreadyPaid + payment).toFixed(2));
    const remaining = Math.max(0, Number((cleanTotal - cleanPaid).toFixed(2)));
    const dueDateStr = targetRecordBill?.dueDate || new Date().toISOString().split('T')[0];
    const computedStatus = calculateBillStatus(cleanTotal, cleanPaid, dueDateStr, false, new Date());
    return {
      totalBill,
      alreadyPaid,
      newPayment: payment,
      remaining,
      resultingStatus: computedStatus === 'PARTIAL' ? 'PARTIAL' : computedStatus === 'OVERDUE' ? 'OVERDUE' : computedStatus === 'PAID' ? 'PAID' : 'DUE'
    };
  }, [targetRecordBill, recordAmount]);

  // Helper to open Record Payment modal for a specific bill
  const handleOpenRecordForBill = (bill: UnifiedBill) => {
    setRecordTenantId(bill.tenantId);
    setRecordInvoiceId(bill.id);
    setRecordAmount(bill.outstandingAmount > 0 ? bill.outstandingAmount : bill.amount);
    setRecordMethod('UPI');
    setRecordType(bill.billType || 'Monthly Rent');
    setRecordTxnId('');
    setRecordDate(new Date().toISOString().split('T')[0]);
    setRecordNotes('');
    setShowRecordModal(true);
  };

  // Record Payment Submission Handler
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTenantId && !recordInvoiceId) {
      showToast('Please select a resident to record payment.', 'error');
      return;
    }
    if (!recordAmount || Number(recordAmount) <= 0) {
      showToast('Please enter a valid payment amount.', 'error');
      return;
    }

    setRecordingLoading(true);
    try {
      const res = await fetch('/api/payments/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: recordTenantId,
          invoiceId: recordInvoiceId || undefined,
          amount: Number(recordAmount),
          paymentMethod: recordMethod,
          paymentType: recordType,
          referenceId: recordTxnId.trim() || undefined,
          paymentDate: recordDate,
          notes: recordNotes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(data.error || 'Failed to record payment.', 'error');
      } else {
        showToast('Payment recorded successfully!', 'success');
        setShowRecordModal(false);

        // Prepare Success Modal Data
        const tenantName = targetRecordBill?.tenantName || 'Resident';
        const receipt: OfficialReceiptData = {
          receiptNo: data.payment?.receiptNumber || `SSR-RCP-2026-${Date.now().toString().slice(-6)}`,
          date: recordDate,
          tenantId: targetRecordBill?.tenantId || recordTenantId,
          tenantName: tenantName,
          roomNumber: targetRecordBill?.roomNumber || 'A-101',
          buildingName: targetRecordBill?.buildingName,
          mobileNumber: targetRecordBill?.tenantPhone || '9876543210',
          billingPeriod: targetRecordBill?.billingPeriod || 'Current Month',
          paymentMethod: recordMethod,
          referenceId: recordTxnId || 'OFFICIAL_RECORDED',
          paymentStatus: liveCalculation.resultingStatus,
          items: [
            {
              sNo: 1,
              accountHead: `${recordType} (${targetRecordBill?.billingPeriod || 'Current Period'})`,
              amount: Number(recordAmount)
            }
          ],
          totalAmount: Number(recordAmount),
          billAmount: liveCalculation.totalBill,
          previousPaid: liveCalculation.alreadyPaid,
          currentPayment: Number(recordAmount),
          remainingDue: liveCalculation.remaining
        };

        setSuccessData({
          tenantName,
          amount: Number(recordAmount),
          remaining: liveCalculation.remaining,
          status: liveCalculation.resultingStatus,
          receiptData: receipt
        });
        setShowSuccessModal(true);

        // Refresh Data
        fetchWorkspaceData(false);
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred while recording payment.', 'error');
    } finally {
      setRecordingLoading(false);
    }
  };

  // View Receipt Handler
  const handleOpenReceipt = (bill: UnifiedBill, txn?: PaymentTransaction) => {
    if (bill.status !== 'PAID' && bill.outstandingAmount > 0.01) {
      showToast('Receipts are generated only after full payment is completed.', 'info');
      return;
    }
    const rawNumber = bill.number.replace(/[^A-Za-z0-9]/g, '');
    const receiptNo = txn?.receiptNumber || `SSR-RCP-2026-${rawNumber.slice(-6).padStart(6, '0')}`;

    const items = bill.items && bill.items.length > 0 
      ? bill.items.map((it, idx) => ({ sNo: idx + 1, accountHead: it.description || 'HOSTEL RENT', amount: Number(it.amount) }))
      : [{ sNo: 1, accountHead: `${bill.billType || 'HOSTEL RENT'} - ${bill.billingPeriod}`, amount: Number(txn?.amount || bill.paidAmount || bill.amount) }];

    const data: OfficialReceiptData = {
      receiptNo,
      date: txn?.date || bill.lastPaymentDate || bill.dueDate,
      verifiedDate: txn?.status === 'APPROVED' ? txn.date : undefined,
      tenantId: bill.tenantId,
      tenantName: bill.tenantName,
      roomNumber: bill.roomNumber,
      buildingName: bill.buildingName,
      mobileNumber: bill.tenantPhone || '9876543210',
      billingPeriod: bill.billingPeriod,
      paymentMethod: txn?.paymentMethod || 'UPI',
      referenceId: txn?.referenceId || 'UTR-VERIFIED',
      recordedBy: txn?.recordedBy || 'Manager',
      paymentStatus: bill.status,
      items,
      billAmount: bill.amount,
      previousPaid: Math.max(0, bill.paidAmount - (txn?.amount || 0)),
      currentPayment: Number(txn?.amount || bill.paidAmount || bill.amount),
      totalAmount: Number(txn?.amount || bill.paidAmount || bill.amount),
      remainingDue: bill.outstandingAmount
    };

    setReceiptData(data);
    setShowReceiptModal(true);
  };

  // Open Tenant Profile Popup Modal
  const handleOpenTenantPopupForBill = (bill: UnifiedBill) => {
    setSelectedTenantForPopup({
      id: bill.tenantId,
      name: bill.tenantName,
      roomNumber: bill.roomNumber,
      buildingName: bill.buildingName,
      rentAmount: bill.amount,
      phone: bill.tenantPhone,
      email: bill.tenantEmail,
      status: bill.status
    });
  };

  // Open Reminder Modal
  const handleOpenReminderModal = (bill: UnifiedBill) => {
    setReminderTargetBill(bill);
    setReminderType(bill.status === 'OVERDUE' ? 'Overdue' : 'Upcoming Due');
    setReminderChannel('WhatsApp');
    setReminderStatusFeedback(null);
    setShowReminderModal(true);
  };

  // Send Reminder Handler
  const handleSendReminderSubmit = async () => {
    if (!reminderTargetBill) return;
    setSendingReminder(true);
    setReminderStatusFeedback(null);

    try {
      const res = await fetch('/api/payments/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: reminderTargetBill.id,
          reminderType,
          channel: reminderChannel
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(data.error || 'Failed to send reminder.', 'error');
      } else {
        if (data.alreadySent) {
          setReminderStatusFeedback({
            alreadySent: true,
            message: `A '${reminderType}' reminder was already sent to ${reminderTargetBill.tenantName} on ${new Date(data.sentAt).toLocaleString('en-IN')}.`,
            sentAt: data.sentAt
          });
          showToast('Reminder already recorded as sent.', 'info');
        } else {
          setReminderStatusFeedback({
            alreadySent: false,
            message: `✓ Reminder logged and sent successfully via ${reminderChannel}!`
          });
          showToast(`Reminder sent to ${reminderTargetBill.tenantName}!`, 'success');
          fetchWorkspaceData(false);

          // If WhatsApp channel, optionally open WhatsApp web link
          if (reminderChannel === 'WhatsApp' && reminderTargetBill.tenantPhone) {
            const cleanPhone = reminderTargetBill.tenantPhone.replace(/[^0-9]/g, '');
            const msg = encodeURIComponent(
              `Hello ${reminderTargetBill.tenantName},\nThis is a gentle payment reminder from Sri Sai Siri Boys Hostel.\n\n` +
              `Bill: ${reminderTargetBill.billingPeriod} Rent\nAmount: ₹${reminderTargetBill.amount.toLocaleString('en-IN')}\n` +
              `Paid: ₹${reminderTargetBill.paidAmount.toLocaleString('en-IN')}\nOutstanding: ₹${reminderTargetBill.outstandingAmount.toLocaleString('en-IN')}\n` +
              `Due Date: ${formatDate(reminderTargetBill.dueDate)}\n\nPlease settle your dues at your earliest convenience. Thank you!`
            );
            window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${msg}`, '_blank');
          }
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error sending reminder.', 'error');
    } finally {
      setSendingReminder(false);
    }
  };

  // Payment Verification Handlers
  const handleApproveVerification = async (paymentId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(data.error || 'Failed to approve payment.', 'error');
      } else {
        showToast('Payment verified and approved successfully!', 'success');
        setShowVerificationModal(false);
        fetchWorkspaceData(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Error approving payment.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectVerification = async (paymentId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, rejectionReason })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(data.error || 'Failed to reject payment.', 'error');
      } else {
        showToast('Payment submission rejected and audit log recorded.', 'info');
        setShowVerificationModal(false);
        setRejectReasonPrompt(false);
        fetchWorkspaceData(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Error rejecting payment.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Reversal Handler
  const handleReversalSubmit = async () => {
    if (!reversalTargetTxn) return;
    setReversingLoading(true);
    try {
      const res = await fetch('/api/payments/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: reversalTargetTxn.id,
          reason: reversalReason
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(data.error || 'Failed to reverse transaction.', 'error');
      } else {
        showToast('Transaction reversed successfully. Audit trail preserved.', 'success');
        setShowReversalModal(false);
        fetchWorkspaceData(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Error reversing transaction.', 'error');
    } finally {
      setReversingLoading(false);
    }
  };

  // Save QR Settings Handler
  const handleSaveQRSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQR(true);
    try {
      const res = await fetch('/api/settings/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qrSettings)
      });
      if (res.ok) {
        showToast('Hostel UPI QR & Payment settings updated!', 'success');
      } else {
        showToast('Failed to save QR settings.', 'error');
      }
    } catch (err) {
      showToast('Error saving settings.', 'error');
    } finally {
      setSavingQR(false);
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Tenant Name', 'Room', 'Building', 'Payment Type', 'Method', 'Amount (INR)', 'Reference / UTR', 'Status', 'Recorded By'];
    const rows = transactionsLedger.map(t => [
      t.id,
      t.date,
      `"${t.tenantName || 'Resident'}"`,
      t.roomNumber || 'A-101',
      `"${t.buildingName || 'Hostel'}"`,
      t.type,
      t.paymentMethod,
      t.amount,
      `"${t.referenceId || 'N/A'}"`,
      t.status,
      `"${t.recordedBy || 'Manager'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hostel_Financial_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transaction statement CSV exported successfully!', 'success');
  };

  // Status Change Handler
  const handleStatusChange = async (billId: string, tenantId: string, tenantName: string, newStatus: string) => {
    if (newStatus === 'PARTIAL') {
      const bill = allBills.find(b => b.id === billId || b.tenantId === tenantId);
      if (bill) {
        handleOpenRecordForBill(bill);
        return;
      }
    }

    try {
      const res = await fetch('/api/payments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: billId,
          tenantId,
          status: newStatus
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(data.error || 'Failed to update payment status.', 'error');
      } else {
        showToast(`Payment status updated to ${newStatus} for ${tenantName}!`, 'success');
        fetchWorkspaceData(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating payment status.', 'error');
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PAID
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            PARTIAL
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            OVERDUE
          </span>
        );
      case 'VERIFICATION_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            VERIFICATION
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" />
            DUE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto text-left select-none">
      
      {/* ========================================================
          🏛️ 1. TOP HEADER & GLOBAL PRIMARY ACTION
         ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Payments
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                Track rent, collections, outstanding balances and transactions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              // Open reminder for the first unpaid bill or dispatch reminder
              const firstUnpaid = bills.find(b => b.outstandingAmount > 0);
              if (firstUnpaid) {
                handleOpenReminderModal(firstUnpaid);
              } else {
                showToast('All resident accounts are fully paid! No dues pending.', 'info');
              }
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send Due Reminders</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          📊 2. TOP SUMMARY OVERVIEW (SHOW ONLY COLLECTED AMOUNT)
         ======================================================== */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-emerald-500/20 dark:border-emerald-500/30 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Collected
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mt-0.5">
              {formatINR(summary.totalCollected)}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">
              Verified collections for active residency billing cycle
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            ● Real-Time Payment Ledger
          </span>
        </div>
      </div>

      {/* ========================================================
          🎛️ 3. UNIFIED SLICERS & WORKSPACE TABS BAR
         ======================================================== */}
      <div className="space-y-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-3xl shadow-sm">
        
        {/* Upper Slicers Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('bills')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'bills'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bills & Dues
            </button>

            <button
              onClick={() => setActiveTab('verification')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'verification'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Verification Queue</span>
              {verificationQueue.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {verificationQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Transaction Ledger
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Audit Trail
            </button>
          </div>

          {/* Month & Building Slicers */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Month Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">📅 All Months</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* Building Dropdown */}
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">🏢 All Buildings</option>
              <option value="b-1">Block A - Premium Executive</option>
              <option value="b-2">Block B - Classic Standard</option>
            </select>
          </div>

        </div>

        {/* Lower Search & Status Filter Pills */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          
          {/* Status Filter Pills (Active only in bills tab) */}
          {activeTab === 'bills' ? (
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {(['ALL', 'PAID', 'PARTIAL', 'DUE', 'OVERDUE', 'VERIFICATION_PENDING'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {st === 'ALL' && `All (${bills.length})`}
                  {st === 'PAID' && `Paid (${summary.counts?.paid || 0})`}
                  {st === 'PARTIAL' && `Partial (${summary.counts?.partial || 0})`}
                  {st === 'DUE' && `Due (${summary.counts?.due || 0})`}
                  {st === 'OVERDUE' && `Overdue (${summary.counts?.overdue || 0})`}
                  {st === 'VERIFICATION_PENDING' && `Verification (${summary.counts?.verificationPending || 0})`}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {activeTab === 'verification' && `Reviewing ${verificationQueue.length} tenant submitted proofs`}
              {activeTab === 'ledger' && `Displaying all ${transactionsLedger.length} financial transactions`}
              {activeTab === 'audit' && `Timeline of system financial events`}
            </div>
          )}

          {/* Search Box & Quick Export */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tenant, room or txn ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {activeTab === 'ledger' && (
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* ========================================================
          📋 4. TAB 1: BILLS & DUES TABLE (PRIMARY VIEW)
         ======================================================== */}
      {activeTab === 'bills' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden">
          
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400">Loading Authoritative Payment Records...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">All Payments Up To Date</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No outstanding payments matching the selected filters.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3.5 px-4">Tenant</th>
                      <th className="py-3.5 px-3">Room</th>
                      <th className="py-3.5 px-3">Building</th>
                      <th className="py-3.5 px-3">Billing Period</th>
                      <th className="py-3.5 px-3 text-right">Bill Amount</th>
                      <th className="py-3.5 px-3 text-right">Paid</th>
                      <th className="py-3.5 px-3 text-right">Outstanding</th>
                      <th className="py-3.5 px-3">Due Date</th>
                      <th className="py-3.5 px-3">Status</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-900 dark:text-slate-100 font-medium">
                    {bills.map((bill) => (
                      <tr 
                        key={bill.id}
                        onClick={() => handleOpenTenantPopupForBill(bill)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        {/* Tenant Name */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2.5 hover:text-emerald-600 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 shrink-0">
                              {bill.tenantName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="block font-black text-sm truncate">{bill.tenantName}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">{bill.number}</span>
                            </div>
                          </div>
                        </td>

                        {/* Room */}
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {bill.roomNumber}
                        </td>

                        {/* Building */}
                        <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                          {bill.buildingName.split('-')[0].trim()}
                        </td>

                        {/* Billing Period */}
                        <td className="py-3.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                          {bill.billingPeriod}
                        </td>

                        {/* Bill Amount */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatINR(bill.amount)}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatINR(bill.paidAmount)}
                        </td>

                        {/* Outstanding Remaining */}
                        <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                          <span className={bill.outstandingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}>
                            {formatINR(bill.outstandingAmount)}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(bill.dueDate)}
                        </td>

                        {/* Status Badge & Quick Selector */}
                        <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            {renderStatusBadge(bill.status)}
                            <select
                              value={bill.status === 'VERIFICATION_PENDING' ? 'DUE' : bill.status}
                              onChange={(e) => handleStatusChange(bill.id, bill.tenantId, bill.tenantName, e.target.value)}
                              className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 py-0.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                              title="Change Payment Status"
                            >
                              <option value="PAID">Set PAID</option>
                              <option value="PARTIAL">Set PARTIAL</option>
                              <option value="DUE">Set PENDING</option>
                              <option value="OVERDUE">Set OVERDUE</option>
                            </select>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">

                            <button
                              onClick={() => handleOpenRecordForBill(bill)}
                              title="Record or Edit Payment Amount"
                              className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-emerald-500/20"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{bill.outstandingAmount > 0 ? 'Collect' : 'Edit'}</span>
                            </button>

                            <button
                              onClick={() => handleOpenReceipt(bill)}
                              disabled={bill.status !== 'PAID' && bill.outstandingAmount > 0.01}
                              title={bill.status === 'PAID' || bill.outstandingAmount <= 0.01 ? "View Official Receipt" : "Receipt available after full payment"}
                              className={`p-1.5 rounded-xl transition-colors ${
                                bill.status === 'PAID' || bill.outstandingAmount <= 0.01
                                  ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer'
                                  : 'bg-slate-100/50 dark:bg-slate-800/30 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40'
                              }`}
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>

                            {bill.outstandingAmount > 0 && (
                              <button
                                onClick={() => handleOpenReminderModal(bill)}
                                title="Send Payment Reminder"
                                className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenTenantPopupForBill(bill)}
                              title="Open Resident Profile Popup"
                              className="p-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-colors cursor-pointer"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Responsive Cards */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/80 p-3 space-y-3">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    onClick={() => handleOpenTenantPopupForBill(bill)}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">{bill.tenantName}</h4>
                        <span className="text-xs text-slate-500 font-mono">Room {bill.roomNumber} • {bill.billingPeriod}</span>
                      </div>
                      <div>{renderStatusBadge(bill.status)}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl text-center border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Bill</span>
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-white">{formatINR(bill.amount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Paid</span>
                        <span className="text-xs font-mono font-bold text-emerald-600">{formatINR(bill.paidAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Outstanding</span>
                        <span className="text-xs font-mono font-black text-amber-600">{formatINR(bill.outstandingAmount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[11px] text-slate-400">Due: {formatDate(bill.dueDate)}</span>
                      <div className="flex items-center gap-2">
                        {bill.outstandingAmount > 0 && (
                          <button
                            onClick={() => handleOpenRecordForBill(bill)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenReceipt(bill)}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs"
                        >
                          Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      )}

      {/* ========================================================
          ⏳ 5. TAB 2: VERIFICATION QUEUE (PROOF REVIEW)
         ======================================================== */}
      {activeTab === 'verification' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">Tenant Payment Verification Queue</h3>
              <p className="text-xs text-slate-500">Review online payment submissions and verify transaction UTR receipts.</p>
            </div>
          </div>

          {verificationQueue.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">You're All Caught Up</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No pending payment verification requests in the queue right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {verificationQueue.map((txn) => (
                <div 
                  key={txn.id}
                  className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">{txn.tenantName}</h4>
                      <span className="text-xs text-slate-500 font-mono">Room {txn.roomNumber || 'A-101'}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-black border border-purple-500/20">
                      PENDING
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Submitted Amount</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatINR(txn.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Method</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{txn.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">UTR / Ref ID</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{txn.referenceId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date</span>
                      <span className="text-slate-600 dark:text-slate-400">{formatDate(txn.date)}</span>
                    </div>
                    {txn.notes && (
                      <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                        "{txn.notes}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedVerificationTxn(txn);
                        setRejectReasonPrompt(false);
                        setShowVerificationModal(true);
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition-all cursor-pointer"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleApproveVerification(txn.id)}
                      disabled={actionLoading}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          📖 6. TAB 3: TRANSACTION LEDGER
         ======================================================== */}
      {activeTab === 'ledger' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">Authoritative Financial Transaction Ledger</h3>
              <p className="text-xs text-slate-500">Non-destructive history of all recorded, verified, and reversed transactions.</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Statement</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-3">Txn ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4">Resident</th>
                  <th className="py-3 px-3">Room</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Reference / UTR</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Recorded By</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-900 dark:text-slate-100 font-medium">
                {transactionsLedger.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-500">{txn.id}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(txn.date)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{txn.tenantName || 'Resident'}</td>
                    <td className="py-3 px-3 font-mono">{txn.roomNumber || 'A-101'}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{txn.type}</td>
                    <td className={`py-3 px-3 text-right font-mono font-black ${txn.amount < 0 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatINR(txn.amount)}
                    </td>
                    <td className="py-3 px-3">{txn.paymentMethod}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                      {txn.referenceId || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        txn.status === 'APPROVED' || txn.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : txn.status === 'REFUNDED' || txn.status === 'REVERSED'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{txn.recordedBy || 'Manager'}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {txn.status !== 'REFUNDED' && txn.status !== 'REVERSED' && (
                          <button
                            onClick={() => {
                              setReversalTargetTxn(txn);
                              setReversalReason('Accidental double entry');
                              setShowReversalModal(true);
                            }}
                            title="Reverse / Refund Transaction"
                            className="p-1 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors cursor-pointer text-[10px] font-bold px-2 py-1 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reverse</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================
          📜 7. TAB 4: AUDIT TRAIL
         ======================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-5 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-base text-slate-900 dark:text-white">Financial Audit Trail & Event Timeline</h3>
            <p className="text-xs text-slate-500">Immutable log of payment recordings, verifications, reminders, and reversals.</p>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 font-black">
                  <History className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{formatDateTime(log.createdAt)}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium pt-1">{log.details}</p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">Performed by: {log.userName || 'System'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          🗂️ 9. TENANT PAYMENT DETAILS SIDE DRAWER / PANEL
         ======================================================== */}
      <AnimatePresence>
        {showDetailsDrawer && selectedBillForDetails && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailsDrawer(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full overflow-y-auto p-6 space-y-6 z-10 text-slate-900 dark:text-white"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Resident Payment Workspace
                  </span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {selectedBillForDetails.tenantName}
                  </h2>
                  <span className="text-xs text-slate-500 font-mono">
                    Room {selectedBillForDetails.roomNumber} • {selectedBillForDetails.buildingName}
                  </span>
                </div>

                <button
                  onClick={() => setShowDetailsDrawer(false)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bill Financial Summary Card */}
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-500 block">Billing Period</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">{selectedBillForDetails.billingPeriod}</span>
                  </div>
                  <div>
                    {renderStatusBadge(selectedBillForDetails.status)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Bill Amount</span>
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{formatINR(selectedBillForDetails.amount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Paid</span>
                    <span className="text-sm font-mono font-bold text-emerald-600">{formatINR(selectedBillForDetails.paidAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Outstanding</span>
                    <span className="text-sm font-mono font-black text-amber-600">{formatINR(selectedBillForDetails.outstandingAmount)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Due Date: <strong>{formatDate(selectedBillForDetails.dueDate)}</strong></span>
                  <span>Invoice: <strong className="font-mono">{selectedBillForDetails.number}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">

                <button
                  onClick={() => handleOpenReceipt(selectedBillForDetails)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Receipt</span>
                </button>

                {selectedBillForDetails.outstandingAmount > 0 && (
                  <button
                    onClick={() => handleOpenReminderModal(selectedBillForDetails)}
                    className="py-2.5 px-4 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-500/20 cursor-pointer"
                    title="Send Payment Reminder"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Transaction History Section */}
              <div className="space-y-3">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>Transaction History ({selectedBillForDetails.transactions.length})</span>
                </h4>

                {selectedBillForDetails.transactions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl text-center">
                    No payment transactions recorded yet for this bill.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedBillForDetails.transactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900 dark:text-white">{formatINR(txn.amount)}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {txn.paymentMethod}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              txn.status === 'APPROVED' || txn.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {txn.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {formatDate(txn.date)} • Ref: {txn.referenceId || 'N/A'} • By: {txn.recordedBy || 'Manager'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleOpenReceipt(selectedBillForDetails, txn)}
                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 text-xs font-bold cursor-pointer"
                          title="View Receipt for this transaction"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reminder History Section */}
              <div className="space-y-3">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Reminder History</span>
                </h4>

                {selectedBillForDetails.reminders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl text-center">
                    No reminders have been triggered for this bill.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedBillForDetails.reminders.map((rem) => (
                      <div
                        key={rem.id}
                        className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-amber-800 dark:text-amber-300 block">{rem.type} ({rem.channel})</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Sent on {formatDateTime(rem.sentAt)} by {rem.sentBy}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600">
                          <Check className="w-3.5 h-3.5" /> Sent
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          💳 10. RECORD PAYMENT MODAL (POPUP WITH LIVE MATH)
         ======================================================== */}
      <NeonModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="Record Tenant Payment"
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-left">
          
          {/* Tenant Selector */}
          <div>
            <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
              Select Tenant / Account
            </label>
            <select
              value={recordTenantId}
              onChange={(e) => {
                setRecordTenantId(e.target.value);
                const matched = allBills.find(b => b.tenantId === e.target.value);
                if (matched) {
                  setRecordInvoiceId(matched.id);
                  setRecordAmount(matched.outstandingAmount > 0 ? matched.outstandingAmount : matched.amount);
                }
              }}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              required
            >
              <option value="">-- Choose Resident --</option>
              {allBills.map(b => (
                <option key={b.tenantId} value={b.tenantId}>
                  {b.tenantName} (Room {b.roomNumber} - Due: ₹{b.outstandingAmount})
                </option>
              ))}
            </select>
          </div>

          {/* Live Balance Calculation Box */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Live Balance Calculation</span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Bill</span>
                <span className="font-mono font-bold">{formatINR(liveCalculation.totalBill)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Already Paid</span>
                <span className="font-mono font-bold text-emerald-600">{formatINR(liveCalculation.alreadyPaid)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">New Payment</span>
                <span className="font-mono font-bold text-blue-600">{formatINR(liveCalculation.newPayment)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Remaining</span>
                <span className="font-mono font-black text-amber-600">{formatINR(liveCalculation.remaining)}</span>
              </div>
            </div>
          </div>

          {/* Payment Amount & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                Payment Amount (INR)
              </label>
              <input
                type="number"
                value={recordAmount}
                onChange={(e) => setRecordAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                min={1}
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                Payment Method
              </label>
              <select
                value={recordMethod}
                onChange={(e) => setRecordMethod(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash at Reception</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Other">Other Adjustment</option>
              </select>
            </div>
          </div>

          {/* Payment Type & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                Payment Type
              </label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Monthly Rent">Monthly Rent</option>
                <option value="Security Deposit">Security Deposit</option>
                <option value="Advance">Advance Payment</option>
                <option value="Mess/Food">Mess / Food</option>
                <option value="Electricity">Electricity</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other Charges">Other Charges</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Reference ID & Notes */}
          <div>
            <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
              Transaction ID / UTR Reference
            </label>
            <input
              type="text"
              placeholder="e.g. UPI489237492102"
              value={recordTxnId}
              onChange={(e) => setRecordTxnId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
              Internal Notes
            </label>
            <input
              type="text"
              placeholder="Optional notes..."
              value={recordNotes}
              onChange={(e) => setRecordNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowRecordModal(false)}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordingLoading}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {recordingLoading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>

        </form>
      </NeonModal>

      {/* ========================================================
          🎉 11. PAYMENT RECORDED SUCCESS MODAL
         ======================================================== */}
      <NeonModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Payment Recorded"
      >
        {successData && (
          <div className="text-center space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Payment Recorded Successfully
              </h3>
              <p className="text-xs text-slate-500 pt-1">
                Transaction ledger updated and receipt generated.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tenant</span>
                <span className="font-bold text-slate-900 dark:text-white">{successData.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-mono font-black text-emerald-600 text-sm">{formatINR(successData.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining Balance</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">{formatINR(successData.remaining)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Status</span>
                <span className="font-black text-emerald-600 uppercase text-xs">{successData.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (successData.receiptData) {
                    setReceiptData(successData.receiptData);
                    setShowReceiptModal(true);
                  }
                }}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download Receipt</span>
              </button>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </NeonModal>

      {/* ========================================================
          🔍 12. PAYMENT VERIFICATION REVIEW MODAL
         ======================================================== */}
      <NeonModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        title="Payment Verification Review"
      >
        {selectedVerificationTxn && (
          <div className="space-y-4 text-left text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tenant Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedVerificationTxn.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">{selectedVerificationTxn.roomNumber || 'A-101'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Submitted</span>
                <span className="font-mono font-black text-emerald-600 text-sm">{formatINR(selectedVerificationTxn.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedVerificationTxn.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID / UTR</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedVerificationTxn.referenceId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date</span>
                <span className="text-slate-700 dark:text-slate-300">{formatDate(selectedVerificationTxn.date)}</span>
              </div>
            </div>

            {selectedVerificationTxn.screenshotUrl ? (
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Payment Screenshot Proof</span>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-60 bg-slate-950 flex items-center justify-center">
                  <img 
                    src={selectedVerificationTxn.screenshotUrl} 
                    alt="Payment Proof" 
                    className="max-h-60 object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-slate-400 italic">
                No screenshot uploaded. Resident provided UTR: {selectedVerificationTxn.referenceId}
              </div>
            )}

            {rejectReasonPrompt ? (
              <div className="space-y-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl">
                <label className="font-bold text-rose-700 dark:text-rose-400 block">
                  Reason for Rejection
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setRejectReasonPrompt(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRejectVerification(selectedVerificationTxn.id)}
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setRejectReasonPrompt(true)}
                  className="px-4 py-2.5 rounded-2xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-bold text-xs cursor-pointer"
                >
                  Reject Payment
                </button>
                <button
                  onClick={() => handleApproveVerification(selectedVerificationTxn.id)}
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  {actionLoading ? 'Approving...' : 'Approve & Verify'}
                </button>
              </div>
            )}
          </div>
        )}
      </NeonModal>

      {/* ========================================================
          🔔 13. SEND PAYMENT REMINDER MODAL
         ======================================================== */}
      <NeonModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        title="Send Payment Reminder"
      >
        {reminderTargetBill && (
          <div className="space-y-4 text-left text-xs">
            
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white block">{reminderTargetBill.tenantName}</span>
              <span className="text-slate-500 font-mono">
                Outstanding: <strong className="text-amber-600">{formatINR(reminderTargetBill.outstandingAmount)}</strong> • Due: {formatDate(reminderTargetBill.dueDate)}
              </span>
            </div>

            {reminderStatusFeedback && (
              <div className={`p-3 rounded-2xl text-xs font-bold ${
                reminderStatusFeedback.alreadySent 
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
              }`}>
                {reminderStatusFeedback.message}
              </div>
            )}

            <div>
              <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                Reminder Event Type
              </label>
              <select
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Upcoming Due">Upcoming Due Reminder</option>
                <option value="Due Today">Due Today Reminder</option>
                <option value="Overdue">Overdue Reminder</option>
                <option value="Manual Reminder">Manual Custom Reminder</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                Notification Channel
              </label>
              <select
                value={reminderChannel}
                onChange={(e) => setReminderChannel(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="WhatsApp">WhatsApp (Direct Notification)</option>
                <option value="SMS">SMS Message</option>
                <option value="Portal">In-Portal Notification</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendReminderSubmit}
                disabled={sendingReminder}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-50"
              >
                {sendingReminder ? 'Checking & Sending...' : 'Send Reminder'}
              </button>
            </div>

          </div>
        )}
      </NeonModal>

      {/* ========================================================
          🔄 14. TRANSACTION REVERSAL / REFUND MODAL
         ======================================================== */}
      <NeonModal
        isOpen={showReversalModal}
        onClose={() => setShowReversalModal(false)}
        title="Reverse Financial Transaction"
      >
        {reversalTargetTxn && (
          <div className="space-y-4 text-left text-xs">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Audit Trail Safe Reversal</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                This will create an explicit refund/reversal transaction of <strong>{formatINR(reversalTargetTxn.amount)}</strong>. The original transaction {reversalTargetTxn.id} remains preserved in audit history.
              </p>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                Reason for Reversal / Refund
              </label>
              <input
                type="text"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Accidental double entry or deposit refund"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReversalModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReversalSubmit}
                disabled={reversingLoading}
                className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-50"
              >
                {reversingLoading ? 'Processing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        )}
      </NeonModal>

      {/* ========================================================
          📄 15. OFFICIAL RECEIPT MODAL
         ======================================================== */}
      {receiptData && (
        <OfficialPaymentReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          receiptData={receiptData}
        />
      )}

      {/* ========================================================
          👤 16. RESIDENT DETAILS & PAYMENT POPUP MODAL
         ======================================================== */}
      {selectedTenantForPopup && (
        <TenantDetailsModal
          isOpen={true}
          onClose={() => setSelectedTenantForPopup(null)}
          tenant={selectedTenantForPopup}
          allBills={allBills}
          allTransactions={transactionsLedger}
          onSendReminder={(t) => {
            setSelectedTenantForPopup(null);
            const targetBill = bills.find(b => b.tenantId === t.id) || allBills.find(b => b.tenantId === t.id);
            if (targetBill) handleOpenReminderModal(targetBill);
          }}
        />
      )}

    </div>
  );
}
