import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

const subscribe = (listener: () => void) => onlineManager.subscribe(listener);
const getSnapshot = () => onlineManager.isOnline();
const getServerSnapshot = () => true;

/** Use the same connectivity state for requests and their UI. */
export function useOnline() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
