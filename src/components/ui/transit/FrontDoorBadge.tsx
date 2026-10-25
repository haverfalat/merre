import { useTranslation } from '@/hooks/useTranslation';
import { ArrowRight } from 'lucide-react-native';
import { View } from 'react-native';

export function FrontDoorBadge({ size = 18 }: { size?: number }) {
  const { t } = useTranslation();
  const diameter = size;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('front_door_boarding')}
      style={{
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        backgroundColor: '#16a34a',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <ArrowRight size={Math.max(6, diameter - 4)} color="#ffffff" strokeWidth={3} />
    </View>
  );
}
