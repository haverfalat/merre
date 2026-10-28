import { ScrollView, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
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
        {controller.picker?.tickets.map((ticket) => (
          <ListRow
            key={`${ticket.accountId}:${ticket.id}`}
            accessibilityLabel={`${ticket.name}, ${ticket.providerName}, ${ticket.accountLabel}`}
            disabled={controller.busy}
            onPress={() => void controller.choose(ticket)}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontSize: 15, fontFamily: fonts.semibold }}>{ticket.name}</Text>
              <Text style={{ fontSize: 13, color: c.muted }}>
                {ticket.providerName} · {ticket.accountLabel}
              </Text>
            </View>
            <ChevronRight size={18} color={c.muted} />
          </ListRow>
        ))}
      </ScrollView>
      <ModalFooter
        onClose={() => {
          controller.closePicker();
          controller.clearError();
        }}
      />
    </ModalFrame>
  );
}
