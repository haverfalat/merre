import { router, useFocusEffect } from 'expo-router';
import { useCallback, type PropsWithChildren, type ReactNode } from 'react';
import {
  BackHandler,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
  type ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { RefreshSkeleton, SkeletonCards, SkeletonRows } from '~/components/ui/Skeleton';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { fonts, useTheme } from '~/lib/theme';
import { BudapestGoError } from 'budapestgo-api/mobile';
import { MavMobileError } from 'mav-mobile-api';
import { PartialAccountImportError, TicketWalletError } from '~/lib/tickets/errors';

export function WalletScreen({
  title,
  actions,
  children,
}: PropsWithChildren<{ title: string; actions?: ReactNode; expanded?: boolean }>) {
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const { t } = useTranslation();
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{
        flex: 1,
        backgroundColor: c.card,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View style={{ padding: 16, gap: 12, borderBottomWidth: 1, borderColor: c.border }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Button variant="ghost" icon={ArrowLeft} label={t('back')} onPress={close} />
          {actions}
        </View>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.semibold, fontSize: 30 }}>
          {title}
        </Text>
      </View>
      {children}
    </KeyboardAvoidingView>
  );
}
export function WalletContent({
  children,
  contentContainerStyle,
  style,
  refreshing = false,
  ...props
}: Omit<ScrollViewProps, 'refreshing'> & { refreshing?: boolean }) {
  return (
    <View style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        {...props}
        style={[{ flex: 1 }, style]}
        contentContainerStyle={[{ padding: 16, gap: 16, paddingBottom: 24 }, contentContainerStyle]}
      >
        {children}
      </ScrollView>
      <RefreshSkeleton active={refreshing} />
    </View>
  );
}
export { TextField as WalletInput } from '~/components/ui/TextField';
export function WalletLoading({ variant = 'rows' }: { variant?: 'rows' | 'tickets' }) {
  return variant === 'tickets' ? <SkeletonCards kind="ticket" /> : <SkeletonRows count={3} variant="search" />;
}
export function WalletError({
  error,
  retry,
  accountLabel,
}: {
  error: unknown;
  retry?: () => void;
  accountLabel?: string;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  const code =
    error instanceof BudapestGoError ||
    error instanceof TicketWalletError ||
    error instanceof MavMobileError
      ? error.code
      : '';
  const message =
    error instanceof PartialAccountImportError
      ? t('tickets_partial_import', { count: error.imported })
      : code === 'validation-uncertain'
        ? t('tickets_validation_uncertain')
      : code === 'auth' || code === 'expired-session'
        ? t('tickets_error_auth')
        : code === 'identity'
          ? t('tickets_error_identity')
          : code === 'import'
            ? t('tickets_error_import')
            : code === 'unbound'
              ? t('tickets_error_unbound')
              : code === 'vehicle-unavailable'
                ? t('tickets_error_vehicle_unavailable')
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
      {accountLabel && <Text style={{ fontFamily: fonts.semibold }}>{accountLabel}</Text>}
      <Text style={{ fontSize: 14 }}>{message}</Text>
      {retry && <Button label={t('tickets_retry')} onPress={retry} />}
    </View>
  );
}
