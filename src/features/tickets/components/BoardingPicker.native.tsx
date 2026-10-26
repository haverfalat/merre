import { ScrollView, View } from 'react-native';
import { Choice } from '~/components/ui/Choice';
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
  return (
    <ModalFrame
      visible={!!controller.picker || !!controller.error}
      onClose={() => {
        controller.closePicker();
        controller.clearError();
      }}
    >
      <ModalHeader title={t('tickets_choose_ticket')} onClose={controller.closePicker} />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
        {controller.loading && <WalletLoading />}
        {controller.error ? <WalletError error={controller.error} /> : null}
        {controller.picker?.tickets.map((ticket) => (
          <Choice
            key={`${ticket.accountId}:${ticket.id}`}
            kind="radio"
            checked={false}
            label={ticket.name}
            disabled={controller.busy}
            onPress={() => void controller.choose(ticket)}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontSize: 13, fontFamily: fonts.semibold }}>{ticket.name}</Text>
              <Text style={{ fontSize: 11, color: c.muted }}>
                {ticket.providerName} · {ticket.accountLabel}
              </Text>
            </View>
          </Choice>
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
