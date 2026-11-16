import { OfflineGate } from '~/features/tickets/components/OfflineGate';
import {
  WorkspaceNavigation,
  WORKSPACE_NAV_HEIGHT,
} from '~/features/workspace/WorkspaceNavigation';
import { DesktopToolbar, DESKTOP_TOOLBAR } from '~/features/workspace/DesktopToolbar';
import { PlannerHeader } from '~/features/planner/PlannerHeader';
import { usePlannerStore } from '~/store/usePlannerStore';
import { useTranslation } from '@/hooks/useTranslation';
import { DEFAULT_SHEET_FRACTION, mobileSheetHeight } from '@/lib/mobile-sheet';
import { desktopPanelWidth, MAP_PANEL_LAYOUT } from '~/lib/map-layout';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { BackHandler, Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
import { MapErrorBoundary } from '~/components/MapErrorBoundary';
import { DetailsSheet } from '~/components/panels/DetailsSheet';
import { Presence } from '~/components/ui/Presence';
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
import { elevation, radii, useTheme } from '~/lib/theme';
import { dismissStopPreview, useStopPreview } from '~/store/useStopPreview';

export default function TransitScreen() {
  const { t } = useTranslation();
  const { width, height, top, insets } = useViewport();
  const desktop = width >= (Platform.OS === 'web' ? MAP_PANEL_LAYOUT.breakpoint : 768);
  const panelWidth = desktopPanelWidth(width);
  const webDesktop = desktop && Platform.OS === 'web';
  const panelInset = webDesktop ? DESKTOP_TOOLBAR.inset : 0;
  const c = useTheme();
  const planning = usePlannerStore((state) => state.open);
  const trip = useMapStore((s) => s.selectedVehicle);
  const stop = useMapStore((s) => s.selectedStopId);
  const route = useMapStore((s) => s.selectedRouteId);
  const fraction = useUIStore((s) => s.mobileSheetFraction);
  const focused = useUIStore((s) => s.searchFocused);
  const selected = !!(planning || trip || stop || route);
  const [navigationHeight, setNavigationHeight] = useState(WORKSPACE_NAV_HEIGHT);
  const navigationInset = desktop ? 0 : navigationHeight + insets.bottom;
  const sheetViewport = Math.max(0, height - navigationInset);
  const bottom =
    !desktop && selected && !focused
      ? navigationInset + mobileSheetHeight(sheetViewport, fraction, sheetViewport < 500)
      : navigationInset;
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
      const planner = usePlannerStore.getState();
      if (planner.returnToJourney) {
        planner.resumeJourney();
        return true;
      }
      if (planner.open) {
        if (planner.detail) planner.showResults();
        else planner.close();
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
      useMapStore.subscribe((s, previous) => {
        const cleared = !s.selectedVehicle && !s.selectedStopId && !s.selectedRouteId;
        const hadSelection = previous.selectedVehicle || previous.selectedStopId || previous.selectedRouteId;
        if (cleared && hadSelection) {
          useUIStore.getState().setMobileSheetFraction(DEFAULT_SHEET_FRACTION);
          if (usePlannerStore.getState().returnToJourney)
            usePlannerStore.setState({ returnToJourney: false });
        }
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
          leftInset={
            desktop && (selected || (!webDesktop && focused))
              ? insets.left + panelInset + panelWidth
              : insets.left
          }
        />
      </MapErrorBoundary>
      <MapControls
        data={data}
        location={location}
        bottom={bottom}
        height={height}
        desktop={desktop}
        leftOffset={desktop && selected ? panelInset + panelWidth : 0}
        safeInsets={insets}
      />
      <StopMapCard
        width={width}
        height={height}
        topInset={insets.top}
        bottomInset={navigationInset}
        leftInset={desktop ? insets.left + panelInset + panelWidth : 0}
      />
      {!desktop && (
        <DetailsSheet
          location={location}
          desktop={desktop}
          height={sheetViewport}
          bottom={navigationInset}
          left={insets.left}
          right={insets.right}
        />
      )}
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
      {webDesktop && (
        <Presence visible={selected} preset="sidebar" testID="desktop-details-panel" style={{ position: 'absolute',
          top: insets.top + DESKTOP_TOOLBAR.inset + DESKTOP_TOOLBAR.height + DESKTOP_TOOLBAR.gap,
          left: insets.left + panelInset, bottom: insets.bottom + panelInset, width: panelWidth,
          backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: radii.card,
          overflow: 'hidden', boxShadow: elevation.panel }}>
          {planning && <PlannerHeader docked />}
          <DetailsSheet location={location} desktop keepVisibleDuringSearch height={sheetViewport} bottom={navigationInset}
            left={insets.left} right={insets.right} />
        </Presence>
      )}
      {!webDesktop && <KeyboardAvoidingView
        pointerEvents="box-none"
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        style={{
          position: 'absolute',
          left: insets.left + (desktop ? 0 : 12),
          right: desktop ? undefined : insets.right + 12,
          width: desktop ? panelWidth : undefined,
          top: insets.top + (desktop ? 0 : 12),
          bottom: desktop ? selected || focused ? insets.bottom : undefined
            : focused ? insets.bottom + 12 : undefined,
          backgroundColor: desktop ? c.card : 'transparent',
          ...(desktop ? { borderRightWidth: 1, borderBottomWidth: 1, borderColor: c.border,
            overflow: 'hidden', boxShadow: elevation.panel } : {}),
        }}
      >
        {desktop && <WorkspaceNavigation desktop />}
        {planning ? <PlannerHeader docked={desktop} /> : <SearchHeader docked={desktop} />}
        {desktop && <DetailsSheet location={location} desktop height={sheetViewport}
          bottom={navigationInset} left={insets.left} right={insets.right} />}
      </KeyboardAvoidingView>
      }
      {webDesktop && <DesktopToolbar width={panelWidth} top={insets.top} left={insets.left} />}
      {!desktop && !focused && (
        <View
          onLayout={(event) =>
            setNavigationHeight(
              Math.max(WORKSPACE_NAV_HEIGHT, event.nativeEvent.layout.height - insets.bottom),
            )
          }
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
        >
          <WorkspaceNavigation desktop={false} bottom={insets.bottom} />
        </View>
      )}
      <SettingsModal />
      <OfflineGate />
    </View>
  );
}
