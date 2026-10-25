import { useTranslation } from '@/hooks/useTranslation';
import { screenHeading } from '@/lib/vehicle-camera';
import type { FeatureCollection } from 'geojson';
import { memo, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Circle, Marker, Polyline } from 'react-native-maps';
import type { LocationState } from '~/hooks/useLocation';
import { locationHeadingAsset } from './marker-assets';
import { useMarkerRedraw } from './useMarkerRedraw';

const coordinate = ([longitude, latitude]: number[]) => ({ longitude, latitude });
export const NativeRoutePaths = memo(function NativeRoutePaths({
  paths,
}: {
  paths: FeatureCollection;
}) {
  const lines = useMemo(
    () =>
      paths.features.flatMap((feature, index) =>
        feature.geometry.type === 'LineString'
          ? [
              {
                id: String(feature.id || index),
                coordinates: feature.geometry.coordinates.map(coordinate),
                color: feature.properties?.color || '#3b82f6',
                outline: feature.properties?.outline || '#0f172a',
              },
            ]
          : [],
      ),
    [paths],
  );
  return (
    <>
      {lines.map((line) => (
        <Polyline
          key={`${line.id}-outline`}
          coordinates={line.coordinates}
          strokeColor={line.outline}
          strokeWidth={8}
          zIndex={4}
        />
      ))}
      {lines.map((line) => (
        <Polyline
          key={line.id}
          coordinates={line.coordinates}
          strokeColor={line.color}
          strokeWidth={4}
          zIndex={5}
        />
      ))}
    </>
  );
});
export const NativeLocationOverlay = memo(function NativeLocationOverlay({
  position,
  heading,
  bearing,
}: Pick<LocationState, 'position' | 'heading'> & { bearing: number }) {
  const { t } = useTranslation();
  const marker = useMarkerRedraw([position, heading, bearing]);
  const center = useMemo(
    () =>
      position
        ? { longitude: position.coords.longitude, latitude: position.coords.latitude }
        : null,
    [position],
  );
  if (!position || !center) return null;
  const accuracy = position.coords.accuracy;
  const radius = Number.isFinite(accuracy) ? Math.max(1, Math.min(accuracy!, 50_000)) : 1;
  const showHeading = heading != null && Number.isFinite(heading) && heading >= 0;
  return (
    <>
      <Circle
        center={center}
        radius={radius}
        fillColor="#3b82f622"
        strokeColor="transparent"
        strokeWidth={0}
      />
      <Marker
        ref={marker}
        tracksViewChanges={false}
        title={t('your_location', { meters: Math.round(radius) })}
        coordinate={center}
        anchor={{ x: 0.5, y: 0.5 }}
        centerOffset={{ x: 0, y: 0 }}
        zIndex={40}
      >
        <View collapsable={false} onLayout={() => marker.current?.redraw()} style={styles.location}>
          {showHeading && (
            <Image
              source={locationHeadingAsset}
              onLoad={() => marker.current?.redraw()}
              style={{
                width: 80,
                height: 80,
                opacity: 0.3,
                transform: [{ rotate: `${screenHeading(heading, bearing)}deg` }],
              }}
            />
          )}
          <View style={styles.locationDot} />
        </View>
      </Marker>
    </>
  );
});
const styles = StyleSheet.create({
  location: {
    width: 80,
    height: 80,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3b82f6',
  },
});
