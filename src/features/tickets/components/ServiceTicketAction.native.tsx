import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronRight, Ticket } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { fonts, useTheme } from '~/lib/theme';
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
import { useBoardingBusy } from '~/lib/tickets/selection.native';
import type { OwnedWalletTicket, TicketReference, TicketService } from '~/lib/tickets/types';
import { useWallet } from '../hooks/useWallet.native';
import { WalletError } from './WalletScreen';

export function ServiceTicketAction({ service }: { service: TicketService }) {
  const wallet = useWallet();
  const c = useTheme();
  const now = useNow();
  const { t } = useTranslation();
  const cache = useQueryClient();
  const busy = useBoardingBusy((state) => state.busy);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState<unknown>(null);
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
    });
    const id = openTicketPresentation(presentation);
    setPicker(false);
    router.push({ pathname: '/tickets/present', params: { id } });
    void cache.invalidateQueries({ queryKey: ['ticket-wallet', ticket.accountId] });
  };
  const run = async (force: boolean, chosen?: OwnedWalletTicket) => {
    if (useBoardingBusy.getState().busy) return;
    useBoardingBusy.setState({ busy: true });
    setLoading(true);
    setError(null);
    try {
      if (chosen) {
        await inspect(chosen);
        return;
      }
      if (!tickets.length) throw new TicketWalletError('unavailable');
      const previous = force ? null : await readSecure<TicketReference>('service-ticket-choice');
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
      useBoardingBusy.setState({ busy: false });
      setLoading(false);
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
        loading={loading}
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
            <ListRow
              key={`${ticket.accountId}:${ticket.id}`}
              accessibilityLabel={`${ticket.name} · ${ticket.providerName} · ${ticket.accountLabel}`}
              disabled={busy}
              onPress={() => void run(false, ticket)}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: fonts.semibold }}>{ticket.name}</Text>
                <Text style={{ fontSize: 13, color: c.muted }}>
                  {ticket.providerName} · {ticket.accountLabel}
                </Text>
              </View>
              <ChevronRight size={18} color={c.muted} />
            </ListRow>
          ))}
        </ScrollView>
        <ModalFooter onClose={close} />
      </ModalFrame>
    </>
  );
}
