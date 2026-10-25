import type { TranslationKey } from '@/i18n/dict';
import { compassHeading, normalizeHeading } from '@/lib/location';
import { validCoordinates } from '@/lib/transit';
import { useMapStore } from '@/store/useMapStore';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

export function useLocation() {
  const [position, setPosition] = useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [compassEnabled, setCompassEnabled] = useState(false);
  const lastHeading = useRef({ time: 0, value: null as number | null });
  const updateHeading = useCallback((value: number) => {
    if (!Number.isFinite(value) || value < 0) return;
    const normalized = normalizeHeading(value);
    const previous = lastHeading.current;
    if (
      Date.now() - previous.time < 100 ||
      (previous.value != null && Math.abs(((normalized - previous.value + 540) % 360) - 180) < 2)
    )
      return;
    lastHeading.current = { time: Date.now(), value: normalized };
    setHeading(normalized);
  }, []);
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const centerNext = useRef(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    void Location.getForegroundPermissionsAsync()
      .then((p) => {
        if (mounted.current && p.granted) setEnabled(true);
      })
      .catch(() => {});
    const listener = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => {
      mounted.current = false;
      listener.remove();
    };
  }, []);
  useEffect(() => {
    if (!enabled || !active) return;
    let disposed = false;
    let watch: Location.LocationSubscription | undefined;
    const timer = setTimeout(() => {
      if (centerNext.current && !disposed) {
        setLocating(false);
        setError('location_timeout');
        centerNext.current = false;
      }
    }, 15_000);
    void Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3_000, distanceInterval: 5 },
      (fix) => {
        if (
          disposed ||
          !validCoordinates(fix.coords.longitude, fix.coords.latitude) ||
          !Number.isFinite(fix.coords.accuracy) ||
          fix.coords.accuracy! < 0
        )
          return;
        if (Date.now() - lastHeading.current.time > 2000)
          setHeading(
            fix.coords.heading != null &&
              Number.isFinite(fix.coords.heading) &&
              fix.coords.heading >= 0 &&
              fix.coords.speed != null &&
              fix.coords.speed >= 0.5
              ? normalizeHeading(fix.coords.heading)
              : null,
          );
        clearTimeout(timer);
        setPosition(fix);
        setLocating(false);
        setError(null);
        if (centerNext.current) {
          centerNext.current = false;
          useMapStore.getState().flyTo([fix.coords.longitude, fix.coords.latitude], 15);
        }
      },
      () => {
        if (!disposed) {
          setError('location_error');
          setLocating(false);
        }
      },
    )
      .then((subscription) => {
        if (disposed) subscription.remove();
        else watch = subscription;
      })
      .catch(() => {
        if (!disposed) {
          setError('location_error');
          setLocating(false);
        }
      });
    return () => {
      disposed = true;
      clearTimeout(timer);
      watch?.remove();
    };
  }, [enabled, active]);
  useEffect(() => {
    if (!enabled || !active) return;
    if (Platform.OS === 'web') {
      if (!compassEnabled) return;
      const orientation = (event: DeviceOrientationEvent) => {
        const value = compassHeading(event, window.screen.orientation?.angle ?? 0);
        if (value != null) updateHeading(value);
      };
      window.addEventListener('deviceorientationabsolute', orientation);
      window.addEventListener('deviceorientation', orientation);
      return () => {
        window.removeEventListener('deviceorientationabsolute', orientation);
        window.removeEventListener('deviceorientation', orientation);
      };
    }
    let disposed = false;
    let watch: Location.LocationSubscription | undefined;
    void Location.watchHeadingAsync((fix) => {
      if (!disposed && fix.accuracy > 0)
        updateHeading(fix.trueHeading >= 0 ? fix.trueHeading : fix.magHeading);
    })
      .then((subscription) => {
        if (disposed) subscription.remove();
        else watch = subscription;
      })
      .catch(() => {});
    return () => {
      disposed = true;
      watch?.remove();
    };
  }, [enabled, active, compassEnabled, updateHeading]);
  const locate = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setLocating(true);
    if (Platform.OS === 'web' && typeof DeviceOrientationEvent !== 'undefined') {
      const request = (
        DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      ).requestPermission;
      if (request)
        void request
          .call(DeviceOrientationEvent)
          .then((permission) => {
            if (mounted.current) setCompassEnabled(permission === 'granted');
          })
          .catch(() => {});
      else setCompassEnabled(true);
    }
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!mounted.current) return;
      if (!permission.granted) {
        setError('location_denied');
        setLocating(false);
        return;
      }
      if (position && Date.now() - position.timestamp < 30_000) {
        useMapStore.getState().flyTo([position.coords.longitude, position.coords.latitude], 15);
        setLocating(false);
      } else centerNext.current = true;
      // Restart a pre-authorized watcher too, giving each explicit request a timeout.
      setEnabled(false);
      setTimeout(() => {
        if (mounted.current) setEnabled(true);
      }, 0);
    } catch {
      if (mounted.current) {
        setError('location_error');
        setLocating(false);
      }
    } finally {
      busy.current = false;
    }
  }, [position]);
  return { position, heading, locating, error, locate, dismissError: () => setError(null) };
}
export type LocationState = ReturnType<typeof useLocation>;
