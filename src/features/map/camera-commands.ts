export interface ZoomIntent {
  zoom: number;
  at: number;
}

/** Accumulate quick taps against the requested zoom while the camera catches up. */
export function nextZoomIntent(
  previous: ZoomIntent | null,
  actualZoom: number,
  amount: number,
  now: number,
): ZoomIntent {
  const base = previous && now - previous.at < 350 ? previous.zoom : actualZoom;
  return { zoom: Math.max(5, Math.min(19, base + amount)), at: now };
}
