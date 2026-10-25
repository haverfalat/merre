import { useEffect, useRef, type ComponentRef } from 'react';
import type { Marker } from 'react-native-maps';

/** Refresh a stable native annotation after its visual content changes. */
export function useMarkerRedraw(values: unknown[]) {
  const marker = useRef<ComponentRef<typeof Marker>>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => marker.current?.redraw());
    return () => cancelAnimationFrame(frame);
  }, values); // eslint-disable-line react-hooks/exhaustive-deps
  return marker;
}
