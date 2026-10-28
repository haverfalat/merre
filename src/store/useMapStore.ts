import { create } from 'zustand';
import type { Mode } from '@/lib/transit/types/common';
import type { VehicleCameraMode } from '@/lib/vehicle-camera';

export interface BoundingBox {
  swLat: number;
  swLon: number;
  neLat: number;
  neLon: number;
}

export interface SelectedVehicle {
  kind?: 'vehicle' | 'trip';
  tripId: string;
  serviceDay?: string;
  vehicleId?: string;
  frontDoor?: boolean;
}

interface MapState {
  bbox: BoundingBox | null;
  zoom: number;
  center: [number, number]; // [lng, lat]
  selectedVehicle: SelectedVehicle | null;
  vehicleCameraMode: VehicleCameraMode;
  selectedStopId: string | null;
  selectedStopIds: string[];
  previousStopId: string | null;
  previousStopIds: string[];
  selectedRouteId: string | null;
  selectedPatternId: string | null;
  stopRouteFilter: string[] | null;
  showStopConnections: boolean;
  cameraTarget: { center: [number, number]; zoom: number; kind?: 'zoom'; duration?: number } | null;
  selectedModes: Mode[];

  setSelectedVehicle: (vehicle: SelectedVehicle | null) => void;
  cycleVehicleCamera: (center: [number, number]) => void;
  releaseVehicleCamera: () => void;
  setSelectedStopId: (stopId: string | null) => void;
  setSelectedStopGroup: (stopId: string, stopIds: string[]) => void;
  setSelectedModes: (modes: Mode[]) => void;
  setViewport: (bbox: BoundingBox, zoom: number, center: [number, number]) => void;
  flyTo: (center: [number, number], zoom?: number) => void;
  setSelectedRouteId: (routeId: string | null) => void;
  setSelectedPatternId: (patternId: string | null) => void;
  setStopRouteFilter: (routeIds: string[] | null) => void;
  setShowStopConnections: (show: boolean) => void;
  clearSelection: () => void;
  goBackToStop: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  bbox: null,
  zoom: 12,
  center: [19.0402, 47.4979], // Budapest center
  selectedVehicle: null,
  vehicleCameraMode: 'free',
  selectedStopId: null,
  selectedStopIds: [],
  previousStopId: null,
  previousStopIds: [],
  selectedRouteId: null,
  selectedPatternId: null,
  stopRouteFilter: null,
  showStopConnections: false,
  cameraTarget: null,
  selectedModes: [
    'RAIL',
    'SUBURBAN_RAILWAY',
    'COACH',
    'BUS',
    'TRAM',
    'TRAMTRAIN',
    'SUBWAY',
    'TROLLEYBUS',
    'FERRY',
    'RAIL_REPLACEMENT_BUS',
  ],

  setSelectedVehicle: (vehicle) =>
    set((state) => ({
      selectedVehicle: vehicle,
      vehicleCameraMode: 'free',
      selectedStopId: null,
      selectedStopIds: [],
      selectedRouteId: null,
      showStopConnections: false,
      stopRouteFilter: null,
      previousStopId: vehicle ? (state.selectedStopId ?? state.previousStopId) : null,
      previousStopIds: vehicle
        ? state.selectedStopId
          ? state.selectedStopIds
          : state.previousStopIds
        : [],
    })),
  cycleVehicleCamera: (center) =>
    set((state) =>
      !state.selectedVehicle
        ? {}
        : state.vehicleCameraMode === 'centered'
          ? { vehicleCameraMode: 'heading' }
          : {
              vehicleCameraMode: 'centered',
              cameraTarget: {
                center,
                zoom: state.vehicleCameraMode === 'heading' ? state.zoom : 15,
              },
            },
    ),
  releaseVehicleCamera: () => set({ vehicleCameraMode: 'free' }),
  setSelectedStopId: (stopId) =>
    set((state) => ({
      selectedStopId: stopId,
      selectedStopIds: stopId ? [stopId] : [],
      selectedVehicle: null,
      vehicleCameraMode: 'free',
      selectedRouteId: null,
      previousStopId: null,
      previousStopIds: [],
      showStopConnections: state.selectedStopId === stopId ? state.showStopConnections : false,
      stopRouteFilter: state.selectedStopId === stopId ? state.stopRouteFilter : null,
    })),
  setSelectedStopGroup: (stopId, stopIds) =>
    set((state) =>
      state.selectedStopId === stopId
        ? { selectedStopIds: [...new Set([stopId, ...stopIds])] }
        : {},
    ),
  setSelectedModes: (selectedModes) => set({ selectedModes: [...new Set(selectedModes)].sort() }),
  setViewport: (bbox, zoom, center) => set({ bbox, zoom, center }),
  flyTo: (center, zoom = 14) => set({ cameraTarget: { center, zoom }, vehicleCameraMode: 'free' }),
  setSelectedRouteId: (selectedRouteId) =>
    set({
      selectedRouteId,
      selectedPatternId: null,
      selectedVehicle: null,
      vehicleCameraMode: 'free',
      selectedStopId: null,
      selectedStopIds: [],
      previousStopId: null,
      previousStopIds: [],
      showStopConnections: false,
      stopRouteFilter: null,
    }),
  setSelectedPatternId: (selectedPatternId) => set({ selectedPatternId }),
  setStopRouteFilter: (stopRouteFilter) => set({ stopRouteFilter }),
  setShowStopConnections: (showStopConnections) => set({ showStopConnections }),
  clearSelection: () =>
    set({
      selectedVehicle: null,
      vehicleCameraMode: 'free',
      selectedStopId: null,
      selectedStopIds: [],
      selectedRouteId: null,
      previousStopId: null,
      previousStopIds: [],
      showStopConnections: false,
      stopRouteFilter: null,
    }),
  goBackToStop: () =>
    set((state) => ({
      selectedVehicle: null,
      vehicleCameraMode: 'free',
      selectedStopId: state.previousStopId,
      selectedStopIds: state.previousStopIds,
      previousStopId: null,
      previousStopIds: [],
    })),
}));
