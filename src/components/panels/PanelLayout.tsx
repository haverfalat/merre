import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { View, useWindowDimensions } from 'react-native';

const PanelWidth = createContext<number | undefined>(undefined);

/** Table headers and rows must respond to their panel, including desktop sidebars. */
export function PanelLayout({ children }: PropsWithChildren) {
  const [width, setWidth] = useState<number>();
  return (
    <View
      style={{ flex: 1, minHeight: 0, minWidth: 0 }}
      onLayout={({ nativeEvent }) => {
        if (nativeEvent.layout.width > 0) setWidth(nativeEvent.layout.width);
      }}
    >
      <PanelWidth.Provider value={width}>{children}</PanelWidth.Provider>
    </View>
  );
}

export function usePanelDimensions() {
  const window = useWindowDimensions();
  const width = useContext(PanelWidth);
  return { ...window, width: width ?? window.width };
}
