import { ScrollView, View } from 'react-native';
import { Route, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { Select } from '~/components/ui/Select';
import { Empty } from '~/components/ui/Empty';
import { QueryError } from '~/components/ui/QueryError';
import { Card } from '~/components/ui/Card';
import { useJourneyPlan } from '~/hooks/useJourneyPlan';
import { useTranslation } from '~/hooks/useTranslation';
import type { LocationState } from '~/hooks/useLocation';
import { fonts, useTheme } from '~/lib/theme';
import { usePlannerStore } from '~/store/usePlannerStore';
import { sortJourneys } from './model/journey';
import { PlannerForm } from './components/PlannerForm';
import { JourneyCard } from './components/JourneyCard';
import { JourneyDetails } from './components/JourneyDetails';

export function PlannerPanel({ location }: { location: LocationState }) {
  const result = useJourneyPlan();
  const request = usePlannerStore((state) => state.request);
  const sort = usePlannerStore((state) => state.sort);
  const detail = usePlannerStore((state) => state.detail);
  const selectedId = usePlannerStore((state) => state.selectedId);
  const { t } = useTranslation();
  const c = useTheme();
  const journeys = sortJourneys(result.data?.journeys ?? [], sort);
  const selected = journeys.find((journey) => journey.id === selectedId) ?? journeys[0];
  const fastest = Math.min(...journeys.map((journey) => journey.duration));
  return (
    <ScrollView
      key={detail ? selected?.id : 'results'}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 14, gap: 16 }}
    >
      {detail && selected ? (
        <JourneyDetails journey={selected} />
      ) : (
        <>
          <PlannerForm loading={result.isFetching} location={location} />
          {!request ? (
            <View style={{ paddingVertical: 15, gap: 10, alignItems: 'center' }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  backgroundColor: c.accentMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Route size={23} color={c.accent} />
              </View>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 15 }}>
                {t('planner_intro_title')}
              </Text>
              <Text style={{ color: c.muted, textAlign: 'center', fontSize: 12, lineHeight: 18 }}>
                {t('planner_intro')}
              </Text>
            </View>
          ) : (
            <>
              {result.isFetching && <Empty loading />}
              {result.isError && (
                <QueryError
                  stale={!!result.data}
                  retry={() => {
                    void result.refetch();
                  }}
                />
              )}
              {!result.isFetching && result.data && !journeys.length && (
                <View style={{ gap: 8 }}>
                  <Empty message={t('planner_no_journeys')} />
                  {result.data.errors.map((error) => (
                    <Text key={error} style={{ fontSize: 11, color: c.muted }}>
                      {error}
                    </Text>
                  ))}
                </View>
              )}
              {!!journeys.length && !result.isFetching && (
                <>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Text
                      accessibilityLiveRegion="polite"
                      style={{ flex: 1, fontSize: 13, fontFamily: fonts.semibold }}
                    >
                      {t('planner_results', { count: journeys.length })}
                    </Text>
                    <View style={{ width: 160 }}>
                      <Select
                        label={t('planner_sort')}
                        value={sort}
                        options={(['departure', 'arrival', 'duration', 'transfers'] as const).map(
                          (value) => ({ value, label: t(`planner_sort_${value}`) }),
                        )}
                        onChange={(value) =>
                          usePlannerStore.getState().setSort(value as typeof sort)
                        }
                      />
                    </View>
                  </View>
                  {journeys.map((journey) => (
                    <JourneyCard
                      key={journey.id}
                      journey={journey}
                      selected={journey.id === selected?.id}
                      fastest={journey.duration === fastest}
                      onPress={() => usePlannerStore.getState().selectJourney(journey.id)}
                    />
                  ))}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button
                      icon={ArrowLeft}
                      label={t('planner_earlier')}
                      disabled={!result.data?.previousPageCursor}
                      onPress={() =>
                        usePlannerStore
                          .getState()
                          .search({ ...request, pageCursor: result.data?.previousPageCursor })
                      }
                      style={{ flex: 1 }}
                    />
                    <Button
                      icon={ArrowRight}
                      label={t('planner_later')}
                      disabled={!result.data?.nextPageCursor}
                      onPress={() =>
                        usePlannerStore
                          .getState()
                          .search({ ...request, pageCursor: result.data?.nextPageCursor })
                      }
                      style={{ flex: 1 }}
                    />
                  </View>
                  <Text style={{ fontSize: 10, color: c.muted, lineHeight: 15 }}>
                    {t('planner_timetable_note')}
                  </Text>
                </>
              )}
              {result.data?.warnings.map((warning) => (
                <Card key={warning} tone="warning" style={{ padding: 10 }}>
                  <Text style={{ fontSize: 11, color: c.warning }}>{warning}</Text>
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
