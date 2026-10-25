export function isRailMode(mode?: string | null): boolean {
  return mode === 'RAIL' || mode === 'SUBURBAN_RAILWAY';
}
