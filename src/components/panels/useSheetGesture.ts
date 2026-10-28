import { MIN_SHEET_HEIGHT, mobileSheetFraction, mobileSheetHeight, mobileSheetSnaps } from '@/lib/mobile-sheet';
import { motion } from '~/lib/theme';
import { useUIStore } from '@/store/useUIStore';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Keyboard, PanResponder } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

export function useSheetGesture(height: number, visible = true) {
  const fraction = useUIStore((s) => s.mobileSheetFraction);
  const reduced = useReducedMotion();
  const short = height < 500;
  const snaps = mobileSheetSnaps(short);
  const currentHeight = mobileSheetHeight(height, fraction, short);
  const [animatedHeight] = useState(() => new Animated.Value(currentHeight));
  const [dragStart] = useState(() => ({ height: currentHeight }));
  useEffect(() => {
    // Keep the outgoing drawer at its current height while its exit runs.
    if (!visible) {
      animatedHeight.stopAnimation();
      return;
    }
    if (reduced) {
      animatedHeight.setValue(currentHeight);
      return;
    }
    const animation = Animated.timing(animatedHeight, {
      toValue: currentHeight,
      useNativeDriver: false,
      duration: motion.standard,
    });
    animation.start();
    return () => animation.stop();
  }, [animatedHeight, currentHeight, reduced, visible]);
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
            Math.min(
              height,
              Math.max(
                Math.min(MIN_SHEET_HEIGHT, height),
                Math.min(height * mobileSheetSnaps(short)[2], dragStart.height - gesture.dy),
              ),
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
          Animated.timing(animatedHeight, {
            toValue: mobileSheetHeight(height, next, short),
            useNativeDriver: false,
            duration: motion.standard,
          }).start();
        },
        onPanResponderTerminate: () =>
          Animated.timing(animatedHeight, {
            toValue: mobileSheetHeight(height, useUIStore.getState().mobileSheetFraction, short),
            useNativeDriver: false,
            duration: reduced ? 0 : motion.standard,
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
    adjust: (action: string) =>
      useUIStore.getState().setMobileSheetFraction(action === 'increment' ? snaps[2] : snaps[0]),
  };
}
