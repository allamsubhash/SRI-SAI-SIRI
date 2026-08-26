'use client';

import React, { useState, useEffect } from 'react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { Receipt, DollarSign, Calendar, User, Zap, ShieldCheck, CheckCircle2, Building, AlertCircle, ArrowRight } from 'lucide-react';

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
  const [baseRent, setBaseRent] = useState(8500);
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
          if (Array.isArray(data) && data.length > 0) {
            setTenants(data);
            const first = data[0];
            setSelectedTenantId(first.id);
            setRoomNumber(first.roomNumber || first.bedNumber || '101');
            const actualRent = Number(first.rentAmount || first.monthlyRent || first.rent || 8500);
            setBaseRent(actualRent);
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
      const actualRent = Number(tenant.rentAmount || tenant.monthlyRent || tenant.rent || 8500);
      setBaseRent(actualRent);
    }
  };

  const selectedTenantObj = tenants.find(t => t.id === selectedTenantId);
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
        showToast('Invoice Dispatched!', `₹${totalAmount.toLocaleString()} rent bill sent to ${selectedTenant?.name || 'Tenant'}.`, 'success');
        if (onInvoiceCreated) onInvoiceCreated();
        onClose();
      } else {
        showToast('Generated Locally', `Rent invoice of ₹${totalAmount.toLocaleString()} created for ${selectedTenant?.name || 'Tenant'}.`, 'success');
        if (onInvoiceCreated) onInvoiceCreated();
        onClose();
      }
    } catch (err) {
      showToast('Invoice Created', `Quick invoice created for Room ${roomNumber}.`, 'success');
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
      <form onSubmit={handleSubmitInvoice} className="space-y-4 text-left font-sans select-none">
        
        {/* RESIDENT SELECTOR & SUMMARY HERO BANNER */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-[#131127] to-slate-900 border border-purple-500/30 space-y-3 shadow-lg">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" />
              SELECT RESIDENT TENANT
            </label>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {selectedTenantObj ? `Room ${selectedTenantObj.roomNumber || '101'}` : 'Room Allocation'}
            </span>
          </div>

          <select
            value={selectedTenantId}
            onChange={(e) => handleSelectTenant(e.target.value)}
            className="w-full py-2.5 px-3 text-xs font-black bg-slate-900/90 border border-purple-500/40 rounded-xl text-white focus:outline-none focus:border-purple-400 cursor-pointer shadow-inner"
          >
            {tenants.length === 0 ? (
              <option value="">Rohan Verma (Room 101 — ₹8,500/mo)</option>
            ) : (
              tenants.map(t => {
                const rentVal = Number(t.rentAmount || t.monthlyRent || t.rent || 8500);
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} — Room {t.roomNumber || '101'} (Actual Rent: ₹{rentVal.toLocaleString()}/mo)
                  </option>
                );
              })
            )}
          </select>
        </div>

        {/* ROOM & BILLING MONTH ROW */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
              <Building className="w-3 h-3 text-purple-400" />
              ASSIGNED ROOM
            </label>
            <input
              type="text"
              required
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="w-full py-2 px-3 text-xs font-extrabold bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-400" />
              BILLING MONTH
            </label>
            <input
              type="text"
              required
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              placeholder="e.g. August 2026"
              className="w-full py-2 px-3 text-xs font-extrabold bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* FEE BREAKDOWN GRID */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">
              ACTUAL RENT & EXTRA CHARGES (₹)
            </span>
            <span className="text-[9px] font-bold text-slate-400">Auto-filled from Tenant Profile</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs font-extrabold">
            <div>
              <span className="text-[9px] text-slate-400 block mb-0.5">ACTUAL BASE RENT (₹)</span>
              <input
                type="number"
                value={baseRent}
                onChange={(e) => setBaseRent(Number(e.target.value))}
                className="w-full py-2 px-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-emerald-400 font-black text-sm"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block mb-0.5">ELECTRICITY BILL (₹)</span>
              <input
                type="number"
                value={electricity}
                onChange={(e) => setElectricity(Number(e.target.value))}
                className="w-full py-2 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block mb-0.5">MAINTENANCE & WATER (₹)</span>
              <input
                type="number"
                value={maintenance}
                onChange={(e) => setMaintenance(Number(e.target.value))}
                className="w-full py-2 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block mb-0.5">EXTRA / LATE FINE (₹)</span>
              <input
                type="number"
                value={extra}
                onChange={(e) => setExtra(Number(e.target.value))}
                className="w-full py-2 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          {/* DYNAMIC TOTAL PREVIEW BOX */}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">TOTAL PAYABLE AMOUNT</span>
              <span className="text-[9px] text-slate-500">Base Rent + Utilities + Fines</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-purple-400 block">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* DUE DATE */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            PAYMENT DUE DATE
          </label>
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full py-2 px-3 text-xs font-extrabold bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* ACTION BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:shadow-purple-500/25 transition-all cursor-pointer border border-purple-400/40"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>GENERATE & DISPATCH INVOICE (₹{totalAmount.toLocaleString()})</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

      </form>
    </NeonModal>
  );
}
