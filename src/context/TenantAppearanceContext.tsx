'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getTenantPreferences, 
  updateTenantPreferences, 
  DEFAULT_TENANT_PREFERENCES,
  TenantPreferences 
} from '@/services/tenantPreferencesService';
import { generateColorVariants, FullColorVariants, PRESET_ACCENTS } from '@/utils/tenantColorGenerator';

interface TenantAppearanceContextType {
  preferences: TenantPreferences;
  variants: FullColorVariants;
  loadingPreferences: boolean;
  setThemeMode: (mode: 'light' | 'dark') => Promise<void>;
  applyColorLive: (colorHex: string) => void;
  saveAppearance: (colorHex: string, name?: string) => Promise<void>;
  resetAppearance: () => Promise<void>;
}

const TenantAppearanceContext = createContext<TenantAppearanceContextType | undefined>(undefined);

export function TenantAppearanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const tenantId = user?.id || 'default_tenant';

  const [preferences, setPreferences] = useState<TenantPreferences>({
    tenantId,
    themeMode: 'light',
    accentColor: '#0891B2',
    accentName: 'Cyan Aqua',
    updatedAt: new Date().toISOString()
  });

  const [variants, setVariants] = useState<FullColorVariants>(() => 
    generateColorVariants('#0891B2')
  );

  const [loadingPreferences, setLoadingPreferences] = useState(true);

  // Apply CSS Variables dynamically to documentElement for BOTH Light and Dark mode
  const applyCssVariables = useCallback((vars: FullColorVariants) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const isDark = root.classList.contains('dark');

    const activePrimary = isDark ? vars.darkPrimary : vars.lightPrimary;
    const activeHover = isDark ? vars.darkHover : vars.lightHover;
    const activeSoft = isDark ? vars.darkSoft : vars.lightSoft;
    const activeBorder = isDark ? vars.darkBorder : vars.lightBorder;
    const activeContrast = isDark ? vars.darkContrast : vars.lightContrast;

    root.style.setProperty('--tenant-accent-color', activePrimary);
    root.style.setProperty('--tenant-accent-hover', activeHover);
    root.style.setProperty('--tenant-accent-soft', activeSoft);
    root.style.setProperty('--tenant-accent-border', activeBorder);
    root.style.setProperty('--tenant-accent-contrast', activeContrast);
    root.style.setProperty('--tenant-dark-glass-shadow', vars.darkGlassShadow);

    root.style.setProperty('--primary', activePrimary);
    root.style.setProperty('--primary-hover', activeHover);
    root.style.setProperty('--primary-light', activeSoft);
    root.style.setProperty('--info', activePrimary);
  }, []);

  // Observe theme mode changes (dark/light toggle)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const observer = new MutationObserver(() => {
      applyCssVariables(variants);
    });

    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [variants, applyCssVariables]);

  const loadPreferences = useCallback(async () => {
    if (!user || user.role !== 'TENANT') {
      setLoadingPreferences(false);
      return;
    }

    setLoadingPreferences(true);
    try {
      const pref = await getTenantPreferences(user.id);
      const mode = pref.themeMode || 'light';
      const colorHex = pref.accentColor || (pref as any).darkAccentColor || '#0891B2';
      const colorName = pref.accentName || (pref as any).darkAccentName || 'Cyan Aqua';

      setPreferences({
        tenantId: user.id,
        themeMode: mode,
        accentColor: colorHex,
        accentName: colorName,
        updatedAt: pref.updatedAt || new Date().toISOString()
      });

      // Apply theme mode class (light/dark)
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (mode === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        localStorage.setItem('theme', mode);
      }

      const generated = generateColorVariants(colorHex);
      setVariants(generated);
      applyCssVariables(generated);
    } catch (e) {
      console.error('Failed loading tenant preferences:', e);
    } finally {
      setLoadingPreferences(false);
    }
  }, [user, applyCssVariables]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Listen for appearance updates across components/windows
  useEffect(() => {
    const handleEvent = (e: any) => {
      if (e.detail?.tenantId === tenantId) {
        setPreferences(e.detail.preferences);
        const generated = generateColorVariants(e.detail.preferences.accentColor);
        setVariants(generated);
        applyCssVariables(generated);
      }
    };

    window.addEventListener('tenantAppearanceUpdated', handleEvent);
    return () => window.removeEventListener('tenantAppearanceUpdated', handleEvent);
  }, [tenantId, applyCssVariables]);

  const setThemeMode = async (mode: 'light' | 'dark') => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', mode);
    }

    const updated = await updateTenantPreferences(tenantId, { themeMode: mode });
    setPreferences(updated);
    applyCssVariables(variants);
  };

  // Apply color live in real-time as user clicks swatches or picks custom colors
  const applyColorLive = (colorHex: string) => {
    const generated = generateColorVariants(colorHex);
    setVariants(generated);
    applyCssVariables(generated);
  };

  const saveAppearance = async (colorHex: string, name?: string) => {
    const matchedPreset = PRESET_ACCENTS.find(
      p => p.lightHex.toLowerCase() === colorHex.toLowerCase() ||
           p.darkHex.toLowerCase() === colorHex.toLowerCase()
    );

    const updatedName = name || matchedPreset?.name || 'Custom Color';

    const updated = await updateTenantPreferences(tenantId, {
      accentColor: colorHex,
      accentName: updatedName,
      darkAccentColor: colorHex,
      darkAccentName: updatedName
    } as any);

    setPreferences(updated);

    const generated = generateColorVariants(colorHex);
    setVariants(generated);
    applyCssVariables(generated);

    // Dispatch global event for context synchronization
    window.dispatchEvent(new CustomEvent('tenantAppearanceUpdated', {
      detail: { tenantId, preferences: updated }
    }));
  };

  const resetAppearance = async () => {
    await saveAppearance('#0891B2', 'Cyan Aqua');
    await setThemeMode('light');
  };

  return (
    <TenantAppearanceContext.Provider value={{
      preferences,
      variants,
      loadingPreferences,
      setThemeMode,
      applyColorLive,
      saveAppearance,
      resetAppearance
    }}>
      {children}
    </TenantAppearanceContext.Provider>
  );
}

export function useTenantAppearance() {
  const context = useContext(TenantAppearanceContext);
  if (!context) {
    // Safe fallback if called outside TenantAppearanceProvider (e.g. Owner portal)
    return {
      preferences: { tenantId: 'default', themeMode: 'light' as const, accentColor: '#0891B2', accentName: 'Cyan Aqua', updatedAt: '' },
      variants: generateColorVariants('#0891B2'),
      loadingPreferences: false,
      setThemeMode: async (mode: 'light' | 'dark') => {
        if (typeof document !== 'undefined') {
          if (mode === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', mode);
        }
      },
      applyColorLive: () => {},
      saveAppearance: async () => {},
      resetAppearance: async () => {}
    };
  }
  return context;
}
