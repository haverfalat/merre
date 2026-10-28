import { ScrollView, View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { needsTicketActivation } from '~/lib/tickets/eligibility';
import { ModalFrame } from '~/components/ui/ModalFrame';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { ModalFooter } from '~/components/ui/ModalFooter';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { useTheme } from '~/lib/theme';
import type { useBoardingController } from '../hooks/useBoardingController.native';
import { WalletError, WalletLoading } from './WalletScreen';
import { TicketChoiceRow } from './TicketChoiceRow';

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
  const close = controller.closePicker;
  return (
    <ModalFrame
      visible={!!controller.picker || !!controller.error}
      onClose={close}
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
          <TicketChoiceRow
            key={`${ticket.accountId}:${ticket.id}`}
            ticket={ticket}
            disabled={controller.busy}
            checked={multiple ? checked : undefined}
            onPress={() => multiple ? controller.toggle(ticket) : void controller.choose(ticket)}
          />
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
        onClose={close}
      />}
    </ModalFrame>
  );
}
