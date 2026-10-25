'use client';

import { useEffect, useRef, useState } from 'react';
import type { VehiclePosition } from '@/lib/transit/types/vehicle';
import {
  interpolateVehicle,
  vehicleMotionKey,
  VEHICLE_FRAME_MS,
  VEHICLE_MOTION_MS,
} from '@/lib/vehicle-motion';

/** Animate reported fixes by vehicle identity, without extrapolating their route. */
export function useVehicleMotion(positions: VehiclePosition[] | undefined, reducedMotion: boolean) {
  const [frame, setFrame] = useState<VehiclePosition[] | undefined>(positions);
  const displayed = useRef<VehiclePosition[] | undefined>(positions);
  useEffect(() => {
    const previous = new Map(
      (displayed.current ?? []).map((position) => [vehicleMotionKey(position), position]),
    );
    const next = positions ?? [];
    const moving =
      !reducedMotion &&
      next.some((position) => {
        const from = previous.get(vehicleMotionKey(position));
        return (
          from &&
          (from.lon !== position.lon ||
            from.lat !== position.lat ||
            from.heading !== position.heading)
        );
      });
    const started = performance.now();
    let lastFrame = -Infinity;
    let request = 0;
    const update = (now: number) => {
      const progress = moving ? Math.min(1, (now - started) / VEHICLE_MOTION_MS) : 1;
      if (now - lastFrame >= VEHICLE_FRAME_MS || progress === 1) {
        const values = next.map((position) =>
          interpolateVehicle(previous.get(vehicleMotionKey(position)), position, progress),
        );
        displayed.current = values;
        setFrame(values);
        lastFrame = now;
      }
      if (progress < 1) request = requestAnimationFrame(update);
    };
    request = requestAnimationFrame(update);
    return () => cancelAnimationFrame(request);
  }, [positions, reducedMotion]);
  return frame;
}
