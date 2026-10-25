import type { StateStorage } from 'zustand/middleware';

// Always supply an adapter so Zustand installs its persistence API even when
// browser storage is unavailable (native, SSR, or restricted browser contexts).
// Native apps replace it with AsyncStorage before mounting the UI.
export const browserPreferenceStorage: StateStorage = {
  getItem(name) {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage?.getItem(name) ?? null;
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage?.setItem(name, value);
    } catch {
      /* Preferences remain usable for this session. */
    }
  },
  removeItem(name) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage?.removeItem(name);
    } catch {
      /* Storage may be blocked by the browser. */
    }
  },
};
