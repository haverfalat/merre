import { ArrowDownToLine, Eye, MapPin, ScanLine } from 'lucide-react-native';
import { ActionRow } from '~/components/ui/ActionRow';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import type { OwnedWalletTicket } from '~/lib/tickets/types';
import { fonts, useTheme } from '~/lib/theme';

export function TicketCard({
  ticket,
  busy,
  loading,
  onInspect,
  onBoard,
  onTransfer,
  transferring,
}: {
  ticket: OwnedWalletTicket;
  busy?: boolean;
  loading?: boolean;
  onInspect?: () => void;
  onBoard?: () => void;
  onTransfer?: () => void;
  transferring?: boolean;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  const status =
    ticket.status === 'VALID'
      ? t('tickets_status_VALID')
      : ticket.status === 'FUTURE_VALID'
        ? t('tickets_status_FUTURE_VALID')
        : ticket.status === 'START_ON_VALIDATION'
          ? t('tickets_status_START_ON_VALIDATION')
          : ticket.status === 'EXPIRED'
            ? t('tickets_status_EXPIRED')
            : ticket.status === 'UNKNOWN'
              ? t('tickets_status_UNKNOWN')
              : ticket.status === 'SUSPENDED'
                ? t('tickets_status_SUSPENDED')
                : t('tickets_status_INVALID');
  const checkTransfer = !!ticket.transferState && ticket.transferState !== 'completed';
  const preview = ticket.providerId === 'mav' && ticket.status !== 'VALID';
  return (
    <Card surface="surface" style={{ padding: 10, gap: 6 }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 13 }}>{ticket.name}</Text>
      {!!ticket.services?.length && (
        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: c.secondary }}>
          {[...new Set(ticket.services.map((service) => service.number))].join(' · ')}
        </Text>
      )}
      <Text style={{ fontSize: 11, color: c.muted }}>
        {ticket.providerName} · {ticket.accountLabel}
      </Text>
      <Text style={{ fontSize: 11, color: ticket.status === 'VALID' ? c.success : c.muted }}>
        {status}
      </Text>
      {ticket.validFrom && (
        <Text style={{ fontSize: 11, color: c.secondary }}>
          {t('tickets_valid_from')}: {ticket.validFrom.replace('T', ' ')}
        </Text>
      )}
      {ticket.validTo && (
        <Text style={{ fontSize: 11, color: c.secondary }}>
          {t('tickets_valid_to')}: {ticket.validTo.replace('T', ' ')}
        </Text>
      )}
      {!ticket.bound && ticket.status === 'VALID' && (
        <Text style={{ fontSize: 12, color: c.warning }}>{t('tickets_other_device')}</Text>
      )}
      {onTransfer && !ticket.bound && (ticket.canTransfer || checkTransfer) && (
        <ActionRow>
          <Button
            icon={ArrowDownToLine}
            label={t(checkTransfer ? 'tickets_transfer_check' : 'tickets_transfer')}
            loading={transferring}
            disabled={busy}
            onPress={onTransfer}
          />
        </ActionRow>
      )}
      {((onInspect && ticket.canInspect) || (onBoard && ticket.canBoard)) && (
        <ActionRow>
          {ticket.canInspect && onInspect && (
            <Button
              icon={preview ? Eye : ScanLine}
              variant={preview ? 'surface' : 'primary'}
              label={t(preview ? 'tickets_view_image' : 'tickets_inspector')}
              loading={loading}
              disabled={busy}
              onPress={onInspect}
            />
          )}
          {ticket.canBoard && onBoard && (
            <Button icon={MapPin} label={t('tickets_nearby')} disabled={busy} onPress={onBoard} />
          )}
        </ActionRow>
      )}
    </Card>
  );
}
