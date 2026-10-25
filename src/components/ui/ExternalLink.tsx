import { safeExternalUrl } from '@/lib/external-url';
import { Linking, Pressable, type StyleProp, type TextStyle } from 'react-native';
import { fonts, useTheme } from '~/lib/theme';
import { Text } from './Text';

export function ExternalLink({
  label,
  url,
  size = 'regular',
  textStyle,
}: {
  label: string;
  url: string;
  size?: 'regular' | 'caption';
  textStyle?: StyleProp<TextStyle>;
}) {
  const c = useTheme();
  const target = safeExternalUrl(url);
  if (!target) return null;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={size === 'caption' ? 0 : 6}
      onPress={() => {
        void Linking.openURL(target).catch(() => {});
      }}
      style={{ minHeight: size === 'caption' ? 0 : 28, justifyContent: 'center' }}
    >
      <Text
        style={[
          {
            color: c.accent,
            fontSize: size === 'caption' ? 8 : 11,
            fontFamily: size === 'caption' ? fonts.regular : fonts.semibold,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
