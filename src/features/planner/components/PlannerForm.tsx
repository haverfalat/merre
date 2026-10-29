import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ArrowDownUp, Circle, MapPin, Search, SlidersHorizontal } from 'lucide-react-native';
import { Button } from '~/components/ui/Button';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { DateTimeInput } from '~/components/ui/DateTimeInput';
import { useNow } from '~/hooks/useNow';
import { useTranslation } from '~/hooks/useTranslation';
import type { LocationState } from '~/hooks/useLocation';
import { serviceDate, serviceDayBounds } from '~/lib/transit/time/service-day';
import { fonts, useTheme } from '~/lib/theme';
import { feedback } from '~/lib/feedback';
import { usePlannerStore } from '~/store/usePlannerStore';
import { journeyTime, sameEndpoint } from '../model/journey';
import { defaultJourneyPreferences, preferenceCount } from '../model/options';
import { EndpointPicker } from './EndpointPicker';
import { PlannerOptions } from './PlannerOptions';

export function PlannerForm({
  loading,
  location,
  onSearch,
}: {
  loading: boolean;
  location: LocationState;
  onSearch?: () => void;
}) {
  const from = usePlannerStore((state) => state.from);
  const to = usePlannerStore((state) => state.to);
  const request = usePlannerStore((state) => state.request);
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [preferences, setPreferences] = useState(
    () => request?.preferences ?? defaultJourneyPreferences(),
  );
  const when = usePlannerStore((state) => state.timeMode);
  const setWhen = usePlannerStore((state) => state.setTimeMode);
  const [date, setDate] = useState(() => request?.date ?? serviceDate(Date.now()));
  const [time, setTime] = useState(() => request?.time ?? journeyTime(Date.now()));
  const { t, language } = useTranslation();
  const c = useTheme();
  const now = useNow();
  const identical = sameEndpoint(from, to);
  const count = preferenceCount(preferences);
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        <View
          style={{
            flex: 1,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.surface,
            overflow: 'hidden',
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 22,
              top: 34,
              bottom: 34,
              width: 2,
              backgroundColor: c.strong,
            }}
          />
          {(['from', 'to'] as const).map((field) => {
            const point = field === 'from' ? from : to;
            const Icon = field === 'from' ? Circle : MapPin;
            return (
              <ListRow
                key={field}
                onPress={() => setPicker(field)}
                accessibilityLabel={`${t(field === 'from' ? 'planner_from' : 'planner_to')}: ${point?.name || t('planner_choose_place')}`}
                style={{
                  minHeight: 64,
                  paddingHorizontal: 12,
                  borderTopWidth: field === 'to' ? 1 : 0,
                  borderColor: c.border,
                }}
              >
                <View style={{ width: 20, alignItems: 'center', backgroundColor: c.surface, paddingVertical: 4 }}>
                  <Icon size={16} color={c.text} />
                </View>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
                    {t(field === 'from' ? 'planner_from' : 'planner_to')}
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: fonts.medium,
                      color: point ? c.text : c.muted,
                    }}
                  >
                    {point?.name || t('planner_choose_place')}
                  </Text>
                </View>
              </ListRow>
            );
          })}
        </View>
        <Button
          icon={ArrowDownUp}
          label={t('planner_swap')}
          size="icon"
          variant="ghost"
          onPress={usePlannerStore.getState().swap}
          style={{ width: 44, height: 44 }}
        />
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel={t('planner_depart_at')}
        style={{ flexDirection: 'row', backgroundColor: c.surface, padding: 3, borderRadius: 6, gap: 2 }}>
        {(['now', 'depart', 'arrive'] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: when === option }}
            onPress={() => { feedback(); setWhen(option); }}
            style={({ pressed }) => ({ flex: 1, minWidth: 0, minHeight: 38, paddingHorizontal: 4,
              paddingVertical: 6, borderRadius: 4, alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed || when === option ? c.raised : 'transparent' })}
          >
            <Text style={{ fontSize: 14, lineHeight: 20, textAlign: 'center', fontFamily: when === option ? fonts.semibold : fonts.regular,
              color: when === option ? c.text : c.secondary }}>
              {t(option === 'now' ? 'planner_now' : option === 'depart' ? 'planner_depart_at' : 'planner_arrive_by')}
            </Text>
          </Pressable>
        ))}
      </View>
      {when !== 'now' && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 4,
            borderRadius: 3,
            backgroundColor: c.surface,
          }}
        >
          <DateTimeInput
            date={date}
            time={time}
            dateLabel={new Intl.DateTimeFormat(language === 'hu' ? 'hu-HU' : 'en-GB', {
              month: 'short',
              day: 'numeric',
              weekday: 'short',
              timeZone: 'UTC',
            }).format(new Date(`${date}T12:00:00Z`))}
            minimum={serviceDayBounds(now, -7).date}
            maximum={serviceDayBounds(now, 365).date}
            onDate={setDate}
            onTime={setTime}
          />
        </View>
      )}
      {identical && (
        <Text accessibilityRole="alert" style={{ color: c.warning, fontSize: 13 }}>
          {t('planner_same_place')}
        </Text>
      )}
      <View style={{ gap: 8 }}>
        <Button
          variant="ghost"
          icon={SlidersHorizontal}
          label={`${t('planner_options')}${count ? ` (${count})` : ''}`}
          selected={!!count}
          onPress={() => setOptionsOpen(true)}
          style={{ minHeight: 44, alignSelf: 'flex-start' }}
        />
        <Button
          icon={Search}
          label={t(loading ? 'planner_searching' : 'planner_search')}
          variant="primary"
          loading={loading}
          disabled={!from || !to || identical}
          style={{ minHeight: 48 }}
          onPress={() => {
            if (!from || !to || identical) return;
            onSearch?.();
            const now = Date.now();
            usePlannerStore.getState().search({
              from,
              to,
              date: when === 'now' ? serviceDate(now) : date,
              time: when === 'now' ? journeyTime(now) : time,
              arriveBy: when === 'arrive',
              preferences,
            });
          }}
        />
      </View>
      {picker && (
        <EndpointPicker field={picker} onClose={() => setPicker(null)} location={location} />
      )}
      {optionsOpen && (
        <PlannerOptions
          value={preferences}
          onApply={setPreferences}
          onClose={() => setOptionsOpen(false)}
        />
      )}
    </View>
  );
}
