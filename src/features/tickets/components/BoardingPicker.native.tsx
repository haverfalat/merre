import { ScrollView, View } from 'react-native';
import { CheckSquare, ChevronRight, Square } from 'lucide-react-native';
import { Button } from '~/components/ui/Button';
import { needsTicketActivation } from '~/lib/tickets/eligibility';
import { ListRow } from '~/components/ui/ListRow';
import { ModalFrame } from '~/components/ui/ModalFrame';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { ModalFooter } from '~/components/ui/ModalFooter';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { fonts, useTheme } from '~/lib/theme';
import type { useBoardingController } from '../hooks/useBoardingController.native';
import { WalletError, WalletLoading } from './WalletScreen';

export function BoardingPicker({
  controller,
}: {
  controller: ReturnType<typeof useBoardingController>;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  const multiple = !!(controller.picker?.request.scannedCode || controller.picker?.request.target);
  const selected = controller.picker?.selected ?? [];
  const activating = selected.filter(needsTicketActivation).length;
  const close = () => {
    controller.closePicker();
    controller.clearError();
  };
  return (
    <ModalFrame
      visible={!!controller.picker || !!controller.error}
      onClose={() => {
        controller.closePicker();
        controller.clearError();
      }}
    >
      <ModalHeader title={t(controller.picker ? 'tickets_choose_ticket' : 'tickets_present')} onClose={close} />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
        {controller.loading && <WalletLoading />}
        {controller.error ? <WalletError error={controller.error} /> : null}
        {multiple && <Text style={{ padding: 8, fontSize: 14, color: c.secondary }}>
          {t('tickets_select_multiple')}
        </Text>}
        {controller.picker?.tickets.map((ticket) => {
          const checked = selected.some(item => item.id === ticket.id && item.accountId === ticket.accountId);
          return (
          <ListRow
            key={`${ticket.accountId}:${ticket.id}`}
            accessibilityLabel={`${ticket.name}, ${ticket.providerName}, ${ticket.accountLabel}`}
            disabled={controller.busy}
            accessibilityRole={multiple ? 'checkbox' : 'button'}
            accessibilityState={multiple ? { checked, disabled: controller.busy } : { disabled: controller.busy }}
            onPress={() => multiple ? controller.toggle(ticket) : void controller.choose(ticket)}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontSize: 15, fontFamily: fonts.semibold }}>{ticket.name}</Text>
              {ticket.groupId && ticket.groupItem != null && <Text style={{ fontSize: 12, color: c.muted }}>
                {t('tickets_group_item', { item: ticket.groupItem })}
              </Text>}
              <Text style={{ fontSize: 13, color: c.muted }}>
                {ticket.providerName} · {ticket.accountLabel}
              </Text>
              {needsTicketActivation(ticket) && <Text style={{ fontSize: 12, color: c.warning }}>
                {t('tickets_status_START_ON_VALIDATION')}
              </Text>}
            </View>
            {multiple ? checked ? <CheckSquare size={20} color={c.accent} /> : <Square size={20} color={c.muted} />
              : <ChevronRight size={18} color={c.muted} />}
          </ListRow>
        ); })}
      </ScrollView>
      {multiple ? <View style={{ padding: 16, gap: 10, borderTopWidth: 1, borderColor: c.border }}>
        {activating > 0 && <Text style={{ fontSize: 14, color: c.warning }}>
          {t('tickets_activation_warning', { count: activating })}
        </Text>}
        <Button
          label={t(activating ? 'tickets_activate_selected' : 'tickets_present_selected', { count: selected.length })}
          variant="primary"
          disabled={!selected.length || controller.busy}
          loading={controller.loading}
          onPress={() => void controller.confirm()}
        />
        <Button label={t('tickets_cancel')} disabled={controller.busy} onPress={close} />
      </View> : <ModalFooter
        onClose={() => {
          controller.closePicker();
          controller.clearError();
        }}
      />}
    </ModalFrame>
  );
}
