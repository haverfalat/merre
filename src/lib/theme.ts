import { useUIStore } from '@/store/useUIStore';

const dark = {
  background: '#0c0e13',
  card: '#11151c',
  border: '#1e2530',
  strong: '#2a3342',
  surface: '#161c25',
  raised: '#1a212b',
  text: '#e8ecf1',
  secondary: '#b3bfce',
  muted: '#93a3b7',
  accent: '#3b82f6',
  accentMuted: '#1e3a5f',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  successMuted: '#0f2e1a',
  warningMuted: '#2e2508',
  dangerMuted: '#2e1010',
  textMuted: '#8191a6',
};
const light: typeof dark = {
  background: '#f1f5f9',
  card: '#ffffff',
  border: '#dbe3ec',
  strong: '#b8c6d6',
  surface: '#f1f5f9',
  raised: '#e8eef5',
  text: '#0f172a',
  secondary: '#334155',
  muted: '#52647b',
  accent: '#2563eb',
  accentMuted: '#dbeafe',
  success: '#15803d',
  warning: '#a16207',
  danger: '#dc2626',
  successMuted: '#dcfce7',
  warningMuted: '#fef3c7',
  dangerMuted: '#fee2e2',
  textMuted: '#63758b',
};
export function useTheme() {
  return useUIStore((s) => s.theme) === 'dark' ? dark : light;
}
export const fonts = {
  regular: 'Geist',
  medium: 'GeistMedium',
  semibold: 'GeistSemibold',
  mono: 'GeistMono',
  symbols: 'MNR2007',
};
