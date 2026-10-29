import { useEffect, useRef, useState } from 'react';
import { vehiclePositionKey } from '@/lib/vehicle-position';
import type { VehiclePosition } from '@/lib/transit/types/vehicle';

/** Camera follows the marker's render timeline at at most 10 Hz, including the final frame. */
export function useCameraPosition(position: VehiclePosition | null) {
  const [value, setValue] = useState(position);
  const latest = useRef(position);
  const last = useRef(-Infinity);
  useEffect(() => {
    latest.current = position;
    const update = () => { last.current = performance.now(); setValue(latest.current); };
    if (!position || performance.now() - last.current >= 100) { update(); return; }
    const timer = setTimeout(update, Math.max(0, 100 - (performance.now() - last.current)));
    return () => clearTimeout(timer);
  }, [position]);
  if (!position) return null;
  return value && vehiclePositionKey(value) === vehiclePositionKey(position) ? value : position;
}
