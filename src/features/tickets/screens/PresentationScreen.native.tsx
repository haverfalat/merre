import * as Brightness from 'expo-brightness';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { fonts, useTheme } from '~/lib/theme';
import { useTranslation } from '~/hooks/useTranslation';
import { useTicketAccounts } from '~/lib/tickets/accounts.native';
import { clearTicketPresentation, useTicketPresentation } from '~/lib/tickets/presentation.native';

export default function PresentationScreen() {
  useKeepAwake();
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const { items, incomplete, id: currentId } = useTicketPresentation();
  const [page, setPage] = useState(0);
  const presentation = items[page]?.presentation;
  const monotonicExpiresAt = items[page]?.monotonicExpiresAt ?? 0;
  const currentExpiry = useRef(monotonicExpiresAt);
  useEffect(() => {
    currentExpiry.current = monotonicExpiresAt;
  }, [monotonicExpiresAt]);
  const accounts = useTicketAccounts((s) => s.accounts);
  const { t } = useTranslation();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [now, setNow] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(() => performance.now());
  const [failed, setFailed] = useState(false);
  const closing = useRef(false);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    // Clear in the unmount cleanup, after the closing transition finishes.
    if (returnTo === 'tickets') router.dismissTo('/tickets');
    else if (router.canGoBack()) router.back();
    else router.replace('/tickets');
  };
  useEffect(() => {
    // Preserve the original brightness across every page of this presentation.
    let previous: number | null = null;
    let alive = true;
    void Brightness.getBrightnessAsync()
      .then(async (value) => {
        previous = value;
        if (alive) await Brightness.setBrightnessAsync(1);
      })
      .catch(() => {});
    const subscription = AppState.addEventListener('change', (state) => {
      setForeground(state === 'active');
      setNow(Date.now());
      setElapsed(performance.now());
      if (previous !== null)
        void Brightness.setBrightnessAsync(
          state === 'active' && performance.now() < currentExpiry.current ? 1 : previous,
        ).catch(() => {});
    });
    const interval = setInterval(() => {
      setNow(Date.now());
      setElapsed(performance.now());
    }, 500);
    return () => {
      alive = false;
      subscription.remove();
      clearInterval(interval);
      if (previous !== null) void Brightness.setBrightnessAsync(previous).catch(() => {});
    };
  }, []);
  useEffect(() => () => clearTicketPresentation(id), [id]);
  const valid =
    presentation &&
    currentId === id &&
    accounts.some((a) => a.id === presentation.accountId) &&
    now < presentation.expiresAt &&
    elapsed < monotonicExpiresAt;
  const html = presentation?.html.replace(
    '</body>',
    `<script>window.addEventListener('budapestgo:close',function(){window.ReactNativeWebView.postMessage('close');});</script></body>`,
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.card }}>
      <StatusBar hidden />
      {valid && foreground && !failed ? (
        <WebView
          key={page}
          source={{ html: html! }}
          style={{ flex: 1, backgroundColor: '#fff' }}
          originWhitelist={['about:*', 'data:*']}
          onShouldStartLoadWithRequest={(request) =>
            request.url === 'about:blank' ||
            request.url.startsWith('about:srcdoc') ||
            request.url.startsWith('data:text/html')
          }
          javaScriptEnabled
          domStorageEnabled={false}
          incognito
          cacheEnabled={false}
          mixedContentMode="never"
          allowFileAccess={false}
          allowUniversalAccessFromFileURLs={false}
          setSupportMultipleWindows={false}
          onMessage={(event) => {
            if (event.nativeEvent.data === 'close') close();
          }}
          onError={() => setFailed(true)}
        />
      ) : (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}
        >
          <Text accessibilityLiveRegion="polite" style={{ color: c.text, fontSize: 15, lineHeight: 22 }}>
            {failed
              ? t('tickets_error')
              : !presentation
                ? t('tickets_missing_presentation')
                : now >= presentation.expiresAt || elapsed >= monotonicExpiresAt
                  ? t('tickets_expired')
                  : foreground && !valid ? t('tickets_missing_presentation') : ''}
          </Text>
        </View>
      )}
      {(items.length > 1 || incomplete) && <View style={{ padding: 12, gap: 8, backgroundColor: c.card,
        borderTopWidth: 1, borderColor: c.border }}>
        {incomplete && <Text style={{ color: c.danger, fontSize: 14, lineHeight: 20 }}>
          {t('tickets_batch_incomplete', incomplete)}
        </Text>}
        {items.length > 1 && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <Button style={{ flexGrow: 1, flexBasis: 100 }} label={t('tickets_previous')} disabled={page === 0} onPress={() => { setFailed(false); setPage(page - 1); }} />
          <Text style={{ color: c.secondary, fontFamily: fonts.medium, fontVariant: ['tabular-nums'], textAlign: 'center', flexShrink: 0 }}>{page + 1} / {items.length}</Text>
          <Button style={{ flexGrow: 1, flexBasis: 100 }} label={t('tickets_next')} disabled={page === items.length - 1} onPress={() => { setFailed(false); setPage(page + 1); }} />
        </View>}
      </View>}
      {(!presentation?.embeddedClose || !valid || failed) && (
        <View style={{ position: 'absolute', top: insets.top + 4, right: insets.right + 4 }}>
          <Button
            icon={X}
            label={t('tickets_close')}
            size="icon"
            onPress={close}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
