import { useState } from 'react';
import { View } from 'react-native';
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
import { usePlannerStore } from '~/store/usePlannerStore';
import { journeyTime, sameEndpoint } from '../model/journey';
import { defaultJourneyPreferences, preferenceCount } from '../model/options';
import { EndpointPicker } from './EndpointPicker';
import { PlannerOptions } from './PlannerOptions';

export function PlannerForm({ loading, location }: { loading: boolean; location: LocationState }) {
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
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        <View
          style={{
            flex: 1,
            borderRadius: 10,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            overflow: 'hidden',
          }}
        >
          {(['from', 'to'] as const).map((field) => {
            const point = field === 'from' ? from : to;
            const Icon = field === 'from' ? Circle : MapPin;
            return (
              <ListRow
                key={field}
                onPress={() => setPicker(field)}
                accessibilityLabel={`${t(field === 'from' ? 'planner_from' : 'planner_to')}: ${point?.name || t('planner_choose_place')}`}
                style={{
                  minHeight: 48,
                  borderTopWidth: field === 'to' ? 1 : 0,
                  borderColor: c.border,
                }}
              >
                <Icon size={16} color={field === 'from' ? c.accent : c.success} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={{ fontSize: 10, color: c.muted }}>
                    {t(field === 'from' ? 'planner_from' : 'planner_to')}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 13,
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
          style={{ width: 40, height: 44 }}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {(['now', 'depart', 'arrive'] as const).map((option) => (
          <Button
            key={option}
            label={t(
              option === 'now'
                ? 'planner_now'
                : option === 'depart'
                  ? 'planner_depart_at'
                  : 'planner_arrive_by',
            )}
            selected={when === option}
            onPress={() => setWhen(option)}
            style={{ flex: 1, minHeight: 34 }}
          />
        ))}
      </View>
      {when !== 'now' && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 4,
            borderRadius: 7,
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
        <Text accessibilityRole="alert" style={{ color: c.warning, fontSize: 11 }}>
          {t('planner_same_place')}
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button
          icon={SlidersHorizontal}
          label={`${t('planner_options')}${count ? ` (${count})` : ''}`}
          selected={!!count}
          onPress={() => setOptionsOpen(true)}
          style={{ minHeight: 42 }}
        />
        <Button
          icon={Search}
          label={t(loading ? 'planner_searching' : 'planner_search')}
          variant="primary"
          loading={loading}
          disabled={!from || !to || identical}
          style={{ flex: 1, minHeight: 42 }}
          onPress={() => {
            if (!from || !to || identical) return;
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
