import { useTranslation } from '@/hooks/useTranslation';
import { View } from 'react-native';
import { type, useTheme } from '~/lib/theme';
import { Text } from '../Text';
import { FrontDoorBadge } from './FrontDoorBadge';

export function FrontDoorNotice({ size = 'regular' }: { size?: 'regular' | 'compact' }) {
  const { t } = useTranslation();
  const c = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: size === 'compact' ? 5 : 6,
      }}
    >
      <FrontDoorBadge size={16} />
      <Text
        style={{
          ...type.meta,
          color: size === 'compact' ? c.secondary : c.success,
        }}
      >
        {t('front_door_boarding')}
      </Text>
    </View>
  );
}
