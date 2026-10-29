import { useUIStore } from '@/store/useUIStore';
import { Platform } from 'react-native';

// Product colors are independent of route/provider colors (lib/transit/colors).
export const themes = {
  dark: {
    background: '#141617',
    card: '#1c1f20',
    surface: '#26292a',
    raised: '#323637',
    border: '#3d4244',
    strong: '#899194',
    text: '#f5f5f3',
    secondary: '#cbd0d2',
    muted: '#aeb5b8',
    accent: '#f5f5f3',
    accentMuted: '#34393b',
    primary: '#edf0f1',
    onAccent: '#1b2022',
    brand: '#91d6aa',
    brandMuted: '#22382b',
    focus: '#91d6aa',
    success: '#97dcb5',
    early: '#7dd3fc',
    earlyMuted: '#183344',
    warning: '#f2ca7b',
    danger: '#ffaaa3',
    successMuted: '#233e2e',
    warningMuted: '#40351f',
    dangerMuted: '#472b29',
  },
  light: {
    background: '#eff1f2',
    card: '#ffffff',
    surface: '#f3f5f6',
    raised: '#e7eaec',
    border: '#d7dcdf',
    strong: '#818b90',
    text: '#22282c',
    secondary: '#414c53',
    muted: '#5d6971',
    accent: '#22282c',
    accentMuted: '#e7ebed',
    primary: '#22282c',
    onAccent: '#ffffff',
    brand: '#176b39',
    brandMuted: '#e8f3ec',
    focus: '#176b39',
    success: '#24663e',
    early: '#0369a1',
    earlyMuted: '#e0f2fe',
    warning: '#805300',
    danger: '#b12e27',
    successMuted: '#e3f2e7',
    warningMuted: '#fff0d1',
    dangerMuted: '#ffebe7',
  },
} as const;

export function useTheme() {
  return useUIStore((s) => s.theme) === 'dark' ? themes.dark : themes.light;
}
export const fonts = {
  regular: 'Geist',
  medium: 'GeistMedium',
  semibold: 'GeistSemibold',
  mono: 'GeistMono',
  symbols: 'MNR2007',
};
// Route identifiers stay compact; controls, objects and overlays have different shapes.
export const radii = { badge: 3, control: 6, card: 8, sheet: 16 } as const;
export const space = { xs: 4, sm: 8, md: 12, gutter: 16, lg: 24, xl: 32 } as const;
export const stroke = { separator: 1, focus: 2, icon: 1.8 } as const;
const touchTarget = Platform.OS === 'android' ? 48 : 44;
export const controls = {
  target: touchTarget,
  compact: Platform.OS === 'web' ? 36 : touchTarget,
  icon: 20,
  iconSmall: 16,
} as const;
// Depth is reserved for content over the map and modal layers.
export const elevation = {
  map: '0 2px 8px #00000024',
  panel: '0 4px 16px #00000028',
} as const;
export const type = {
  meta: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 15 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  section: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  heading: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28 },
  time: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28, fontVariant: ['tabular-nums'] as 'tabular-nums'[] },
  timeCompact: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, fontVariant: ['tabular-nums'] as 'tabular-nums'[] },
} as const;
export const motion = { quick: 140, standard: 200 } as const;
