import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from '~/hooks/useTranslation';
import { backendFor } from '~/lib/tickets/accounts.native';
import { TicketWalletError } from '~/lib/tickets/errors';
import { useBoardingBusy } from '~/lib/tickets/selection.native';
import type { OwnedWalletTicket } from '~/lib/tickets/types';

export function useTicketTransfer() {
  const { t } = useTranslation();
  const cache = useQueryClient();
  const busy = useBoardingBusy((state) => state.busy);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const run = async (ticket: OwnedWalletTicket, allowMutation: boolean) => {
    if (useBoardingBusy.getState().busy) return;
    useBoardingBusy.setState({ busy: true });
    setLoading(`${ticket.accountId}:${ticket.id}`);
    setError(null);
    try {
      const result = await backendFor(ticket.accountId).transfer?.(ticket.id, { allowMutation });
      if (!result) throw new TicketWalletError('unavailable');
      await cache.invalidateQueries({ queryKey: ['ticket-wallet', ticket.accountId] });
      void cache.invalidateQueries({
        queryKey: ['ticket-wallet'],
        predicate: (query) => query.queryKey[1] !== ticket.accountId,
      });
      Alert.alert(
        t(
          result.status === 'completed'
            ? 'tickets_transfer_done'
            : result.status === 'pending'
              ? 'tickets_transfer_pending'
              : result.status === 'failed'
                ? 'tickets_transfer_failed'
                : 'tickets_transfer_unknown',
        ),
      );
    } catch (error) {
      setError(error);
      void cache.invalidateQueries({ queryKey: ['ticket-wallet', ticket.accountId] });
    } finally {
      setLoading(null);
      useBoardingBusy.setState({ busy: false });
    }
  };
  const transfer = (ticket: OwnedWalletTicket) => {
    if (busy) return;
    if (ticket.transferState && ticket.transferState !== 'completed') {
      void run(ticket, false);
      return;
    }
    const remaining =
      ticket.remainingTransfers == null
        ? ''
        : ` ${t('tickets_transfer_remaining', { count: ticket.remainingTransfers })}`;
    Alert.alert(
      t('tickets_transfer_title'),
      t('tickets_transfer_confirm', { name: ticket.name }) + remaining,
      [
        { text: t('tickets_cancel'), style: 'cancel' },
        { text: t('tickets_transfer'), onPress: () => void run(ticket, true) },
      ],
    );
  };
  return { transfer, loading, error, busy };
}
