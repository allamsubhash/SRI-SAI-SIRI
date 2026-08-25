'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'warning' | 'danger' | 'info';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (title: string, message?: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-white/95 dark:bg-[#1E293B]/95 border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
                  : toast.type === 'warning'
                  ? 'bg-white/95 dark:bg-[#1E293B]/95 border-amber-500/40 text-amber-950 dark:text-amber-100'
                  : toast.type === 'danger'
                  ? 'bg-white/95 dark:bg-[#1E293B]/95 border-rose-500/40 text-rose-950 dark:text-rose-100'
                  : 'bg-white/95 dark:bg-[#1E293B]/95 border-[#4F6D9B]/40 text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {toast.type === 'danger' && <XCircle className="w-5 h-5 text-rose-500" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-[#4F6D9B] dark:text-[#D4A64A]" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold tracking-tight">{toast.title}</h4>
                {toast.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{toast.message}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
