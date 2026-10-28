export const BOARD_TABLE = { paddingLeft: 13, paddingRight: 10, gap: 8 } as const;
export const platformColumnWidth = (fontScale: number) => Math.ceil(30 * fontScale);
export const tripTimeColumnWidth = (fontScale: number) => Math.ceil(64 * fontScale);

export function stopBoardTableLayout(width: number, fontScale: number) {
  return {
    reflow: fontScale > 1.2 || width < 350,
    timeWidth: Math.ceil(96 * fontScale),
    platformWidth: platformColumnWidth(fontScale),
  };
}
