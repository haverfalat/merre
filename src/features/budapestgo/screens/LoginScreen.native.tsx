import { useQueryClient } from '@tanstack/react-query';
import {
  BudapestGoClient,
  ISSUER,
  BudapestGoError,
  type PendingLogin,
  type WalletProfile,
} from 'budapestgo-api/mobile';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';

import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import {
  WalletContent,
  WalletError,
  WalletInput,
  WalletLoading,
  WalletScreen,
} from '~/features/tickets/components/WalletScreen';
import { useTranslation } from '~/hooks/useTranslation';
import { cryptoAdapter, newInstallationId } from '~/lib/budapestgo/auth/crypto';
import { readSecure, writeSecure } from '~/lib/tickets/secure-storage.native';
import { parseBudapestGoProfile } from '~/lib/budapestgo/profile';
import { accountRecord, addAccounts } from '~/lib/tickets/accounts.native';

interface Draft {
  accountId?: string;
  profile: WalletProfile;
  pending: PendingLogin;
  url: string;
}
export default function LoginScreen() {
  const { t } = useTranslation();
  const { account: accountId } = useLocalSearchParams<{ account?: string }>();
  const cache = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const current = useRef<Draft | null>(null);
  const [callback, setCallback] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const locked = useRef(false);
  useEffect(() => {
    let alive = true;
    void readSecure<Draft>('login-draft')
      .then((saved) => {
        if (
          alive &&
          saved &&
          saved.accountId === accountId &&
          saved.pending.createdAt > Date.now() - 900_000 &&
          saved.url.startsWith(`${ISSUER}/protocol/openid-connect/auth?`)
        ) {
          current.current = saved;
          setDraft(saved);
        }
      })
      .catch(() => {
        if (alive) setError(new Error());
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [accountId]);
  const start = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    setCallback('');
    try {
      const previous = accountId ? accountRecord(accountId) : null;
      if (previous && previous.providerId !== 'budapestgo') throw new BudapestGoError('identity');
      const profile: WalletProfile = previous
        ? { ...parseBudapestGoProfile(previous.payload), session: null }
        : {
            version: 1,
            installation: {
              applicationId: newInstallationId(),
              createdAt: new Date().toISOString(),
            },
            session: null,
          };
      const client = new BudapestGoClient(
        profile.installation.applicationId,
        null,
        async () => {},
        cryptoAdapter,
      );
      const login = await client.beginLogin();
      const next = { profile, ...login, ...(accountId ? { accountId } : {}) };
      await writeSecure('login-draft', next);
      current.current = next;
      setDraft(next);
      await WebBrowser.openBrowserAsync(next.url);
    } catch (error) {
      setError(error);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const finish = async (url: string) => {
    const stored = current.current;
    if (!stored || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      let latest = stored;
      const client = new BudapestGoClient(
        stored.profile.installation.applicationId,
        stored.profile.session,
        async (session) => {
          latest = { ...latest, profile: { ...latest.profile, session } };
          await writeSecure('login-draft', latest);
          current.current = latest;
        },
        cryptoAdapter,
      );
      if (!stored.profile.session) await client.completeLogin(url, stored.pending);
      const account = await client.userinfo();
      const previous = stored.accountId ? accountRecord(stored.accountId) : null;
      if (previous && parseBudapestGoProfile(previous.payload).owner?.sub !== account.sub)
        throw new BudapestGoError('auth');
      await addAccounts([
        {
          providerId: 'budapestgo',
          label: previous?.label ?? account.email ?? account.name ?? 'BudapestGO',
          payload: { ...latest.profile, owner: account },
        },
      ]);
      await writeSecure('login-draft', null);
      current.current = null;
      setDraft(null);
      setCallback('');
      cache.removeQueries({ queryKey: ['ticket-wallet'] });
      router.dismissTo('/tickets');
    } catch (error) {
      setError(error);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return (
    <WalletScreen title={t('tickets_login')}>
      <WalletContent>
        <Text style={{ fontSize: 12 }}>{t('tickets_login_browser_note')}</Text>
        {loading && <WalletLoading />}
        {error ? <WalletError error={error} /> : null}
        {!draft && !loading && (
          <Button
            label={t('tickets_login')}
            variant="primary"
            onPress={() => void start()}
            loading={busy}
            disabled={busy}
          />
        )}
        {draft && (
          <>
            <Button
              label={t('tickets_browser')}
              disabled={busy}
              onPress={() =>
                void WebBrowser.openBrowserAsync(draft.url).catch(() => setError(new Error()))
              }
            />
            <Text style={{ fontSize: 12 }}>{t('tickets_manual_note')}</Text>
            <WalletInput
              value={callback}
              onChangeText={setCallback}
              placeholder={t('tickets_callback')}
              accessibilityLabel={t('tickets_callback')}
              editable={!busy}
              multiline
              style={{ minHeight: 90 }}
            />
            <Button
              label={t('tickets_finish_login')}
              variant="primary"
              loading={busy}
              disabled={busy || !callback.trim()}
              onPress={() => void finish(callback.trim())}
            />
            <Button
              label={t('tickets_restart_login')}
              disabled={busy}
              onPress={() => void start()}
            />
          </>
        )}
      </WalletContent>
    </WalletScreen>
  );
}
