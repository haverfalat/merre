import { focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

export function useQueryLifecycle() {
  useEffect(() => {
    let networkChanged = false;
    let disposed = false;
    const update = (state: Network.NetworkState) =>
      onlineManager.setOnline(state.isInternetReachable ?? state.isConnected ?? true);
    void Network.getNetworkStateAsync()
      .then((state) => {
        if (!disposed && !networkChanged) update(state);
      })
      .catch(() => {});
    const network = Network.addNetworkStateListener((state) => {
      networkChanged = true;
      if (!disposed) update(state);
    });
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
