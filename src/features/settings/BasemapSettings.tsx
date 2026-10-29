import { useTranslation } from '@/hooks/useTranslation';
import { BASEMAPS, getBasemap } from '@/lib/basemaps';
import { useUIStore } from '@/store/useUIStore';
import { ChevronDown, ChevronUp, Map } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { Choice } from '~/components/ui/Choice';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { fonts, useTheme } from '~/lib/theme';
import { useNativeMapPreferences } from '~/store/useNativeMapPreferences';

export function BasemapSettings() {
  const [expanded, setExpanded] = useState(false);
  const mapStyle = useUIStore((s) => s.mapStyle);
  const apple3D = useNativeMapPreferences((s) => s.appleSatellite3D) && Platform.OS === 'ios';
  const { t, language } = useTranslation();
  const c = useTheme();
  const appleTitle = language === 'hu' ? 'Apple 3D műhold' : 'Apple 3D satellite';
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 12,
        borderTopWidth: 1,
        borderColor: c.border,
        borderRadius: 0,
        overflow: 'hidden',
      }}
    >
      <ListRow
        accessibilityLabel={t('map_style')}
        aria-expanded={expanded}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={{ minHeight: 56, paddingVertical: 12, backgroundColor: c.card }}
      >
        <Map size={16} color={c.secondary} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 14, fontFamily: fonts.semibold }}>{t('map_style')}</Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
            {apple3D ? appleTitle : t(getBasemap(mapStyle).name)}
          </Text>
        </View>
        <Chevron size={15} color={c.secondary} />
      </ListRow>
      {expanded && (
        <View style={{ padding: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
          {BASEMAPS.map((map) => (
            <BasemapChoice
              key={map.id}
              label={t(map.name)}
              provider={map.provider}
              selected={!apple3D && mapStyle === map.id}
              onSelect={() => {
                useNativeMapPreferences.getState().setAppleSatellite3D(false);
                useUIStore.getState().setMapStyle(map.id);
              }}
            />
          ))}
          {Platform.OS === 'ios' && (
            <BasemapChoice
              label={appleTitle}
              provider={
                language === 'hu'
                  ? 'Apple Térképek · ahol elérhető'
                  : 'Apple Maps · where available'
              }
              selected={apple3D}
              onSelect={() => useNativeMapPreferences.getState().setAppleSatellite3D(true)}
            />
          )}
        </View>
      )}
    </View>
  );
}

function BasemapChoice({
  label,
  provider,
  selected,
  onSelect,
}: {
  label: string;
  provider: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const c = useTheme();
  return (
    <Choice
      kind="radio"
      label={`${label} · ${provider}`}
      checked={selected}
      onPress={onSelect}
      style={{ minHeight: 48, flexGrow: 1, flexBasis: '45%' }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 13, fontFamily: fonts.medium }}>{label}</Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>{provider}</Text>
      </View>
    </Choice>
  );
}
