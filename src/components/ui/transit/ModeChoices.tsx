import { View } from 'react-native';
import { Choice } from '~/components/ui/Choice';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { TRANSIT_MODE_OPTIONS } from '~/lib/transit/modes';
import type { Mode } from '~/lib/transit/types/common';
import { useTheme } from '~/lib/theme';
import { ModeIcon } from './ModeIcon';

export function ModeChoices({
  selected,
  onChange,
}: {
  selected: Mode[];
  onChange(modes: Mode[]): void;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {TRANSIT_MODE_OPTIONS.map(([mode, key]) => (
        <Choice
          key={mode}
          kind="checkbox"
          label={t(key)}
          checked={selected.includes(mode)}
          onPress={() =>
            onChange(
              selected.includes(mode)
                ? selected.filter((item) => item !== mode)
                : [...selected, mode],
            )
          }
          style={{ flexGrow: 1, flexBasis: '45%', minHeight: 34, paddingHorizontal: 8, paddingVertical: 6, gap: 6 }}
        >
          <ModeIcon mode={mode} size={14} color={selected.includes(mode) ? c.accent : c.muted} />
          <Text style={{ flex: 1, fontSize: 12, lineHeight: 16 }}>{t(key)}</Text>
        </Choice>
      ))}
    </View>
  );
}
