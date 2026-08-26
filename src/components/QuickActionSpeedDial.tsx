'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UserPlus, FilePlus, Megaphone, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

import QuickInvoiceModal from '@/components/QuickInvoiceModal';

export default function QuickActionSpeedDial() {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickInvoiceModal, setShowQuickInvoiceModal] = useState(false);

  const actions = [
    {
      label: 'Add Resident',
      icon: <UserPlus className="w-4 h-4 text-emerald-400" />,
      href: '/owner/tenants',
      bgColor: 'bg-slate-900 text-white dark:bg-zinc-800'
    },
    {
      label: '⚡ Quick Invoice Generator',
      icon: <FilePlus className="w-4 h-4 text-purple-400" />,
      onClick: () => setShowQuickInvoiceModal(true),
      bgColor: 'bg-slate-900 text-white dark:bg-zinc-800'
    },
    {
      label: 'Broadcast Notice',
      icon: <Megaphone className="w-4 h-4 text-amber-400 text-purple-400" />,
      href: '/owner/notices',
      bgColor: 'bg-slate-900 text-white dark:bg-zinc-800'
    }
  ];

  return (
    <div className="fixed bottom-24 sm:bottom-28 right-6 z-[999] flex flex-col items-end gap-3 pointer-events-auto">
      {/* Speed Dial Action Items */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {actions.map((action, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.18, delay: idx * 0.04 }}
              >
                {action.onClick ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      action.onClick!();
                    }}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-zinc-800 shadow-xl hover:scale-105 transition-all text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer group"
                  >
                    <span className="text-slate-700 dark:text-zinc-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {action.label}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-purple-500/15 flex items-center justify-center">
                      {action.icon}
                    </div>
                  </button>
                ) : (
                  <Link
                    href={action.href!}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-zinc-800 shadow-xl hover:scale-105 transition-all text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer group"
                  >
                    <span className="text-slate-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {action.label}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      {action.icon}
                    </div>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-13 h-13 rounded-full flex items-center justify-center text-white shadow-2xl transition-all cursor-pointer border ${
          isOpen
            ? 'bg-rose-600 border-rose-500 shadow-rose-500/30'
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 border-blue-400/40 shadow-blue-500/30'
        }`}
        title="Quick Actions Speed Dial"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </motion.div>
      </motion.button>

      {/* Quick Invoice Popup Modal */}
      <QuickInvoiceModal
        isOpen={showQuickInvoiceModal}
        onClose={() => setShowQuickInvoiceModal(false)}
      />
    </div>
  );
}
