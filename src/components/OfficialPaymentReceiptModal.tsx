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
import { CUSTOM_QR_BASE64 } from '@/utils/qrBase64';

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

  // Enforce Strict Invariant: Room Rent & Boarding Amount MUST MATCH Amount Paid
  const billAmount = totalAmount;
  const currentPaid = totalAmount;
  const totalPaid = totalAmount;
  const remainingDue = 0;
  const statusStamp: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' = remainingDue <= 0.01 ? 'PAID' : (totalPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING');

  // Use the User's uploaded exact QR code image
  const qrCodeDataUrl = CUSTOM_QR_BASE64;

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

  // Bulletproof Isolated Frame Printing: Prints ONLY the receipt element on 1 single page
  const handlePrint = () => {
    if (!receiptRef.current) return;
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document;
    if (!doc) return;

    const receiptHtml = receiptRef.current.outerHTML;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${receiptData.receiptNo}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #180731 !important;
              font-family: system-ui, -apple-system, sans-serif;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 8mm;
            }
            img {
              max-width: 100% !important;
              height: auto !important;
            }
            img[alt*="QR"], img[alt*="Code"] {
              width: 72px !important;
              height: 72px !important;
              max-width: 72px !important;
              max-height: 72px !important;
              min-width: 72px !important;
              min-height: 72px !important;
              object-fit: contain !important;
            }
            #printable-official-receipt {
              margin: 0 auto;
              width: 100%;
              max-width: 740px;
              max-height: 270mm;
              background: linear-gradient(to bottom, #180731, #2d0b5a, #120427) !important;
              color: white;
              border-radius: 24px;
              border: 2px solid rgba(212, 175, 55, 0.4);
              padding: 16px;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          ${receiptHtml}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 1000);
    }, 500);
  };

  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      if (!receiptRef.current) return;

      const targetFileName = `Official_Receipt_${receiptData.receiptNo.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

      // Helper to trigger direct browser file download
      const triggerFileDownload = (blobOrDataUrl: Blob | string, filename: string) => {
        const link = document.createElement('a');
        link.style.display = 'none';
        if (typeof blobOrDataUrl === 'string') {
          link.href = blobOrDataUrl;
        } else {
          link.href = URL.createObjectURL(blobOrDataUrl);
        }
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
          if (typeof blobOrDataUrl !== 'string') URL.revokeObjectURL(link.href);
        }, 1500);
      };

      try {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        const canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          useCORS: false,
          allowTaint: true,
          backgroundColor: '#180731',
          logging: false,
          onclone: (clonedDoc) => {
            const el = clonedDoc.getElementById('printable-official-receipt');
            if (el) {
              // Strip decorative SVG gradients that crash Safari canvas export
              const svgs = el.querySelectorAll('svg');
              svgs.forEach((svg) => {
                if (svg.querySelector('linearGradient') || svg.getAttribute('viewBox') === '0 0 500 120') {
                  svg.remove();
                }
              });

              el.style.boxShadow = 'none';
              el.style.transform = 'none';
              el.style.backdropFilter = 'none';
              (el.style as any).webkitBackdropFilter = 'none';
              el.style.margin = '0 auto';
              el.style.padding = '16px';

              // Enforce explicit inline dimensions on images in captured DOM
              const imgs = el.querySelectorAll('img');
              imgs.forEach((img) => {
                img.style.width = '72px';
                img.style.height = '72px';
                img.style.maxWidth = '72px';
                img.style.maxHeight = '72px';
              });
            }
          }
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = 190; // mm
        const maxPdfHeight = 270; // mm to guarantee strict 1-page fit
        let pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        let renderWidth = pdfWidth;
        let renderHeight = pdfHeight;
        let xOffset = 10;

        if (pdfHeight > maxPdfHeight) {
          const scaleRatio = maxPdfHeight / pdfHeight;
          renderWidth = pdfWidth * scaleRatio;
          renderHeight = maxPdfHeight;
          xOffset = 10 + (pdfWidth - renderWidth) / 2;
        }

        pdf.addImage(imgData, 'PNG', xOffset, 10, renderWidth, renderHeight);

        // Primary: Native jsPDF save
        pdf.save(`${targetFileName}.pdf`);

        // Secondary Blob trigger for mobile browsers
        try {
          const pdfBlob = pdf.output('blob');
          triggerFileDownload(pdfBlob, `${targetFileName}.pdf`);
        } catch {}

        return;
      } catch (canvasErr) {
        console.warn('Canvas PDF export fallback triggered:', canvasErr);
      }

      // Secondary Fallback: Image PNG Download
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: false, allowTaint: true });
        const imgData = canvas.toDataURL('image/png');
        triggerFileDownload(imgData, `${targetFileName}.png`);
      } catch (finalErr) {
        console.error('Final download fallback failed, triggering print dialog:', finalErr);
        handlePrint();
      }
    } catch (e) {
      console.error('Failed to export receipt:', e);
      handlePrint();
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div id="print-receipt-portal-wrapper">
      <AnimatePresence>
        <div className="fixed inset-0 z-[999999] overflow-y-auto font-sans bg-slate-950/85 backdrop-blur-md flex justify-center items-center p-2 sm:p-4 no-print text-left">
          
          {/* Global Print CSS Safeguard */}
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
                width: 100% !important;
                height: 100% !important;
                overflow: hidden !important;
              }
              .no-print {
                display: none !important;
              }
              body > *:not(#print-receipt-portal-wrapper) {
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
                max-width: 740px !important;
                margin: 0 auto !important;
                padding: 16px !important;
                background: #180731 !important;
                box-shadow: none !important;
                border: none !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #printable-official-receipt * {
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #printable-official-receipt img[alt*="QR"], #printable-official-receipt img[alt*="Code"] {
                width: 72px !important;
                height: 72px !important;
                max-width: 72px !important;
                max-height: 72px !important;
                min-width: 72px !important;
                min-height: 72px !important;
                object-fit: contain !important;
              }
            }
          `}</style>

          {/* Modal Window Container */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="relative w-full max-w-[560px] max-h-[96vh] flex flex-col bg-slate-900 rounded-3xl shadow-2xl overflow-hidden z-10 border border-purple-500/30 text-left my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-900/50 bg-[#16062d] shrink-0 no-print">
              <div className="flex items-center gap-2">
                <div className="w-5.5 h-5.5 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300 shrink-0">
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
            <div className="p-2.5 sm:p-3.5 overflow-y-auto bg-slate-950/60 custom-scrollbar">
              <div 
                id="printable-official-receipt"
                ref={receiptRef}
                className="relative bg-gradient-to-b from-[#180731] via-[#2d0b5a] to-[#120427] p-3.5 sm:p-4 rounded-[24px] border-2 border-amber-400/40 shadow-2xl space-y-2 text-slate-900 font-sans text-xs overflow-hidden text-left"
              >
                {/* SVG Decorative Gold Wave Accents */}
                <svg className="absolute top-0 left-0 right-0 w-full h-20 pointer-events-none opacity-25" viewBox="0 0 500 120" preserveAspectRatio="none">
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
                <div className="absolute top-3 right-3 z-20 transform rotate-[-6deg] select-none pointer-events-none">
                  {statusStamp === 'PAID' && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-2 border-white px-3 py-1 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> ✔ PAID
                    </div>
                  )}
                  {statusStamp === 'PARTIALLY_PAID' && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-white px-3 py-1 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl">
                      PARTIALLY PAID
                    </div>
                  )}
                  {statusStamp === 'PENDING' && (
                    <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white border-2 border-white px-3 py-1 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl">
                      PAYMENT PENDING
                    </div>
                  )}
                </div>

                {/* TOP BRAND HEADER WITH CROWN */}
                <div className="text-center space-y-0.5 relative z-10 pt-0.5">
                  <div className="flex items-center justify-center">
                    <svg className="w-7 h-7 text-amber-300 drop-shadow-md mb-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                    </svg>
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-wider uppercase text-center drop-shadow-md leading-tight">
                    SRI SAI SIRI BOYS HOSTEL
                  </h1>
                  <p className="text-[9px] font-bold text-amber-200/90 tracking-widest text-center uppercase">
                    COMFORT • SAFETY • QUALITY STAY
                  </p>
                  <div className="pt-0.5">
                    <div className="inline-block bg-[#f5e6c8] text-[#2b0c54] font-black text-[10.5px] px-4 py-0.5 rounded-full uppercase tracking-wider shadow-md border border-amber-300/60">
                      {isShortStay ? 'SHORT-STAY PAYMENT RECEIPT' : 'MONTHLY RENT RECEIPT'}
                    </div>
                  </div>
                </div>

                {/* 1. TENANT / GUEST DETAILS CARD (White Card with Purple Icons) */}
                <div className="bg-white rounded-xl p-2.5 shadow-xs border border-purple-100/80 text-[11px] font-medium text-slate-800 space-y-1.5 relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3" />
                      </div>
                      <div className="truncate">
                        <span className="text-slate-500 text-[10px] font-medium">{isShortStay ? 'Guest Name' : 'Tenant Name'} : </span>
                        <span className="font-bold text-slate-950 truncate">{displayName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <Building className="w-3 h-3" />
                      </div>
                      <div className="truncate">
                        <span className="text-slate-500 text-[10px] font-medium">Building : </span>
                        <span className="font-bold text-slate-950 truncate">{receiptData.buildingName || 'Block A - Premium Executive'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <Phone className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] font-medium">Mobile Number : </span>
                        <span className="font-bold text-slate-950">{receiptData.mobileNumber || '+91 98765 43210'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <Bed className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] font-medium">Room / Bed : </span>
                        <span className="font-bold text-slate-950">
                          {receiptData.roomNumber ? `Rm ${receiptData.roomNumber}` : 'Rm R-108'} 
                          {receiptData.bedNumber ? ` (Bed ${receiptData.bedNumber})` : ' (Bed 1)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <CreditCard className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] font-medium">Tenant ID : </span>
                        <span className="font-mono font-bold text-slate-950">{receiptData.tenantId || `T-${receiptData.receiptNo.replace(/\D/g,'') || '1790261026467'}`}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <Calendar className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] font-medium">Billing Period : </span>
                        <span className="font-bold text-purple-800">{receiptData.billingPeriod || 'September 2026'}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. RECEIPT NO & DATE BAR */}
                <div className="bg-[#f3effa] border border-purple-200/80 rounded-xl p-2 px-3 flex justify-between items-center text-[11px] text-slate-900 font-bold relative z-10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-purple-200/80 text-purple-900 flex items-center justify-center shrink-0">
                      <FileText className="w-3 h-3" />
                    </div>
                    <span className="text-slate-600 font-medium">Receipt No : </span>
                    <span className="font-mono font-bold text-slate-950">{receiptData.receiptNo}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-purple-200/80 text-purple-900 flex items-center justify-center shrink-0">
                      <Clock className="w-3 h-3" />
                    </div>
                    <span className="text-slate-600 font-medium">Date & Time : </span>
                    <span className="font-semibold text-slate-900">{formatDateTime(receiptData.date)}</span>
                  </div>
                </div>

                {/* 3. FINANCIAL ACCOUNT PARTICULARS TABLE (PREVIOUSLY PAID REMOVED) */}
                <div className="bg-white rounded-xl border border-purple-200 overflow-hidden shadow-2xs text-[11px] relative z-10">
                  <div className="bg-[#2b0c54] text-white px-3 py-1.5 font-bold flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-purple-300" />
                      <span>Account Particulars</span>
                    </div>
                    <span>Amount (INR)</span>
                  </div>

                  <div className="divide-y divide-purple-100 font-medium text-slate-800">
                    {isShortStay ? (
                      <div className="px-3 py-1.5 flex justify-between items-center">
                        <span>Total Stay Charges ({receiptData.numberOfDays || 1} Days)</span>
                        <span className="font-bold font-mono text-slate-950">₹{(receiptData.totalStayAmount || totalAmount).toLocaleString('en-IN')}</span>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 flex justify-between items-center">
                        <span>Room Rent & Boarding ({receiptData.billingPeriod || 'September 2026'})</span>
                        <span className="font-bold font-mono text-slate-950">₹{billAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {/* Highlighted Received & Total Rows */}
                    <div className="px-3 py-1.5 bg-emerald-50/80 text-emerald-950 font-bold flex justify-between items-center border-t border-emerald-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4.5 h-4.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] shrink-0">
                          <ArrowRight className="w-2.5 h-2.5" />
                        </div>
                        <span className="text-emerald-900 font-bold">This Payment Received</span>
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-700">₹{currentPaid.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="px-3 py-1.5 bg-emerald-100/90 text-emerald-950 font-black flex justify-between items-center border-t border-emerald-200">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4.5 h-4.5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[9px] shrink-0">
                          <Plus className="w-2.5 h-2.5" />
                        </div>
                        <span className="text-emerald-950 font-black">Total Amount Paid</span>
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-800">₹{totalPaid.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="px-3 py-1.5 bg-rose-50/80 text-rose-950 font-bold flex justify-between items-center border-t border-rose-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4.5 h-4.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] shrink-0">
                          <Clock className="w-3 h-3" />
                        </div>
                        <span className="text-rose-900 font-bold">Remaining Balance Dues</span>
                      </div>
                      <span className="font-mono text-xs font-black text-rose-700">₹{remainingDue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* 4. IN WORDS BANNER */}
                <div className="bg-[#efe7fc] border border-purple-200 rounded-xl p-2 px-3 flex items-center gap-2 text-[11px] relative z-10">
                  <FileText className="w-3.5 h-3.5 text-purple-800 shrink-0" />
                  <div>
                    <span className="font-bold text-purple-950">In Words: </span>
                    <span className="font-black italic uppercase text-purple-900">{amountInWords}</span>
                  </div>
                </div>

                {/* 5. PAYMENT METHOD & EXACT UPLOADED QR CODE CARD */}
                <div className="bg-white rounded-xl p-2.5 px-3 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] relative z-10">
                  <div className="space-y-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <CreditCard className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Payment Method : </span>
                        <span className="font-bold text-slate-950 uppercase">{receiptData.paymentMethod || 'UPI'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <ArrowRightLeft className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Transaction ID : </span>
                        <span className="font-mono font-bold text-slate-950">{receiptData.referenceId || `UPI/${receiptData.receiptNo.replace(/\D/g,'') || '426709318274'}`}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <UserCheck className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Received By : </span>
                        <span className="font-bold text-slate-950">{receiptData.receivedBy || receiptData.recordedBy || 'Sri Sai Siri Management'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Exact Uploaded Scannable QR Code */}
                  <div className="flex flex-col items-center justify-center p-1.5 rounded-xl border-2 border-purple-200 bg-white shrink-0 shadow-2xs">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="Website QR Code" 
                      className="w-18 h-18 object-contain rounded-md shrink-0" 
                      style={{ width: '72px', height: '72px', maxWidth: '72px', maxHeight: '72px', minWidth: '72px', minHeight: '72px' }} 
                    />
                    <div className="bg-[#2b0c54] text-white text-[7.5px] font-bold px-2 py-0.5 rounded-full mt-1 flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5 text-amber-300" /> Scan to visit website
                    </div>
                  </div>
                </div>

                {/* 6. FOOTER SECTION: BUILDING IMAGE + THANK YOU SCRIPT + STAMP IN PLACE OF SIGNATURE */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-purple-400/30 text-white relative z-10">
                  
                  {/* Left: Building Vector Illustration */}
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-14 rounded-lg overflow-hidden border border-amber-300/50 shadow-xs bg-gradient-to-tr from-purple-950 to-indigo-900 shrink-0 flex flex-col items-center justify-center p-1">
                      <Building className="w-6 h-6 text-amber-300" />
                      <span className="text-[7px] font-bold text-amber-200/90 mt-0.5">Sri Sai Siri Hostel</span>
                    </div>
                  </div>

                  {/* Middle: Thank You Gold Cursive Script */}
                  <div className="text-center space-y-0.5">
                    <h3 className="font-serif italic text-amber-300 text-xl font-bold tracking-wide drop-shadow-md">
                      Thank You!
                    </h3>
                    <p className="text-[9.5px] text-purple-200 font-medium">
                      For being a part of Sri Sai Siri Boys Hostel.
                    </p>
                  </div>

                  {/* Right: OFFICIAL CIRCULAR STAMP ONLY IN PLACE OF SIGNATURE */}
                  <div className="flex flex-col items-center justify-center text-center shrink-0">
                    {/* 🔴 AUTHENTIC CIRCULAR RED HOSTEL STAMP IN PLACE OF SIGNATURE */}
                    <div className="relative w-18 h-18 rounded-full border-2 border-dashed border-red-500 p-0.5 flex items-center justify-center text-center transform -rotate-12 pointer-events-none select-none bg-red-500/10 backdrop-blur-3xs shadow-md mb-0.5">
                      <div className="w-full h-full rounded-full border border-solid border-red-500 flex flex-col items-center justify-center p-0.5 bg-white/10">
                        <span className="text-[6px] font-black tracking-tight text-red-500 uppercase leading-none">
                          SRI SAI SIRI
                        </span>
                        <span className="text-[4.5px] font-black text-red-500 uppercase leading-tight my-0.5 border-y border-red-500/60 px-1 py-0.2">
                          ★ AUTHORISED STAMP ★
                        </span>
                        <span className="text-[5.5px] font-black text-red-500 uppercase tracking-tight leading-none">
                          BOYS HOSTEL
                        </span>
                      </div>
                    </div>

                    <div className="w-20 h-0.5 border-b border-white/30 my-0.5"></div>
                    <span className="font-bold text-slate-200 uppercase tracking-wider text-[8px]">Authorized Signature</span>
                    <span className="text-[7.5px] text-amber-300/90 font-semibold">Hostel Manager</span>
                  </div>

                </div>

                {/* 7. BOTTOM CONTACT BAR */}
                <div className="bg-[#140529] -mx-3.5 sm:-mx-4 -mb-3.5 sm:-mb-4 mt-2 p-2 rounded-b-[22px] border-t border-amber-400/30 flex flex-wrap justify-between items-center text-[9.5px] font-semibold text-purple-200 px-5 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-amber-300" />
                    <span>+91 98765 43210</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3 h-3 text-amber-300" />
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
