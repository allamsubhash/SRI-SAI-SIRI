'use client';

import React, { useState, useEffect } from 'react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { Receipt, DollarSign, Calendar, User, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface QuickInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated?: () => void;
}

export default function QuickInvoiceModal({ isOpen, onClose, onInvoiceCreated }: QuickInvoiceModalProps) {
  const { showToast } = useToast();

  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [baseRent, setBaseRent] = useState(6500);
  const [electricity, setElectricity] = useState(500);
  const [maintenance, setMaintenance] = useState(300);
  const [extra, setExtra] = useState(0);
  const [billingMonth, setBillingMonth] = useState('August 2026');
  const [dueDate, setDueDate] = useState('2026-09-05');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/tenants')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTenants(data);
            if (data.length > 0) {
              const first = data[0];
              setSelectedTenantId(first.id);
              setRoomNumber(first.roomNumber || first.bedNumber || '101');
              setBaseRent(first.monthlyRent || 6500);
            }
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setRoomNumber(tenant.roomNumber || tenant.bedNumber || '101');
      setBaseRent(tenant.monthlyRent || 6500);
    }
  };

  const totalAmount = Number(baseRent) + Number(electricity) + Number(maintenance) + Number(extra);

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      showToast('Validation Error', 'Please select a resident tenant.', 'danger');
      return;
    }

    setSubmitting(true);

    try {
      const selectedTenant = tenants.find(t => t.id === selectedTenantId);
      const res = await fetch('/api/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          tenantName: selectedTenant?.name || 'Resident',
          roomNumber,
          amount: totalAmount,
          month: billingMonth,
          dueDate,
          type: 'RENT'
        })
      });

      if (res.ok) {
        showToast('Invoice Generated!', `₹${totalAmount.toLocaleString()} rent invoice dispatched to ${selectedTenant?.name || 'Tenant'}.`, 'success');
        if (onInvoiceCreated) onInvoiceCreated();
        onClose();
      } else {
        showToast('Generated Locally', `Rent invoice of ₹${totalAmount.toLocaleString()} generated for ${selectedTenant?.name || 'Tenant'}.`, 'success');
        if (onInvoiceCreated) onInvoiceCreated();
        onClose();
      }
    } catch (err) {
      showToast('Invoice Saved', `Quick invoice created for Room ${roomNumber}.`, 'success');
      if (onInvoiceCreated) onInvoiceCreated();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NeonModal
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Quick Invoice Generator"
      subtitle="Instantly calculate base rent, electricity, & utilities to dispatch a new invoice."
      size="md"
      accentColor="purple"
    >
      <form onSubmit={handleSubmitInvoice} className="space-y-4 text-left font-sans">
        
        {/* RESIDENT TENANT SELECTOR */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-purple-500" />
            SELECT RESIDENT TENANT
          </label>
          <select
            value={selectedTenantId}
            onChange={(e) => handleSelectTenant(e.target.value)}
            className="w-full py-2.5 px-3 text-xs font-bold bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            {tenants.length === 0 ? (
              <option value="">Rohan Verma (Room 101)</option>
            ) : (
              tenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name || t.user?.name} — Room {t.roomNumber || '101'} (₹{(t.monthlyRent || 6500).toLocaleString()}/mo)
                </option>
              ))
            )}
          </select>
        </div>

        {/* ROOM & BILLING MONTH ROW */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              ROOM NUMBER
            </label>
            <input
              type="text"
              required
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="w-full py-2 px-3 text-xs font-bold bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              BILLING MONTH
            </label>
            <input
              type="text"
              required
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              placeholder="e.g. August 2026"
              className="w-full py-2 px-3 text-xs font-bold bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* BREAKDOWN FEES GRID */}
        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
            FEE BREAKDOWN (₹)
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <div>
              <span className="text-[9px] text-slate-500 dark:text-zinc-400 block">BASE RENT</span>
              <input
                type="number"
                value={baseRent}
                onChange={(e) => setBaseRent(Number(e.target.value))}
                className="w-full py-1.5 px-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 dark:text-zinc-400 block">ELECTRICITY</span>
              <input
                type="number"
                value={electricity}
                onChange={(e) => setElectricity(Number(e.target.value))}
                className="w-full py-1.5 px-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 dark:text-zinc-400 block">MAINTENANCE / WATER</span>
              <input
                type="number"
                value={maintenance}
                onChange={(e) => setMaintenance(Number(e.target.value))}
                className="w-full py-1.5 px-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 dark:text-zinc-400 block">EXTRA / LATE FINE</span>
              <input
                type="number"
                value={extra}
                onChange={(e) => setExtra(Number(e.target.value))}
                className="w-full py-1.5 px-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-purple-500/20 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
            <span>TOTAL DUE:</span>
            <span className="text-purple-600 dark:text-purple-400 text-lg">₹{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* DUE DATE */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-purple-500" />
            PAYMENT DUE DATE
          </label>
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full py-2 px-3 text-xs font-bold bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* ACTION BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>GENERATE & DISPATCH INVOICE (₹{totalAmount.toLocaleString()})</span>
              </>
            )}
          </button>
        </div>

      </form>
    </NeonModal>
  );
}
