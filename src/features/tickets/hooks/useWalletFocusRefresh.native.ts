import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export function useWalletFocusRefresh() {
  const cache = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      void cache.refetchQueries(
        { queryKey: ['ticket-wallet'], type: 'active' },
        { cancelRefetch: false },
      );
    }, [cache]),
  );
}
