import { useCallback, useEffect } from 'react';
import { useStopPreview } from '~/store/useStopPreview';

export function useStopPreviewProjection(
  project: (point: [number, number]) => Promise<{ x: number; y: number } | undefined>,
  ready: boolean,
) {
  const stop = useStopPreview((s) => s.stop);
  const update = useCallback(() => {
    const current = useStopPreview.getState().stop;
    if (!current || !ready) return;
    void project(current.coordinates)
      .then((point) => {
        if (
          !point ||
          !Number.isFinite(point.x) ||
          !Number.isFinite(point.y) ||
          useStopPreview.getState().stop !== current
        )
          return;
        const previous = useStopPreview.getState().point;
        if (
          !previous ||
          Math.abs(previous.x - point.x) > 0.5 ||
          Math.abs(previous.y - point.y) > 0.5
        )
          useStopPreview.setState({ point });
      })
      .catch(() => {});
  }, [project, ready]);
  useEffect(update, [update, stop]);
  return update;
}
