import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { AppState } from 'react-native';
import { getTransit } from '~/lib/transit/service';
import { TRANSIT_MODES } from '~/lib/transit/modes';
import { activeStopIndex, serviceDate, validCoordinates } from '~/lib/transit';
import { stopTiming } from '~/lib/transit/stop-times';
import { formatServiceTime } from '~/lib/transit/time/format';
import { distanceMeters } from '~/lib/tickets/boarding';
import { cleanTransitPlaceName } from '~/lib/transit/labels';
import { getRouteColor, contrastTextColor } from '~/lib/transit/colors';
import { getDelayFromVehiclePosition } from '~/lib/transit/delay';
import { t } from '~/i18n/dict';
import type { RideDisplay } from './activity.ios';

const task = 'merre-ride-detection';
const stateKey = 'ride-detection-state';
export const available = !!requireOptionalNativeModule('ExpoWidgets') && !!requireOptionalNativeModule('ExpoTaskManager');
type Language = 'hu' | 'en';
type Evidence = { key: string; lat: number; lon: number; vehicleLat: number; vehicleLon: number; started: number; fix: number; seen: number; confirmed: boolean };
type State = { language: Language; candidate?: Evidence; lastRide?: number; pushRequested?: number; display?: RideDisplay };
let queue = Promise.resolve();
function serial(operation: () => Promise<void>) {
  const result = queue.then(operation);
  queue = result.catch(() => {});
  return result;
}
async function read(): Promise<State | null> {
  return JSON.parse((await AsyncStorage.getItem(stateKey)) ?? 'null');
}
function rideActivity(): typeof import('./activity.ios').default {
  // Load native widget code only after checking the installed build supports it.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./activity.ios').default;
}
async function publish(state: State) {
  const factory = rideActivity();
  const instances = factory.getInstances();
  // Old installations can have a searching activity or a legacy text-only display.
  if (!state.display?.symbol || Date.now() - (state.lastRide ?? 0) > 150000) {
    await Promise.all(instances.map(activity => activity.end('immediate')));
    return;
  }
  const stale = new Date(state.lastRide! + 120000);
  if (instances.length) {
    await instances[0].update(state.display, stale);
    await Promise.all(instances.slice(1).map(activity => activity.end('immediate')));
    return;
  }
  if (Date.now() - (state.pushRequested ?? 0) < 30000) return;
  if (AppState.currentState === 'active') {
    factory.start(state.display, undefined, stale);
    return;
  }
  const token = await SecureStore.getItemAsync('ride-push-token');
  if (!token) return;
  state.pushRequested = Date.now();
  await AsyncStorage.setItem(stateKey, JSON.stringify(state));
  const origin = process.env.EXPO_PUBLIC_RIDE_API_ORIGIN || 'https://merre.bencica.hu';
  await fetch(origin + '/api/rides/start', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, display: state.display }), signal: AbortSignal.timeout(8000),
  });
}
export const isTracking = () => Location.hasStartedLocationUpdatesAsync(task);
export function setTracking(enable: boolean, language: Language) {
  return serial(async () => {
    if (!enable) {
      if (await isTracking()) await Location.stopLocationUpdatesAsync(task);
      await AsyncStorage.removeItem(stateKey);
      const factory = rideActivity();
      await Promise.all(factory.getInstances().map(a => a.end('immediate')));
      return;
    }
    if (!(await Location.requestForegroundPermissionsAsync()).granted ||
        !(await Location.requestBackgroundPermissionsAsync()).granted) throw Error('permission');
    const state = { language };
    await AsyncStorage.setItem(stateKey, JSON.stringify(state));
    try {
      await Location.startLocationUpdatesAsync(task, { accuracy: Location.Accuracy.High,
        distanceInterval: 20, showsBackgroundLocationIndicator: true, pausesUpdatesAutomatically: false });
      await publish(state); // Clear any searching activity left by a previous build.
    } catch (error) {
      if (await isTracking()) await Location.stopLocationUpdatesAsync(task);
      await AsyncStorage.removeItem(stateKey);
      throw error;
    }
  });
}
async function observe(location: Location.LocationObject) {
  const state = await read();
  if (!state) return;
  const { latitude, longitude, accuracy, heading, speed } = location.coords;
  const now = Date.now();
  if (state.lastRide && now - state.lastRide > 150000) {
    delete state.display;
    delete state.lastRide;
    await AsyncStorage.setItem(stateKey, JSON.stringify(state));
    await publish(state);
  }
  if (now - location.timestamp > 60000 || !validCoordinates(longitude, latitude) ||
      accuracy == null || accuracy < 0 || accuracy > 65) return;
  if (state.candidate && location.timestamp - state.candidate.seen < 9000) return;
  const transit = getTransit(AbortSignal.timeout(18000), state.language);
  const vehicles = await transit.vehiclesInBounds({ swLat: latitude - .003, neLat: latitude + .003,
    swLon: longitude - .005, neLon: longitude + .005 }, TRANSIT_MODES);
  const nearby = vehicles.flatMap(v => {
    const id = v.trip?.gtfsId || v.trip?.id;
    if (!id || !v.lastUpdated || v.isEstimated || now / 1000 - v.lastUpdated > 60 ||
        !validCoordinates(v.lon, v.lat)) return [];
    if (speed != null && speed > 2 && heading != null && heading >= 0 && v.heading != null &&
        Math.abs(((heading - v.heading + 540) % 360) - 180) > 65) return [];
    const distance = distanceMeters(latitude, longitude, v.lat!, v.lon!);
    return distance <= 65 + accuracy ? [{ v, id, distance }] : [];
  }).sort((a,b) => a.distance - b.distance);
  const match = nearby[0];
  if (!match || nearby.some(other => other.id !== match.id && other.distance - match.distance < 25)) {
    if (state.candidate) {
      delete state.candidate;
      await AsyncStorage.setItem(stateKey, JSON.stringify(state));
    }
    return;
  }
  const { v, id } = match;
  const day = v.trip?.serviceDate?.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3') || serviceDate(now);
  const key = JSON.stringify([id, day, v.vehicleId]);
  const prev = state.candidate;
  const same = prev?.key === key && location.timestamp - prev.seen < 100000;
  const candidate: Evidence = same ? { ...prev, seen: location.timestamp } : {
    key, lat: latitude, lon: longitude, vehicleLat: v.lat!, vehicleLon: v.lon!, started: location.timestamp, fix: v.lastUpdated!,
    seen: location.timestamp, confirmed: false };
  candidate.confirmed ||= location.timestamp - candidate.started >= 20000 && v.lastUpdated! > candidate.fix &&
    distanceMeters(latitude, longitude, candidate.lat, candidate.lon) >= 100 &&
    distanceMeters(v.lat!, v.lon!, candidate.vehicleLat, candidate.vehicleLon) >= 80;
  state.candidate = candidate;
  await AsyncStorage.setItem(stateKey, JSON.stringify(state));
  if (!candidate.confirmed) return;
  const trip = await transit.trip(id, day);
  if (!trip) return;
  const stops = (trip.stoptimes ?? []).filter(s => s.realtimeState !== 'SKIPPED' && s.realtimeState !== 'CANCELED');
  const index = activeStopIndex(stops, v, now);
  if (index < 0) {
    delete state.display;
    delete state.lastRide;
    await AsyncStorage.setItem(stateKey, JSON.stringify(state));
    await publish(state);
    return;
  }
  const remaining = stops.slice(index);
  const describeDelay = (seconds: number | null) => {
    const minutes = seconds == null ? null : Math.round(seconds / 60);
    return minutes == null ? t('scheduled', state.language) : minutes === 0 ? t('on_time', state.language)
      : (minutes > 0 ? '+' : '') + minutes + ' min';
  };
  const rows = (remaining.length <= 4 ? remaining : [remaining[0], remaining[remaining.length - 1]]).map(s => {
    let timing = stopTiming(s, 'arrivals');
    if (timing.epoch == null) timing = stopTiming(s, 'departures');
    const time = timing.epoch == null ? '—' : formatServiceTime(timing.epoch * 1000);
    return { time, name: cleanTransitPlaceName(s.stop.name), delay: describeDelay(timing.delay) };
  });
  const mode = trip.route?.mode || v.trip?.route?.mode || 'BUS';
  const symbols: Record<string, RideDisplay['symbol']> = {
    BUS: 'bus.fill', COACH: 'bus.doubledecker.fill', RAIL_REPLACEMENT_BUS: 'bus.fill',
    TROLLEYBUS: 'bus.fill', TRAM: 'tram.fill', TRAMTRAIN: 'tram.fill',
    SUBWAY: 'tram.tunnel.fill', RAIL: 'train.side.front.car', SUBURBAN_RAILWAY: 'train.side.front.car', FERRY: 'ferry.fill',
  };
  const color = getRouteColor(mode, trip.route?.color, trip.route?.textColor).primary;
  state.display = { color, ink: contrastTextColor(color), symbol: symbols[mode] ?? 'location.fill',
    status: describeDelay(getDelayFromVehiclePosition(v) ?? stopTiming(remaining[0], 'arrivals').delay),
    route: trip.route?.shortName || trip.tripShortName || 'Merre',
    destination: cleanTransitPlaceName(trip.tripHeadsign || stops.at(-1)?.stop.name),
    nextTime: rows[0].time, rows };
  state.lastRide = now;
  await AsyncStorage.setItem(stateKey, JSON.stringify(state));
  await publish(state);
}
if (available) {
  // Older development builds and Expo Go can lack the native task module.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const widgets: typeof import('expo-widgets') = require('expo-widgets');
  widgets.addPushToStartTokenListener(({ activityPushToStartToken }) => {
    void SecureStore.setItemAsync('ride-push-token', activityPushToStartToken, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }).catch(() => {});
  });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TaskManager: typeof import('expo-task-manager') = require('expo-task-manager');
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(task, async ({ data, error }) => {
    const location = data?.locations.at(-1);
    if (!error && location) await serial(() => observe(location));
  });
}
export function resumeTracking() {
  return serial(async () => {
    const state = await read();
    if (state && await isTracking()) {
      if (Date.now() - (state.lastRide ?? 0) > 150000) delete state.display;
      await publish(state);
    }
  });
}
