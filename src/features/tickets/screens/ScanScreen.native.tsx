import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import {
  WalletContent,
  WalletError,
  WalletLoading,
  WalletScreen,
} from '../components/WalletScreen';
import { BoardingPicker } from '../components/BoardingPicker.native';
import { useBoardingController } from '../hooks/useBoardingController.native';
import { useWallet } from '../hooks/useWallet.native';

export default function ScanScreen() {
  const { t } = useTranslation();
  const wallet = useWallet();
  const controller = useBoardingController();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [code, setCode] = useState<{ format: 'aztec' | 'qr'; value: string } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const captured = useRef(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) =>
      setForeground(state === 'active'),
    );
    return () => subscription.remove();
  }, []);
  const eligible = wallet.tickets.some((ticket) => ticket.status === 'VALID' && ticket.canBoard);
  const scan = (result: BarcodeScanningResult) => {
    if (
      captured.current ||
      (result.type !== 'aztec' && result.type !== 'qr') ||
      !result.data.trim() ||
      result.data.length > 4096
    )
      return;
    captured.current = true;
    setCode({ format: result.type, value: result.data });
  };
  return (
    <>
      <WalletScreen title={t('tickets_scan')}>
        <WalletContent>
          {(!wallet.ready || (wallet.isPending && !eligible)) && <WalletLoading />}
          {wallet.ready && !wallet.accounts.length && (
            <Button
              label={t('tickets_add_account')}
              onPress={() => router.push('/tickets/accounts')}
            />
          )}
          {wallet.ready && !wallet.isPending && wallet.accounts.length > 0 && !eligible && (
            <Text style={{ fontSize: 12 }}>{t('tickets_no_usable')}</Text>
          )}
          {eligible && !permission?.granted && (
            <Button
              label={t('tickets_camera_permission')}
              onPress={() => void requestPermission().catch(setError)}
            />
          )}
          {eligible && permission?.granted && focused && foreground && !code && (
            <CameraView
              facing="back"
              mode="picture"
              mute
              barcodeScannerSettings={{ barcodeTypes: ['aztec', 'qr'] }}
              onBarcodeScanned={scan}
              onMountError={() => setError(new Error())}
              style={{ height: 320, borderRadius: 12, overflow: 'hidden' }}
            />
          )}
          {code && (
            <>
              <Text style={{ fontSize: 12 }}>{t('tickets_scan_found')}</Text>
              <Button
                label={t('tickets_confirm_boarding')}
                variant="primary"
                loading={controller.loading}
                disabled={controller.busy}
                accessibilityHint={t('tickets_long_press_switch')}
                {...controller.pressHandlers({ scannedCode: code })}
              />
              <Button
                label={t('tickets_scan_again')}
                disabled={controller.busy}
                onPress={() => {
                  setCode(null);
                  captured.current = false;
                  setError(null);
                }}
              />
            </>
          )}
          {error ? <WalletError error={error} /> : null}
        </WalletContent>
      </WalletScreen>
      <BoardingPicker controller={controller} />
    </>
  );
}
