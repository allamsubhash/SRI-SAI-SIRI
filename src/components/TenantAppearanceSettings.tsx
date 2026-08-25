'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Palette, RotateCcw, Moon, Sun, ArrowRight, Sparkles } from 'lucide-react';
import { useTenantAppearance } from '@/context/TenantAppearanceContext';
import { PRESET_ACCENTS, generateColorVariants } from '@/utils/tenantColorGenerator';
import { useToast } from '@/components/ToastProvider';

export default function TenantAppearanceSettings() {
  const { preferences, applyColorLive, saveAppearance, resetAppearance } = useTenantAppearance();
  const { showToast } = useToast();

  const [selectedHex, setSelectedHex] = useState(preferences.accentColor || '#0891B2');
  const [selectedName, setSelectedName] = useState(preferences.accentName || 'Cyan Aqua');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (preferences.accentColor) {
      setSelectedHex(preferences.accentColor);
      setSelectedName(preferences.accentName);
    }
  }, [preferences]);

  // Revert live preview back to saved preference if modal closes without applying
  useEffect(() => {
    const savedColor = preferences.accentColor || '#0891B2';
    return () => {
      applyColorLive(savedColor);
    };
  }, [preferences.accentColor, applyColorLive]);

  // Compute live preview variants dynamically
  const previewVariants = generateColorVariants(selectedHex);

  const handleSelectSwatch = (preset: typeof PRESET_ACCENTS[0]) => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const targetHex = isDark ? preset.darkHex : preset.lightHex;
    
    setSelectedHex(targetHex);
    setSelectedName(preset.name);
    // INSTANT REAL-TIME PREVIEW IN BOTH LIGHT & DARK MODE!
    applyColorLive(targetHex);
  };

  const handleCustomColorChange = (hex: string) => {
    setSelectedHex(hex);
    setSelectedName('Custom Color');
    applyColorLive(hex);
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await saveAppearance(selectedHex, selectedName);
      showToast(`Accent color updated to ${selectedName}. Saved permanently to your account.`, 'success');
    } catch (e) {
      showToast('Failed to save appearance settings.', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = async () => {
    setIsApplying(true);
    try {
      await resetAppearance();
      setSelectedHex('#0891B2');
      setSelectedName('Cyan Aqua');
      applyColorLive('#0891B2');
      showToast('Reset to default: Light Mode with Cyan Aqua (#0891B2).', 'info');
    } catch (e) {
      showToast('Failed to reset appearance.', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* 👑 HEADER */}
      <div className="p-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621]/90 backdrop-blur-md border border-[#DDD8CE] dark:border-[#293832] flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl tenant-bg-accent flex items-center justify-center shrink-0 shadow-sm">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-sm text-[#1C2522] dark:text-[#F2F5F2]">Personal Accent Colors</h3>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium leading-relaxed mt-0.5">
            Default: Light Mode with Cyan Aqua. Select an accent color for your Tenant Portal. Swatches preview your portal UI live in real-time. Click Apply to save permanently to your account.
          </p>
        </div>
      </div>

      {/* 🎨 24+ PRESET ACCENT SWATCHES GRID */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2] uppercase tracking-wider">Select Accent Swatch (Default: Cyan Aqua)</span>
          <span className="text-xs font-bold text-[#0891B2] dark:text-[#38BDF8]">{selectedName} ({selectedHex.toUpperCase()})</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-[280px] overflow-y-auto pr-1 p-1">
          {PRESET_ACCENTS.map((preset) => {
            const isSelected = 
              selectedHex.toLowerCase() === preset.lightHex.toLowerCase() ||
              selectedHex.toLowerCase() === preset.darkHex.toLowerCase();

            return (
              <motion.button
                key={preset.name}
                type="button"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectSwatch(preset)}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-[#0891B2] dark:border-[#38BDF8] bg-cyan-50 dark:bg-cyan-950/40 shadow-md ring-2 ring-cyan-500/30' 
                    : 'border-[#DDD8CE] dark:border-[#293832] bg-[#FFFDF9] dark:bg-[#141D19]/80 backdrop-blur-sm hover:bg-[#F1EEE7] dark:hover:bg-[#1A2621]'
                }`}
              >
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center shadow-md relative shrink-0 border border-white/20"
                  style={{ backgroundColor: preset.lightHex, color: '#FFFFFF' }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className={`text-[10px] font-extrabold truncate w-full text-center ${
                  isSelected ? 'text-[#0891B2] dark:text-[#38BDF8]' : 'text-[#68736E] dark:text-[#9BAAA4]'
                }`}>
                  {preset.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* CUSTOM COLOR PICKER */}
        <div className="pt-2 flex items-center justify-between p-3.5 rounded-2xl bg-[#FFFDF9] dark:bg-[#141D19]/90 backdrop-blur-md border border-[#DDD8CE] dark:border-[#293832]">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={selectedHex}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
            />
            <div>
              <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2] block">Custom Color Picker</span>
              <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">Pick any custom hex accent color</span>
            </div>
          </div>
          <input
            type="text"
            value={selectedHex}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="w-24 px-3 py-1.5 rounded-xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-mono font-bold text-[#1C2522] dark:text-[#F2F5F2] text-center"
          />
        </div>
      </div>

      {/* 🖼️ LIVE PREVIEW SECTION */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2] uppercase tracking-wider block">LIVE PREVIEW CARDS</span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Light Mode Preview Card */}
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#DDD8CE] text-[#1C2522] space-y-3 shadow-md">
            <div className="flex justify-between items-center pb-2 border-b border-[#DDD8CE] text-xs font-bold text-[#68736E]">
              <span className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" /> Light Mode Preview
              </span>
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                style={{ backgroundColor: previewVariants.lightSoft, color: previewVariants.lightPrimary, border: `1px solid ${previewVariants.lightBorder}` }}
              >
                {selectedName}
              </span>
            </div>
            <div 
              className="p-3 rounded-xl text-xs font-black border flex items-center justify-between"
              style={{ backgroundColor: previewVariants.lightSoft, color: previewVariants.lightPrimary, borderColor: previewVariants.lightBorder }}
            >
              <span>Active Navigation Item</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <button 
              type="button" 
              className="w-full py-2.5 rounded-xl text-xs font-black shadow-sm text-white"
              style={{ backgroundColor: previewVariants.lightPrimary }}
            >
              Primary Action Button
            </button>
          </div>

          {/* Dark Mode Preview Card */}
          <div className="p-4 rounded-2xl bg-[#0C1210] border border-[#293832] text-[#F2F5F2] space-y-3 shadow-md">
            <div className="flex justify-between items-center pb-2 border-b border-[#293832] text-xs font-bold text-[#9BAAA4]">
              <span className="flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-400" /> Dark Mode Preview
              </span>
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                style={{ backgroundColor: previewVariants.darkSoft, color: previewVariants.darkPrimary, border: `1px solid ${previewVariants.darkBorder}` }}
              >
                {selectedName}
              </span>
            </div>
            <div 
              className="p-3 rounded-xl text-xs font-black border flex items-center justify-between"
              style={{ backgroundColor: previewVariants.darkSoft, color: previewVariants.darkPrimary, borderColor: previewVariants.darkBorder }}
            >
              <span>Active Navigation Item</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <button 
              type="button" 
              className="w-full py-2.5 rounded-xl text-xs font-black shadow-sm text-black font-extrabold"
              style={{ backgroundColor: previewVariants.darkPrimary, color: previewVariants.darkContrast }}
            >
              Liquid Action Button
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 SAVE & RESET ACTION TOOLBAR */}
      <div className="pt-4 border-t border-[#DDD8CE] dark:border-[#293832] flex justify-between items-center">
        <button
          type="button"
          onClick={handleReset}
          disabled={isApplying}
          className="py-2.5 px-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] hover:bg-[#EAE5DC] dark:hover:bg-[#202D27] text-[#68736E] dark:text-[#9BAAA4] font-bold text-xs cursor-pointer border border-[#DDD8CE] dark:border-[#293832] flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Default</span>
        </button>

        <button
          type="button"
          onClick={handleApply}
          disabled={isApplying}
          className="py-2.5 px-6 rounded-2xl tenant-bg-accent font-black text-xs cursor-pointer shadow-md hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50"
        >
          <span>{isApplying ? 'Saving...' : 'Apply Color ✓'}</span>
        </button>
      </div>

    </div>
  );
}
