'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTenantAppearance } from '@/context/TenantAppearanceContext';

interface ThemeToggleSwitchProps {
  className?: string;
}

export default function ThemeToggleSwitch({ className = '' }: ThemeToggleSwitchProps) {
  const { preferences, setThemeMode } = useTenantAppearance();
  const [theme, setTheme] = useState<'light' | 'dark'>(preferences.themeMode || 'light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(preferences.themeMode || 'light');
  }, [preferences.themeMode]);

  const applyTheme = async (mode: 'light' | 'dark') => {
    setTheme(mode);
    try {
      await setThemeMode(mode);
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted) {
    return (
      <div className="w-[84px] h-[34px] rounded-full bg-[#F1EEE7] dark:bg-[#1A2621] animate-pulse border border-[#DDD8CE] dark:border-[#293832] shrink-0" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <motion.div 
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`relative flex items-center p-1 rounded-full bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] shadow-inner select-none shrink-0 cursor-pointer ${className}`}
    >
      {/* Sliding Active Pill Background - Dynamic Tenant Accent */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 450, damping: 30 }}
        className={`absolute top-1 bottom-1 w-[38px] rounded-full shadow-sm tenant-bg-accent ${
          isDark ? 'left-[42px]' : 'left-1'
        }`}
      />

      {/* Light Button ☀️ */}
      <button
        type="button"
        onClick={() => applyTheme('light')}
        className={`relative z-10 w-[38px] h-[26px] flex items-center justify-center text-xs font-bold rounded-full transition-all cursor-pointer ${
          !isDark ? 'text-white' : 'text-[#68736E] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
        }`}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      {/* Dark Button 🌙 */}
      <button
        type="button"
        onClick={() => applyTheme('dark')}
        className={`relative z-10 w-[38px] h-[26px] flex items-center justify-center text-xs font-bold rounded-full transition-all cursor-pointer ${
          isDark ? 'text-[#0C1210] dark:text-[#0C1210]' : 'text-[#68736E] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
