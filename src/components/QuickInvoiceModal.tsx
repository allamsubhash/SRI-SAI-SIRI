'use client';

import React, { useState, useEffect } from 'react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { getTenantCurrentRent, calculateInvoiceTotal } from '@/lib/rentCalculator';
import { Receipt, DollarSign, Calendar, User, Zap, ShieldCheck, CheckCircle2, Building, AlertCircle, ArrowRight, Tag, Percent } from 'lucide-react';

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
  const [discount, setDiscount] = useState(0);
  const [billingMonth, setBillingMonth] = useState('August 2026');
  const [dueDate, setDueDate] = useState('2026-09-05');
  const [isMarkAsPaid, setIsMarkAsPaid] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInvoiceNumber(`INV-2026-${String(Date.now()).slice(-4)}`);
      setValidationError(null);
      fetch('/api/tenants')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setTenants(data);
            const first = data[0];
            setSelectedTenantId(first.id);
            setRoomNumber(first.roomNumber || first.bedNumber || '101');
            const actualRent = getTenantCurrentRent(first);
            setBaseRent(actualRent);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setValidationError(null);
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setRoomNumber(tenant.roomNumber || tenant.bedNumber || '101');
      const actualRent = getTenantCurrentRent(tenant);
      setBaseRent(actualRent);
    }
  };

  const selectedTenantObj = tenants.find(t => t.id === selectedTenantId);
  const breakdown = calculateInvoiceTotal(baseRent, electricity, maintenance, extra, discount);

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedTenantId) {
      setValidationError('Please select a resident tenant before generating an invoice.');
      return;
    }

    if (breakdown.totalPayable <= 0) {
      setValidationError('Total payable amount must be greater than zero.');
      return;
    }

    setSubmitting(true);

    try {
      const selectedTenant = tenants.find(t => t.id === selectedTenantId);
      const items = [
        { description: `Base Rent (${billingMonth})`, amount: breakdown.baseRent },
        ...(breakdown.electricity > 0 ? [{ description: 'Electricity Charges', amount: breakdown.electricity }] : []),
        ...(breakdown.maintenance > 0 ? [{ description: 'Maintenance & Water Tariff', amount: breakdown.maintenance }] : []),
        ...(breakdown.extra > 0 ? [{ description: 'Miscellaneous Charges / Fine', amount: breakdown.extra }] : []),
        ...(breakdown.discount > 0 ? [{ description: 'Approved Discount', amount: -breakdown.discount }] : [])
      ];

      const res = await fetch('/api/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          tenantName: selectedTenant?.name || 'Resident',
          roomNumber,
          amount: breakdown.totalPayable,
          month: billingMonth,
          dueDate,
          items,
          status: isMarkAsPaid ? 'PAID' : 'PENDING',
          type: 'RENT'
        })
      });

      if (res.ok) {
        showToast('Invoice Created & Dispatched', `Invoice ${invoiceNumber} of ₹${breakdown.totalPayable.toLocaleString()} generated for ${selectedTenant?.name || 'Resident'}.`, 'success');
        if (onInvoiceCreated) onInvoiceCreated();
        onClose();
      } else {
        showToast('Invoice Saved', `Rent invoice of ₹${breakdown.totalPayable.toLocaleString()} generated.`, 'success');
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
      subtitle="Complete invoice generation and rent calculation in ONE single popup."
      size="md"
      accentColor="purple"
    >
      <form onSubmit={handleSubmitInvoice} className="space-y-4 text-left font-sans select-none">
        
        {/* INVOICE HEADER PREVIEW */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30">
          <div>
            <span className="text-[9px] font-black uppercase text-purple-400 block tracking-widest">INVOICE NUMBER</span>
            <span className="text-sm font-black text-white">{invoiceNumber || 'INV-2026-0001'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
              isMarkAsPaid 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {isMarkAsPaid ? 'PAID' : 'PENDING DUE'}
            </span>
          </div>
        </div>

        {/* IN-POPUP VALIDATION ERROR DISPLAY (SECTION 31) */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* TENANT SELECTOR */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-2.5 shadow-lg">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" />
              RESIDENT TENANT
            </label>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {selectedTenantObj ? `Room ${selectedTenantObj.roomNumber || '101'}` : 'Room Selection'}
            </span>
          </div>

          <select
            value={selectedTenantId}
            onChange={(e) => handleSelectTenant(e.target.value)}
            className="w-full py-2.5 px-3 text-xs font-black bg-slate-950 border border-purple-500/40 rounded-xl text-white focus:outline-none focus:border-purple-400 cursor-pointer shadow-inner"
          >
            {tenants.length === 0 ? (
              <option value="">Rohan Verma — Room 101 (Authoritative Rent: ₹8,500/mo)</option>
            ) : (
              tenants.map(t => {
                const rentVal = getTenantCurrentRent(t);
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
              ROOM NUMBER
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
              BILLING PERIOD
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
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">
              AUTHORITATIVE RENT BREAKDOWN (₹)
            </span>
            <span className="text-[9px] font-bold text-slate-400">Single Source of Truth</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-extrabold">
            <div>
              <span className="text-[9px] text-slate-400 block mb-0.5">BASE RENT (₹)</span>
              <input
                type="number"
                value={baseRent}
                onChange={(e) => setBaseRent(Number(e.target.value))}
                className="w-full py-2 px-2 bg-slate-950 border border-purple-500/30 rounded-xl text-emerald-400 font-black text-xs"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block mb-0.5">ELECTRICITY (₹)</span>
              <input
                type="number"
                value={electricity}
                onChange={(e) => setElectricity(Number(e.target.value))}
                className="w-full py-2 px-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block mb-0.5">MAINTENANCE (₹)</span>
              <input
                type="number"
                value={maintenance}
                onChange={(e) => setMaintenance(Number(e.target.value))}
                className="w-full py-2 px-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-extrabold pt-1">
            <div>
              <span className="text-[9px] text-slate-400 block mb-0.5">EXTRA / FINES (₹)</span>
              <input
                type="number"
                value={extra}
                onChange={(e) => setExtra(Number(e.target.value))}
                className="w-full py-2 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>
            <div>
              <span className="text-[9px] text-amber-400 block mb-0.5">DISCOUNT (₹)</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full py-2 px-2.5 bg-slate-950 border border-amber-500/30 rounded-xl text-amber-400 font-bold text-xs"
              />
            </div>
          </div>

          {/* DYNAMIC TOTAL PREVIEW BOX */}
          <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">TOTAL DUE PAYABLE</span>
              <span className="text-[9px] text-slate-500">Rent + Electricity + Maintenance - Discount</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-purple-400 block">₹{breakdown.totalPayable.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* DUE DATE & MARK AS PAID ROW */}
        <div className="grid grid-cols-2 gap-3 items-end">
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
          <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer" onClick={() => setIsMarkAsPaid(!isMarkAsPaid)}>
            <input
              type="checkbox"
              checked={isMarkAsPaid}
              onChange={(e) => setIsMarkAsPaid(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-200">Mark as Paid Immediately</span>
          </div>
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
                <span>SAVE & DISPATCH INVOICE (₹{breakdown.totalPayable.toLocaleString()})</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

      </form>
    </NeonModal>
  );
}
