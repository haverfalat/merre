import { CheckSquare, ChevronRight, Square } from 'lucide-react-native';
import { View } from 'react-native';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { fonts, useTheme } from '~/lib/theme';
import { needsTicketActivation } from '~/lib/tickets/eligibility';
import type { OwnedWalletTicket } from '~/lib/tickets/types';

export function TicketChoiceRow({ ticket, checked, disabled, onPress }: {
  ticket: OwnedWalletTicket;
  checked?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  const { t } = useTranslation();
  const multiple = checked !== undefined;
  return (
    <ListRow
      accessibilityLabel={`${ticket.name}, ${ticket.providerName}, ${ticket.accountLabel}`}
      accessibilityRole={multiple ? 'checkbox' : 'button'}
      accessibilityState={{ disabled, ...(multiple ? { checked } : {}) }}
      disabled={disabled}
      onPress={onPress}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 15, fontFamily: fonts.semibold }}>{ticket.name}</Text>
        {ticket.groupId && ticket.groupItem != null && (
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
            {t('tickets_group_item', { item: ticket.groupItem })}
          </Text>
        )}
        <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
          {ticket.providerName} · {ticket.accountLabel}
        </Text>
        {needsTicketActivation(ticket) && (
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.warning }}>{t('tickets_status_START_ON_VALIDATION')}</Text>
        )}
      </View>
      {multiple ? checked ? <CheckSquare size={20} color={c.accent} /> : <Square size={20} color={c.muted} />
        : <ChevronRight size={18} color={c.muted} />}
    </ListRow>
  );
}
