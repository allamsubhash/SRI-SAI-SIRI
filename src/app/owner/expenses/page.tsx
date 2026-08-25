'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Plus, 
  Loader, 
  Calendar, 
  FileText, 
  Trash2, 
  Search,
  Receipt,
  IndianRupee,
  PieChart,
  Tag,
  X
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { formatINR, formatDate } from '@/utils/formatters';

export default function ExpensesManagement() {
  const { showToast } = useToast();
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedViewExpense, setSelectedViewExpense] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteExpense, setDeleteExpense] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('1500');
  const [category, setCategory] = useState('UTILITIES');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchExpenses = () => {
    setLoading(true);
    fetch('/api/expenses')
      .then(res => res.json())
      .then(data => {
        setExpenses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !date) return;

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, amount: parseFloat(amount), category, date, notes })
      });
      if (res.ok) {
        setTitle('');
        setNotes('');
        setShowModal(false);
        showToast('Expense Logged', `${title} registered in financial overheads.`, 'success');
        fetchExpenses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedViewExpense(null);
        showToast('Expense Deleted', 'Bill record removed from overhead ledger.', 'info');
        fetchExpenses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = search === '' || 
        exp.title?.toLowerCase().includes(search.toLowerCase()) || 
        exp.notes?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || exp.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, categoryFilter]);

  const totalOverhead = useMemo(() => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [expenses]);
  const utilitiesTotal = useMemo(() => expenses.filter(e => e.category === 'UTILITIES').reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [expenses]);
  const kitchenTotal = useMemo(() => expenses.filter(e => e.category === 'FOOD').reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [expenses]);
  const maintenanceTotal = useMemo(() => expenses.filter(e => e.category === 'MAINTENANCE').reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [expenses]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader className="w-8 h-8 animate-spin text-blue-600 dark:text-cyan-400" />
          <span className="text-xs font-black uppercase tracking-wider">Loading Financial Expenses Ledger...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-entrance text-left pb-24 select-none relative font-sans">
      
      {/* 👑 1. HEADER HERO CARD */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] text-[#1C2522] dark:text-[#F2F5F2] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
              OPERATIONAL EXPENSES LEDGER
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw animate-pulse" />
              {expenses.length} EXPENSE RECORDS
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            Financial Expenses & Overheads
          </h1>
          
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Track utility bills, kitchen groceries, maintenance repairs, and staff overheads.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="py-3 px-6 rounded-2xl tenant-bg-accent text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Expense Bill</span>
        </button>
      </div>

      {/* 📊 2. EXPENSE SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest block">TOTAL OVERHEADS</span>
          <div className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2] mt-1">{formatINR(totalOverhead)}</div>
          <span className="text-[10px] font-extrabold tenant-text-accent block mt-1">Logged Expenses</span>
        </div>

        <div className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest block">UTILITIES</span>
          <div className="text-2xl font-black tenant-text-accent mt-1">{formatINR(utilitiesTotal)}</div>
          <span className="text-[10px] font-extrabold tenant-text-accent block mt-1">Electricity & Water</span>
        </div>

        <div className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">FOOD & KITCHEN</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatINR(kitchenTotal)}</div>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">Groceries & Mess</span>
        </div>

        <div className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">MAINTENANCE</span>
          <div className="text-2xl font-black text-amber-500 mt-1">{formatINR(maintenanceTotal)}</div>
          <span className="text-[10px] font-extrabold text-amber-500 block mt-1">Room Repairs</span>
        </div>
      </div>

      {/* 🔍 3. SEARCH & FILTERS TOOLBAR */}
      <div className="p-5 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#929B96] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] cursor-pointer w-full md:w-auto focus:outline-none focus:tenant-border-accent"
        >
          <option value="ALL">All Expense Categories</option>
          <option value="UTILITIES">Utilities (Electricity/Water)</option>
          <option value="FOOD">Food / Kitchen Groceries</option>
          <option value="MAINTENANCE">Room Repairs / Maintenance</option>
          <option value="SALARY">Staff Salaries</option>
          <option value="OTHER">Other Overhead</option>
        </select>
      </div>

      {/* 📦 4. EXPENSES GRID / EMPTY STATE */}
      {filteredExpenses.length === 0 ? (
        <div className="p-12 text-center bg-white/80 dark:bg-[#141D30]/80 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-xl space-y-3">
          <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-black text-slate-900 dark:text-white">No expenses recorded yet</p>
          <p className="text-xs text-slate-400">Log your operational bills and overhead expenses to track financial outflows.</p>
          <button
            onClick={() => setShowModal(true)}
            className="py-2.5 px-5 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
          >
            Log Expense Bill
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExpenses.map((exp) => (
            <motion.div
              key={exp.id}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedViewExpense(exp)}
              className="bg-[#FDFBF9]/95 dark:bg-[#141D30]/95 p-5 rounded-[28px] border border-white/80 dark:border-white/10 shadow-xl backdrop-blur-2xl cursor-pointer text-left space-y-4 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                    {exp.title}
                  </h3>
                  <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block mt-0.5">
                    {exp.category}
                  </span>
                </div>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {formatINR(exp.amount)}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium italic line-clamp-2">
                {exp.notes || 'No description notes.'}
              </p>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 text-xs font-bold">
                <span className="text-slate-400">Date: {formatDate(exp.date)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteExpense(exp);
                    setShowDeleteModal(true);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  title="Delete Expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          ))}
        </div>
      )}

      {/* 🚀 5. LOG EXPENSE MODAL */}
      {showModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title="Log Expense Bill"
          subtitle="Create a new operational overhead expense log."
          size="md"
          accentColor="purple"
        >
          <form onSubmit={handleAddExpense} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Bill Title</label>
              <input
                type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Electric Grid Submeter Bill"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Category</label>
                <select
                  value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="UTILITIES">Utilities (Electricity/Water)</option>
                  <option value="FOOD">Food / Kitchen Groceries</option>
                  <option value="MAINTENANCE">Room Repairs / Supplies</option>
                  <option value="SALARY">Staff Salaries</option>
                  <option value="OTHER">Other Overhead</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Amount Paid (₹)</label>
                <input
                  type="number" required value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Billing Date</label>
              <input
                type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Optional Notes / Description</label>
              <input
                type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Vendor name or transaction ID..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Submit Expense ✓
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* 📌 6. VIEW EXPENSE DETAILS POPUP MODAL */}
      {selectedViewExpense && (
        <NeonModal
          isOpen={true}
          onClose={() => setSelectedViewExpense(null)}
          title={`Expense Bill: ${selectedViewExpense.title}`}
          subtitle={`Category: ${selectedViewExpense.category} • Date: ${formatDate(selectedViewExpense.date)}`}
          size="md"
          accentColor="purple"
        >
          <div className="space-y-4 text-left font-sans">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid</span>
                <span className="text-purple-600 dark:text-purple-400 font-black text-sm">{formatINR(selectedViewExpense.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Billing Date</span>
                <span className="text-slate-900 dark:text-white">{formatDate(selectedViewExpense.date)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Description Notes</span>
                <p className="text-slate-700 dark:text-zinc-300 italic">{selectedViewExpense.notes || 'No description notes provided.'}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedViewExpense(null)}
                className="py-2.5 px-5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* ⚠️ 7. DELETE CONFIRMATION MODAL */}
      {showDeleteModal && deleteExpense && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowDeleteModal(false)}
          size="sm"
          accentColor="rose"
        >
          <div className="py-2 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 mx-auto flex items-center justify-center text-xl font-black">
              ⚠️
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Delete Expense Record?</h4>
              <p className="text-xs text-rose-500 font-bold mt-0.5">{deleteExpense.title}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">This bill will be permanently removed from financial overhead ledger.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteExpense(deleteExpense.id)}
                className="py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Delete Expense
              </button>
            </div>
          </div>
        </NeonModal>
      )}

    </div>
  );
}
