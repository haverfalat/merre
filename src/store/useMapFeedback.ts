import { create } from 'zustand';

export const useMapFeedback = create<{
  tileError: boolean;
  revision: number;
  setTileError: (error: boolean) => void;
  retryTiles: () => void;
}>((set) => ({
  tileError: false,
  revision: 0,
  setTileError: (tileError) => set({ tileError }),
  retryTiles: () =>
    set((state) => (state.tileError ? { tileError: false, revision: state.revision + 1 } : {})),
}));
