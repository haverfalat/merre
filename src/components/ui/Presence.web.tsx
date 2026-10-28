import { useLayoutEffect, useRef, useState, type ComponentRef } from 'react';
import { View } from 'react-native';
import type { PresenceProps } from './Presence.types';

/** Keep React in charge of removal; never reparent nodes to animate an exit. */
export function Presence({ visible, preset = 'fade', entering, exiting, children, ...props }: PresenceProps) {
  void entering;
  void exiting;
  const root = useRef<ComponentRef<typeof View>>(null);
  const [content, setContent] = useState(children);
  const [present, setPresent] = useState(visible);
  if (visible && children !== content) setContent(() => children);
  if (visible && !present) setPresent(true);
  useLayoutEffect(() => {
    if (!present) return;
    const element = root.current as unknown as HTMLElement | null;
    if (!element?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let canceled = false;
      if (!visible) queueMicrotask(() => { if (!canceled) setPresent(false); });
      return () => { canceled = true; };
    }
    const distance = preset === 'sheet' ? element.getBoundingClientRect().height + 24
      : preset === 'dropdown' ? -8 : preset === 'popup' ? 8 : 0;
    const hidden = { opacity: 0, transform: `translateY(${distance}px)` };
    const shown = { opacity: 1, transform: 'translateY(0)' };
    const animation = element.animate(visible ? [hidden, shown] : [shown, hidden], {
      duration: visible ? 200 : 150,
      easing: visible ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'ease-in',
      fill: 'both',
    });
    let canceled = false;
    void animation.finished.then(() => {
      if (!canceled && !visible) setPresent(false);
    }).catch(() => {});
    return () => { canceled = true; animation.cancel(); };
  }, [visible, present, preset]);
  return present ? <View {...props} ref={root}
    pointerEvents={visible ? props.pointerEvents : 'none'} aria-hidden={!visible || props['aria-hidden']}>
    {visible ? children : content}
  </View> : null;
}
