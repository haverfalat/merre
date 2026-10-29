'use client';

import { useEffect, useRef, useState } from 'react';
import { predictVehicle, type VehiclePath } from '@/lib/vehicle-prediction';
import type { VehiclePosition } from '@/lib/transit/types/vehicle';
import {
  interpolateVehicle,
  vehicleMotionKey,
  VEHICLE_FRAME_MS,
  VEHICLE_MOTION_MS,
} from '@/lib/vehicle-motion';

/** Reconcile fixes by identity; only the selected route permits bounded prediction. */
export function useVehicleMotion(positions: VehiclePosition[] | undefined, reducedMotion: boolean, path?: VehiclePath) {
  const [frame, setFrame] = useState<VehiclePosition[] | undefined>(positions);
  const displayed = useRef<VehiclePosition[] | undefined>(positions);
  const fixes = useRef(new Map<string, { position: VehiclePosition; received: number }>());
  useEffect(() => {
    const previous = new Map(
      (displayed.current ?? []).map((position) => [vehicleMotionKey(position), position]),
    );
    const next = positions ?? [];
    const active = new Set(next.map(vehicleMotionKey));
    for (const key of fixes.current.keys()) if (!active.has(key)) fixes.current.delete(key);
    for (const position of next) {
      const key = vehicleMotionKey(position), old = fixes.current.get(key);
      if (!old || old.position.lastUpdated !== position.lastUpdated || old.position.lat !== position.lat || old.position.lon !== position.lon)
        fixes.current.set(key, { position, received: performance.now() });
    }
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
    // Match short update gaps without stretching an old fix across a long interval.
    const duration = path ? VEHICLE_MOTION_MS : Math.min(2_000, Math.max(VEHICLE_MOTION_MS,
      ...next.map((position) => {
        const from = previous.get(vehicleMotionKey(position));
        return from?.lastUpdated && position.lastUpdated
          ? (position.lastUpdated - from.lastUpdated) * 200 : 0;
      })));
    const started = performance.now();
    let lastFrame = -Infinity;
    let request = 0;
    const update = (now: number) => {
      const progress = moving ? Math.min(1, (now - started) / duration) : 1;
      let predicting = !reducedMotion && !!path && next.some((position) => {
        const fix = fixes.current.get(vehicleMotionKey(position));
        return fix && now - fix.received < 3_000 && predictVehicle(position, path, 1) !== position;
      });
      if (now - lastFrame >= VEHICLE_FRAME_MS || (progress === 1 && !predicting)) {
        const values = next.map((position) => {
          const fix = fixes.current.get(vehicleMotionKey(position));
          const elapsed = fix ? (now - fix.received) / 1000 : 0;
          const target = reducedMotion ? position : predictVehicle(position, path, elapsed);
          if (target !== position && elapsed < 3) predicting = true;
          return interpolateVehicle(previous.get(vehicleMotionKey(position)), target, progress);
        });
        displayed.current = values;
        setFrame(values);
        lastFrame = now;
      }
      if (progress < 1 || predicting) request = requestAnimationFrame(update);
    };
    request = requestAnimationFrame(update);
    return () => cancelAnimationFrame(request);
  }, [positions, reducedMotion, path]);
  return frame;
}
