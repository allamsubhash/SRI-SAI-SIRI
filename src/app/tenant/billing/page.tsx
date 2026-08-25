'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
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
  FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import NeonModal from '@/components/NeonModal';
import { formatINR, formatDate } from '@/utils/formatters';

export default function TenantBilling() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Payment Modal
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [paying, setPaying] = useState(false);

  const fetchTenantInvoices = () => {
    setLoading(true);
    fetch('/api/rent')
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a: any, b: any) => new Date(b.dateCreated || b.dueDate || 0).getTime() - new Date(a.dateCreated || a.dueDate || 0).getTime());
        const filtered = sorted.filter((inv: any) => 
          (inv.tenantName && user?.name && inv.tenantName.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
          (inv.tenantId && user?.id && inv.tenantId === user.id)
        );
        setInvoices(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user) {
      fetchTenantInvoices();
    }
  }, [user]);

  const handleDownloadPDF = (inv: any) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(23, 107, 91);
      doc.rect(0, 0, 210, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('Helvetica', 'bold');
      doc.text('SRI SAI SIRI BOYS HOSTEL', 14, 25);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text('OFFICIAL RESIDENT RENT RECEIPT', 14, 34);

      doc.setTextColor(28, 37, 34);
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Receipt #: ${inv.number}`, 14, 60);

      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Tenant Name: ${user?.name || inv.tenantName}`, 14, 70);
      doc.text(`Billing Date: ${formatDate(inv.dateCreated)}`, 14, 78);
      doc.text(`Due Date: ${formatDate(inv.dueDate)}`, 14, 86);
      doc.text(`Payment Status: ${inv.status}`, 14, 94);

      doc.setFont('Helvetica', 'bold');
      doc.text(`Total Amount: INR ${(inv.paidAmount || inv.amount).toLocaleString('en-IN')}`, 14, 110);

      doc.save(`Receipt_${inv.number}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice || paying) return;

    setPaying(true);
    try {
      const res = await fetch('/api/rent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: activeInvoice.id,
          amountPaid: activeInvoice.amount,
          method: 'ONLINE',
          isTenantPayment: true
        })
      });
      if (res.ok) {
        setShowModal(false);
        setActiveInvoice(null);
        fetchTenantInvoices();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaying(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = search === '' || 
        inv.number?.toLowerCase().includes(search.toLowerCase()) ||
        inv.dueDate?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterStatus === 'ALL' || inv.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [invoices, search, filterStatus]);

  const outstandingBalance = invoices.reduce((sum, inv) => sum + (inv.status !== 'PAID' ? (inv.amount - (inv.paidAmount || 0)) : 0), 0);
  const pendingInv = invoices.find(i => i.status === 'PENDING' || i.status === 'OVERDUE');

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[#68736E] dark:text-[#9BAAA4]">
        <Loader className="w-8 h-8 animate-spin tenant-text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-7 page-entrance text-left font-sans transition-colors duration-200">
      
      {/* 👑 1. TOP HERO CARD */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm space-y-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
            MY BILLING & DUES
          </span>
          <div className="text-3xl sm:text-4xl font-black text-[#1C2522] dark:text-[#F2F5F2]">
            {formatINR(outstandingBalance)}
          </div>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            {pendingInv 
              ? `Due on ${formatDate(pendingInv.dueDate)} • Invoice #${pendingInv.number}` 
              : '✓ All invoices cleared. Account in good standing!'}
          </p>
        </div>

        {pendingInv && (
          <button
            onClick={() => {
              setActiveInvoice(pendingInv);
              setShowModal(true);
            }}
            className="py-3.5 px-8 rounded-2xl tenant-bg-accent font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-transform cursor-pointer shrink-0"
          >
            PAY NOW →
          </button>
        )}
      </div>

      {/* 🔍 2. SEARCH & STATUS FILTER TOOLBAR */}
      <div className="p-4 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929B96]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number or date..."
            className="w-full bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] rounded-2xl pl-11 pr-4 py-2.5 text-xs text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Invoices' },
            { id: 'PAID', label: 'Paid' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'OVERDUE', label: 'Overdue' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? 'tenant-bg-accent shadow-md'
                  : 'bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📑 3. PAYMENT HISTORY TRANSACTION ROWS */}
      <div className="p-6 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm space-y-4">
        <h3 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2] pb-3 border-b border-[#DDD8CE] dark:border-[#293832]">
          Payment History & Receipts
        </h3>

        <div className="space-y-3">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center bg-[#F1EEE7] dark:bg-[#1A2621] rounded-2xl space-y-2">
              <Receipt className="w-8 h-8 text-[#929B96] mx-auto opacity-50" />
              <p className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2]">No invoices found</p>
              <p className="text-[11px] text-[#68736E] dark:text-[#9BAAA4]">No rent invoices match your search filters.</p>
            </div>
          ) : (
            filteredInvoices.map((inv) => {
              const isPaid = inv.status === 'PAID';
              const isOverdue = inv.status === 'OVERDUE';
              return (
                <div 
                  key={inv.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:tenant-border-accent transition-all text-left"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#1C2522] dark:text-[#F2F5F2]">Invoice #{inv.number}</span>
                      <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                        isPaid ? 'tenant-bg-soft tenant-text-accent border tenant-border-accent' :
                        isOverdue ? 'bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676] border border-rose-200 dark:border-[#F27676]/30' :
                        'bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D] border border-amber-200 dark:border-[#F2C15D]/30'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
                      Billing Cycle: Monthly Room Rent • Due Date: {formatDate(inv.dueDate)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-[#DDD8CE] dark:border-[#293832] pt-3 sm:pt-0">
                    <span className="text-lg font-black text-[#1C2522] dark:text-[#F2F5F2]">{formatINR(inv.amount)}</span>
                    {isPaid ? (
                      <button
                        onClick={() => handleDownloadPDF(inv)}
                        className="px-3.5 py-2 rounded-xl tenant-bg-soft tenant-text-accent border tenant-border-accent text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveInvoice(inv);
                          setShowModal(true);
                        }}
                        className="px-4 py-2 rounded-xl tenant-bg-accent text-xs font-black shadow-md cursor-pointer shrink-0"
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 💳 SIMULATION MODAL */}
      {showModal && activeInvoice && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title={`Pay Invoice #${activeInvoice.number}`}
          subtitle="Settle your rent payment online."
          size="sm"
          accentColor="emerald"
        >
          <form onSubmit={handlePaySubmit} className="space-y-4 text-left font-sans">
            <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Total Payable</span>
                <span className="tenant-text-accent font-black text-sm">{formatINR(activeInvoice.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#68736E] dark:text-[#9BAAA4]">Due Date</span>
                <span className="text-[#1C2522] dark:text-[#F2F5F2]">{formatDate(activeInvoice.dueDate)}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Payment Method</label>
              <select className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]">
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="NETBANKING">Net Banking</option>
              </select>
            </div>

            <div className="pt-3 border-t border-[#DDD8CE] dark:border-[#293832] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4] font-bold text-xs cursor-pointer border border-[#DDD8CE] dark:border-[#293832]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paying}
                className="py-2.5 px-6 rounded-2xl tenant-bg-accent font-black text-xs cursor-pointer disabled:opacity-50 shadow-md"
              >
                {paying ? 'Processing...' : 'Confirm Payment ✓'}
              </button>
            </div>
          </form>
        </NeonModal>
      )}

    </div>
  );
}
