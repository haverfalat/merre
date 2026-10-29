import { safeExternalUrl } from '@/lib/external-url';
import { Linking, Pressable, type StyleProp, type TextStyle } from 'react-native';
import { controls, fonts, useTheme } from '~/lib/theme';
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
      style={{ minHeight: size === 'caption' ? 0 : controls.target, justifyContent: 'center' }}
    >
      <Text
        style={[
          {
            color: c.accent,
            fontSize: size === 'caption' ? 11 : 14,
            lineHeight: size === 'caption' ? 16 : 20,
            fontFamily: size === 'caption' ? fonts.regular : fonts.semibold,
            textDecorationLine: size === 'caption' ? 'none' : 'underline',
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
