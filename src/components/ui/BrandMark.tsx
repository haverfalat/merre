import { Image } from 'react-native';

export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <Image
      source={require('../../../assets/branding/mark.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
