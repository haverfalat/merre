import { screenHeading } from '@/lib/vehicle-camera';
import type { Feature, Point } from 'geojson';
import { memo, useState } from 'react';
import { Image, Text as NativeText, Platform, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Circle, Path } from 'react-native-svg';
import { fonts, useTheme } from '~/lib/theme';
import { markerPointerPath, roundedMarkerEdge } from './marker-heading';
import { stopRingImage } from './stop-sprite';
import { useMarkerRedraw } from './useMarkerRedraw';

const CENTER = 48;
function MarkerPointer({ path, color, outline, strokeWidth = 0 }: {
  path: string; color: string; outline?: string; strokeWidth?: number;
}) {
  return <Svg pointerEvents="none" width={96} height={96} viewBox="-48 -48 96 96"
    style={{ position: 'absolute', inset: 0 }}>
    <Path d={path} fill={color} stroke={outline} strokeWidth={strokeWidth} strokeLinejoin="round" />
  </Svg>;
}
export const NativeVehicleMarker = memo(function NativeVehicleMarker({
  feature,
  bearing,
  onSelect,
}: {
  feature: Feature<Point>;
  bearing: number;
  onSelect: (feature: Feature) => void;
}) {
  const p = feature.properties!;
  const c = useTheme();
  const heading = screenHeading(p.heading, bearing);
  const [badgeSize, setBadgeSize] = useState({ width: p.bodyWidth + p.outlineWidth * 2, height: p.bodyHeight + p.outlineWidth * 2 });
  const border = p.outlineWidth;
  const edge = p.showLabel
    ? roundedMarkerEdge(Math.max(1, badgeSize.width - border * 2), Math.max(1, badgeSize.height - border * 2), 4, heading)
    : p.size / 2;
  const pointer = markerPointerPath(heading, edge + border / 2, p.headingSize);
  const outline = p.selected ? p.outline : p.showLabel ? '#000000' : 'rgba(255,255,255,0.706)';

  const marker = useMarkerRedraw([
    badgeSize.width,
    badgeSize.height,
    p.size,
    p.showLabel,
    p.showHeading,
    p.showDelay,
    p.selected,
    p.displayLabel,
    p.color,
    p.delay,
    p.heading,
    bearing,
    c.text,
  ]);
  return (
    <Marker
      ref={marker}
      identifier={String(feature.id)}
      coordinate={{
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      centerOffset={{ x: 0, y: 0 }}
      zIndex={p.selected ? 30 : 20}
      tracksViewChanges={false}
      onPress={(event) => {
        event.stopPropagation();
        onSelect(feature);
      }}
    >
      <View collapsable={false} onLayout={() => marker.current?.redraw()} style={styles.frame}>
        {p.showHeading && <MarkerPointer path={pointer} color={outline} outline={outline} strokeWidth={border * 2} />}
        <View pointerEvents="none" style={styles.center}>
          {p.showLabel ? (
            <View
              onLayout={({ nativeEvent: { layout } }) => setBadgeSize((previous) =>
                previous.width === layout.width && previous.height === layout.height ? previous : { width: layout.width, height: layout.height })}
              style={{
                backgroundColor: p.color,
                borderRadius: 5,
                borderWidth: p.selected ? 2 : 2.5,
                borderColor: p.selected ? p.outline : '#000000',
                paddingHorizontal: 6,
                paddingVertical: 4,
              }}
            >
              <NativeText
                numberOfLines={1}
                allowFontScaling={false}
                style={{
                  fontFamily: p.symbol
                    ? fonts.symbols
                    : Platform.OS === 'ios'
                      ? undefined
                      : 'sans-serif',
                  fontWeight: p.symbol ? '400' : '700',
                  fontSize: 12,
                  lineHeight: 14,
                  includeFontPadding: false,
                  color: p.textColor,
                }}
              >
                {p.displayLabel}
              </NativeText>
            </View>
          ) : (
            <View
              style={{
                width: p.size + border * 2,
                height: p.size + border * 2,
                borderRadius: p.size / 2 + border,
                backgroundColor: p.color,
                borderWidth: p.selected ? 2 : p.strokeWidth,
                borderColor: p.selected ? p.outline : 'rgba(255,255,255,0.706)',
              }}
            />
          )}
        </View>
        {p.showHeading && <MarkerPointer path={pointer} color={p.color} />}
        {p.showDelay && !!p.delay && (
          <View pointerEvents="none" style={[styles.delay, { backgroundColor: p.delayColor }]}>
            <NativeText
              allowFontScaling={false}
              style={{
                fontSize: 10,
                fontWeight: '700',
                lineHeight: 12,
                color: p.delayTextColor,
                includeFontPadding: false,
              }}
            >
              {p.delay}
            </NativeText>
          </View>
        )}
      </View>
    </Marker>
  );
});
export const NativeStopMarker = memo(function NativeStopMarker({
  feature,
  bearing,
  onSelect,
}: {
  feature: Feature<Point>;
  bearing: number;
  onSelect: (feature: Feature) => void;
}) {
  const p = feature.properties!;
  const c = useTheme();
  const radius: number = p.radius;
  const heading = screenHeading(p.bearing ?? 0, bearing);
  const marker = useMarkerRedraw([
    radius,
    p.bearing,
    bearing,
    p.color,
    p.selected,
    p.ring,
    p.journey,
    c.card,
  ]);
  const ring = p.ring ? stopRingImage(p.ring) : null;
  return (
    <Marker
      ref={marker}
      identifier={String(feature.id)}
      coordinate={{
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      centerOffset={{ x: 0, y: 0 }}
      zIndex={10}
      tracksViewChanges={false}
      onPress={(event) => {
        event.stopPropagation();
        onSelect(feature);
      }}
    >
      <View collapsable={false} onLayout={() => marker.current?.redraw()} style={styles.frame}>
        <View pointerEvents="none" style={styles.center}>
          <Svg
            width={(radius + 8) * 2}
            height={(radius + 8) * 2}
            viewBox={`${-radius - 8} ${-radius - 8} ${(radius + 8) * 2} ${(radius + 8) * 2}`}
          >
            {p.selected && (
              <Circle r={radius + 7} fill="#38bdf841" stroke="#38bdf8" strokeWidth={2} />
            )}
            <Circle r={radius} fill={p.background} stroke={p.color} strokeWidth={p.journey ? 2 : 0} />
          </Svg>
          {ring && (
            <Image
              source={{ uri: ring.uri }}
              style={{
                position: 'absolute',
                width: ring.size * p.ringSize,
                height: ring.size * p.ringSize,
                left: CENTER - (ring.size * p.ringSize) / 2,
                top: CENTER - (ring.size * p.ringSize) / 2,
                transform: [{ rotate: `${heading}deg` }],
              }}
            />
          )}

        </View>
      </View>
    </Marker>
  );
});
const styles = StyleSheet.create({
  frame: { width: 96, height: 96, backgroundColor: 'transparent' },
  center: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  delay: {
    position: 'absolute',
    top: CENTER + 13,
    alignSelf: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
});
