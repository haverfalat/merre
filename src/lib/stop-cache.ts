import type { StateStorage } from 'zustand/middleware';
import { browserPreferenceStorage } from './preference-storage';
import { stopsWithinBounds } from './transit/geometry/bounds';
import type { GroupedChildStop } from './transit/types/stop';
import type { VehicleBounds } from './transit/types/vehicle';

const STOPS_CACHE_KEY = 'merre-stops-cache-v1';
const METRO_CACHE_KEY = 'merre-metro-stops-v1';
const MAX_CACHED_STOPS = 1500;

let storage: StateStorage = browserPreferenceStorage;
const stopMap = new Map<string, GroupedChildStop>();
let hydrated = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function hydrateFromSyncStorage() {
  if (hydrated) return;
  hydrated = true;
  const raw = storage.getItem(STOPS_CACHE_KEY);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as GroupedChildStop[];
      if (Array.isArray(parsed)) {
        for (const stop of parsed) {
          const key = stop.gtfsId || stop.id;
          if (key) stopMap.set(key, stop);
        }
      }
    } catch {
      /* Ignore corrupt cache. */
    }
  }
}

export async function configureStopCacheStorage(nextStorage: StateStorage) {
  storage = nextStorage;
  try {
    const raw = await storage.getItem(STOPS_CACHE_KEY);
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw) as GroupedChildStop[];
      if (Array.isArray(parsed)) {
        for (const stop of parsed) {
          const key = stop.gtfsId || stop.id;
          if (key && !stopMap.has(key)) stopMap.set(key, stop);
        }
      }
    }
    hydrated = true;
  } catch {
    /* Ignore storage errors. */
  }
}

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const entries = [...stopMap.values()].slice(-MAX_CACHED_STOPS);
      void storage.setItem(STOPS_CACHE_KEY, JSON.stringify(entries));
    } catch {
      /* Ignore quota errors. */
    }
  }, 500);
}

export function rememberStopsInCache(stops: GroupedChildStop[]) {
  if (!stops.length) return;
  hydrateFromSyncStorage();
  for (const stop of stops) {
    const key = stop.gtfsId || stop.id;
    if (!key) continue;
    stopMap.delete(key);
    stopMap.set(key, stop);
  }
  while (stopMap.size > MAX_CACHED_STOPS) {
    const oldest = stopMap.keys().next().value;
    if (oldest) stopMap.delete(oldest);
    else break;
  }
  scheduleSave();
}

export function readCachedStopsInBounds(bounds: VehicleBounds): GroupedChildStop[] | undefined {
  hydrateFromSyncStorage();
  if (!stopMap.size) return undefined;
  const hits = stopsWithinBounds([...stopMap.values()], bounds);
  return hits.length ? hits : undefined;
}

export function readCachedMetroStops(date: string): GroupedChildStop[] | null {
  try {
    const raw = storage.getItem(`${METRO_CACHE_KEY}:${date}`);
    if (typeof raw !== 'string') return null;
    const parsed = JSON.parse(raw) as GroupedChildStop[];
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedMetroStops(date: string, stops: GroupedChildStop[]) {
  if (!stops.length) return;
  try {
    void storage.setItem(`${METRO_CACHE_KEY}:${date}`, JSON.stringify(stops));
  } catch {
    /* Ignore quota errors. */
  }
}
