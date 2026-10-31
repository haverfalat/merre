import type { SelectedVehicle } from './useMapStore';
import { create } from 'zustand';

export type StopBoardTab = 'departures' | 'arrivals' | 'timetable';
export interface StopPreview {
  id: string;
  name: string;
  coordinates: [number, number];
}
export const useStopPreview = create<{
  stop: StopPreview | null;
  alternatives: StopPreview[];
  point: { x: number; y: number } | null;
  board: { id: string; tab: StopBoardTab; at?: number; fromVehicle?: boolean; vehicle?: SelectedVehicle } | null;
}>()(() => ({ stop: null, alternatives: [], point: null, board: null }));

export function dismissStopPreview() {
  const { stop, point } = useStopPreview.getState();
  if (stop || point) useStopPreview.setState({ stop: null, alternatives: [], point: null });
}
