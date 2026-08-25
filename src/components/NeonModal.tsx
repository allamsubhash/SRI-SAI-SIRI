'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { createPortal } from 'react-dom';

interface NeonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  badge?: React.ReactNode;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  accentColor?: 'purple' | 'blue' | 'emerald' | 'orange' | 'rose' | 'teal' | 'cyan';
}

export default function NeonModal({
  isOpen,
  onClose,
  onBack,
  badge,
  title,
  subtitle,
  children,
  maxWidth,
  size = 'md',
  accentColor = 'emerald'
}: NeonModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, mounted, onClose]);

  if (!mounted) return null;

  const sizeMap = {
    sm: 'max-w-[380px]',
    md: 'max-w-[540px]',
    lg: 'max-w-[820px]',
    xl: 'max-w-[960px]'
  };

  const finalWidth = maxWidth || sizeMap[size];

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          key="erp-modal-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Soft Glass Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#1C2522]/50 dark:bg-black/80 backdrop-blur-md cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />

          {/* Centered Pop-Up Modal Surface */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={`relative w-full ${finalWidth} max-h-[85vh] sm:max-h-[90vh] flex flex-col rounded-[28px] sm:rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] border tenant-border-accent shadow-2xl overflow-hidden z-10 my-auto text-left font-sans text-[#1C2522] dark:text-[#F2F5F2]`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Header */}
            <div className="flex justify-between items-start p-5 sm:p-6 pb-4 border-b border-[#DDD8CE] dark:border-[#293832] shrink-0 bg-[#FFFDF9] dark:bg-[#141D19]">
              <div className="flex items-start gap-3 pr-2 space-y-0.5">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="p-2 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2] transition-colors cursor-pointer shrink-0 border border-[#DDD8CE] dark:border-[#293832]"
                    title="Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {title && (
                      <h3 className="text-base sm:text-lg font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2]">
                        {title}
                      </h3>
                    )}
                    {badge}
                  </div>
                  {subtitle && (
                    <p className="text-xs font-medium text-[#68736E] dark:text-[#9BAAA4] mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2] transition-colors cursor-pointer shrink-0 border border-[#DDD8CE] dark:border-[#293832]"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
