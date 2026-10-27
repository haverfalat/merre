import { MAV_LOGIN_URL, MAV_SESSION_BRIDGE, MAV_WEB_ORIGIN, MavMobileError } from 'mav-mobile-api';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { useTheme } from '~/lib/theme';
import {
  POPUP_PARENT_SCRIPT,
  parsePopupPacket,
  popupChildScript,
  popupClosed,
  popupDelivery,
  popupOrigin,
} from '../browser/popups';

interface Popup {
  id: string;
  name: string;
  url: string;
}

export interface LoginBrowserHandle {
  reload(): void;
}

export function LoginBrowser({
  ref,
  onSession,
  onError,
}: {
  ref?: Ref<LoginBrowserHandle>;
  onSession(message: string, url: string): void;
  onError(error: unknown): void;
}) {
  const main = useRef<WebView<unknown>>(null);
  const child = useRef<WebView<unknown>>(null);
  const current = useRef<Popup | null>(null);
  const childOrigin = useRef<string | null>(null);
  const pending = useRef(0);
  const closing = useRef(false);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [address, setAddress] = useState('');
  const c = useTheme();
  const closePopup = useCallback(() => {
    if (current.current) main.current?.injectJavaScript(popupClosed(current.current.id));
    current.current = null;
    childOrigin.current = null;
    pending.current = 0;
    closing.current = false;
    setPopup(null);
  }, []);
  useImperativeHandle(ref, () => ({
    reload() {
      closePopup();
      main.current?.reload();
    },
  }), [closePopup]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!current.current) return false;
      closePopup();
      return true;
    });
    return () => subscription.remove();
  }, [closePopup]);
  const mainMessage = (event: WebViewMessageEvent) => {
    const { data, url } = event.nativeEvent;
    if (popupOrigin(url) !== MAV_WEB_ORIGIN) return;
    const packet = parsePopupPacket(data);
    if (!packet) {
      onSession(data, url);
      return;
    }
    if (packet.kind === 'open' || packet.kind === 'navigate') {
      const target = packet.url!;
      if (target !== 'about:blank' && !popupOrigin(target)) {
        main.current?.injectJavaScript(popupClosed(packet.id));
        onError(new MavMobileError('input', 'Unexpected sign-in popup origin'));
        return;
      }
      const previous = current.current;
      if (packet.kind === 'navigate' && previous?.id !== packet.id) return;
      if (previous && previous.id !== packet.id)
        main.current?.injectJavaScript(popupClosed(previous.id));
      const next = { id: packet.id, name: packet.name ?? previous?.name ?? '', url: target };
      current.current = next;
      childOrigin.current = null;
      pending.current = 0;
      closing.current = false;
      setAddress(popupOrigin(target) ?? '');
      setPopup(next);
    } else if (current.current?.id === packet.id) {
      if (packet.kind === 'close') closePopup();
      else if (packet.kind === 'ack') {
        pending.current = Math.max(0, pending.current - 1);
        if (!pending.current && closing.current) closePopup();
      } else if (
        (packet.kind === 'message' || packet.kind === 'port-message') &&
        childOrigin.current &&
        (packet.targetOrigin === '*' || packet.targetOrigin === childOrigin.current)
      ) {
        child.current?.injectJavaScript(
          popupDelivery(
            packet.id, MAV_WEB_ORIGIN, packet.data, packet.targetOrigin!, packet.port, packet.ports,
          ),
        );
      }
    }
  };
  const childMessage = (event: WebViewMessageEvent, id: string) => {
    if (current.current?.id !== id) return;
    const { data, url } = event.nativeEvent;
    const origin = popupOrigin(url);
    if (!origin) return;
    childOrigin.current = origin;
    const packet = parsePopupPacket(data);
    if (!packet) {
      if (origin === MAV_WEB_ORIGIN) onSession(data, url);
      return;
    }
    if (packet.id !== id) return;
    if (packet.kind === 'close') {
      if (pending.current) closing.current = true;
      else closePopup();
    } else if (
      (packet.kind === 'message' || packet.kind === 'port-message') &&
      (packet.targetOrigin === '*' || packet.targetOrigin === MAV_WEB_ORIGIN)
    ) {
      if (!main.current) return;
      pending.current += 1;
      main.current.injectJavaScript(
        popupDelivery(id, origin, packet.data, packet.targetOrigin!, packet.port, packet.ports),
      );
    }
  };
  const common = {
    javaScriptEnabled: true,
    domStorageEnabled: true,
    incognito: true,
    thirdPartyCookiesEnabled: true,
    originWhitelist: ['https://*', 'about:blank'],
    applicationNameForUserAgent: Platform.OS === 'ios'
      ? `Version/${Platform.Version} Safari/604.1` : undefined,
    mixedContentMode: 'never' as const,
    allowFileAccess: false,
    allowUniversalAccessFromFileURLs: false,
    javaScriptCanOpenWindowsAutomatically: true,
    setSupportMultipleWindows: true,
    onError: () => onError(new MavMobileError('network', 'MAV sign-in page could not be loaded')),
  };
  return (
    <View style={{ flex: 1 }}>
      <WebView
        {...common}
        ref={main}
        source={{ uri: MAV_LOGIN_URL }}
        style={{ flex: 1 }}
        injectedJavaScriptBeforeContentLoaded={POPUP_PARENT_SCRIPT}
        injectedJavaScript={`${POPUP_PARENT_SCRIPT}\n${MAV_SESSION_BRIDGE}`}
        onMessage={mainMessage}
        onOpenWindow={({ nativeEvent }) => {
          if (popupOrigin(nativeEvent.targetUrl))
            main.current?.injectJavaScript(`window.open(${JSON.stringify(nativeEvent.targetUrl)},'_blank');true;`);
        }}
      />
      {popup && popup.url !== 'about:blank' && (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: c.surface }}>
          <ModalHeader title={address} onClose={closePopup} />
          <WebView
            {...common}
            key={popup.id}
            ref={child}
            source={{ uri: popup.url }}
            style={{ flex: 1 }}
            injectedJavaScriptBeforeContentLoaded={popupChildScript(popup.id, popup.name)}
            injectedJavaScript={`${popupChildScript(popup.id, popup.name)}\n${MAV_SESSION_BRIDGE}`}
            onMessage={(event) => childMessage(event, popup.id)}
            onShouldStartLoadWithRequest={(request) => {
              if (request.isTopFrame === false) return true;
              const origin = popupOrigin(request.url);
              if (origin) {
                childOrigin.current = origin;
                setAddress(origin);
              }
              const allowed = request.url === 'about:blank' || !!origin;
              if (!allowed) {
                closePopup();
                onError(new MavMobileError('auth', 'Unexpected sign-in popup origin'));
              }
              return allowed;
            }}
            onNavigationStateChange={(navigation) => {
              if (current.current?.id !== popup.id) return;
              childOrigin.current = popupOrigin(navigation.url);
              if (childOrigin.current) setAddress(childOrigin.current);
            }}
          />
        </View>
      )}
    </View>
  );
}
