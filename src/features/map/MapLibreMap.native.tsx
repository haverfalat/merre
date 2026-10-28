import { validCoordinates } from '@/lib/transit';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { Camera, Images, Map, type MapRef } from '@maplibre/maplibre-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { basemapStyle } from '~/features/map/model/basemap-style';
import { nearestMapFeature } from '~/features/map/model/hit-testing';
import { locationFeatures } from '~/features/map/model/location-features';
import { useMapFeedback } from '~/store/useMapFeedback';
import { dismissStopPreview } from '~/store/useStopPreview';
import { MapTileError } from './MapTileError';
import type { TransitMapProps } from './TransitMap.types';
import { TransitSource } from './native/TransitSource';
import { useMapLibreCamera } from './native/useMapLibreCamera';
import { useMapLibreImages } from './native/useMapLibreImages';
import { useMapPadding } from './useMapPadding';
import { useStopPreviewProjection } from './useStopPreviewProjection';

export function TransitMap({
  data,
  location,
  bottomInset,
  leftInset,
  topInset = 0,
  rightInset = 0,
}: TransitMapProps) {
  const [failed, setFailed] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [ready, setReady] = useState(false);
  const [mapBearing, setMapBearing] = useState(0);
  const mapRef = useRef<MapRef>(null);
  const projectStop = useCallback(async (point: [number, number]) => {
    const pixel = await mapRef.current?.project(point);
    return pixel ? { x: pixel[0], y: pixel[1] } : undefined;
  }, []);
  const updateStopPreview = useStopPreviewProjection(projectStop, ready);
  const revision = useMapFeedback((s) => s.revision);
  const theme = useUIStore((s) => s.theme);
  const style = useUIStore((s) => s.mapStyle);
  const mapStyle = useMemo(
    () => basemapStyle(style, theme, true, revision),
    [style, theme, revision],
  );
  const images = useMapLibreImages(data);
  const locationData = useMemo(
    () => locationFeatures(location.position, location.heading),
    [location.position, location.heading],
  );
  const padding = useMapPadding({ bottomInset, leftInset, topInset, rightInset });
  const { camera, updateBearing } = useMapLibreCamera(data, ready, padding);
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: theme === 'dark' ? '#0c0e13' : '#f1f5f9' },
      ]}
    >
      <Map
        ref={mapRef}
        key={generation}
        mapStyle={mapStyle}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme === 'dark' ? '#0c0e13' : '#f1f5f9' },
        ]}
        androidView="texture"
        logo={false}
        attribution
        compass
        compassPosition={{ top: topInset + 95, right: rightInset + 16 }}
        attributionPosition={{ bottom: bottomInset + 6, left: leftInset + 6 }}
        onDidFinishLoadingStyle={() => {
          setReady(true);
          setFailed(false);
          useMapFeedback.getState().setTileError(false);
        }}
        onDidFailLoadingMap={() => {
          setFailed(true);
          useMapFeedback.getState().setTileError(true);
        }}
        onRegionWillChange={(event) => {
          if (event.nativeEvent.userInteraction) useMapStore.getState().releaseVehicleCamera();
        }}
        onRegionIsChanging={({ nativeEvent: state }) => {
          updateStopPreview();
          setMapBearing(Math.round(state.bearing));
          if (Math.floor(state.zoom) !== Math.floor(useMapStore.getState().zoom))
            useMapStore.setState({ zoom: state.zoom });
        }}
        onRegionDidChange={({ nativeEvent: state }) => {
          updateStopPreview();
          updateBearing(state.bearing);
          setMapBearing(Math.round(state.bearing));
          const [west, south, east, north] = state.bounds;
          if (validCoordinates(...state.center))
            useMapStore
              .getState()
              .setViewport(
                { swLon: west, swLat: south, neLon: east, neLat: north },
                state.zoom,
                state.center,
              );
        }}
        onPress={() => {
          dismissStopPreview();
          useUIStore.getState().setSearchFocused(false);
        }}
      >
        <Images images={images} />
        <Camera
          ref={camera}
          initialViewState={{
            center: useMapStore.getState().center,
            zoom: useMapStore.getState().zoom,
          }}
          minZoom={5}
          maxZoom={19}
          padding={padding}
        />
        <TransitSource id="paths" data={data.paths} />
        <TransitSource
          id="stops"
          data={data.stopMarkers}
          onPress={(event) => {
            event.stopPropagation();
            const feature = nearestMapFeature(event.nativeEvent.features, event.nativeEvent.lngLat);
            if (feature) data.selectFeature(feature);
          }}
        />
        <TransitSource
          id="vehicles"
          bearing={mapBearing}
          data={data.markers}
          onPress={(event) => {
            event.stopPropagation();
            const feature = event.nativeEvent.features[0];
            if (feature) data.selectFeature(feature);
          }}
        />
        <TransitSource
          id="symbols"
          data={data.symbols}
          onPress={(event) => {
            event.stopPropagation();
            const feature = event.nativeEvent.features[0];
            if (feature) data.selectFeature(feature);
          }}
        />
        <TransitSource id="location" data={locationData} />
      </Map>
      {failed && (
        <MapTileError
          onRetry={() => {
            setReady(false);
            setGeneration((v) => v + 1);
          }}
        />
      )}
    </View>
  );
}
