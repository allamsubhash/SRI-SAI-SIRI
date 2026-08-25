'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Warehouse, 
  Plus, 
  Loader, 
  Trash2, 
  Search, 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Tag, 
  IndianRupee,
  Filter,
  X
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { formatINR, formatDate } from '@/utils/formatters';

export default function InventoryManagement() {
  const { showToast } = useToast();
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedViewItem, setSelectedViewItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('FURNITURE');
  const [quantity, setQuantity] = useState('10');
  const [condition, setCondition] = useState('GOOD');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState('2500');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');

  const fetchItems = () => {
    setLoading(true);
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !cost) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, quantity, condition, purchaseDate, cost })
      });
      if (res.ok) {
        setName('');
        setShowModal(false);
        showToast('Asset Logged', `${name} logged into inventory registry.`, 'success');
        fetchItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedViewItem(null);
        showToast('Asset Removed', 'Item removed from inventory records.', 'info');
        fetchItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = search === '' || 
        item.name?.toLowerCase().includes(search.toLowerCase()) || 
        item.vendor?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesCondition = conditionFilter === 'ALL' || item.condition === conditionFilter;
      return matchesSearch && matchesCategory && matchesCondition;
    });
  }, [items, search, categoryFilter, conditionFilter]);

  // Metrics
  const totalAssetsCount = items.length;
  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [items]);
  const totalAssetValue = useMemo(() => items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.cost) || 0)), 0), [items]);
  const lowStockCount = useMemo(() => items.filter(item => (Number(item.quantity) || 0) <= 5).length, [items]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader className="w-8 h-8 animate-spin text-blue-600 dark:text-cyan-400" />
          <span className="text-xs font-black uppercase tracking-wider">Loading Inventory Ledger...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 page-entrance text-left font-sans transition-colors duration-200 select-none pb-24 relative">
      
      {/* 👑 1. HEADER HERO CARD */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] text-[#1C2522] dark:text-[#F2F5F2] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
              ASSETS & STOCK INVENTORY
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw animate-pulse" />
              {totalQuantity} TOTAL UNITS IN WAREHOUSE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            Warehouse Assets & Stock Registry
          </h1>
          
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Audit hostel furniture, electrical appliances, kitchen utensils, and maintenance stock items.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="py-3 px-6 rounded-2xl tenant-bg-accent text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log New Asset</span>
        </button>
      </div>

      {/* 📊 2. METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest block">TOTAL ASSETS</span>
          <div className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2] mt-1">{totalAssetsCount} Items</div>
          <span className="text-[10px] font-extrabold tenant-text-accent block mt-1">Cataloged</span>
        </div>

        <div className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest block">TOTAL UNITS</span>
          <div className="text-2xl font-black tenant-text-accent mt-1">{totalQuantity} Units</div>
          <span className="text-[10px] font-extrabold tenant-text-accent block mt-1">In Warehouse</span>
        </div>

        <div className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">LOW STOCK ALERTS</span>
          <div className="text-2xl font-black text-amber-500 mt-1">{lowStockCount} Items</div>
          <span className="text-[10px] font-extrabold text-amber-500 block mt-1">Under 5 Units</span>
        </div>

        <div className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">VALUATION VALUE</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatINR(totalAssetValue)}</div>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">Asset Worth</span>
        </div>
      </div>

      {/* 🔍 3. SEARCH & FILTERS TOOLBAR */}
      <div className="p-5 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#929B96] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] cursor-pointer focus:outline-none focus:tenant-border-accent"
          >
            <option value="ALL">All Categories</option>
            <option value="FURNITURE">Furniture</option>
            <option value="ELECTRONICS">Electronics</option>
            <option value="KITCHEN">Kitchen / Utensils</option>
            <option value="CLEANING">Cleaning Supplies</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">All Conditions</option>
            <option value="GOOD">Good / Functional</option>
            <option value="NEED_REPLACEMENT">Need Replacement</option>
            <option value="REPAIRING">Under Repair</option>
          </select>
        </div>
      </div>

      {/* 📦 4. ASSETS CARDS GRID / EMPTY STATE */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white/80 dark:bg-[#141D30]/80 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-xl space-y-3">
          <Boxes className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-black text-slate-900 dark:text-white">No inventory assets found</p>
          <p className="text-xs text-slate-400">Log your first physical asset item to track warehouse stock.</p>
          <button
            onClick={() => setShowModal(true)}
            className="py-2.5 px-5 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
          >
            Log Asset Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedViewItem(item)}
              className="bg-[#FDFBF9]/95 dark:bg-[#141D30]/95 p-5 rounded-[28px] border border-white/80 dark:border-white/10 shadow-xl backdrop-blur-2xl cursor-pointer text-left space-y-4 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                    {item.name}
                  </h3>
                  <span className="text-[10px] font-black text-blue-600 dark:text-cyan-400 uppercase tracking-widest block mt-0.5">
                    {item.category}
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  item.condition === 'GOOD' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                  item.condition === 'REPAIRING' ? 'bg-amber-500/15 text-amber-500' :
                  'bg-rose-500/15 text-rose-500'
                }`}>
                  {item.condition}
                </span>
              </div>

              {/* Quantity Stock Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                  <span className="text-slate-400 text-[10px] uppercase font-black">Stock In Warehouse</span>
                  <span className="text-slate-900 dark:text-white font-black">{item.quantity} Units</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.quantity > 5 ? 'bg-blue-600 dark:bg-cyan-400' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (item.quantity / 50) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-1.5 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit Cost</span>
                  <span className="text-slate-900 dark:text-white font-black">{formatINR(item.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Purchase Date</span>
                  <span className="text-slate-500 font-medium">{formatDate(item.purchaseDate)}</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteItem(item);
                    setShowDeleteModal(true);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  title="Delete Asset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          ))}
        </div>
      )}

      {/* 🚀 5. LOG INVENTORY MODAL */}
      {showModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title="Log Inventory Fixture"
          subtitle="Create a physical stock item record."
          size="md"
          accentColor="blue"
        >
          <form onSubmit={handleAddItem} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Item Name</label>
              <input
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wooden Dining Chair"
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
                  <option value="FURNITURE">Furniture</option>
                  <option value="ELECTRONICS">Electronics</option>
                  <option value="KITCHEN">Kitchen / Utensils</option>
                  <option value="CLEANING">Cleaning Supplies</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Condition</label>
                <select
                  value={condition} onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="GOOD">Good / Functional</option>
                  <option value="NEED_REPLACEMENT">Need Replacement</option>
                  <option value="REPAIRING">Under Repair</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Quantity</label>
                <input
                  type="number" required value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Unit Cost (₹)</label>
                <input
                  type="number" required value={cost} onChange={(e) => setCost(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Purchase Date</label>
              <input
                type="date" required value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}
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
                className="py-2.5 px-6 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Log Item ✓
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* 📌 6. VIEW ASSET DETAILS POPUP MODAL */}
      {selectedViewItem && (
        <NeonModal
          isOpen={true}
          onClose={() => setSelectedViewItem(null)}
          title={`Asset Item: ${selectedViewItem.name}`}
          subtitle={`Category: ${selectedViewItem.category} • Status: ${selectedViewItem.condition}`}
          size="md"
          accentColor="blue"
        >
          <div className="space-y-4 text-left font-sans">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-slate-400">Stock Quantity</span>
                <span className="text-slate-900 dark:text-white font-black">{selectedViewItem.quantity} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unit Cost</span>
                <span className="text-blue-600 dark:text-cyan-400 font-black">{formatINR(selectedViewItem.cost)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/80 dark:border-zinc-800 pt-2">
                <span className="text-slate-400">Total Asset Value</span>
                <span className="text-emerald-600 font-black text-sm">{formatINR((Number(selectedViewItem.quantity) || 0) * (Number(selectedViewItem.cost) || 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Purchase Date</span>
                <span className="text-slate-500">{formatDate(selectedViewItem.purchaseDate)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedViewItem(null)}
                className="py-2.5 px-5 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* ⚠️ 7. DELETE CONFIRMATION MODAL */}
      {showDeleteModal && deleteItem && (
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
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Delete Asset Item?</h4>
              <p className="text-xs text-rose-500 font-bold mt-0.5">{deleteItem.name}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">This item will be permanently removed from physical inventory ledger.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(deleteItem.id)}
                className="py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </NeonModal>
      )}

    </div>
  );
}
