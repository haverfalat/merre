import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { background, clipShape, font, frame, lineLimit, monospacedDigit, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';
import type { ComponentProps } from 'react';

export type RideDisplay = {
  route: string; destination: string; color: string; ink: string;
  symbol: NonNullable<ComponentProps<typeof Image>['systemName']>;
  status: string; nextTime: string;
  rows: { name: string; time: string; delay: string }[];
};
function RideLayout(props: RideDisplay) {
  'widget';
  const badge = <Image systemName={props.symbol} size={14} color={props.ink}
    modifiers={[frame({ width: 24, height: 24 }), background(props.color), clipShape('circle')]} />;
  const line = <HStack spacing={4}>{badge}<Text modifiers={[font({ weight: 'bold' })]}>{props.route}</Text></HStack>;
  const stops = <VStack alignment="leading" spacing={2}>
    {props.rows.map((row, i) => <HStack key={i} spacing={5}>
      <Image systemName={i === 0 ? 'circle.inset.filled' : 'circle'} size={9} color={props.color} />
      <Text modifiers={[font({ size: 14 }), lineLimit(1)]}>{row.name}</Text>
      <Spacer />
      <Text modifiers={[font({ size: 12 }), monospacedDigit()]}>{row.delay}</Text>
      <Text modifiers={[font({ size: 14, weight: 'semibold' }), monospacedDigit()]}>{row.time}</Text>
    </HStack>)}
  </VStack>;
  return {
    banner: <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 10 })]}>
      <HStack spacing={5}>{line}<Image systemName="arrow.right" size={12} />
        <Text modifiers={[font({ size: 16, weight: 'semibold' }), lineLimit(1)]}>{props.destination}</Text>
      </HStack><Text modifiers={[font({ size: 12 })]}>{props.status}</Text>{stops}
    </VStack>,
    compactLeading: line, compactTrailing: <Text>{props.nextTime}</Text>, minimal: badge,
    expandedLeading: line, expandedTrailing: <Text>{props.status}</Text>,
    expandedBottom: <VStack alignment="leading"><Text modifiers={[lineLimit(1)]}>→ {props.destination}</Text>{stops}</VStack>,
  };
}
export default createLiveActivity('TransitRide', RideLayout);
