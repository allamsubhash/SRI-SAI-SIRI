// Utility to generate accessible Light & Dark Mode accent variants from a tenant's selected color

export interface AccentColorPreset {
  name: string;
  lightHex: string;
  darkHex: string;
}

export const PRESET_ACCENTS: AccentColorPreset[] = [
  { name: 'Emerald', lightHex: '#176B5B', darkHex: '#42C7A5' },
  { name: 'Teal', lightHex: '#0F766E', darkHex: '#2DD4BF' },
  { name: 'Cyan Aqua', lightHex: '#0891B2', darkHex: '#38BDF8' },
  { name: 'Ocean Blue', lightHex: '#1D4ED8', darkHex: '#60A5FA' },
  { name: 'Electric Indigo', lightHex: '#4338CA', darkHex: '#818CF8' },
  { name: 'Deep Violet', lightHex: '#6D28D9', darkHex: '#A78BFA' },
  { name: 'Purple Velvet', lightHex: '#86198F', darkHex: '#E879F9' },
  { name: 'Hot Magenta', lightHex: '#BE185D', darkHex: '#F472B6' },
  { name: 'Liquid Rose', lightHex: '#B85C70', darkHex: '#FB7185' },
  { name: 'Ruby Crimson', lightHex: '#B91C1C', darkHex: '#F87171' },
  { name: 'Neon Coral', lightHex: '#C95B5B', darkHex: '#FB923C' },
  { name: 'Lava Orange', lightHex: '#C2410C', darkHex: '#FF6B4A' },
  { name: 'Burnt Terracotta', lightHex: '#B45F45', darkHex: '#F97316' },
  { name: 'Glowing Amber', lightHex: '#B7791F', darkHex: '#F2C15D' },
  { name: 'Liquid Gold', lightHex: '#B58A3A', darkHex: '#D7B568' },
  { name: 'Electric Lime', lightHex: '#657A3A', darkHex: '#A3C65D' },
  { name: 'Forest Green', lightHex: '#166534', darkHex: '#4ADE80' },
  { name: 'Frosted Sage', lightHex: '#4B6B4E', darkHex: '#8FC492' },
  { name: 'Golden Olive', lightHex: '#556B2F', darkHex: '#9ACD32' },
  { name: 'Liquid Slate', lightHex: '#475569', darkHex: '#94A3B8' },
  { name: 'Plum Orchid', lightHex: '#701A75', darkHex: '#F0ABFC' },
  { name: 'Liquid Bronze', lightHex: '#854D0E', darkHex: '#FACC15' },
  { name: 'Midnight Ice', lightHex: '#1E293B', darkHex: '#E2E8F0' },
  { name: 'Cyber Silver', lightHex: '#334155', darkHex: '#CBD5E1' }
];

export interface FullColorVariants {
  lightPrimary: string;
  lightHover: string;
  lightSoft: string;
  lightBorder: string;
  lightContrast: string;
  darkPrimary: string;
  darkHover: string;
  darkSoft: string;
  darkBorder: string;
  darkContrast: string;
  darkGlassShadow: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function generateColorVariants(selectedHex: string): FullColorVariants {
  const preset = PRESET_ACCENTS.find(p => 
    p.lightHex.toLowerCase() === selectedHex.toLowerCase() || 
    p.darkHex.toLowerCase() === selectedHex.toLowerCase()
  );

  const lightHex = preset ? preset.lightHex : selectedHex;
  const darkHex = preset ? preset.darkHex : selectedHex;

  // Light Mode variants
  const lRgb = hexToRgb(lightHex);
  const lightPrimary = lightHex;
  const lightHoverR = Math.max(0, Math.round(lRgb.r * 0.85));
  const lightHoverG = Math.max(0, Math.round(lRgb.g * 0.85));
  const lightHoverB = Math.max(0, Math.round(lRgb.b * 0.85));
  const lightHover = `#${lightHoverR.toString(16).padStart(2, '0')}${lightHoverG.toString(16).padStart(2, '0')}${lightHoverB.toString(16).padStart(2, '0')}`;
  const lightSoft = `rgba(${lRgb.r}, ${lRgb.g}, ${lRgb.b}, 0.12)`;
  const lightBorder = `rgba(${lRgb.r}, ${lRgb.g}, ${lRgb.b}, 0.30)`;
  const lightContrast = '#FFFFFF';

  // Dark Mode Liquid Glass variants
  const dRgb = hexToRgb(darkHex);
  const darkLuminance = getLuminance(dRgb.r, dRgb.g, dRgb.b);
  const darkContrast = darkLuminance > 0.45 ? '#0C1210' : '#FFFFFF';
  const darkHoverR = Math.min(255, Math.round(dRgb.r * 1.15));
  const darkHoverG = Math.min(255, Math.round(dRgb.g * 1.15));
  const darkHoverB = Math.min(255, Math.round(dRgb.b * 1.15));
  const darkHover = `#${darkHoverR.toString(16).padStart(2, '0')}${darkHoverG.toString(16).padStart(2, '0')}${darkHoverB.toString(16).padStart(2, '0')}`;
  const darkSoft = `rgba(${dRgb.r}, ${dRgb.g}, ${dRgb.b}, 0.20)`;
  const darkBorder = `rgba(${dRgb.r}, ${dRgb.g}, ${dRgb.b}, 0.42)`;
  const darkGlassShadow = `0 8px 32px 0 rgba(${dRgb.r}, ${dRgb.g}, ${dRgb.b}, 0.28)`;

  return {
    lightPrimary,
    lightHover,
    lightSoft,
    lightBorder,
    lightContrast,
    darkPrimary: darkHex,
    darkHover,
    darkSoft,
    darkBorder,
    darkContrast,
    darkGlassShadow
  };
}
