import { Fragment, type ReactNode } from 'react';
import { Section } from '~/components/ui/Section';
import { useTranslation } from '~/hooks/useTranslation';
import type { OwnedWalletTicket } from '~/lib/tickets/types';

export function TicketGroups({
  tickets,
  children,
}: {
  tickets: OwnedWalletTicket[];
  children: (ticket: OwnedWalletTicket) => ReactNode;
}) {
  const { t } = useTranslation();
  const classified = tickets.some((ticket) => ticket.kind != null);
  const legacy = tickets.filter((ticket) => ticket.kind == null);
  const groups = [
    {
      id: 'ticket',
      title: t('wallet_tickets'),
      items: tickets.filter((ticket) => ticket.kind === 'ticket'),
    },
    {
      id: 'pass',
      title: t('wallet_passes'),
      items: tickets.filter((ticket) => ticket.kind === 'pass'),
    },
    {
      id: 'unknown',
      title: t('wallet_other_products'),
      items: tickets.filter((ticket) => ticket.kind === 'unknown'),
    },
    {
      id: 'legacy',
      title: classified
        ? [...new Set(legacy.map((ticket) => ticket.providerName))].join(' · ')
        : '',
      items: legacy,
    },
  ];
  return groups
    .filter((group) => group.items.length > 0)
    .map((group) => (
      <Fragment key={group.id}>
        {!!group.title && <Section title={group.title} style={{ paddingHorizontal: 0, paddingTop: 8, paddingBottom: 0 }} />}
        {group.items.map((ticket) => (
          <Fragment key={`${ticket.accountId}:${ticket.id}`}>{children(ticket)}</Fragment>
        ))}
      </Fragment>
    ));
}
