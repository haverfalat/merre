import { router, useFocusEffect } from 'expo-router';
import { useCallback, type PropsWithChildren, type ReactNode } from 'react';
import {
  BackHandler,
  ScrollView,
  View,
  useWindowDimensions,
  type ScrollViewProps,
} from 'react-native';
import { ModalPanel } from '~/components/ui/ModalFrame';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { ModalFooter } from '~/components/ui/ModalFooter';
import { SkeletonRows } from '~/components/ui/Skeleton';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { useTheme } from '~/lib/theme';
import { BudapestGoError } from 'budapestgo-api/mobile';
import { PartialAccountImportError, TicketWalletError } from '~/lib/tickets/errors';

export function WalletScreen({
  title,
  actions,
  children,
  expanded,
}: PropsWithChildren<{ title: string; actions?: ReactNode; expanded?: boolean }>) {
  const { height } = useWindowDimensions();
  const close = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/')), []);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        close();
        return true;
      });
      return () => subscription.remove();
    }, [close]),
  );
  return (
    <ModalPanel
      onClose={close}
      style={expanded ? { height: Math.min(height * 0.8, 680) } : undefined}
    >
      <ModalHeader title={title} onClose={close} actions={actions} />
      {children}
      <ModalFooter onClose={close} />
    </ModalPanel>
  );
}
export function WalletContent({ children, contentContainerStyle, ...props }: ScrollViewProps) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      {...props}
      contentContainerStyle={[{ padding: 12, gap: 8, paddingBottom: 12 }, contentContainerStyle]}
    >
      {children}
    </ScrollView>
  );
}
export { TextField as WalletInput } from '~/components/ui/TextField';
export function WalletLoading() {
  return <SkeletonRows count={3} />;
}
export function WalletError({ error, retry }: { error: unknown; retry?: () => void }) {
  const { t } = useTranslation();
  const c = useTheme();
  const code =
    error instanceof BudapestGoError || error instanceof TicketWalletError ? error.code : '';
  const message =
    error instanceof PartialAccountImportError
      ? t('tickets_partial_import', { count: error.imported })
      : code === 'auth' || code === 'expired-session'
        ? t('tickets_error_auth')
        : code === 'identity'
          ? t('tickets_error_identity')
          : code === 'import'
            ? t('tickets_error_import')
            : code === 'unbound'
              ? t('tickets_error_unbound')
              : code === 'unavailable'
                ? t('tickets_error_unavailable')
                : code === 'busy'
                  ? t('tickets_error_busy')
                  : t('tickets_error');
  return (
    <View
      accessibilityRole="alert"
      style={{ padding: 10, borderRadius: 9, backgroundColor: c.dangerMuted, gap: 8 }}
    >
      <Text style={{ fontSize: 12 }}>{message}</Text>
      {retry && <Button label={t('tickets_retry')} onPress={retry} />}
    </View>
  );
}
