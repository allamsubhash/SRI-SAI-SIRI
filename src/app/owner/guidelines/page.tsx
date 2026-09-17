'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  X,
  AlertCircle
} from 'lucide-react';

interface Guideline {
  id: string;
  title: string;
  content: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function OwnerGuidelinesPage() {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Guideline | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchGuidelines = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guidelines?all=true');
      const data = await res.json();
      if (Array.isArray(data)) {
        setGuidelines(data);
      }
    } catch (err: any) {
      setError('Failed to load guidelines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setContent('');
    setOrder(guidelines.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (item: Guideline) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setOrder(item.order);
    setIsActive(item.isActive);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setError('Title and content are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const url = '/api/guidelines';
      const method = editingItem ? 'PUT' : 'POST';
      const bodyPayload = editingItem
        ? { id: editingItem.id, title, content, order, isActive }
        : { title, content, order, isActive };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setSuccessMsg(editingItem ? 'Guideline updated successfully' : 'Guideline created successfully');
        setModalOpen(false);
        fetchGuidelines();
      } else {
        setError(resData.error || 'Operation failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (item: Guideline) => {
    try {
      const res = await fetch('/api/guidelines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive })
      });
      if (res.ok) {
        fetchGuidelines();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hostel guideline?')) return;
    try {
      const res = await fetch('/api/guidelines', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setSuccessMsg('Guideline deleted');
        fetchGuidelines();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-3xl bg-white dark:bg-[#141D19] border border-slate-200 dark:border-[#293832] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Hostel Rules & Guidelines</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Manage rules displayed to prospective and active residents.</p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Rule</span>
        </button>
      </div>

      {/* FEEDBACK BANNERS */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-xs">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs">✕</button>
        </div>
      )}

      {/* GUIDELINES LIST */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-bold">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading hostel guidelines...
        </div>
      ) : guidelines.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#141D19] border border-slate-200 dark:border-[#293832] text-slate-400 text-xs font-medium">
          No guidelines found. Click "Add New Rule" above to create your first rule.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guidelines.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                item.isActive
                  ? 'bg-white dark:bg-[#141D19] border-slate-200 dark:border-[#293832]'
                  : 'bg-slate-50/50 dark:bg-zinc-900/40 border-slate-200/60 dark:border-zinc-800/60 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-600 dark:text-cyan-400 text-xs font-black flex items-center justify-center">
                      #{item.order || idx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h3>
                  </div>
                  <button
                    onClick={() => toggleStatus(item)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                      item.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'
                    }`}
                  >
                    {item.isActive ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed pl-8">
                  {item.content}
                </p>
              </div>

              <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-blue-600 cursor-pointer transition-colors"
                  title="Edit Rule"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white cursor-pointer transition-colors"
                  title="Delete Rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#141D19] border border-slate-200 dark:border-[#293832] shadow-2xl z-10 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  {editingItem ? 'Edit Guideline Rule' : 'Add New Guideline Rule'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Rule Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Cleanliness & Hygiene"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Rule Content & Description</label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Provide full rule details and instructions..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Display Order</label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-medium focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Status</label>
                    <select
                      value={isActive ? 'ACTIVE' : 'INACTIVE'}
                      onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-medium focus:outline-none"
                    >
                      <option value="ACTIVE">Active (Public)</option>
                      <option value="INACTIVE">Inactive (Disabled)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-full bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-700"
                  >
                    {submitting ? 'Saving...' : 'Save Rule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
