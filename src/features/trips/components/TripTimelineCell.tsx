import { createContext, useContext, type ComponentProps } from 'react';

import { View, type FlatListProps } from 'react-native';

import type { tripTimelineItems } from '~/features/trips/model/trip-timeline';

type Item = ReturnType<typeof tripTimelineItems>[number];

export const TimelineLayers = createContext(-1);

type TimelineCellProps = ComponentProps<NonNullable<FlatListProps<Item>['CellRendererComponent']>>;

export function TripTimelineCell({
  children,
  index,
  style,
  onLayout,
  onFocusCapture,
}: TimelineCellProps) {
  const foreground = useContext(TimelineLayers);
  return (
    <View
      onLayout={onLayout}
      onFocusCapture={onFocusCapture}
      style={[style, { overflow: 'visible', zIndex: index === foreground ? 2 : 0 }]}
    >
      {children}
    </View>
  );
}
