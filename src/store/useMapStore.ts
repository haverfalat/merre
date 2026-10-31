import { create } from 'zustand';
import type { Mode } from '@/lib/transit/types/common';
import type { VehicleCameraMode } from '@/lib/vehicle-camera';
import { TRANSIT_MODES } from '@/lib/transit/modes';
import type { VehicleBounds } from '@/lib/transit/types/vehicle';

export type BoundingBox = VehicleBounds;

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
  previousStopId: string | null;
  previousTrips: SelectedVehicle[];
  goBackToTrip: () => void;
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

function emptySelection() {
  return {
    selectedVehicle: null,
    vehicleCameraMode: 'free' as const,
    selectedStopId: null,
    previousStopId: null,
    previousTrips: [] as SelectedVehicle[],
    selectedRouteId: null,
    selectedPatternId: null,
    stopRouteFilter: null,
    showStopConnections: false,
  };
}

export const useMapStore = create<MapState>((set) => ({
  bbox: null,
  zoom: 12,
  center: [19.0402, 47.4979], // Budapest center
  ...emptySelection(),
  cameraTarget: null,
  selectedModes: [...TRANSIT_MODES].sort(),

  setSelectedVehicle: (vehicle) =>
    set((state) => ({
      ...emptySelection(),
      selectedVehicle: vehicle,
      previousStopId: vehicle ? (state.selectedStopId ?? state.previousStopId) : null,
    })),
  goBackToTrip: () => set(state => {
    const previous = state.previousTrips.at(-1);
    if (!previous) return {};
    return { selectedVehicle: { ...previous, kind: 'trip' as const },
      previousTrips: state.previousTrips.slice(0, -1), vehicleCameraMode: 'free' as const };
  }),
  cycleVehicleCamera: (center) =>
    set((state) => {
      if (!state.selectedVehicle) return {};
      if (state.vehicleCameraMode === 'centered') return { vehicleCameraMode: 'heading' };
      if (state.vehicleCameraMode === 'heading') return { vehicleCameraMode: 'free' };
      return { vehicleCameraMode: 'centered', cameraTarget: { center, zoom: 15 } };
    }),
  releaseVehicleCamera: () => set({ vehicleCameraMode: 'free' }),
  setSelectedStopId: (stopId) =>
    set((state) => ({
      ...emptySelection(),
      selectedStopId: stopId,
      showStopConnections: state.selectedStopId === stopId ? state.showStopConnections : false,
      stopRouteFilter: state.selectedStopId === stopId ? state.stopRouteFilter : null,
    })),
  setSelectedModes: (selectedModes) => set({ selectedModes: [...new Set(selectedModes)].sort() }),
  setViewport: (bbox, zoom, center) => set({ bbox, zoom, center }),
  flyTo: (center, zoom = 14) => set({ cameraTarget: { center, zoom }, vehicleCameraMode: 'free' }),
  setSelectedRouteId: (selectedRouteId) =>
    set({
      ...emptySelection(),
      selectedRouteId,
    }),
  setSelectedPatternId: (selectedPatternId) => set({ selectedPatternId }),
  setStopRouteFilter: (stopRouteFilter) => set({ stopRouteFilter }),
  setShowStopConnections: (showStopConnections) => set({ showStopConnections }),
  clearSelection: () => set(emptySelection()),
  goBackToStop: () =>
    set((state) => ({
      ...emptySelection(),
      selectedStopId: state.previousStopId,
    })),
}));
