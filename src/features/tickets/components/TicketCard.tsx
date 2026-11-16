import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  ScanLine,
  TriangleAlert,
} from 'lucide-react-native';
import { View } from 'react-native';
import { ActionRow } from '~/components/ui/ActionRow';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import type { OwnedWalletTicket } from '~/lib/tickets/types';
import { formatTicketDate } from '~/lib/tickets/display';
import { needsTicketActivation } from '~/lib/tickets/eligibility';
import { fonts, radii, useTheme } from '~/lib/theme';

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
  const { t, language } = useTranslation();
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
  const checkTransfer = ticket.transferState === 'pending' || ticket.transferState === 'unknown';
  const preview = ticket.providerId === 'mav' && ticket.status !== 'VALID';
  return (
    <Card style={{ padding: 16, gap: 10, borderRadius: radii.card, borderWidth: 1, borderColor: c.border }}>
      <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: c.secondary }}>
          {ticket.providerName}
        </Text>
        {ticket.accountLabel.trim().toLocaleLowerCase() !== ticket.providerName.trim().toLocaleLowerCase()
          ? ` · ${ticket.accountLabel}` : ''}
      </Text>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26 }}>{ticket.name}</Text>
      {ticket.groupId && ticket.groupItem != null && <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
        {t('tickets_group_item', { item: ticket.groupItem })}
      </Text>}
      {!!ticket.services?.length && (
        <Text style={{ fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, fontVariant: ['tabular-nums'], color: c.secondary }}>
          {[...new Set(ticket.services.map((service) => service.number))].join(' · ')}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {ticket.status === 'VALID' ? (
          <CheckCircle2 size={16} color={c.success} />
        ) : ticket.status === 'FUTURE_VALID' ? (
          <Clock size={16} color={c.secondary} />
        ) : (
          <TriangleAlert size={16} color={c.warning} />
        )}
        <Text style={{ fontSize: 14, color: ticket.status === 'VALID' ? c.success : c.secondary }}>
          {status}
        </Text>
      </View>
      {ticket.providerId === 'mav' && ['VALID', 'FUTURE_VALID'].includes(ticket.status) && <Text style={{ fontSize: 14, lineHeight: 20, color: ticket.offlineAvailable ? c.success : c.secondary }}>
        {t(ticket.offlineAvailable ? 'tickets_offline_saved' : 'tickets_offline_missing')}
      </Text>}
      {(ticket.validFrom || ticket.validTo) && (
        <View style={{ gap: 4, paddingTop: 10, borderTopWidth: 1, borderColor: c.border }}>
          {([
            ['tickets_valid_from', ticket.validFrom],
            ['tickets_valid_to', ticket.validTo],
          ] as const).map(([label, value]) => value && (
            <View key={label} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 12, rowGap: 0 }}>
              <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>{t(label)}</Text>
              <Text style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.medium, fontVariant: ['tabular-nums'] }}>
                {formatTicketDate(value, language)}
              </Text>
            </View>
          ))}
        </View>
      )}
      {!ticket.bound && ['VALID', 'START_ON_VALIDATION', 'FUTURE_VALID'].includes(ticket.status) && (
        <Text style={{ fontSize: 14, color: c.warning }}>{t('tickets_other_device')}</Text>
      )}
      {!ticket.bound && ticket.transferState === 'failed' && <Text style={{ fontSize: 14, lineHeight: 20, color: c.warning }}>
        {t('tickets_transfer_failed')}
      </Text>}
      {onTransfer && !ticket.bound && (ticket.canTransfer || checkTransfer) && (
        <ActionRow>
          <Button
            icon={ArrowDownToLine}
            label={t(checkTransfer ? 'tickets_transfer_check' : ticket.transferState === 'failed' || ticket.transferState === 'retryable' ? 'tickets_transfer_retry' : 'tickets_transfer')}
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
            <Button
              variant="ghost"
              icon={needsTicketActivation(ticket) ? ScanLine : MapPin}
              label={t(needsTicketActivation(ticket) ? 'tickets_validate' : 'tickets_nearby')}
              disabled={busy}
              onPress={onBoard}
            />
          )}
        </ActionRow>
      )}
    </Card>
  );
}
