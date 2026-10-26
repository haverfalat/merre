import { useRef, useState } from 'react';

export function usePullToRefresh(refetch: () => unknown) {
  const [refreshing, setRefreshing] = useState(false);
  const pending = useRef(false);
  const onRefresh = () => {
    if (pending.current) return;
    pending.current = true;
    setRefreshing(true);
    void Promise.resolve()
      .then(refetch)
      .catch(() => {})
      .finally(() => {
        pending.current = false;
        setRefreshing(false);
      });
  };
  return { refreshing, onRefresh };
}
