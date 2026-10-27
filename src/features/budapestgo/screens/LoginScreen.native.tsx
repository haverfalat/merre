import { useQueryClient } from '@tanstack/react-query';
import {
  BudapestGoClient,
  parseWalletProfile,
  ISSUER,
  REDIRECT_URI,
  BudapestGoError,
  type PendingLogin,
  type WalletProfile,
} from 'budapestgo-api/mobile';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button } from '~/components/ui/Button';
import {
  WalletContent,
  WalletError,
  WalletLoading,
  WalletScreen,
} from '~/features/tickets/components/WalletScreen';
import { useTranslation } from '~/hooks/useTranslation';
import { ticketCrypto } from '~/lib/tickets/platform.native';
import { newAccountId } from '~/lib/tickets/identity.native';
import { readSecure, writeSecure } from '~/lib/tickets/secure-storage.native';
import { accountRecord, addAccounts, initializeAccounts } from '~/lib/tickets/accounts.native';

interface Draft {
  accountId?: string;
  profile: WalletProfile;
  pending: PendingLogin;
  url: string;
  phase?: 'account' | 'mobile';
}

function accountLoginUrl(pending: PendingLogin): string {
  const url = new URL(`${ISSUER}/protocol/openid-connect/auth`);
  url.search = new URLSearchParams({
    client_id: 'account',
    redirect_uri: `${ISSUER}/account/login-redirect`,
    state: `0/${pending.state}`,
    response_type: 'code',
    scope: 'openid',
    ui_locales: 'hu',
  }).toString();
  return url.href;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const { account: accountId } = useLocalSearchParams<{ account?: string }>();
  const cache = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const current = useRef<Draft | null>(null);
  const locked = useRef(false);
  const moving = useRef(false);
  const alive = useRef(true);
  const generation = useRef(Symbol());
  const finish = useCallback(
    async (callback?: string) => {
      const stored = current.current;
      const run = generation.current;
      if (!stored || locked.current || !alive.current) return;
      locked.current = true;
      setBusy(true);
      setError(null);
      try {
        let latest = stored;
        const client = new BudapestGoClient(
          stored.profile.installation.applicationId,
          stored.profile.session,
          async (session) => {
            if (!alive.current || run !== generation.current) throw new BudapestGoError('auth');
            latest = { ...latest, profile: { ...latest.profile, session } };
            await writeSecure('login-draft', latest);
            current.current = latest;
          },
          ticketCrypto,
        );
        if (!stored.profile.session) {
          if (!callback) throw new BudapestGoError('auth');
          await client.completeLogin(callback, stored.pending);
        }
        const owner = await client.userinfo();
        if (!alive.current || run !== generation.current) return;
        const previous = stored.accountId ? accountRecord(stored.accountId) : null;
        if (previous && parseWalletProfile(previous.payload).owner?.sub !== owner.sub)
          throw new BudapestGoError('auth');
        await addAccounts([
          {
            providerId: 'budapestgo',
            label: previous?.label ?? owner.email ?? owner.name ?? 'BudapestGO',
            payload: { ...latest.profile, owner },
          },
        ]);
        await writeSecure('login-draft', null);
        if (!alive.current || run !== generation.current) return;
        current.current = null;
        cache.removeQueries({ queryKey: ['ticket-wallet'] });
        router.dismissTo('/tickets');
      } catch (error) {
        if (alive.current && run === generation.current) setError(error);
      } finally {
        if (run === generation.current) {
          locked.current = false;
          if (alive.current) setBusy(false);
        }
      }
    },
    [cache],
  );
  const start = useCallback(async () => {
    const run = Symbol();
    generation.current = run;
    setError(null);
    setBusy(false);
    setDraft(null);
    try {
      await initializeAccounts();
      const previous = accountId ? accountRecord(accountId) : null;
      if (previous && previous.providerId !== 'budapestgo') throw new BudapestGoError('identity');
      const profile: WalletProfile = previous
        ? { ...parseWalletProfile(previous.payload), session: null }
        : (current.current?.profile ?? {
            version: 1,
            installation: { applicationId: newAccountId(), createdAt: new Date().toISOString() },
            session: null,
          });
      const client = new BudapestGoClient(
        profile.installation.applicationId,
        null,
        async () => {},
        ticketCrypto,
      );
      const login = await client.beginLogin();
      if (!alive.current || run !== generation.current) return;
      const next: Draft = {
        profile: { ...profile, session: null },
        ...login,
        phase: 'account',
        ...(accountId ? { accountId } : {}),
      };
      await writeSecure('login-draft', next);
      if (!alive.current || run !== generation.current) return;
      current.current = next;
      moving.current = false;
      setDraft(next);
    } catch (error) {
      if (alive.current && run === generation.current) setError(error);
    }
  }, [accountId]);
  useEffect(() => {
    const run = Symbol();
    generation.current = run;
    alive.current = true;
    void initializeAccounts()
      .then(() => readSecure<Draft>('login-draft'))
      .then((saved) => {
        if (!alive.current || run !== generation.current) return;
        if (
          saved &&
          saved.accountId === accountId &&
          saved.pending.createdAt > Date.now() - 900_000 &&
          saved.pending.createdAt <= Date.now() &&
          saved.pending.applicationId === saved.profile.installation.applicationId &&
          saved.url.startsWith(`${ISSUER}/protocol/openid-connect/auth?`)
        ) {
          current.current = saved;
          setDraft(saved);
          if (saved.profile.session) void finish();
        } else void start();
      })
      .catch((error) => {
        if (alive.current) setError(error);
      });
    return () => {
      alive.current = false;
      generation.current = Symbol();
    };
  }, [accountId, finish, start]);
  const navigate = (value: string): boolean => {
    const stored = current.current;
    if (!stored || !alive.current) return true;
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return false;
    }
    const expected = new URL(REDIRECT_URI);
    if (url.origin === expected.origin && url.pathname === expected.pathname) {
      void finish(value);
      return false;
    }
    const accountCallback = new URL(`${ISSUER}/account/login-redirect`);
    const accountHome = new URL(`${ISSUER}/account/`);
    const isAccountCallback =
      url.origin === accountCallback.origin && url.pathname === accountCallback.pathname;
    const isAccountHome =
      url.origin === accountHome.origin &&
      url.pathname.replace(/\/$/, '') === accountHome.pathname.replace(/\/$/, '');
    if (isAccountCallback || isAccountHome) {
      if (stored.phase === 'mobile' || moving.current) return false;
      if (
        url.searchParams.has('error') ||
        (isAccountCallback &&
          (url.searchParams.get('state') !== `0/${stored.pending.state}` ||
            !url.searchParams.get('code')))
      ) {
        setError(new BudapestGoError('auth'));
        return false;
      }
      const run = generation.current;
      moving.current = true;
      const next: Draft = { ...stored, phase: 'mobile' };
      current.current = next;
      void writeSecure('login-draft', next)
        .then(() => {
          if (alive.current && run === generation.current) setDraft(next);
        })
        .catch((error) => {
          if (alive.current && run === generation.current) setError(error);
        })
        .finally(() => {
          if (run === generation.current) moving.current = false;
        });
      return false;
    }
    return url.protocol === 'https:';
  };
  return (
    <WalletScreen title={t('tickets_login')} expanded>
      {error ? (
        <WalletContent>
          <WalletError error={error} />
          <Button label={t('tickets_restart_login')} disabled={busy} onPress={() => void start()} />
        </WalletContent>
      ) : null}
      {draft && (
        <View style={{ flex: 1, minHeight: 250 }}>
          <WebView
            source={{ uri: draft.phase === 'mobile' ? draft.url : accountLoginUrl(draft.pending) }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            incognito
            thirdPartyCookiesEnabled
            originWhitelist={['https://*']}
            mixedContentMode="never"
            allowFileAccess={false}
            allowUniversalAccessFromFileURLs={false}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(request) =>
              request.isTopFrame === false || navigate(request.url)
            }
            onNavigationStateChange={(navigation) => {
              navigate(navigation.url);
            }}
            onError={() => setError(new BudapestGoError('network'))}
          />
          {busy && (
            <View
              style={{
                position: 'absolute',
                inset: 0,
                justifyContent: 'center',
                padding: 20,
                backgroundColor: '#ffffffee',
              }}
            >
              <WalletLoading />
            </View>
          )}
        </View>
      )}
      {!draft && !error && <WalletLoading />}
    </WalletScreen>
  );
}
