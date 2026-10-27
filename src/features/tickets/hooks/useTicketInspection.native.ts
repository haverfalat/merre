import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import { backendFor } from '~/lib/tickets/accounts.native';
import { TicketWalletError } from '~/lib/tickets/errors';
import { openTicketPresentation } from '~/lib/tickets/presentation.native';
import type { OwnedWalletTicket } from '~/lib/tickets/types';

export function useTicketInspection() {
  const cache = useQueryClient();
  const { language } = useTranslation();
  const locked = useRef(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const inspect = async (ticket: OwnedWalletTicket) => {
    if (locked.current) return;
    locked.current = true;
    setLoading(`${ticket.accountId}:${ticket.id}`);
    setError(null);
    try {
      const presentation = await backendFor(ticket.accountId).inspector?.(ticket.id, language);
      if (!presentation) throw new TicketWalletError('unavailable');
      const id = openTicketPresentation(presentation);
      router.push({ pathname: '/tickets/present', params: { id } });
      void cache.invalidateQueries({ queryKey: ['ticket-wallet', ticket.accountId] });
    } catch (error) {
      setError(error);
    } finally {
      locked.current = false;
      setLoading(null);
    }
  };
  return { inspect, loading, busy: loading !== null, error };
}
