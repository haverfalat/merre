import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import type {
  GeoJSONSource,
  Map as GLMap,
  Marker as GLMarker,
  StyleSpecification,
} from 'maplibre-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TransitMapProps } from '~/features/map/TransitMap.types';
import { vehicleHeadingOffset } from '~/features/map/marker-heading';
import { transitLayers } from '~/features/map/map-model';
import { basemapStyle } from '~/features/map/model/basemap-style';
import { emptyCollection } from '~/features/map/model/geojson';
import { locationFeatures } from '~/features/map/model/location-features';
import { useStopPreviewProjection } from '~/features/map/useStopPreviewProjection';
import { useMapFeedback } from '~/store/useMapFeedback';
import { installMapImages } from './map-images';
import { installMapInteractions } from './map-interactions';

import { useWebMapSources } from './useWebMapSources';

export function useWebMap({ data, location }: TransitMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<GLMap | null>(null);
  const latest = useRef(data);
  const locationRef = useRef(location);
  const userMarker = useRef<GLMarker | null>(null);
  const [failed, setFailed] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [ready, setReady] = useState(0);
  const projectStop = useCallback(
    async (point: [number, number]) => map.current?.project(point),
    [],
  );
  const updateStopPreview = useStopPreviewProjection(projectStop, ready > 0);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    instance.on('move', updateStopPreview);
    return () => {
      instance.off('move', updateStopPreview);
    };
  }, [ready, updateStopPreview]);
  const revision = useMapFeedback((s) => s.revision);
  const theme = useUIStore((s) => s.theme);
  const style = useUIStore((s) => s.mapStyle);
  const base = useMemo(
    () => basemapStyle(style, theme, false) as StyleSpecification,
    [style, theme],
  );
  const styleRef = useRef(base);
  useEffect(() => {
    latest.current = data;
    locationRef.current = location;
  });
  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    void import('maplibre-gl')
      .then(({ Map, Marker, Popup, AttributionControl, setWorkerUrl }) => {
        if (disposed || !container.current) return;
        setWorkerUrl(new URL('/maplibre/maplibre-gl-worker.mjs', window.location.origin).href);
        const instance = new Map({
          container: container.current,
          style: styleRef.current,
          center: useMapStore.getState().center,
          zoom: useMapStore.getState().zoom,
          minZoom: 5,
          maxZoom: 19,
          fadeDuration: 0,
          attributionControl: false,
        });
        map.current = instance;
        const locationElement = document.createElement('div');
        locationElement.className = 'transit-location-anchor';
        locationElement.setAttribute('role', 'img');
        userMarker.current = new Marker({
          element: locationElement,
          anchor: 'center',
          subpixelPositioning: true,
        });
        instance.addControl(new AttributionControl({ compact: true }), 'bottom-right');
        installMapImages(instance, () => disposed);
        const updateHeadingAttachment = () => {
          const offset = vehicleHeadingOffset(instance.getBearing());
          for (const id of ['vehicle-heading-outlines', 'vehicle-headings'])
            if (instance.getLayer(id)) instance.setLayoutProperty(id, 'icon-offset', offset);
        };
        instance.on('rotate', updateHeadingAttachment);
        instance.on('style.load', () => {
          if (disposed) return;
          for (const id of ['paths', 'stops', 'vehicles', 'symbols', 'location'])
            instance.addSource(id, { type: 'geojson', data: emptyCollection() });
          for (const layer of transitLayers)
            instance.addLayer(layer as Parameters<GLMap['addLayer']>[0]);
          updateHeadingAttachment();
          (instance.getSource('paths') as GeoJSONSource).setData(latest.current.paths);
          (instance.getSource('stops') as GeoJSONSource).setData(latest.current.stopMarkers);
          (instance.getSource('vehicles') as GeoJSONSource).setData(latest.current.markers);
          (instance.getSource('symbols') as GeoJSONSource).setData(latest.current.symbols);
          (instance.getSource('location') as GeoJSONSource).setData(
            locationFeatures(locationRef.current.position, locationRef.current.heading),
          );
          setReady((v) => v + 1);
          setFailed(false);
          useMapFeedback.getState().setTileError(false);
        });
        installMapInteractions(instance, container, latest, Popup);
        const reportedErrors = new Set<string>();
        instance.on('error', (event) => {
          if (disposed) return;
          const tileError = 'sourceId' in event && String(event.sourceId).startsWith('base-');
          const key = tileError ? 'basemap' : event.error.message;
          if (!reportedErrors.has(key)) {
            reportedErrors.add(key);
            console.warn('Transit map:', event.error.message);
          }
          if (tileError) {
            setFailed(true);
            useMapFeedback.getState().setTileError(true);
          }
        });
        resize = new ResizeObserver(() => instance.resize());
        resize.observe(container.current);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      resize?.disconnect();
      userMarker.current?.remove();
      userMarker.current = null;
      map.current?.remove();
      map.current = null;
    };
  }, [generation]);
  useEffect(() => {
    if (revision && map.current) {
      for (const id of Object.keys(map.current.getStyle().sources))
        if (id.startsWith('base-')) map.current.refreshTiles(id);
      setFailed(false);
    }
  }, [revision]);
  useEffect(() => {
    styleRef.current = base;
    if (map.current) map.current.setStyle(base);
  }, [base]);
  useWebMapSources(map, userMarker, ready, data, location);
  return {
    container,
    map,
    ready,
    failed,
    retry: () => {
      setFailed(false);
      setGeneration((value) => value + 1);
    },
  };
}
