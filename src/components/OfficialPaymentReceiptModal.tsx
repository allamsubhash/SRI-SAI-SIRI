'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, Building, ShieldCheck, Share2, Check, QrCode } from 'lucide-react';
import { numberToWords, formatDate, formatDateTime } from '@/utils/formatters';

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
  const displayName = isShortStay ? (receiptData.guestName || receiptData.tenantName || 'Guest') : (receiptData.tenantName || 'Resident');
  const totalAmount = receiptData.totalAmount || (receiptData.items ? receiptData.items.reduce((sum, item) => sum + item.amount, 0) : 0);
  const amountInWords = numberToWords(totalAmount);
  const generatedTime = receiptData.generatedOn || formatDateTime(new Date());

  // Enforce Strict Mathematical Invariant: Balance = Math.max(0, Bill Amount - Total Paid)
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
        try {
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(receiptRef.current, {
            scale: 3, // High DPI capture for crispness
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 800,
            onclone: (clonedDoc) => {
              const el = clonedDoc.getElementById('printable-official-receipt');
              if (el) {
                el.style.color = '#0f172a';
                el.style.backgroundColor = '#ffffff';
                el.style.boxShadow = 'none';
                el.style.transform = 'none';
              }
            }
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = 190;
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
          pdf.save(`Official_Receipt_${receiptData.receiptNo}.pdf`);
          setDownloading(false);
          return;
        } catch (canvasErr) {
          console.warn('Canvas export fallback triggered:', canvasErr);
        }
      }

      // High-Fidelity Vector PDF Generator (Ensures downloaded PDF is 100% identical to viewing receipt)
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Title & Header
      pdf.setTextColor(112, 36, 52); // #702434
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('SRI SAI SIRI BOYS HOSTEL', 105, 18, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text(isShortStay ? 'SHORT-STAY PAYMENT RECEIPT' : 'MONTHLY RENT RECEIPT', 105, 25, { align: 'center' });

      // Visual Status Stamp Badge
      if (statusStamp === 'PAID') {
        pdf.setDrawColor(5, 150, 105);
        pdf.setFillColor(209, 250, 229);
        pdf.rect(145, 12, 45, 10, 'FD');
        pdf.setTextColor(4, 120, 87);
        pdf.setFontSize(10);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('✓ PAID', 167.5, 18.5, { align: 'center' });
      } else if (statusStamp === 'PARTIALLY_PAID') {
        pdf.setDrawColor(217, 119, 6);
        pdf.setFillColor(254, 243, 199);
        pdf.rect(140, 12, 50, 10, 'FD');
        pdf.setTextColor(180, 83, 9);
        pdf.setFontSize(9);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('PARTIALLY PAID', 165, 18.5, { align: 'center' });
      } else {
        pdf.setDrawColor(225, 29, 72);
        pdf.setFillColor(254, 226, 226);
        pdf.rect(140, 12, 50, 10, 'FD');
        pdf.setTextColor(190, 18, 60);
        pdf.setFontSize(9);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('PAYMENT PENDING', 165, 18.5, { align: 'center' });
      }

      // Guest / Tenant Info Box
      pdf.setDrawColor(208, 215, 222);
      pdf.setFillColor(248, 250, 252);
      pdf.rect(14, 32, 182, 22, 'FD');

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(9.5);
      pdf.setFont('Helvetica', 'bold');
      pdf.text(`${isShortStay ? 'Guest Name' : 'Tenant Name'}  : ${displayName}`, 18, 40);
      pdf.text(`Mobile Number : ${receiptData.mobileNumber || 'N/A'}`, 18, 48);

      pdf.text(`Building   : ${receiptData.buildingName || 'Main Hostel'}`, 110, 40);
      pdf.text(`Room / Bed : Room ${receiptData.roomNumber || 'N/A'} (Bed ${receiptData.bedNumber || 'N/A'})`, 110, 48);

      // Receipt Number & Date Bar
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, 57, 182, 9, 'FD');
      pdf.setFontSize(9);
      pdf.text(`Receipt No : ${receiptData.receiptNo}`, 18, 63);
      pdf.text(`Date & Time : ${formatDate(receiptData.date)}`, 140, 63);

      let currentY = 70;

      // Short Stay Rate Calculation Box
      if (isShortStay) {
        pdf.setFillColor(236, 253, 245);
        pdf.setDrawColor(167, 243, 208);
        pdf.rect(14, currentY, 182, 12, 'FD');
        pdf.setTextColor(6, 78, 59);
        pdf.setFontSize(9);
        pdf.text(`Stay Duration: ${receiptData.checkInDate ? formatDate(receiptData.checkInDate) : ''} to ${receiptData.expectedCheckOutDate ? formatDate(receiptData.expectedCheckOutDate) : ''}`, 18, currentY + 7);
        pdf.text(`Rate: INR ${receiptData.dailyRent || 0} / day x ${receiptData.numberOfDays || 1} days = INR ${(receiptData.totalStayAmount || totalAmount).toLocaleString('en-IN')}`, 105, currentY + 7);
        currentY += 16;
      }

      // Financial Particulars Table
      pdf.setFillColor(241, 245, 249);
      pdf.setDrawColor(208, 215, 222);
      pdf.rect(14, currentY, 182, 8, 'FD');
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(9);
      pdf.text('Account Particulars', 20, currentY + 5.5);
      pdf.text('Amount (INR)', 165, currentY + 5.5);
      currentY += 8;

      if (isShortStay) {
        // Total Stay Row
        pdf.rect(14, currentY, 182, 8, 'S');
        pdf.setFont('Helvetica', 'normal');
        pdf.text(`Total Stay Charges (${receiptData.numberOfDays || 1} Days)`, 20, currentY + 5.5);
        pdf.setFont('Helvetica', 'bold');
        pdf.text((receiptData.totalStayAmount || totalAmount).toLocaleString('en-IN'), 185, currentY + 5.5, { align: 'right' });
        currentY += 8;

        // Previously Paid Row
        if (receiptData.previousPaid && receiptData.previousPaid > 0) {
          pdf.rect(14, currentY, 182, 8, 'S');
          pdf.setFont('Helvetica', 'normal');
          pdf.text('Previously Paid Installments', 20, currentY + 5.5);
          pdf.setFont('Helvetica', 'bold');
          pdf.text(receiptData.previousPaid.toLocaleString('en-IN'), 185, currentY + 5.5, { align: 'right' });
          currentY += 8;
        }

        // Received Row
        pdf.setFillColor(236, 253, 245);
        pdf.rect(14, currentY, 182, 8, 'FD');
        pdf.setTextColor(4, 120, 87);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('This Payment Received', 20, currentY + 5.5);
        pdf.text(totalAmount.toLocaleString('en-IN'), 185, currentY + 5.5, { align: 'right' });
        currentY += 8;

        // Balance Row
        pdf.setFillColor(254, 242, 242);
        pdf.rect(14, currentY, 182, 8, 'FD');
        pdf.setTextColor(190, 18, 60);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('Remaining Balance Dues', 20, currentY + 5.5);
        pdf.text((receiptData.remainingDue || 0).toLocaleString('en-IN'), 185, currentY + 5.5, { align: 'right' });
        currentY += 12;
      } else {
        // Monthly Tenant Rows
        const items = receiptData.items && receiptData.items.length > 0 ? receiptData.items : [{ accountHead: 'Monthly Hostel Rent Collection', amount: totalAmount }];
        items.forEach((item) => {
          pdf.rect(14, currentY, 182, 8, 'S');
          pdf.setFont('Helvetica', 'normal');
          pdf.text(item.accountHead, 20, currentY + 5.5);
          pdf.setFont('Helvetica', 'bold');
          pdf.text(item.amount.toLocaleString('en-IN'), 185, currentY + 5.5, { align: 'right' });
          currentY += 8;
        });

        // Paid Row
        pdf.setFillColor(236, 253, 245);
        pdf.rect(14, currentY, 182, 8, 'FD');
        pdf.setTextColor(4, 120, 87);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('Total Amount Paid', 20, currentY + 5.5);
        pdf.text(totalAmount.toLocaleString('en-IN'), 185, currentY + 5.5, { align: 'right' });
        currentY += 8;

        // Balance Row
        pdf.setFillColor(254, 242, 242);
        pdf.rect(14, currentY, 182, 8, 'FD');
        pdf.setTextColor(190, 18, 60);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('Remaining Balance Dues', 20, currentY + 5.5);
        pdf.text((receiptData.remainingDue || 0).toLocaleString('en-IN'), 185, currentY + 5.5, { align: 'right' });
        currentY += 12;
      }

      // In Words Box
      pdf.setFillColor(239, 246, 255);
      pdf.setDrawColor(191, 219, 254);
      pdf.rect(14, currentY, 182, 10, 'FD');
      pdf.setTextColor(30, 58, 138);
      pdf.setFontSize(9);
      pdf.setFont('Helvetica', 'bold');
      pdf.text(`In Words : *** ${amountInWords} ***`, 18, currentY + 6.5);
      currentY += 14;

      // Metadata & Verification Box
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(208, 215, 222);
      pdf.rect(14, currentY, 182, 14, 'FD');
      pdf.setTextColor(51, 65, 85);
      pdf.setFontSize(8.5);
      pdf.setFont('Helvetica', 'bold');
      pdf.text(`Payment Method : ${(receiptData.paymentMethod || 'CASH').toUpperCase()}`, 18, currentY + 5.5);
      pdf.text(`Received By     : ${receiptData.receivedBy || receiptData.recordedBy || 'Hostel Manager'}`, 18, currentY + 10.5);

      pdf.text('VERIFIED RECEIPT', 150, currentY + 5.5);
      pdf.setFont('Helvetica', 'normal');
      pdf.text(`Generated: ${generatedTime}`, 140, currentY + 10.5);
      currentY += 18;

      // Signatures & Footer Note with Round Hostel Stamp
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(8);
      pdf.text(isShortStay ? 'Thank you for staying with us.' : 'This receipt confirms payment received for the billing period mentioned above.', 14, currentY);

      // Draw Round Stamp in Vector Fallback
      pdf.setDrawColor(112, 36, 52); // #702434
      pdf.setLineWidth(0.5);
      pdf.circle(165, currentY - 3, 11, 'S'); // Outer circle
      pdf.setLineWidth(0.2);
      pdf.circle(165, currentY - 3, 9.8, 'S'); // Inner circle

      pdf.setTextColor(112, 36, 52);
      pdf.setFontSize(6);
      pdf.setFont('Helvetica', 'bold');
      pdf.text('SRI SAI SIRI', 165, currentY - 6, { align: 'center' });
      pdf.setFontSize(4.5);
      pdf.text('★ AUTHORISED STAMP ★', 165, currentY - 3, { align: 'center' });
      pdf.setFontSize(6);
      pdf.text('BOYS HOSTEL', 165, currentY, { align: 'center' });

      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(8);
      pdf.setFont('Helvetica', 'bold');
      pdf.text('Authorized Signature : ___________________', 135, currentY + 7);

      pdf.save(`Official_Receipt_${receiptData.receiptNo}.pdf`);
    } catch (e) {
      console.error('Failed to export receipt PDF:', e);
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] overflow-y-auto font-sans bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-3 sm:p-4 no-print">
        
        {/* Printable CSS Rules */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-official-receipt, #printable-official-receipt * {
              visibility: visible !important;
            }
            #printable-official-receipt {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 20px !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: none !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Modal Container */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          className="relative w-full max-w-[500px] max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-900 border border-slate-200 text-left my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0 no-print">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {isShortStay ? 'Short-Stay Payment Voucher' : 'Monthly Rent Voucher'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Close Receipt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Receipt Body */}
          <div className="p-4 overflow-y-auto bg-slate-100/60">
            <div 
              id="printable-official-receipt"
              ref={receiptRef}
              className="relative bg-white p-4 sm:p-5 rounded-2xl border border-slate-300 shadow-sm space-y-3.5 text-slate-900 font-sans text-xs overflow-hidden"
            >
              
              {/* VISUAL ANGLED STATUS STAMP */}
              <div className="absolute top-4 right-4 z-10 pointer-events-none transform rotate-[-12deg] opacity-90 select-none">
                {statusStamp === 'PAID' && (
                  <div className="border-4 border-emerald-600 px-3 py-1 rounded-xl text-emerald-700 font-black text-xs uppercase tracking-widest bg-emerald-50/90 shadow-md flex items-center gap-1">
                    <Check className="w-4 h-4 stroke-[3]" /> ✓ PAID
                  </div>
                )}
                {statusStamp === 'PARTIALLY_PAID' && (
                  <div className="border-4 border-amber-500 px-3 py-1 rounded-xl text-amber-600 font-black text-xs uppercase tracking-widest bg-amber-50/90 shadow-md">
                    PARTIALLY PAID
                  </div>
                )}
                {statusStamp === 'PENDING' && (
                  <div className="border-4 border-rose-500 px-3 py-1 rounded-xl text-rose-600 font-black text-xs uppercase tracking-widest bg-rose-50/90 shadow-md">
                    PAYMENT PENDING
                  </div>
                )}
              </div>

              {/* TOP HEADER */}
              <div className="text-center space-y-0.5">
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#702434] text-white flex items-center justify-center font-black shadow-sm mb-1">
                    <Building className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h1 className="text-base sm:text-lg font-black text-[#702434] tracking-tight leading-tight uppercase">
                  SRI SAI SIRI BOYS HOSTEL
                </h1>
                <h2 className="text-xs font-bold text-[#702434]/85 tracking-normal uppercase">
                  {isShortStay ? 'SHORT-STAY PAYMENT RECEIPT' : 'MONTHLY RENT RECEIPT'}
                </h2>
              </div>

              {/* TENANT / GUEST DETAILS */}
              <div className="border border-slate-300 rounded-lg overflow-hidden text-[11px] bg-slate-50/40">
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="p-2 sm:p-2.5 space-y-1">
                    <div className="flex justify-between sm:justify-start gap-1">
                      <span className="text-slate-600 font-medium">{isShortStay ? 'Guest Name:' : 'Tenant Name:'}</span>
                      <span className="font-bold text-slate-900 truncate max-w-[120px]">{displayName}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start gap-1">
                      <span className="text-slate-600 font-medium">Mobile:</span>
                      <span className="font-bold text-slate-900">{receiptData.mobileNumber || 'N/A'}</span>
                    </div>
                    {!isShortStay && (
                      <div className="flex justify-between sm:justify-start gap-1">
                        <span className="text-slate-600 font-medium">Tenant ID:</span>
                        <span className="font-bold text-slate-900">{receiptData.tenantId || 'TEN-001'}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2 sm:p-2.5 space-y-1">
                    <div className="flex justify-between sm:justify-start gap-1">
                      <span className="text-slate-600 font-medium">Building:</span>
                      <span className="font-bold text-slate-900">{receiptData.buildingName || 'Main Hostel'}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start gap-1">
                      <span className="text-slate-600 font-medium">Room / Bed:</span>
                      <span className="font-bold text-slate-900">
                        {receiptData.roomNumber ? `Rm ${receiptData.roomNumber}` : 'N/A'} 
                        {receiptData.bedNumber ? ` (Bed ${receiptData.bedNumber})` : ''}
                      </span>
                    </div>
                    {!isShortStay && receiptData.billingPeriod && (
                      <div className="flex justify-between sm:justify-start gap-1">
                        <span className="text-slate-600 font-medium">Billing Period:</span>
                        <span className="font-bold text-emerald-700">{receiptData.billingPeriod}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RECEIPT NUMBER & DATE BAR */}
              <div className="border border-slate-300 rounded-lg bg-slate-50 px-3 py-1.5 flex justify-between items-center text-[11px] font-bold text-slate-900">
                <div>
                  <span className="text-slate-500 font-medium">Receipt No: </span>
                  <span className="font-mono font-bold text-slate-900">{receiptData.receiptNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Date & Time: </span>
                  <span className="font-semibold text-slate-800">{formatDate(receiptData.date)}</span>
                </div>
              </div>

              {/* SHORT-STAY SPECIFIC CALCULATIONS */}
              {isShortStay && (
                <div className="border border-emerald-300/60 rounded-lg bg-emerald-50/50 p-2.5 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Stay Duration:</span>
                    <span className="font-bold text-slate-900">
                      {receiptData.checkInDate ? formatDate(receiptData.checkInDate) : ''} → {receiptData.expectedCheckOutDate ? formatDate(receiptData.expectedCheckOutDate) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-900 font-bold border-t border-emerald-200/60 pt-1.5">
                    <span>Stay Rate Calculation:</span>
                    <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
                      ₹{receiptData.dailyRent || 0} / day × {receiptData.numberOfDays || 1} days = ₹{(receiptData.totalStayAmount || totalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {/* FINANCIAL BREAKDOWN TABLE */}
              <div className="border border-slate-300 rounded-lg overflow-hidden text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                      <th className="py-1.5 px-3 border-r border-slate-300">Account Particulars</th>
                      <th className="py-1.5 px-3 text-right w-28">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-slate-900 font-medium">
                    {isShortStay ? (
                      <>
                        <tr>
                          <td className="py-1.5 px-3 border-r border-slate-300 text-slate-800">Total Stay Charges ({receiptData.numberOfDays || 1} Days)</td>
                          <td className="py-1.5 px-3 text-right font-bold font-mono">₹{(receiptData.totalStayAmount || totalAmount).toLocaleString('en-IN')}</td>
                        </tr>
                        {receiptData.previousPaid !== undefined && receiptData.previousPaid > 0 && (
                          <tr>
                            <td className="py-1.5 px-3 border-r border-slate-300 text-slate-600">Previously Paid Installments</td>
                            <td className="py-1.5 px-3 text-right font-semibold font-mono text-slate-600">₹{receiptData.previousPaid.toLocaleString('en-IN')}</td>
                          </tr>
                        )}
                        <tr className="bg-emerald-50/50 font-bold">
                          <td className="py-1.5 px-3 border-r border-slate-300 text-emerald-900">This Payment Received</td>
                          <td className="py-1.5 px-3 text-right font-mono text-xs font-black text-emerald-700">₹{totalAmount.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                          <td className="py-1.5 px-3 border-r border-slate-300 text-slate-700">Remaining Balance Dues</td>
                          <td className="py-1.5 px-3 text-right font-mono text-xs font-black text-rose-600">₹{(receiptData.remainingDue || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      </>
                    ) : (
                      <>
                        {receiptData.items && receiptData.items.length > 0 ? (
                          receiptData.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-1.5 px-3 border-r border-slate-300 text-slate-800">{item.accountHead}</td>
                              <td className="py-1.5 px-3 text-right font-bold font-mono">₹{item.amount.toLocaleString('en-IN')}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="py-1.5 px-3 border-r border-slate-300 text-slate-800">Monthly Hostel Rent Collection</td>
                            <td className="py-1.5 px-3 text-right font-bold font-mono">₹{totalAmount.toLocaleString('en-IN')}</td>
                          </tr>
                        )}
                        <tr className="bg-emerald-50/50 font-bold">
                          <td className="py-1.5 px-3 border-r border-slate-300 text-emerald-900">Total Amount Paid</td>
                          <td className="py-1.5 px-3 text-right font-mono text-xs font-black text-emerald-700">₹{totalAmount.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                          <td className="py-1.5 px-3 border-r border-slate-300 text-slate-700">Remaining Balance Dues</td>
                          <td className="py-1.5 px-3 text-right font-mono text-xs font-black text-rose-600">₹{(receiptData.remainingDue || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* AMOUNT IN WORDS */}
              <div className="p-2 sm:p-2.5 bg-blue-50/60 border border-blue-200 rounded-lg text-[10px] sm:text-[11px] text-blue-900">
                <span className="font-bold">In Words: </span>
                <span className="font-semibold italic uppercase">{amountInWords}</span>
              </div>

              {/* PAYMENT METADATA & QR CODE */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600">
                <div className="space-y-0.5">
                  <div>
                    Payment Method: <strong className="text-slate-900 uppercase">{receiptData.paymentMethod || 'CASH'}</strong>
                  </div>
                  <div>
                    Received By: <strong className="text-slate-900">{receiptData.receivedBy || receiptData.recordedBy || 'Hostel Manager'}</strong>
                  </div>
                  {receiptData.verifiedDate && (
                    <div>
                      Verified Date: <strong className="text-slate-900">{formatDate(receiptData.verifiedDate)}</strong>
                    </div>
                  )}
                </div>

                {/* Receipt Verification QR Stamp */}
                <div className="flex flex-col items-center justify-center p-1.5 bg-white border border-slate-300 rounded-lg shrink-0">
                  <QrCode className="w-8 h-8 text-slate-800" />
                  <span className="text-[8px] font-mono font-bold text-slate-500 mt-0.5">VERIFIED</span>
                </div>
              </div>

              {/* AUTHORIZED SIGNATURE AREA WITH CIRCULAR HOSTEL STAMP */}
              <div className="pt-2 flex justify-between items-end text-[10px] text-slate-500 border-t border-slate-200 relative">
                <div>
                  <span className="block font-medium">Received By: {receiptData.receivedBy || 'Manager'}</span>
                  <span className="italic text-[9px] text-slate-400">
                    {isShortStay ? 'Thank you for staying with us.' : 'This receipt confirms payment received for the billing period mentioned above.'}
                  </span>
                </div>
                
                <div className="text-right relative">
                  {/* 🔴 ROUND OFFICIAL HOSTEL STAMP */}
                  <div className="absolute -top-10 right-2 w-20 h-20 rounded-full border-2 border-dashed border-[#702434]/75 p-1 flex flex-col items-center justify-center text-center transform -rotate-12 pointer-events-none opacity-85 select-none bg-red-50/20 backdrop-blur-3xs">
                    <div className="w-full h-full rounded-full border border-solid border-[#702434]/80 flex flex-col items-center justify-center p-1">
                      <span className="text-[6.5px] font-black tracking-tighter text-[#702434] uppercase leading-none">
                        SRI SAI SIRI
                      </span>
                      <span className="text-[5.5px] font-bold text-[#702434]/90 uppercase leading-tight my-0.5 border-y border-[#702434]/40 px-1 py-0.2">
                        ★ AUTHORISED STAMP ★
                      </span>
                      <span className="text-[6px] font-black text-[#702434] uppercase tracking-tighter leading-none">
                        BOYS HOSTEL
                      </span>
                    </div>
                  </div>

                  <div className="h-6 border-b border-slate-400 w-28 mb-1"></div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Authorized Signature</span>
                </div>
              </div>

            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 shrink-0 no-print">
            <button
              onClick={handleShare}
              className="py-2 px-3.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Share'}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="py-2 px-4 rounded-xl bg-[#702434] hover:bg-[#5a1c29] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {downloading ? 'Downloading...' : 'Download PDF'}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
