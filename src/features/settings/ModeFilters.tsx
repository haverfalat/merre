import { View } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { useMapStore } from '@/store/useMapStore';
import { Section } from '~/components/ui/Section';
import { ModeChoices } from '~/components/ui/transit/ModeChoices';

export function ModeFilters() {
  const selected = useMapStore((state) => state.selectedModes);
  const { t } = useTranslation();
  return (
    <>
      <Section title={t('filter_modes')} />
      <View style={{ paddingHorizontal: 12 }}>
        <ModeChoices selected={selected} onChange={useMapStore.getState().setSelectedModes} />
      </View>
    </>
  );
}
