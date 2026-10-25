import { useTranslation } from '@/hooks/useTranslation';
import type { GeoJSONSource, Map as GLMap, Marker as GLMarker } from 'maplibre-gl';
import { useEffect } from 'react';
import type { TransitMapProps } from '~/features/map/TransitMap.types';
import { locationFeatures } from '~/features/map/model/location-features';

import type { RefObject } from 'react';

export function useWebMapSources(
  map: RefObject<GLMap | null>,
  userMarker: RefObject<GLMarker | null>,
  ready: number,
  data: TransitMapProps['data'],
  location: TransitMapProps['location'],
) {
  const { t } = useTranslation();
  useEffect(() => {
    (map.current?.getSource('paths') as GeoJSONSource | undefined)?.setData(data.paths);
  }, [map, ready, data.paths]);
  useEffect(() => {
    (map.current?.getSource('stops') as GeoJSONSource | undefined)?.setData(data.stopMarkers);
  }, [map, ready, data.stopMarkers]);
  useEffect(() => {
    (map.current?.getSource('vehicles') as GeoJSONSource | undefined)?.setData(data.markers);
  }, [map, ready, data.markers]);
  useEffect(() => {
    (map.current?.getSource('symbols') as GeoJSONSource | undefined)?.setData(data.symbols);
  }, [map, ready, data.symbols]);
  useEffect(() => {
    (map.current?.getSource('location') as GeoJSONSource | undefined)?.setData(
      locationFeatures(location.position, location.heading),
    );
  }, [map, ready, location.position, location.heading]);
  useEffect(() => {
    const marker = userMarker.current;
    const instance = map.current;
    if (!marker || !instance) return;
    if (!location.position) {
      marker.remove();
      return;
    }
    const { longitude, latitude, accuracy } = location.position.coords;
    marker
      .getElement()
      .setAttribute('aria-label', t('your_location', { meters: Math.round(accuracy ?? 1) }));
    // This transparent DOM anchor supplies accessibility only. The visible dot,
    // bearing and accuracy area all use the same WebGL geographic source.
    const previous = marker.getLngLat();
    if (!previous || previous.lng !== longitude || previous.lat !== latitude)
      marker.setLngLat([longitude, latitude]);
    if (!marker.getElement().isConnected) marker.addTo(instance);
  }, [map, ready, location.position, t, userMarker]);
}
