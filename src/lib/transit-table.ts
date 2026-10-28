import { isRailMode } from './transit/modes';

export const BOARD_TABLE = { paddingLeft: 13, paddingRight: 10, gap: 8 } as const;
export const platformColumnWidth = (fontScale: number) => Math.ceil(30 * fontScale);
export function tripTableLayout(width: number, fontScale: number, mode?: string | null) {
  const train = isRailMode(mode);
  return {
    train,
    reflow: fontScale > 1.3 || (train && (fontScale > 1.1 || width < 390)),
    timeWidth: Math.ceil(64 * fontScale),
  };
}

export function stopBoardTableLayout(width: number, fontScale: number) {
  return {
    reflow: fontScale > 1.2 || width < 350,
    timeWidth: Math.ceil(96 * fontScale),
    platformWidth: platformColumnWidth(fontScale),
  };
}
