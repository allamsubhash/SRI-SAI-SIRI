'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AccentColor = 'blue' | 'emerald' | 'gold' | 'purple' | 'rose' | 'cyan' | 'orange' | 'pink' | 'slate' | 'custom';

export interface AccentPalette {
  id: AccentColor;
  label: string;
  primary: string;
  hover: string;
  lightBg: string;
  border: string;
}

export const ACCENT_PALETTES: Record<string, AccentPalette> = {
  blue: {
    id: 'blue',
    label: 'Royal Blue',
    primary: '#2563eb',
    hover: '#1d4ed8',
    lightBg: 'rgba(37, 99, 235, 0.15)',
    border: 'rgba(37, 99, 235, 0.35)'
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald Green',
    primary: '#10b981',
    hover: '#059669',
    lightBg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.35)'
  },
  gold: {
    id: 'gold',
    label: 'Electric Gold',
    primary: '#d97706',
    hover: '#b45309',
    lightBg: 'rgba(217, 119, 6, 0.15)',
    border: 'rgba(217, 119, 6, 0.35)'
  },
  purple: {
    id: 'purple',
    label: 'Deep Purple',
    primary: '#8b5cf6',
    hover: '#7c3aed',
    lightBg: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.35)'
  },
  rose: {
    id: 'rose',
    label: 'Crimson Red',
    primary: '#f43f5e',
    hover: '#e11d48',
    lightBg: 'rgba(244, 63, 94, 0.15)',
    border: 'rgba(244, 63, 94, 0.35)'
  },
  cyan: {
    id: 'cyan',
    label: 'Teal Cyan',
    primary: '#06b6d4',
    hover: '#0891b2',
    lightBg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.35)'
  },
  orange: {
    id: 'orange',
    label: 'Sunset Orange',
    primary: '#f97316',
    hover: '#ea580c',
    lightBg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.35)'
  },
  pink: {
    id: 'pink',
    label: 'Neon Pink',
    primary: '#ec4899',
    hover: '#db2777',
    lightBg: 'rgba(236, 72, 153, 0.15)',
    border: 'rgba(236, 72, 153, 0.35)'
  },
  slate: {
    id: 'slate',
    label: 'Slate Monolith',
    primary: '#475569',
    hover: '#334155',
    lightBg: 'rgba(71, 85, 105, 0.15)',
    border: 'rgba(71, 85, 105, 0.35)'
  }
};

interface AccentContextType {
  accent: AccentColor;
  customHex: string;
  palette: AccentPalette;
  setAccent: (color: AccentColor) => void;
  setCustomHexColor: (hex: string) => void;
}

const AccentContext = createContext<AccentContextType>({
  accent: 'blue',
  customHex: '#2563eb',
  palette: ACCENT_PALETTES.blue,
  setAccent: () => {},
  setCustomHexColor: () => {}
});

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentColor>('blue');
  const [customHex, setCustomHexState] = useState<string>('#2563eb');

  const applyAccentToCSS = (color: AccentColor, hexOverride?: string) => {
    let primary = '#2563eb';
    let hover = '#1d4ed8';
    let lightBg = 'rgba(37, 99, 235, 0.15)';
    let border = 'rgba(37, 99, 235, 0.35)';

    if (color === 'custom' && hexOverride) {
      primary = hexOverride;
      hover = hexOverride;
      lightBg = `${hexOverride}25`;
      border = `${hexOverride}50`;
    } else if (ACCENT_PALETTES[color]) {
      const pal = ACCENT_PALETTES[color];
      primary = pal.primary;
      hover = pal.hover;
      lightBg = pal.lightBg;
      border = pal.border;
    }

    const root = document.documentElement;
    root.style.setProperty('--accent-primary', primary);
    root.style.setProperty('--accent-hover', hover);
    root.style.setProperty('--accent-light-bg', lightBg);
    root.style.setProperty('--accent-border', border);
    root.setAttribute('data-accent', color);
  };

  useEffect(() => {
    const saved = (localStorage.getItem('accentBrandColorId') as AccentColor) || 'blue';
    const savedHex = localStorage.getItem('accentCustomHex') || '#2563eb';
    setCustomHexState(savedHex);

    if (saved === 'custom') {
      setAccentState('custom');
      applyAccentToCSS('custom', savedHex);
    } else if (ACCENT_PALETTES[saved]) {
      setAccentState(saved);
      applyAccentToCSS(saved);
    } else {
      applyAccentToCSS('blue');
    }
  }, []);

  const setAccent = (color: AccentColor) => {
    setAccentState(color);
    localStorage.setItem('accentBrandColorId', color);
    applyAccentToCSS(color, customHex);
  };

  const setCustomHexColor = (hex: string) => {
    setCustomHexState(hex);
    setAccentState('custom');
    localStorage.setItem('accentCustomHex', hex);
    localStorage.setItem('accentBrandColorId', 'custom');
    applyAccentToCSS('custom', hex);
  };

  const currentPalette: AccentPalette = accent === 'custom' ? {
    id: 'custom',
    label: 'Custom Hex Color',
    primary: customHex,
    hover: customHex,
    lightBg: `${customHex}25`,
    border: `${customHex}50`
  } : (ACCENT_PALETTES[accent] || ACCENT_PALETTES.blue);

  return (
    <AccentContext.Provider value={{ accent, customHex, palette: currentPalette, setAccent, setCustomHexColor }}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  return useContext(AccentContext);
}
