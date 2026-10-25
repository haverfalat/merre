import { getBasemap } from '@/lib/basemaps';
import { validCoordinates } from '@/lib/transit';
import { vehicleCameraBearing } from '@/lib/vehicle-camera';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { ExternalLink } from '~/components/ui/ExternalLink';
import { useTheme } from '~/lib/theme';
import { useMapFeedback } from '~/store/useMapFeedback';
import { useNativeMapPreferences } from '~/store/useNativeMapPreferences';
import { dismissStopPreview } from '~/store/useStopPreview';
import { layoutStopLabels } from './label-layout';
import { nativeCameraCenter, nativeMapRegion, nativeMapZoom } from './native-camera';
import { NativeBasemapTiles } from './NativeBasemapTiles';
import { NativeLocationOverlay, NativeRoutePaths } from './NativeMapOverlays';
import { NativeStopLabel } from './NativeStopLabel';
import { NativeStopMarker, NativeVehicleMarker } from './NativeTransitMarkers';
import type { TransitMapProps } from './TransitMap.types';
import { useMapPadding } from './useMapPadding';
import { useStopPreviewProjection } from './useStopPreviewProjection';

const coordinate = ([longitude, latitude]: number[]) => ({ longitude, latitude });
export function ExpoGoMap({
  data,
  location,
  bottomInset,
  leftInset,
  topInset = 0,
  rightInset = 0,
}: TransitMapProps) {
  const map = useRef<MapView>(null);
  const fitted = useRef<string | null>(null);
  const bearing = useRef(0);
  const [ready, setReady] = useState(false);
  const [mapHeading, setMapHeading] = useState(0);
  const projectStop = useCallback(
    async (point: [number, number]) => map.current?.pointForCoordinate(coordinate(point)),
    [],
  );
  const updateStopPreview = useStopPreviewProjection(projectStop, ready);
  const { width, height } = useWindowDimensions();
  const c = useTheme();
  const theme = useUIStore((s) => s.theme);
  const style = useUIStore((s) => s.mapStyle);
  const target = useMapStore((s) => s.cameraTarget);
  const follow = useMapStore((s) => s.vehicleCameraMode);
  const viewport = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const revision = useMapFeedback((s) => s.revision);
  const apple3D = useNativeMapPreferences((s) => s.appleSatellite3D) && Platform.OS === 'ios';
  const basemap = getBasemap(style);
  const dark = style === 'dark' || (style === 'auto' && theme === 'dark');
  const padding = useMapPadding({ bottomInset, leftInset, topInset, rightInset });
  const labels = useMemo(
    () =>
      layoutStopLabels(
        data.stopMarkers.features,
        viewport,
        zoom,
        width,
        height,
        mapHeading,
        padding,
      ),
    [data.stopMarkers, viewport, zoom, width, height, mapHeading, padding],
  );
  const [initialRegion] = useState(() =>
    nativeMapRegion(useMapStore.getState().center, useMapStore.getState().zoom, width, height),
  );
  const appliedTarget = useRef<typeof target>(null);
  const liveRegion = useRef(initialRegion);
  const headingRead = useRef({ time: 0, pending: false });
  const refreshHeading = useCallback(() => {
    const state = headingRead.current;
    if (state.pending || Date.now() - state.time < 100) return;
    state.time = Date.now();
    state.pending = true;
    void map.current
      ?.getCamera()
      .then((camera) => {
        bearing.current = camera.heading;
        setMapHeading(camera.heading);
      })
      .catch(() => {})
      .finally(() => {
        state.pending = false;
      });
  }, []);
  useEffect(() => {
    if (!ready || !target || appliedTarget.current === target) return;
    appliedTarget.current = target;
    let disposed = false;
    void map.current
      ?.getCamera()
      .then((camera) => {
        if (disposed) return;
        const actualZoom =
          nativeMapZoom(width, liveRegion.current.longitudeDelta) ?? useMapStore.getState().zoom;
        const altitude =
          camera.altitude != null ? camera.altitude * 2 ** (actualZoom - target.zoom) : undefined;
        if (target.kind === 'zoom') {
          const visibleCenter = nativeCameraCenter(
            [camera.center.longitude, camera.center.latitude],
            actualZoom,
            padding,
            camera.heading,
            true,
          );
          const center =
            Platform.OS === 'ios'
              ? coordinate(nativeCameraCenter(visibleCenter, target.zoom, padding, camera.heading))
              : undefined;
          map.current?.animateCamera(
            {
              ...(center ? { center } : {}),
              zoom: target.zoom + 1,
              ...(altitude != null ? { altitude } : {}),
            },
            { duration: target.duration ?? 160 },
          );
          return;
        }
        map.current?.animateCamera(
          {
            center: coordinate(
              Platform.OS === 'ios'
                ? nativeCameraCenter(
                    target.center,
                    target.zoom,
                    padding,
                    follow === 'heading' ? bearing.current : 0,
                  )
                : target.center,
            ),
            zoom: target.zoom + 1,
            ...(altitude != null ? { altitude } : {}),
            heading: follow === 'heading' ? bearing.current : 0,
            pitch: apple3D ? 60 : 0,
          },
          { duration: 700 },
        );
      })
      .catch(() => {});
    return () => {
      disposed = true;
    };
  }, [ready, target, apple3D, follow, width, padding]);
  useEffect(() => {
    if (ready) map.current?.setCamera({ pitch: apple3D ? 60 : 0 });
  }, [ready, apple3D]);
  const fitRequest =
    data.fitKey && data.fitBounds
      ? JSON.stringify([data.fitKey, data.fitBounds, padding, width, height])
      : null;
  useEffect(() => {
    if (!data.fitKey) fitted.current = null;
    if (
      !ready ||
      !data.fitKey ||
      !data.fitBounds ||
      fitted.current === fitRequest ||
      follow !== 'free'
    )
      return;
    fitted.current = fitRequest;
    const [west, south, east, north] = data.fitBounds;
    map.current?.fitToCoordinates(
      [
        { longitude: west, latitude: south },
        { longitude: east, latitude: north },
      ],
      { edgePadding: padding, animated: true },
    );
  }, [ready, data.fitKey, data.fitBounds, follow, padding, fitRequest]);
  useEffect(() => {
    if (
      !ready ||
      follow === 'free' ||
      !data.position ||
      !validCoordinates(data.position.lon, data.position.lat)
    )
      return;
    bearing.current =
      follow === 'heading' ? vehicleCameraBearing(bearing.current, data.position.heading) : 0;
    const center =
      Platform.OS === 'ios'
        ? nativeCameraCenter(
            [data.position.lon!, data.position.lat!],
            nativeMapZoom(width, liveRegion.current.longitudeDelta) ?? useMapStore.getState().zoom,
            padding,
            bearing.current,
          )
        : [data.position.lon!, data.position.lat!];
    map.current?.animateCamera(
      { center: coordinate(center), heading: bearing.current },
      { duration: 800 },
    );
  }, [ready, follow, data.position, width, padding]);
  const zoomChanged = useCallback(
    (region: Region) => {
      updateStopPreview();
      liveRegion.current = region;
      refreshHeading();
      const zoom = nativeMapZoom(width, region.longitudeDelta);
      if (zoom != null && Math.floor(zoom) !== Math.floor(useMapStore.getState().zoom))
        useMapStore.setState({ zoom });
    },
    [width, refreshHeading, updateStopPreview],
  );
  const updateViewport = useCallback(
    (region: Region) => {
      updateStopPreview();
      liveRegion.current = region;
      const zoom = nativeMapZoom(width, region.longitudeDelta);
      if (zoom == null) return;
      void map.current
        ?.getCamera()
        .then((camera) => {
          bearing.current = camera.heading;
          setMapHeading(camera.heading);
        })
        .catch(() => {});
      useMapStore.getState().setViewport(
        {
          swLon: region.longitude - region.longitudeDelta / 2,
          swLat: region.latitude - region.latitudeDelta / 2,
          neLon: region.longitude + region.longitudeDelta / 2,
          neLat: region.latitude + region.latitudeDelta / 2,
        },
        zoom,
        [region.longitude, region.latitude],
      );
    },
    [width, updateStopPreview],
  );
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background }]}>
      <MapView
        ref={map}
        style={[StyleSheet.absoluteFill, { backgroundColor: c.background }]}
        mapType={apple3D ? 'satelliteFlyover' : Platform.OS === 'android' ? 'none' : 'standard'}
        userInterfaceStyle={dark ? 'dark' : 'light'}
        mapPadding={Platform.OS === 'android' ? padding : undefined}
        minZoomLevel={Platform.OS === 'android' ? 6 : undefined}
        maxZoomLevel={Platform.OS === 'android' ? 20 : undefined}
        pitchEnabled
        showsBuildings={apple3D}
        showsPointsOfInterests={apple3D}
        showsCompass
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        initialRegion={initialRegion}
        onMapReady={() => {
          setReady(true);
          updateViewport(initialRegion);
        }}
        onRegionChange={zoomChanged}
        onRegionChangeComplete={updateViewport}
        onPanDrag={() => useMapStore.getState().releaseVehicleCamera()}
        onPress={() => {
          dismissStopPreview();
          useUIStore.getState().setSearchFocused(false);
        }}
      >
        {!apple3D && <NativeBasemapTiles style={style} dark={dark} revision={revision} />}
        <NativeRoutePaths paths={data.paths} />
        {labels.map((label) => (
          <NativeStopLabel
            key={`label-${label.feature.id}`}
            label={label}
            onSelect={data.selectFeature}
          />
        ))}
        {data.stopMarkers.features.map((feature) => (
          <NativeStopMarker
            key={String(feature.id)}
            feature={feature}
            bearing={mapHeading}
            onSelect={data.selectFeature}
          />
        ))}
        {data.markers.features.map((feature) => (
          <NativeVehicleMarker
            key={String(feature.id)}
            feature={feature}
            bearing={mapHeading}
            onSelect={data.selectFeature}
          />
        ))}
        <NativeLocationOverlay
          position={location.position}
          heading={location.heading}
          bearing={mapHeading}
        />
      </MapView>
      <View
        style={{
          position: 'absolute',
          bottom: bottomInset + 3,
          right: rightInset + 8,
          maxWidth: 260,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        {(apple3D
          ? [{ label: '© Apple', url: 'https://www.apple.com/maps/' }]
          : basemap.credits
        ).map((credit) => (
          <ExternalLink
            key={credit.url}
            label={`${credit.label} `}
            url={credit.url}
            size="caption"
            textStyle={{ color: c.secondary, backgroundColor: c.card }}
          />
        ))}
      </View>
    </View>
  );
}
