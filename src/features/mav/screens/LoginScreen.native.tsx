import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  MAV_WEB_ORIGIN,
  MavMobileClient,
  MavMobileError,
  parseAccountProfile,
} from 'mav-mobile-api';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Button } from '~/components/ui/Button';
import {
  WalletContent,
  WalletError,
  WalletLoading,
  WalletLoadingOverlay,
  WalletScreen,
} from '~/features/tickets/components/WalletScreen';
import { useTranslation } from '~/hooks/useTranslation';
import { accountRecord, addAccounts, initializeAccounts } from '~/lib/tickets/accounts.native';
import { LoginBrowser, type LoginBrowserHandle } from '../components/LoginBrowser.native';

export default function LoginScreen() {
  const { account: accountId } = useLocalSearchParams<{ account?: string }>();
  const { t } = useTranslation();
  const cache = useQueryClient();
  const browser = useRef<LoginBrowserHandle>(null);
  const active = useRef<AbortController | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    let alive = true;
    void initializeAccounts()
      .then(() => {
        if (alive) setReady(true);
      })
      .catch((error) => {
        if (alive) setError(error);
      });
    return () => {
      alive = false;
      active.current?.abort();
    };
  }, []);
  const finish = async (message: string, url: string) => {
    if (!ready || active.current || message.length > 750_000) return;
    try {
      if (new URL(url).origin !== MAV_WEB_ORIGIN) return;
    } catch {
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError(null);
    try {
      const previous = accountId ? accountRecord(accountId) : null;
      if (previous && previous.providerId !== 'mav')
        throw new MavMobileError('input', 'Invalid account');
      const oldProfile = previous ? parseAccountProfile(previous.payload) : null;
      const client = new MavMobileClient({ uaid: oldProfile?.uaid });
      const profile = await client.auth.importWebSession(message, { signal: controller.signal });
      if (oldProfile && oldProfile.email.toLowerCase() !== profile.email.toLowerCase())
        throw new MavMobileError('auth', 'Use the same MAV account when signing in again');
      if (controller.signal.aborted) return;
      await addAccounts([
        { providerId: 'mav', label: previous?.label ?? profile.email, payload: profile },
      ]);
      if (controller.signal.aborted) return;
      cache.removeQueries({ queryKey: ['ticket-wallet'] });
      router.dismissTo('/tickets');
    } catch (error) {
      if (!controller.signal.aborted) setError(error);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      if (active.current === controller) active.current = null;
    }
  };
  return (
    <WalletScreen title={t('mav_login')}>
      {error ? (
        <WalletContent>
          <WalletError error={error} />
          <Button
            label={t('retry')}
            onPress={() => {
              setError(null);
              if (ready) browser.current?.reload();
              else void initializeAccounts().then(() => setReady(true)).catch(setError);
            }}
          />
        </WalletContent>
      ) : null}
      {ready && (
        <View style={{ flex: 1, minHeight: 250 }}>
          <LoginBrowser
            ref={browser}
            onSession={(message, url) => void finish(message, url)}
            onError={setError}
          />
          {busy && <WalletLoadingOverlay />}
        </View>
      )}
      {!ready && !error && <WalletLoading />}
    </WalletScreen>
  );
}
