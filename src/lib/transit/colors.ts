import { isRailMode } from './modes';

export function getRouteColor(
  mode?: string | null,
  apiColor?: string | null,
  textColor?: string | null,
): ReturnType<typeof getTransitColor> {
  return getTransitColor(
    mode ?? undefined,
    isRailMode(mode) ? textColor || apiColor || undefined : apiColor || undefined,
  );
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}

function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 70;
}

export function hexToRgba(hex: string, alpha = 255): [number, number, number, number] {
  const full = (normalizeHexColor(hex) ?? '#64748b').slice(1);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [r, g, b, alpha];
}

function mixHexColors(a: string, bHex: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(bHex.slice(1, 3), 16);
  const bg = parseInt(bHex.slice(3, 5), 16);
  const bb = parseInt(bHex.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function getMapRouteColor(
  mode: string | undefined,
  apiColor: string | null | undefined,
  theme: 'dark' | 'light',
): string {
  const base = getTransitColor(mode, apiColor).primary;
  if (theme === 'dark') {
    return isDarkColor(base) ? mixHexColors(base, '#ffffff', 0.45) : base;
  }
  return isLightColor(base) ? mixHexColors(base, '#0f172a', 0.45) : base;
}

export function getTransitColor(
  mode: string | undefined,
  apiColor?: string | null,
): {
  primary: string;
} {
  if (apiColor && apiColor.trim().length >= 3) {
    const raw = apiColor.trim().replace(/^#/, '');
    if (/^[0-9A-Fa-f]{6}$/.test(raw) || /^[0-9A-Fa-f]{3}$/.test(raw)) {
      const hex = normalizeHexColor(raw)!;
      return { primary: hex };
    }
  }
  const m = mode?.toUpperCase() || 'BUS';
  switch (m) {
    case 'RAIL':
    case 'SUBURBAN_RAILWAY':
      return { primary: '#00509d' };
    case 'BUS':
      return { primary: '#009EE3' };
    case 'COACH':
    case 'RAIL_REPLACEMENT_BUS':
      return { primary: '#e5a93c' };
    case 'TRAM':
    case 'TRAMTRAIN':
      return { primary: '#ffcc00' };
    case 'SUBWAY':
      return { primary: '#e63946' };
    default:
      return { primary: '#475569' };
  }
}

export function normalizeHexColor(value?: string | null): string | null {
  const raw = value?.trim().replace(/^#/, '');
  if (!raw || !/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(raw)) return null;
  return `#${
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  }`;
}

export function contrastTextColor(color: string): string {
  const [r, g, b] = hexToRgba(color)
    .slice(0, 3)
    .map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#0f172a' : '#ffffff';
}
