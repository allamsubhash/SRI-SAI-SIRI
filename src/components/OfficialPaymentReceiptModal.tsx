'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, Building, ShieldCheck, Share2, Check } from 'lucide-react';
import { numberToWords, formatDate, formatDateTime } from '@/utils/formatters';

export interface ReceiptItem {
  sNo?: number;
  accountHead: string;
  amount: number;
}

export interface OfficialReceiptData {
  receiptNo: string;
  date: string;
  verifiedDate?: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  buildingName?: string;
  mobileNumber: string;
  billingPeriod?: string;
  paymentMethod?: string;
  referenceId?: string;
  recordedBy?: string;
  paymentStatus?: string;
  items: ReceiptItem[];
  billAmount?: number;
  previousPaid?: number;
  currentPayment?: number;
  totalAmount: number;
  remainingDue?: number;
  generatedOn?: string;
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

  const totalAmount = receiptData.totalAmount || receiptData.items.reduce((sum, item) => sum + item.amount, 0);
  const amountInWords = numberToWords(totalAmount);
  const generatedTime = receiptData.generatedOn || formatDateTime(new Date());

  const handleShare = async () => {
    const text = `Official Receipt from Sri Sai Siri Boys Hostel\nReceipt No: ${receiptData.receiptNo}\nTenant: ${receiptData.tenantName} (Room ${receiptData.roomNumber})\nAmount: ₹${totalAmount.toLocaleString('en-IN')}\nStatus: ${receiptData.paymentStatus || 'PAID'}`;
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
      
      // Attempt 1: Try HTML Canvas Capture if ref exists
      if (receiptRef.current) {
        try {
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(receiptRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = 190;
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 10, 12, pdfWidth, pdfHeight);
          pdf.save(`Official_Receipt_${receiptData.receiptNo}.pdf`);
          setDownloading(false);
          return;
        } catch (canvasErr) {
          console.warn('Canvas export fallback triggered:', canvasErr);
        }
      }

      // Fallback: Reliable Pure jsPDF Vector Document Generator
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Title & Header
      pdf.setTextColor(112, 36, 52); // #702434
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('SRI SAI SIRI BOYS HOSTEL', 105, 20, { align: 'center' });

      pdf.setFontSize(13);
      pdf.text('Online Payment Receipt', 105, 28, { align: 'center' });

      // Tenant Info Box
      pdf.setDrawColor(208, 215, 222);
      pdf.rect(14, 35, 182, 22);

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(10);
      pdf.setFont('Helvetica', 'bold');
      pdf.text(`Tenant ID        : ${receiptData.tenantId || 'TEN-001'}`, 18, 43);
      pdf.text(`Tenant Name     : ${receiptData.tenantName || 'SUBHASH'}`, 18, 51);

      pdf.text(`Room Number    : ${receiptData.roomNumber || 'A-101'}`, 110, 43);
      pdf.text(`Mobile Number  : ${receiptData.mobileNumber || '9876543210'}`, 110, 51);

      // Receipt Info Bar
      pdf.setFillColor(248, 250, 252);
      pdf.rect(14, 61, 182, 10, 'F');
      pdf.rect(14, 61, 182, 10, 'S');

      pdf.text(`Receipt No : ${receiptData.receiptNo}`, 18, 67.5);
      pdf.text(`Date : ${formatDate(receiptData.date)}`, 150, 67.5);

      // Table Header
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, 75, 182, 10, 'F');
      pdf.rect(14, 75, 182, 10, 'S');

      pdf.text('S.NO', 20, 81.5);
      pdf.text('Account Head', 45, 81.5);
      pdf.text('Amount (INR)', 165, 81.5);

      // Table Body
      let y = 92;
      const items = receiptData.items && receiptData.items.length > 0 ? receiptData.items : [{ accountHead: 'HOSTEL RENT COLLECTION', amount: totalAmount }];
      items.forEach((item, idx) => {
        pdf.rect(14, y - 7, 182, 10, 'S');
        pdf.setFont('Helvetica', 'normal');
        pdf.text(String(idx + 1), 22, y);
        pdf.text(item.accountHead, 45, y);
        pdf.setFont('Helvetica', 'bold');
        pdf.text(item.amount.toLocaleString('en-IN'), 185, y, { align: 'right' });
        y += 10;
      });

      // Total Row
      pdf.setFillColor(248, 250, 252);
      pdf.rect(14, y - 7, 182, 10, 'F');
      pdf.rect(14, y - 7, 182, 10, 'S');
      pdf.setFont('Helvetica', 'bold');
      pdf.text('Total :', 135, y);
      pdf.text(totalAmount.toLocaleString('en-IN'), 185, y, { align: 'right' });
      y += 14;

      // In Words Box
      pdf.setFillColor(220, 231, 249);
      pdf.setDrawColor(184, 211, 248);
      pdf.rect(14, y - 5, 182, 12, 'FD');
      pdf.setTextColor(30, 58, 138);
      pdf.text(`In Words : *** ${amountInWords} ***`, 18, y + 2);
      y += 16;

      // Terms
      pdf.setDrawColor(208, 215, 222);
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(9);
      pdf.text('*Terms & Conditions Apply', 14, y);
      pdf.text('*Payment subject to realization', 196, y, { align: 'right' });
      y += 6;

      // Footer
      pdf.setFillColor(254, 246, 216);
      pdf.setDrawColor(247, 231, 169);
      pdf.rect(14, y, 182, 14, 'FD');
      pdf.setTextColor(113, 63, 18);
      pdf.text('This is a Computer Generated Receipt. No signature is Required.', 105, y + 5, { align: 'center' });
      pdf.text(`Generated On : ${generatedTime}`, 105, y + 10, { align: 'center' });

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

        {/* Modal Outer Container */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          className="relative w-full max-w-[490px] max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-900 border border-slate-200 text-left my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header Bar with Close Button */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0 no-print">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Official Payment Voucher</span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Close Receipt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Receipt Body Container (Scrollable if height exceeds screen) */}
          <div className="p-4 overflow-y-auto bg-slate-100/60">
            
            {/* 📄 THE EXACT COMPACT OFFICIAL RECEIPT BOX */}
            <div 
              id="printable-official-receipt"
              ref={receiptRef}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-300 shadow-sm space-y-3.5 text-slate-900 font-sans text-xs"
            >
              
              {/* TOP HEADER WITH EMBLEM & TITLE */}
              <div className="text-center space-y-0.5">
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#702434] text-white flex items-center justify-center font-black shadow-sm mb-1">
                    <Building className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h1 className="text-base sm:text-lg font-black text-[#702434] tracking-tight leading-tight uppercase">
                  SRI SAI SIRI BOYS HOSTEL
                </h1>
                <h2 className="text-xs font-bold text-[#702434]/85 tracking-normal">
                  Online Payment Receipt
                </h2>
              </div>

              {/* 1. TENANT DETAILS SECTION (2 COLUMNS BOX) */}
              <div className="border border-slate-300 rounded-lg overflow-hidden text-[11px] bg-slate-50/40">
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  {/* Left Column */}
                  <div className="p-2 sm:p-2.5 space-y-1">
                    <div className="flex justify-between sm:justify-start gap-1">
                      <span className="text-slate-600 font-medium">Tenant ID:</span>
                      <span className="font-bold text-slate-900">{receiptData.tenantId || 'TEN-001'}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start gap-1">
                      <span className="text-slate-600 font-medium">Name:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[120px]">{receiptData.tenantName || 'Resident'}</span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="p-2 sm:p-2.5 space-y-1">
                    <div className="flex justify-between sm:justify-start gap-1">
                      <span className="text-slate-600 font-medium">Room:</span>
                      <span className="font-bold text-slate-900">{receiptData.roomNumber || 'A-101'}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start gap-1">
                      <span className="text-slate-600 font-medium">Mobile:</span>
                      <span className="font-bold text-slate-900">{receiptData.mobileNumber || '9876543210'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. RECEIPT INFORMATION ROW */}
              <div className="border border-slate-300 rounded-lg bg-slate-50 px-3 py-1.5 flex justify-between items-center text-[11px] font-bold text-slate-900">
                <div>
                  <span className="text-slate-500 font-medium">Receipt No: </span>
                  <span className="font-mono font-bold text-slate-800">{receiptData.receiptNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Date: </span>
                  <span className="font-semibold text-slate-800">{formatDate(receiptData.date)}</span>
                </div>
              </div>

              {/* 3. TABLE OF ACCOUNT HEADS */}
              <div className="border border-slate-300 rounded-lg overflow-hidden text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                      <th className="py-1.5 px-2.5 w-10 border-r border-slate-300 text-center">S.No</th>
                      <th className="py-1.5 px-3 border-r border-slate-300">Account Head</th>
                      <th className="py-1.5 px-3 text-right w-28">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-slate-900">
                    {receiptData.items && receiptData.items.length > 0 ? (
                      receiptData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-2.5 border-r border-slate-300 text-center font-medium text-slate-600">{item.sNo || idx + 1}</td>
                          <td className="py-1.5 px-3 border-r border-slate-300 font-medium text-slate-800">{item.accountHead}</td>
                          <td className="py-1.5 px-3 text-right font-bold font-mono">₹{item.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-1.5 px-2.5 border-r border-slate-300 text-center font-medium">1</td>
                        <td className="py-1.5 px-3 border-r border-slate-300 font-medium">HOSTEL RENT COLLECTION</td>
                        <td className="py-1.5 px-3 text-right font-bold font-mono">₹{totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    )}

                    {/* Total Row */}
                    <tr className="bg-slate-50 font-bold border-t border-slate-300 text-slate-900">
                      <td colSpan={2} className="py-1.5 px-3 text-right border-r border-slate-300 font-bold uppercase tracking-wider text-[10px]">
                        Total Amount:
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-xs font-black text-emerald-700 bg-emerald-50/60">
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. AMOUNT IN WORDS */}
              <div className="p-2 sm:p-2.5 bg-blue-50/60 border border-blue-200 rounded-lg text-[10px] sm:text-[11px] text-blue-900">
                <span className="font-bold">In Words: </span>
                <span className="font-semibold italic capitalize">{amountInWords} Only</span>
              </div>

              {/* 5. PAYMENT METADATA & FOOTER */}
              <div className="text-[10px] text-slate-600 space-y-1">
                <div className="flex flex-wrap justify-between gap-1">
                  <div>
                    Payment Mode: <strong className="text-slate-800 uppercase">{receiptData.paymentMethod || 'UPI'}</strong>
                    {receiptData.referenceId && (
                      <span className="ml-1 text-slate-500">
                        (Ref: <span className="font-mono font-bold text-slate-800">{receiptData.referenceId}</span>)
                      </span>
                    )}
                  </div>
                  <div>
                    Recorded By: <strong className="text-slate-800">{receiptData.recordedBy || 'Manager'}</strong>
                  </div>
                </div>

                {receiptData.remainingDue !== undefined && receiptData.remainingDue > 0 && (
                  <div className="p-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px] flex justify-between">
                    <span>Remaining Due for Period:</span>
                    <span className="font-mono">₹{receiptData.remainingDue.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* 6. AUTHORIZED SIGNATURE & STAMP */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-end text-[10px]">
                <div className="space-y-0.5">
                  <div className="px-2 py-0.5 rounded-full border border-emerald-600 text-[9px] font-black text-emerald-700 uppercase tracking-wider text-center bg-emerald-50 inline-block">
                    ✓ PAID & VERIFIED
                  </div>
                  <p className="text-[9px] text-slate-400">Generated on {generatedTime}</p>
                </div>

                <div className="text-right space-y-0.5">
                  <div className="h-6 border-b border-slate-300 w-32 ml-auto" />
                  <p className="font-bold text-slate-800 text-[10px]">Hostel Management</p>
                  <p className="text-[9px] text-slate-400">Authorized Signatory</p>
                </div>
              </div>

            </div>

          </div>

          {/* Action Toolbar (Bottom Bar - Hidden on Print) */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50 shrink-0 no-print">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

