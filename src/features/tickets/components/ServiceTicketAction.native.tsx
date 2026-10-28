import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ticket } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button } from '~/components/ui/Button';
import { ModalFrame } from '~/components/ui/ModalFrame';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { ModalFooter } from '~/components/ui/ModalFooter';
import { useNow } from '~/hooks/useNow';
import { useTranslation } from '~/hooks/useTranslation';
import { backendFor } from '~/lib/tickets/accounts.native';
import { TicketWalletError } from '~/lib/tickets/errors';
import { openTicketPresentation } from '~/lib/tickets/presentation.native';
import { providerById } from '~/lib/tickets/providers.native';
import { readSecure, writeSecure } from '~/lib/tickets/secure-storage.native';
import type { OwnedWalletTicket, TicketReference, TicketService } from '~/lib/tickets/types';
import { useWallet } from '../hooks/useWallet.native';
import { useTicketOperation } from '../hooks/useTicketOperation.native';
import { WalletError } from './WalletScreen';
import { TicketChoiceRow } from './TicketChoiceRow';

export function ServiceTicketAction({ service }: { service: TicketService }) {
  const wallet = useWallet();
  const now = useNow();
  const { t } = useTranslation();
  const cache = useQueryClient();
  const { busy, loading, error, setError, acquire, release } = useTicketOperation();
  const [picker, setPicker] = useState(false);
  const suppressed = useRef(false);
  const context = { ...service, at: service.at ?? now };
  const tickets = wallet.tickets.filter(
    (ticket) =>
      ticket.canInspect && providerById(ticket.providerId).matchesService?.(ticket, context),
  );
  const close = () => {
    if (!busy) {
      setPicker(false);
      setError(null);
    }
  };
  const inspect = async (ticket: OwnedWalletTicket) => {
    if (!providerById(ticket.providerId).matchesService?.(ticket, { ...context, at: Date.now() }))
      throw new TicketWalletError('unavailable');
    const presentation = await backendFor(ticket.accountId).inspector?.(ticket.id, wallet.language);
    if (!presentation) throw new TicketWalletError('unavailable');
    await writeSecure('service-ticket-choice', {
      accountId: ticket.accountId,
      ticketId: ticket.id,
    }).catch(() => {});
    const id = openTicketPresentation(presentation);
    setPicker(false);
    router.push({ pathname: '/tickets/present', params: { id } });
    void cache.invalidateQueries({ queryKey: ['ticket-wallet', ticket.accountId] });
  };
  const run = async (force: boolean, chosen?: OwnedWalletTicket) => {
    if (!acquire('service')) return;
    try {
      if (chosen) {
        await inspect(chosen);
        return;
      }
      if (!tickets.length) throw new TicketWalletError('unavailable');
      const previous = force ? null : await readSecure<TicketReference>('service-ticket-choice').catch(() => null);
      const selected =
        !force && tickets.length === 1
          ? tickets[0]
          : !force
            ? tickets.find(
                (ticket) =>
                  ticket.id === previous?.ticketId && ticket.accountId === previous.accountId,
              )
            : undefined;
      if (selected) await inspect(selected);
      else setPicker(true);
    } catch (error) {
      setError(error);
    } finally {
      release();
    }
  };
  if (!tickets.length && !error && !picker) return null;
  return (
    <>
      <Button
        icon={Ticket}
        label={t('tickets_present')}
        accessibilityHint={t('tickets_long_press_switch')}
        disabled={busy}
        loading={loading !== null}
        onPressIn={() => {
          suppressed.current = false;
        }}
        onLongPress={() => {
          suppressed.current = true;
          void run(true);
        }}
        onPress={() => {
          if (!suppressed.current) void run(false);
        }}
      />
      <ModalFrame visible={picker || !!error} onClose={close} style={{ maxHeight: '75%' }}>
        <ModalHeader title={t('tickets_choose_ticket')} onClose={close} />
        <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
          {error ? <WalletError error={error} /> : null}
          {tickets.map((ticket) => (
            <TicketChoiceRow
              key={`${ticket.accountId}:${ticket.id}`}
              ticket={ticket}
              disabled={busy}
              onPress={() => void run(false, ticket)}
            />
          ))}
        </ScrollView>
        <ModalFooter onClose={close} />
      </ModalFrame>
    </>
  );
}
