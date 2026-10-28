import { useUIStore } from '@/store/useUIStore';

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
    textMuted: '#aeb5b8',
    accent: '#f5f5f3',
    accentMuted: '#34393b',
    primary: '#edf0f1',
    onAccent: '#1b2022',
    focus: '#d9e0e3',
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
    surface: '#f5f5f3',
    raised: '#e7eaec',
    border: '#d7dcdf',
    strong: '#818b90',
    text: '#22282c',
    secondary: '#414c53',
    muted: '#5d6971',
    textMuted: '#5d6971',
    accent: '#22282c',
    accentMuted: '#e7ebed',
    primary: '#22282c',
    onAccent: '#ffffff',
    focus: '#46555e',
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
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radii = { badge: 3, control: 3, card: 6, sheet: 16 } as const;
export const type = {
  meta: { fontFamily: fonts.regular, fontSize: 12 },
  body: { fontFamily: fonts.regular, fontSize: 15 },
  label: { fontFamily: fonts.medium, fontSize: 14 },
  heading: { fontFamily: fonts.semibold, fontSize: 22 },
  time: { fontFamily: fonts.mono, fontSize: 22, fontVariant: ['tabular-nums'] as 'tabular-nums'[] },
} as const;
export const motion = { quick: 140, standard: 200 } as const;
