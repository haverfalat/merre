import { useState } from 'react';
import { useBoardingBusy } from '~/lib/tickets/selection.native';

/** All ticket actions share one lock, including inspection from the wallet. */
export function useTicketOperation() {
  const busy = useBoardingBusy((state) => state.busy);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  return {
    busy,
    loading,
    error,
    setError,
    acquire(key: string) {
      if (useBoardingBusy.getState().busy) return false;
      useBoardingBusy.setState({ busy: true });
      setLoading(key);
      setError(null);
      return true;
    },
    release() {
      useBoardingBusy.setState({ busy: false });
      setLoading(null);
    },
  };
}
