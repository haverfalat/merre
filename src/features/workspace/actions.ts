import { Keyboard } from 'react-native';
import { useMapStore } from '~/store/useMapStore';
import { usePlannerStore } from '~/store/usePlannerStore';
import { dismissStopPreview } from '~/store/useStopPreview';
import { useUIStore } from '~/store/useUIStore';

export function dismissWorkspaceSearch() {
  Keyboard.dismiss();
  useUIStore.getState().setSearchFocused(false);
}

export function showWorkspaceMap() {
  dismissWorkspaceSearch();
  usePlannerStore.getState().close();
  useMapStore.getState().clearSelection();
  dismissStopPreview();
}

export function showWorkspaceSettings() {
  dismissWorkspaceSearch();
  useUIStore.getState().setIsSettingsOpen(true);
}
