import { focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

export function useQueryLifecycle() {
  useEffect(() => {
    const update = (state: Network.NetworkState) =>
      onlineManager.setOnline(state.isInternetReachable ?? state.isConnected ?? true);
    let disposed = false;
    void Network.getNetworkStateAsync()
      .then((state) => {
        if (!disposed) update(state);
      })
      .catch(() => {});
    const network = Network.addNetworkStateListener(update);
    const app = AppState.addEventListener('change', (state) => {
      if (Platform.OS !== 'web') focusManager.setFocused(state === 'active');
    });
    if (Platform.OS !== 'web') focusManager.setFocused(AppState.currentState === 'active');
    return () => {
      disposed = true;
      network.remove();
      app.remove();
    };
  }, []);
}
