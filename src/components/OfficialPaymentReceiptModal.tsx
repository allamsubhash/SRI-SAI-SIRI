'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, Building, ShieldCheck } from 'lucide-react';
import { numberToWords, formatDate, formatDateTime } from '@/utils/formatters';

export interface ReceiptItem {
  sNo?: number;
  accountHead: string;
  amount: number;
}

export interface OfficialReceiptData {
  receiptNo: string;
  date: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  mobileNumber: string;
  items: ReceiptItem[];
  totalAmount: number;
  paymentType?: string;
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
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !receiptData) return null;

  const totalAmount = receiptData.totalAmount || receiptData.items.reduce((sum, item) => sum + item.amount, 0);
  const amountInWords = numberToWords(totalAmount);
  const generatedTime = receiptData.generatedOn || formatDateTime(new Date());

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] overflow-y-auto font-sans bg-slate-950/75 backdrop-blur-sm flex justify-center items-start p-2 sm:p-6 py-6 sm:py-10 no-print">
        
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
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-[780px] bg-white rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-900 border border-slate-200 text-left my-auto sm:my-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header Bar with Close Button */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 no-print">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Official Hostel Payment Receipt</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Close Receipt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Receipt Body Container (Full Viewable) */}
          <div className="p-4 sm:p-8 space-y-5 bg-white">
            
            {/* 📄 THE EXACT OFFICIAL RECEIPT BOX (MATCHING REFERENCE IMAGE) */}
            <div 
              id="printable-official-receipt"
              ref={receiptRef}
              className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-300 shadow-sm space-y-4 text-slate-900 font-sans"
            >
              
              {/* TOP HEADER WITH EMBLEM & TITLE */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#702434] text-white flex items-center justify-center font-black text-sm shadow-sm">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#702434] tracking-tight">
                  SRI SAI SIRI BOYS HOSTEL
                </h1>
                <h2 className="text-base sm:text-lg font-bold text-[#702434] tracking-normal">
                  Online Payment Receipt
                </h2>
              </div>

              {/* 1. TENANT DETAILS SECTION (2 COLUMNS BOX) */}
              <div className="border border-slate-300 rounded-sm overflow-hidden text-xs bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300">
                  {/* Left Column */}
                  <div className="p-3 space-y-2">
                    <div className="flex">
                      <span className="w-36 font-semibold text-slate-700">Tenant ID</span>
                      <span className="font-bold text-slate-900">: {receiptData.tenantId || 'TEN-001'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-36 font-semibold text-slate-700">Tenant Name</span>
                      <span className="font-bold text-slate-900">: {receiptData.tenantName || 'SUBHASH'}</span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="p-3 space-y-2">
                    <div className="flex">
                      <span className="w-36 font-semibold text-slate-700">Room Number</span>
                      <span className="font-bold text-slate-900">: {receiptData.roomNumber || 'A-101'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-36 font-semibold text-slate-700">Mobile Number</span>
                      <span className="font-bold text-slate-900">: {receiptData.mobileNumber || '9876543210'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. RECEIPT INFORMATION ROW */}
              <div className="border border-slate-300 rounded-sm bg-slate-50/60 px-3.5 py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-bold text-slate-900 gap-1">
                <div>
                  Receipt No : <span className="font-mono text-slate-900">{receiptData.receiptNo}</span>
                </div>
                <div>
                  Date : <span className="font-mono text-slate-900">{formatDate(receiptData.date)}</span>
                </div>
              </div>

              {/* 3. PAYMENT DETAILS TABLE */}
              <div className="border border-slate-300 rounded-sm overflow-hidden text-xs">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-300 font-bold text-slate-800">
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-14">S.NO</th>
                      <th className="py-2.5 px-4 border-r border-slate-300">Account Head</th>
                      <th className="py-2.5 px-4 text-right w-36">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                    {receiptData.items && receiptData.items.length > 0 ? (
                      receiptData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 text-center border-r border-slate-300 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-4 border-r border-slate-300 font-semibold">{item.accountHead}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold">{item.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2.5 px-3 text-center border-r border-slate-300 font-mono">1</td>
                        <td className="py-2.5 px-4 border-r border-slate-300 font-semibold">HOSTEL RENT COLLECTION</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold">{totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 bg-slate-50/40">
                      <td colSpan={2} className="py-2.5 px-4 text-right font-bold text-slate-900 border-r border-slate-300">
                        Total :
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-slate-900 font-mono text-sm">
                        {totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 4. AMOUNT IN WORDS SECTION */}
              <div className="bg-[#DCE7F9] border border-[#B8D3F8] p-3 rounded-sm text-xs font-bold text-[#1E3A8A] tracking-tight">
                In Words : *** {amountInWords} ***
              </div>

              {/* 5. TERMS & CONDITIONS ROW */}
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600 px-0.5">
                <span>*Terms & Conditions Apply</span>
                <span>*Payment subject to realization</span>
              </div>

              {/* 6. COMPUTER GENERATED FOOTER */}
              <div className="bg-[#FEF6D8] border border-[#F7E7A9] p-3 rounded-sm text-center text-xs font-semibold text-[#713F12] space-y-0.5">
                <p>This is a Computer Generated Receipt. No signature is Required.</p>
                <p className="font-mono text-[11px] text-[#854D0E]">
                  Generated On : {generatedTime}
                </p>
              </div>

            </div>

          </div>

          {/* Bottom Action Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-3 no-print">
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-full bg-[#1E293B] text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-6 py-2.5 rounded-full bg-[#0F172A] text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Exporting PDF...' : 'Download PDF'}</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
