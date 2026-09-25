'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Printer, 
  Download, 
  Building, 
  ShieldCheck, 
  Share2, 
  Check, 
  Crown,
  User,
  Phone,
  CreditCard,
  Bed,
  Calendar,
  FileText,
  Clock,
  ClipboardList,
  ArrowRight,
  Plus,
  ArrowRightLeft,
  UserCheck,
  Globe
} from 'lucide-react';
import { numberToWords, formatDate, formatDateTime } from '@/utils/formatters';
import { generateQRCodeDataURL } from '@/utils/qrcode';

export interface ReceiptItem {
  sNo?: number;
  accountHead: string;
  amount: number;
}

export interface OfficialReceiptData {
  receiptNo: string;
  date: string;
  receiptType?: 'MONTHLY' | 'SHORT_STAY';
  verifiedDate?: string;
  tenantId?: string;
  tenantName?: string;
  guestName?: string;
  roomNumber?: string;
  bedNumber?: string;
  buildingName?: string;
  mobileNumber?: string;
  billingPeriod?: string;
  paymentMethod?: string;
  referenceId?: string;
  recordedBy?: string;
  receivedBy?: string;
  paymentStatus?: string;
  items?: ReceiptItem[];
  billAmount?: number;
  previousPaid?: number;
  currentPayment?: number;
  totalAmount: number;
  remainingDue?: number;
  generatedOn?: string;
  // Short-Stay Specific Fields
  checkInDate?: string;
  checkInTime?: string;
  expectedCheckOutDate?: string;
  expectedCheckOutTime?: string;
  actualCheckOutDate?: string;
  numberOfDays?: number;
  dailyRent?: number;
  totalStayAmount?: number;
  totalPaid?: number;
}

interface OfficialPaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: OfficialReceiptData;
}

export default function OfficialPaymentReceiptModal({
  isOpen,
  onClose,
  receiptData
}: OfficialPaymentReceiptModalProps) {
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !receiptData) return null;

  const isShortStay = receiptData.receiptType === 'SHORT_STAY';
  const displayName = isShortStay ? (receiptData.guestName || receiptData.tenantName || 'Guest') : (receiptData.tenantName || 'John Doe');
  const totalAmount = receiptData.totalAmount || (receiptData.items ? receiptData.items.reduce((sum, item) => sum + item.amount, 0) : 0);
  const amountInWords = numberToWords(totalAmount);

  // Enforce Strict Mathematical Invariants
  const billAmount = Number((receiptData.billAmount || receiptData.totalStayAmount || receiptData.totalAmount || 0).toFixed(2));
  const currentPaid = receiptData.currentPayment !== undefined 
    ? Number((receiptData.currentPayment || 0).toFixed(2))
    : Number((receiptData.totalPaid || receiptData.totalAmount || 0).toFixed(2));
  const totalPaid = receiptData.totalPaid !== undefined 
    ? Number((receiptData.totalPaid || 0).toFixed(2))
    : Number(((receiptData.previousPaid || 0) + currentPaid).toFixed(2));

  const remainingDue = Math.max(0, Number((billAmount - totalPaid).toFixed(2)));

  let statusStamp: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' = 'PAID';
  if (remainingDue <= 0.01 || (billAmount > 0 && totalPaid >= billAmount)) {
    statusStamp = 'PAID';
  } else if (totalPaid > 0 && remainingDue > 0) {
    statusStamp = 'PARTIALLY_PAID';
  } else {
    statusStamp = 'PENDING';
  }

  // Real Scannable QR Code URL linking directly to active website
  const websiteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://srisaisiri.vercel.app';
  const qrCodeDataUrl = generateQRCodeDataURL(websiteUrl, 180);

  const handleShare = async () => {
    const text = `Official ${isShortStay ? 'Short-Stay' : 'Monthly'} Receipt from Sri Sai Siri Boys Hostel\nReceipt No: ${receiptData.receiptNo}\nName: ${displayName}\nAmount: ₹${totalAmount.toLocaleString('en-IN')}\nStatus: ${statusStamp.replace('_', ' ')}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${receiptData.receiptNo}`,
          text,
          url: window.location.href
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const { jsPDF } = await import('jspdf');
      
      if (receiptRef.current) {
        const html2canvas = (await import('html2canvas')).default;
        
        // High resolution capture for 100% visual parity with viewing modal
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          useCORS: false,
          allowTaint: true,
          backgroundColor: '#180731',
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = 190;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
        pdf.save(`Official_Receipt_${receiptData.receiptNo}.pdf`);
      }
    } catch (e) {
      console.error('Failed to export receipt PDF:', e);
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div id="print-receipt-portal-wrapper">
      <AnimatePresence>
        <div className="fixed inset-0 z-[999999] overflow-y-auto font-sans bg-slate-950/85 backdrop-blur-md flex justify-center items-center p-3 sm:p-4 no-print text-left">
          
          {/* Robust Print CSS Rules */}
          <style jsx global>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 0;
              }
              html, body {
                background: #180731 !important;
                color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
                height: 100% !important;
              }
              .no-print {
                display: none !important;
              }
              #print-receipt-portal-wrapper {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
              }
              #printable-official-receipt {
                position: static !important;
                display: block !important;
                visibility: visible !important;
                width: 100% !important;
                max-width: 800px !important;
                margin: 0 auto !important;
                padding: 24px !important;
                background: #180731 !important;
                box-shadow: none !important;
                border: none !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #printable-official-receipt * {
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>

          {/* Modal Window Container */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="relative w-full max-w-[580px] max-h-[95vh] flex flex-col bg-slate-900 rounded-3xl shadow-2xl overflow-hidden z-10 border border-purple-500/30 text-left my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-purple-900/50 bg-[#16062d] shrink-0 no-print">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black text-amber-200 uppercase tracking-wider">
                  {isShortStay ? 'Short-Stay Payment Voucher' : 'Official Payment Receipt'}
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close Receipt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Content Body */}
            <div className="p-3 sm:p-4 overflow-y-auto bg-slate-950/60 custom-scrollbar">
              <div 
                id="printable-official-receipt"
                ref={receiptRef}
                className="relative bg-gradient-to-b from-[#180731] via-[#2d0b5a] to-[#120427] p-4 sm:p-6 rounded-[28px] border-2 border-amber-400/40 shadow-2xl space-y-3.5 text-slate-900 font-sans text-xs overflow-hidden text-left"
              >
                {/* SVG Decorative Gold Wave Accents */}
                <svg className="absolute top-0 left-0 right-0 w-full h-24 pointer-events-none opacity-30" viewBox="0 0 500 120" preserveAspectRatio="none">
                  <path d="M0,0 Q250,90 500,0 L500,0 L0,0 Z" fill="url(#goldGradientTop)" />
                  <defs>
                    <linearGradient id="goldGradientTop" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f5e6c8" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#d4af37" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* VISUAL ANGLED STATUS STAMP BADGE */}
                <div className="absolute top-4 right-4 z-20 transform rotate-[-6deg] select-none pointer-events-none">
                  {statusStamp === 'PAID' && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-2 border-white px-4 py-1.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                      <Check className="w-4 h-4 stroke-[3]" /> ✔ PAID
                    </div>
                  )}
                  {statusStamp === 'PARTIALLY_PAID' && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-white px-4 py-1.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                      PARTIALLY PAID
                    </div>
                  )}
                  {statusStamp === 'PENDING' && (
                    <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white border-2 border-white px-4 py-1.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                      PAYMENT PENDING
                    </div>
                  )}
                </div>

                {/* TOP BRAND HEADER WITH CROWN */}
                <div className="text-center space-y-1 relative z-10 pt-1">
                  <div className="flex items-center justify-center">
                    {/* Pinkish Gold Crown Icon matching reference */}
                    <svg className="w-9 h-9 text-amber-300 drop-shadow-md mb-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                    </svg>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase text-center drop-shadow-md">
                    SRI SAI SIRI BOYS HOSTEL
                  </h1>
                  <p className="text-[10px] font-bold text-amber-200/90 tracking-widest text-center uppercase">
                    COMFORT • SAFETY • QUALITY STAY
                  </p>
                  <div className="pt-1">
                    <div className="inline-block bg-[#f5e6c8] text-[#2b0c54] font-black text-xs px-5 py-1 rounded-full uppercase tracking-wider shadow-md border border-amber-300/60">
                      {isShortStay ? 'SHORT-STAY PAYMENT RECEIPT' : 'MONTHLY RENT RECEIPT'}
                    </div>
                  </div>
                </div>

                {/* 1. TENANT / GUEST DETAILS CARD (White Card with Purple Icons) */}
                <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-purple-100/80 text-xs font-medium text-slate-800 space-y-2 relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <span className="text-slate-500 text-[11px] font-medium">{isShortStay ? 'Guest Name' : 'Tenant Name'} : </span>
                        <span className="font-bold text-slate-950 truncate">{displayName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <span className="text-slate-500 text-[11px] font-medium">Building : </span>
                        <span className="font-bold text-slate-950 truncate">{receiptData.buildingName || 'Block A - Premium Executive'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] font-medium">Mobile Number : </span>
                        <span className="font-bold text-slate-950">{receiptData.mobileNumber || '+91 98765 43210'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <Bed className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] font-medium">Room / Bed : </span>
                        <span className="font-bold text-slate-950">
                          {receiptData.roomNumber ? `Rm ${receiptData.roomNumber}` : 'Rm R-108'} 
                          {receiptData.bedNumber ? ` (Bed ${receiptData.bedNumber})` : ' (Bed 1)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] font-medium">Tenant ID : </span>
                        <span className="font-mono font-bold text-slate-950">{receiptData.tenantId || `T-${receiptData.receiptNo.replace(/\D/g,'') || '1790261026467'}`}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] font-medium">Billing Period : </span>
                        <span className="font-bold text-purple-800">{receiptData.billingPeriod || 'September 2026'}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. RECEIPT NO & DATE BAR */}
                <div className="bg-[#f3effa] border border-purple-200/80 rounded-2xl p-2.5 px-3.5 flex justify-between items-center text-xs text-slate-900 font-bold relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-200/80 text-purple-900 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-600 font-medium">Receipt No : </span>
                    <span className="font-mono font-bold text-slate-950">{receiptData.receiptNo}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-200/80 text-purple-900 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-600 font-medium">Date & Time : </span>
                    <span className="font-semibold text-slate-900">{formatDateTime(receiptData.date)}</span>
                  </div>
                </div>

                {/* 3. FINANCIAL ACCOUNT PARTICULARS TABLE */}
                <div className="bg-white rounded-2xl border border-purple-200 overflow-hidden shadow-sm text-xs relative z-10">
                  <div className="bg-[#2b0c54] text-white px-4 py-2.5 font-bold flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-purple-300" />
                      <span>Account Particulars</span>
                    </div>
                    <span>Amount (INR)</span>
                  </div>

                  <div className="divide-y divide-purple-100 font-medium text-slate-800">
                    {isShortStay ? (
                      <>
                        <div className="px-4 py-2.5 flex justify-between items-center">
                          <span>Total Stay Charges ({receiptData.numberOfDays || 1} Days)</span>
                          <span className="font-bold font-mono text-slate-950">₹{(receiptData.totalStayAmount || totalAmount).toLocaleString('en-IN')}</span>
                        </div>
                        {receiptData.previousPaid !== undefined && receiptData.previousPaid > 0 && (
                          <div className="px-4 py-2.5 flex justify-between items-center text-slate-600">
                            <span>Previously Paid Installments</span>
                            <span className="font-semibold font-mono">₹{receiptData.previousPaid.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-2.5 flex justify-between items-center">
                          <span>Room Rent & Boarding ({receiptData.billingPeriod || 'September 2026'})</span>
                          <span className="font-bold font-mono text-slate-950">₹{billAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="px-4 py-2.5 flex justify-between items-center text-slate-600">
                          <span>Previously Paid Amount</span>
                          <span className="font-semibold font-mono">₹{(receiptData.previousPaid || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}

                    {/* Highlighted Received & Total Rows */}
                    <div className="px-4 py-2.5 bg-emerald-50/80 text-emerald-950 font-bold flex justify-between items-center border-t border-emerald-100">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0">
                          <ArrowRight className="w-3 h-3" />
                        </div>
                        <span className="text-emerald-900 font-bold">This Payment Received</span>
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-700">₹{currentPaid.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="px-4 py-2.5 bg-emerald-100/90 text-emerald-950 font-black flex justify-between items-center border-t border-emerald-200">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] shrink-0">
                          <Plus className="w-3 h-3" />
                        </div>
                        <span className="text-emerald-950 font-black">Total Amount Paid</span>
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-800">₹{totalPaid.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="px-4 py-2.5 bg-rose-50/80 text-rose-950 font-bold flex justify-between items-center border-t border-rose-100">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shrink-0">
                          <Clock className="w-3 h-3" />
                        </div>
                        <span className="text-rose-900 font-bold">Remaining Balance Dues</span>
                      </div>
                      <span className="font-mono text-xs font-black text-rose-700">₹{remainingDue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* 4. IN WORDS BANNER */}
                <div className="bg-[#efe7fc] border border-purple-200 rounded-2xl p-2.5 px-3.5 flex items-center gap-2 text-xs relative z-10">
                  <FileText className="w-4 h-4 text-purple-800 shrink-0" />
                  <div>
                    <span className="font-bold text-purple-950">In Words: </span>
                    <span className="font-black italic uppercase text-purple-900">{amountInWords}</span>
                  </div>
                </div>

                {/* 5. PAYMENT METHOD & REAL SCANNABLE QR CODE CARD */}
                <div className="bg-white rounded-2xl p-3.5 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs relative z-10">
                  <div className="space-y-2.5 w-full sm:w-auto">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Payment Method : </span>
                        <span className="font-bold text-slate-950 uppercase">{receiptData.paymentMethod || 'UPI'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Transaction ID : </span>
                        <span className="font-mono font-bold text-slate-950">{receiptData.referenceId || `UPI/${receiptData.receiptNo.replace(/\D/g,'') || '426709318274'}`}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Received By : </span>
                        <span className="font-bold text-slate-950">{receiptData.receivedBy || receiptData.recordedBy || 'Sri Sai Siri Management'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Real Scannable QR Code */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-purple-200 bg-white shrink-0 shadow-xs">
                    <img src={qrCodeDataUrl} alt="Website QR Code" className="w-24 h-24 object-contain rounded-lg" />
                    <div className="bg-[#2b0c54] text-white text-[8px] font-bold px-2.5 py-0.5 rounded-full mt-1.5 flex items-center gap-1 shadow-2xs">
                      <Globe className="w-2.5 h-2.5 text-amber-300" /> Scan to visit our website
                    </div>
                  </div>
                </div>

                {/* 6. FOOTER SECTION: BUILDING IMAGE + THANK YOU SCRIPT + SIGNATURE & STAMP */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-purple-400/30 text-white relative z-10">
                  
                  {/* Left: Building Vector Illustration */}
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-16 rounded-xl overflow-hidden border border-amber-300/50 shadow-md bg-gradient-to-tr from-purple-950 to-indigo-900 shrink-0 flex flex-col items-center justify-center p-1">
                      <Building className="w-7 h-7 text-amber-300" />
                      <span className="text-[7.5px] font-bold text-amber-200/90 mt-0.5">Sri Sai Siri Hostel</span>
                    </div>
                  </div>

                  {/* Middle: Thank You Gold Cursive Script */}
                  <div className="text-center space-y-0.5">
                    <h3 className="font-serif italic text-amber-300 text-2xl font-bold tracking-wide drop-shadow-md">
                      Thank You!
                    </h3>
                    <p className="text-[10px] text-purple-200 font-medium">
                      For being a part of Sri Sai Siri Boys Hostel.
                    </p>
                  </div>

                  {/* Right: SIGNATURE & OFFICIAL CIRCULAR STAMP OVERLAY */}
                  <div className="flex items-center gap-2 shrink-0">
                    
                    {/* Cursive Signature Graphic */}
                    <div className="text-center">
                      <div className="font-serif italic text-white text-lg font-bold tracking-widest leading-none drop-shadow-xs mb-1">
                        Joniafo
                      </div>
                      <div className="w-24 h-0.5 border-b border-white/30 my-0.5"></div>
                      <span className="font-bold text-slate-200 uppercase tracking-wider text-[8px] block">Authorized Signature</span>
                      <span className="text-[7.5px] text-amber-300/90 font-semibold block">Hostel Manager</span>
                    </div>

                    {/* 🔴 AUTHENTIC CIRCULAR RED HOSTEL STAMP */}
                    <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-red-500 p-0.5 flex items-center justify-center text-center transform -rotate-12 pointer-events-none select-none bg-red-500/10 backdrop-blur-3xs shadow-lg shrink-0">
                      <div className="w-full h-full rounded-full border border-solid border-red-500 flex flex-col items-center justify-center p-0.5 bg-white/10">
                        <span className="text-[6.5px] font-black tracking-tight text-red-500 uppercase leading-none">
                          SRI SAI SIRI
                        </span>
                        <span className="text-[5px] font-black text-red-500 uppercase leading-tight my-0.5 border-y border-red-500/60 px-1 py-0.2">
                          ★ AUTHORISED STAMP ★
                        </span>
                        <span className="text-[6px] font-black text-red-500 uppercase tracking-tight leading-none">
                          BOYS HOSTEL
                        </span>
                      </div>
                    </div>

                  </div>

                </div>

                {/* 7. BOTTOM CONTACT BAR */}
                <div className="bg-[#140529] -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-3 p-2.5 rounded-b-[26px] border-t border-amber-400/30 flex flex-wrap justify-between items-center text-[10px] font-semibold text-purple-200 px-6 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-300" />
                    <span>+91 98765 43210</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-300" />
                    <span>Sri Sai Siri Boys Hostel, Block A, Rm R-108</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-purple-900/50 bg-[#16062d] shrink-0 no-print">
              <button
                onClick={handleShare}
                className="py-2 px-3.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-700/50"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-300" />
                {copied ? 'Copied!' : 'Share'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="py-2 px-4 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-700/50"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  Print
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
