import type { Feature } from 'geojson';
import { memo } from 'react';
import { Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { STOP_LABEL_STYLE } from './stop-label-style';
import type { StopLabel } from './label-layout';
import { useMarkerRedraw } from './useMarkerRedraw';

export const NativeStopLabel = memo(function NativeStopLabel({
  label,
  onSelect,
}: {
  label: StopLabel;
  onSelect: (feature: Feature) => void;
}) {
  const { feature, text, width, height, offset } = label;
  const p = feature.properties!;
  const marker = useMarkerRedraw([text, width, height, offset, p.background, p.textColor]);
  return (
    <Marker
      ref={marker}
      identifier={`label-${feature.id}`}
      coordinate={{
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      centerOffset={{ x: 0, y: 0 }}
      zIndex={9}
      tracksViewChanges={false}
      onPress={(event) => {
        event.stopPropagation();
        onSelect(feature);
      }}
    >
      <View
        collapsable={false}
        onLayout={() => marker.current?.redraw()}
        style={{ width: 320, height: 160 }}
      >
        <Text
          allowFontScaling={false}
          style={{
            position: 'absolute',
            left: 160 + offset[0] - width / 2,
            top: 80 + offset[1] - height / 2,
            width,
            height,
            paddingHorizontal: 5,
            paddingVertical: 3,
            fontSize: STOP_LABEL_STYLE.fontSize,
            lineHeight: STOP_LABEL_STYLE.lineHeight,
            color: p.textColor,
            backgroundColor: p.background,
            borderRadius: 4,
            textAlign: p.journey ? 'center' : 'left',
            includeFontPadding: false,
          }}
        >
          {p.direction ? <>
            {p.name}
            <Text style={{ fontSize: STOP_LABEL_STYLE.fontSize * 0.9 }}>{'\n'}{p.direction}{p.timeLabel ? `\n${p.timeLabel}` : ''}</Text>
          </> : text}
        </Text>
      </View>
    </Marker>
  );
});
