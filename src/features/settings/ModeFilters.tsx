import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dict';
import type { Mode } from '@/lib/transit/types/common';
import { useMapStore } from '@/store/useMapStore';
import { View } from 'react-native';
import { Choice } from '~/components/ui/Choice';
import { Section } from '~/components/ui/Section';
import { Text } from '~/components/ui/Text';
import { ModeIcon } from '~/components/ui/transit/ModeIcon';
import { useTheme } from '~/lib/theme';

const modes: readonly [Mode, TranslationKey][] = [
  ['RAIL', 'rail'],
  ['SUBURBAN_RAILWAY', 'suburban_railway'],
  ['COACH', 'coach'],
  ['BUS', 'bus'],
  ['TRAM', 'tram'],
  ['TRAMTRAIN', 'tramtrain'],
  ['SUBWAY', 'subway'],
  ['TROLLEYBUS', 'trolleybus'],
  ['FERRY', 'ferry'],
  ['RAIL_REPLACEMENT_BUS', 'rail_replacement_bus'],
];

export function ModeFilters() {
  const selected = useMapStore((s) => s.selectedModes);
  const c = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <Section title={t('filter_modes')} />
      <View style={{ paddingHorizontal: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {modes.map(([mode, key]) => (
          <Choice
            key={mode}
            kind="checkbox"
            label={t(key)}
            checked={selected.includes(mode)}
            onPress={() =>
              useMapStore
                .getState()
                .setSelectedModes(
                  selected.includes(mode)
                    ? selected.filter((m) => m !== mode)
                    : [...selected, mode],
                )
            }
            style={{ flexGrow: 1, flexBasis: '45%' }}
          >
            <ModeIcon mode={mode} size={15} color={selected.includes(mode) ? c.accent : c.muted} />
            <Text style={{ flex: 1, fontSize: 11 }}>{t(key)}</Text>
          </Choice>
        ))}
      </View>
    </>
  );
}
