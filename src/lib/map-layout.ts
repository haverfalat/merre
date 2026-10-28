// The workspace and map camera reserve the same responsive sidebar width.
export const MAP_PANEL_LAYOUT = { breakpoint: 900, minWidth: 360, maxWidth: 456, headerHeight: 48 } as const;

export function desktopPanelWidth(viewport: number) {
  return Math.min(MAP_PANEL_LAYOUT.maxWidth, Math.max(MAP_PANEL_LAYOUT.minWidth, Math.round(viewport * 0.31)));
}
