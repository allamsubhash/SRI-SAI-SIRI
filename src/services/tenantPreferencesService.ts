export interface TenantPreferences {
  tenantId: string;
  themeMode: 'light' | 'dark';
  accentColor: string;
  accentName: string;
  updatedAt: string;
}

export const DEFAULT_TENANT_PREFERENCES: Omit<TenantPreferences, 'tenantId'> = {
  themeMode: 'dark',
  accentColor: '#0891B2',
  accentName: 'Cyan Aqua',
  updatedAt: new Date().toISOString()
};

/**
 * Service abstraction to get preferences for a specific tenant ID.
 * Multi-tenant safe: tenant A's preferences are completely isolated from tenant B's.
 */
export async function getTenantPreferences(tenantId: string): Promise<TenantPreferences> {
  if (!tenantId) {
    return { tenantId: 'anonymous', ...DEFAULT_TENANT_PREFERENCES };
  }

  if (typeof window !== 'undefined') {
    const storageKey = `srisaisiri_tenant_pref_${tenantId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          tenantId,
          themeMode: parsed.themeMode || 'light',
          accentColor: parsed.accentColor || parsed.darkAccentColor || '#0891B2',
          accentName: parsed.accentName || parsed.darkAccentName || 'Cyan Aqua',
          updatedAt: parsed.updatedAt || new Date().toISOString()
        };
      } catch (e) {
        console.error('Error parsing tenant preferences:', e);
      }
    }
  }

  return {
    tenantId,
    ...DEFAULT_TENANT_PREFERENCES
  };
}

/**
 * Service abstraction to update preferences for a specific tenant ID.
 */
export async function updateTenantPreferences(
  tenantId: string, 
  prefs: Partial<TenantPreferences>
): Promise<TenantPreferences> {
  if (!tenantId) {
    throw new Error('Tenant ID required to update preferences.');
  }

  const current = await getTenantPreferences(tenantId);
  const updated: TenantPreferences = {
    ...current,
    ...prefs,
    tenantId,
    updatedAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    const storageKey = `srisaisiri_tenant_pref_${tenantId}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
    // Dispatch custom event for immediate reactive state updates across open tabs/components
    window.dispatchEvent(new CustomEvent('tenantAppearanceUpdated', { detail: { tenantId, preferences: updated } }));
  }

  return updated;
}
