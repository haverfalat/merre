import type { InfoService } from './stop';
import type { Mode } from './common';

export interface JourneyEndpoint {
  name: string;
  lat: number;
  lon: number;
  stopId?: string;
}

export interface JourneyRequest {
  from: JourneyEndpoint;
  to: JourneyEndpoint;
  date: string;
  time: string;
  arriveBy: boolean;
  pageCursor?: string;
  preferences?: JourneyPreferences;
}

export interface JourneyPlace {
  name: string;
  lat: number | null;
  lon: number | null;
  stopId?: string;
  platform?: string;
}

export interface JourneyLeg {
  id: string;
  mode: Mode;
  transit: boolean;
  from: JourneyPlace;
  to: JourneyPlace;
  startTime: number;
  endTime: number;
  duration: number;
  distance: number;
  departureDelay: number;
  arrivalDelay: number;
  realtime: boolean;
  canceled: boolean;
  staySeated: boolean;
  routeName?: string;
  routeColor?: string;
  operator?: string;
  headsign?: string;
  tripName?: string;
  tripId?: string;
  serviceDate?: string;
  coordinates: [number, number][];
  intermediateStops: JourneyPlace[];
  notices: string[];
  services: InfoService[];
  steps: { direction: string; heading: string; street: string; distance: number }[];
}

export interface Journey {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  transfers: number;
  walkTime: number;
  legs: JourneyLeg[];
  trackClosure: boolean;
}

export interface JourneyPlan {
  journeys: Journey[];
  warnings: string[];
  errors: string[];
  nextPageCursor?: string;
  previousPageCursor?: string;
}

export interface JourneyPreferences {
  modes: Mode[];
  walkSpeed: number;
  minTransferTime: number;
  wheelchair: boolean;
  comfortLevels: string[];
  searchParameters: string[];
  transitPassFilter: string[];
}

export interface JourneyOption {
  id: string;
  label: string;
  disables: string[];
}
export interface JourneyOptions {
  comfortGroups: { label: string; options: JourneyOption[] }[];
  filterGroups: {
    label: string;
    field: 'searchParameters' | 'transitPassFilter';
    options: JourneyOption[];
  }[];
}
