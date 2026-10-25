import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Use the visible viewport when a mobile browser displays its keyboard. */
export function useViewport() {
  const windowSize = useWindowDimensions();
  const nativeInsets = useSafeAreaInsets();
  const [web, setWeb] = useState<{
    width: number;
    height: number;
    top: number;
    insets: typeof nativeInsets;
  } | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const update = () => {
      const css = getComputedStyle(document.documentElement);
      const read = (edge: string) => Number.parseFloat(css.getPropertyValue(`--safe-${edge}`)) || 0;
      setWeb({
        width: window.innerWidth,
        height: window.visualViewport?.height ?? window.innerHeight,
        top: window.visualViewport?.offsetTop ?? 0,
        insets: {
          top: read('top'),
          right: read('right'),
          bottom: read('bottom'),
          left: read('left'),
        },
      });
    };
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);
  // Match the server on the first client render. Otherwise React keeps the
  // server's height:0 style when the client initially computes a different size.
  if (Platform.OS === 'web')
    return {
      width: web?.width ?? 0,
      height: web?.height ?? 0,
      top: web?.top ?? 0,
      insets: web?.insets ?? { top: 0, right: 0, bottom: 0, left: 0 },
    };
  return { width: windowSize.width, height: windowSize.height, top: 0, insets: nativeInsets };
}
