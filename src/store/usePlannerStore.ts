import { create } from 'zustand';
import type { JourneyEndpoint, JourneyRequest } from '~/lib/transit/types/plan';
import { DEFAULT_SHEET_FRACTION } from '~/lib/mobile-sheet';
import { dismissStopPreview } from './useStopPreview';
import { useMapStore } from './useMapStore';
import { useUIStore } from './useUIStore';

interface PlannerState {
  timeMode: 'now' | 'depart' | 'arrive';
  setTimeMode: (timeMode: PlannerState['timeMode']) => void;
  sort: 'departure' | 'arrival' | 'duration' | 'transfers';
  setSort: (sort: PlannerState['sort']) => void;
  returnToJourney: boolean;
  openService: (tripId: string, serviceDay?: string) => void;
  resumeJourney: () => void;
  open: boolean;
  from: JourneyEndpoint | null;
  to: JourneyEndpoint | null;
  request: JourneyRequest | null;
  requestRevision: number;
  expandedLegs: number[];
  toggleStops: (index: number) => void;
  selectedId: string | null;
  detail: boolean;
  focusedLeg: number | null;
  mapRevision: number;
  fitJourney: () => void;
  openPlanner: (destination?: JourneyEndpoint) => void;
  close: () => void;
  setEndpoint: (field: 'from' | 'to', value: JourneyEndpoint) => void;
  swap: () => void;
  search: (request: JourneyRequest) => void;
  selectJourney: (id: string) => void;
  showResults: () => void;
  focusLeg: (index: number) => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
  returnToJourney: false,
  openService: (tripId, serviceDay) => {
    set({ open: false, returnToJourney: true });
    useMapStore.getState().setSelectedVehicle({ tripId, serviceDay });
  },
  resumeJourney: () => {
    set((state) => ({ open: true, returnToJourney: false, mapRevision: state.mapRevision + 1 }));
    useMapStore.getState().clearSelection();
    useUIStore.getState().setSearchFocused(false);
  },
  timeMode: 'now',
  setTimeMode: (timeMode) => set({ timeMode }),
  mapRevision: 0,
  fitJourney: () => set((state) => ({ focusedLeg: null, mapRevision: state.mapRevision + 1 })),
  sort: 'departure',
  setSort: (sort) => set({ sort }),
  open: false,
  from: null,
  to: null,
  request: null,
  requestRevision: 0,
  expandedLegs: [],
  toggleStops: (index) =>
    set((state) => ({
      expandedLegs: state.expandedLegs.includes(index)
        ? state.expandedLegs.filter((item) => item !== index)
        : [...state.expandedLegs, index],
      focusedLeg: index,
      mapRevision: state.mapRevision + 1,
    })),
  selectedId: null,
  detail: false,
  focusedLeg: null,
  openPlanner: (destination) => {
    useMapStore.getState().clearSelection();
    dismissStopPreview();
    useUIStore.getState().setSearchFocused(false);
    useUIStore.getState().setMobileSheetFraction(DEFAULT_SHEET_FRACTION);
    set({
      open: true,
      returnToJourney: false,
      ...(destination
        ? { to: destination, request: null, selectedId: null, detail: false, focusedLeg: null }
        : {}),
    });
  },
  close: () => set({ open: false, returnToJourney: false, focusedLeg: null }),
  setEndpoint: (field, value) =>
    set({ [field]: value, request: null, selectedId: null, detail: false, focusedLeg: null }),
  swap: () =>
    set((state) => ({
      from: state.to,
      to: state.from,
      request: null,
      selectedId: null,
      detail: false,
      focusedLeg: null,
    })),
  search: (request) =>
    set((state) => ({
      request,
      requestRevision: state.requestRevision + 1,
      expandedLegs: [],
      selectedId: null,
      detail: false,
      focusedLeg: null,
    })),
  selectJourney: (selectedId) => {
    useUIStore.getState().setMobileSheetFraction(DEFAULT_SHEET_FRACTION);
    set({ selectedId, detail: true, focusedLeg: null, expandedLegs: [] });
  },
  showResults: () => set({ detail: false, focusedLeg: null }),
  focusLeg: (focusedLeg) => {
    useUIStore.getState().setMobileSheetFraction(DEFAULT_SHEET_FRACTION);
    set((state) => ({ focusedLeg, mapRevision: state.mapRevision + 1 }));
  },
}));
