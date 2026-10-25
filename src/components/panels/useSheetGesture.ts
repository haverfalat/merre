import { mobileSheetFraction, mobileSheetHeight, mobileSheetSnaps } from '@/lib/mobile-sheet';
import { useUIStore } from '@/store/useUIStore';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Keyboard, PanResponder } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

export function useSheetGesture(height: number) {
  const fraction = useUIStore((s) => s.mobileSheetFraction);
  const reduced = useReducedMotion();
  const short = height < 500;
  const snaps = mobileSheetSnaps(short);
  const currentHeight = mobileSheetHeight(height, fraction, short);
  const [animatedHeight] = useState(() => new Animated.Value(currentHeight));
  const [dragStart] = useState(() => ({ height: currentHeight }));
  useEffect(() => {
    if (reduced) {
      animatedHeight.setValue(currentHeight);
      return;
    }
    Animated.spring(animatedHeight, {
      toValue: currentHeight,
      useNativeDriver: false,
      damping: 28,
      stiffness: 260,
      mass: 0.8,
    }).start();
  }, [animatedHeight, currentHeight, reduced]);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
        onPanResponderGrant: () => {
          Keyboard.dismiss();
          useUIStore.getState().setSearchFocused(false);
          animatedHeight.stopAnimation((value) => {
            dragStart.height = value;
          });
        },
        onPanResponderMove: (_, gesture) =>
          animatedHeight.setValue(
            Math.max(
              156,
              Math.min(height * mobileSheetSnaps(short)[2], dragStart.height - gesture.dy),
            ),
          ),
        onPanResponderRelease: (_, gesture) => {
          const projected = (dragStart.height - gesture.dy - gesture.vy * 80) / height;
          const next = mobileSheetFraction(projected, short);
          useUIStore.getState().setMobileSheetFraction(next);
          if (reduced) {
            animatedHeight.setValue(mobileSheetHeight(height, next, short));
            return;
          }
          Animated.spring(animatedHeight, {
            toValue: mobileSheetHeight(height, next, short),
            useNativeDriver: false,
            damping: 28,
            stiffness: 260,
          }).start();
        },
        onPanResponderTerminate: () =>
          Animated.spring(animatedHeight, {
            toValue: mobileSheetHeight(height, useUIStore.getState().mobileSheetFraction, short),
            useNativeDriver: false,
          }).start(),
      }),
    [animatedHeight, dragStart, height, short, reduced],
  );
  const toggle = () =>
    useUIStore
      .getState()
      .setMobileSheetFraction(
        fraction >= snaps[2] ? snaps[1] : fraction <= snaps[0] ? snaps[1] : snaps[2],
      );
  return {
    fraction,
    animatedHeight,
    pan,
    toggle,
    expanded: fraction >= snaps[2],
    adjust: (action: string) =>
      useUIStore.getState().setMobileSheetFraction(action === 'increment' ? snaps[2] : snaps[0]),
  };
}
