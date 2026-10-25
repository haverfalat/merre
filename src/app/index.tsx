import { useTranslation } from '@/hooks/useTranslation';
import { DEFAULT_SHEET_FRACTION, mobileSheetHeight } from '@/lib/mobile-sheet';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import Head from 'expo-router/head';
import { useEffect } from 'react';
import { BackHandler, Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
import { MapErrorBoundary } from '~/components/MapErrorBoundary';
import { DetailsSheet } from '~/components/panels/DetailsSheet';
import { Backdrop } from '~/components/ui/ModalFrame';
import { MapControls } from '~/features/map/MapControls';
import { StopMapCard } from '~/features/map/StopMapCard';
import { TransitMap } from '~/features/map/TransitMap';
import { useMapData } from '~/features/map/useMapData';
import { SearchHeader } from '~/features/search/SearchHeader';
import { SettingsModal } from '~/features/settings/SettingsModal';
import { useLocation } from '~/hooks/useLocation';
import { useSelectionLink } from '~/hooks/useSelectionLink';
import { useViewport } from '~/hooks/useViewport';
import { useTheme } from '~/lib/theme';
import { dismissStopPreview, useStopPreview } from '~/store/useStopPreview';

export default function TransitScreen() {
  const { t } = useTranslation();
  const { width, height, top, insets } = useViewport();
  const desktop = width >= 768;
  const c = useTheme();
  const trip = useMapStore((s) => s.selectedVehicle);
  const stop = useMapStore((s) => s.selectedStopId);
  const route = useMapStore((s) => s.selectedRouteId);
  const fraction = useUIStore((s) => s.mobileSheetFraction);
  const focused = useUIStore((s) => s.searchFocused);
  const selected = !!(trip || stop || route);
  const bottom =
    !desktop && selected && !focused
      ? mobileSheetHeight(height, fraction, height < 500)
      : insets.bottom;
  const data = useMapData();
  const location = useLocation();
  useSelectionLink();
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const ui = useUIStore.getState();
      const map = useMapStore.getState();
      if (ui.searchFocused) {
        ui.setSearchFocused(false);
        Keyboard.dismiss();
        return true;
      }
      if (useStopPreview.getState().stop) {
        dismissStopPreview();
        return true;
      }
      if (map.selectedStopId || map.selectedRouteId || map.selectedVehicle) {
        map.clearSelection();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, []);
  useEffect(
    () =>
      useMapStore.subscribe((s) => {
        if (!s.selectedVehicle && !s.selectedStopId && !s.selectedRouteId)
          useUIStore.getState().setMobileSheetFraction(DEFAULT_SHEET_FRACTION);
      }),
    [],
  );
  useEffect(
    () =>
      useMapStore.subscribe((s) => {
        if (s.selectedVehicle || s.selectedStopId || s.selectedRouteId) dismissStopPreview();
        if (!s.selectedStopId && useStopPreview.getState().board)
          useStopPreview.setState({ board: null });
      }),
    [],
  );
  return (
    <View
      style={[
        { flex: 1, backgroundColor: c.background },
        Platform.OS === 'web' && { position: 'absolute', left: 0, right: 0, top, height },
      ]}
    >
      <Head>
        <title>{t('app_title')}</title>
        <meta name="description" content={t('app_description')} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content={c.card} />
      </Head>
      <MapErrorBoundary>
        <TransitMap
          data={data}
          location={location}
          bottomInset={bottom}
          topInset={insets.top}
          rightInset={insets.right}
          leftInset={desktop && selected ? insets.left + 416 : insets.left}
        />
      </MapErrorBoundary>
      <MapControls
        data={data}
        location={location}
        bottom={bottom}
        height={height}
        desktop={desktop}
        safeInsets={insets}
      />
      <StopMapCard
        width={width}
        height={height}
        topInset={insets.top}
        bottomInset={insets.bottom}
      />
      <DetailsSheet
        desktop={desktop}
        height={height}
        top={insets.top}
        bottom={insets.bottom}
        left={insets.left}
        right={insets.right}
      />
      {focused && (
        <Backdrop
          label={t('cancel_search')}
          color="#00000035"
          onPress={() => {
            useUIStore.getState().setSearchFocused(false);
            Keyboard.dismiss();
          }}
        />
      )}
      <KeyboardAvoidingView
        pointerEvents="box-none"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          position: 'absolute',
          left: insets.left + 12,
          right: desktop ? undefined : insets.right + 12,
          width: desktop ? 388 : undefined,
          top: insets.top + 12,
          bottom: focused ? insets.bottom + 12 : undefined,
        }}
      >
        <SearchHeader />
      </KeyboardAvoidingView>
      <SettingsModal />
    </View>
  );
}
