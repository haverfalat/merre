import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { Select } from '~/components/ui/Select';
import { Empty } from '~/components/ui/Empty';
import { RefreshSkeleton, SkeletonCards } from '~/components/ui/Skeleton';
import { QueryError } from '~/components/ui/QueryError';
import { Card } from '~/components/ui/Card';
import { useJourneyPlan } from '~/hooks/useJourneyPlan';
import { useTranslation } from '~/hooks/useTranslation';
import type { LocationState } from '~/hooks/useLocation';
import { fonts, useTheme } from '~/lib/theme';
import { usePlannerStore } from '~/store/usePlannerStore';
import { preferenceCount } from './model/options';
import { sortJourneys } from './model/journey';
import { PlannerForm } from './components/PlannerForm';
import { JourneyCard } from './components/JourneyCard';
import { JourneyDetails } from './components/JourneyDetails';

export function PlannerPanel({ location }: { location: LocationState }) {
  const result = useJourneyPlan();
  const request = usePlannerStore((state) => state.request);
  const [editing, setEditing] = useState(false);
  const sort = usePlannerStore((state) => state.sort);
  const detail = usePlannerStore((state) => state.detail);
  const selectedId = usePlannerStore((state) => state.selectedId);
  const { t, language } = useTranslation();
  const c = useTheme();
  const journeys = sortJourneys(result.data?.journeys ?? [], sort);
  const selected = journeys.find((journey) => journey.id === selectedId) ?? journeys[0];
  const fastest = Math.min(...journeys.map((journey) => journey.duration));
  return (
    <ScrollView
      key={detail ? selected?.id : 'results'}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      {detail && selected ? (
        <JourneyDetails journey={selected} />
      ) : (
        <>
          {request && !editing ? (
            <View
              style={{ paddingBottom: 16, borderBottomWidth: 1, borderColor: c.border, gap: 12 }}
            >
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 15, lineHeight: 22, fontFamily: fonts.medium }}>
                  {t('planner_from')}: {request.from.name}
                </Text>
                <Text style={{ fontSize: 15, lineHeight: 22, fontFamily: fonts.medium }}>
                  {t('planner_to')}: {request.to.name}
                </Text>
              </View>
              <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
                {t(request.arriveBy ? 'planner_arrive_by' : 'planner_depart_at')} ·{' '}
                {new Intl.DateTimeFormat(language === 'hu' ? 'hu-HU' : 'en-GB', {
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'UTC',
                }).format(new Date(`${request.date}T12:00:00Z`))}{' '}
                · {request.time}
                {request.preferences && preferenceCount(request.preferences) > 0
                  ? ` · ${t('planner_options')} (${preferenceCount(request.preferences)})`
                  : ''}
              </Text>
              <Button
                variant="ghost"
                label={t('planner_edit_search')}
                onPress={() => setEditing(true)}
                style={{ alignSelf: 'flex-start' }}
              />
            </View>
          ) : (
            <PlannerForm
              loading={result.isFetching}
              location={location}
              onSearch={() => setEditing(false)}
            />
          )}

          {request && !editing && (
            <>
              {result.isFetching && !result.data && <SkeletonCards kind="journey" />}
              <RefreshSkeleton active={result.isFetching && !!result.data} />
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
                    <Text key={error} style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
                      {error}
                    </Text>
                  ))}
                </View>
              )}
              {!!journeys.length && (
                <>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}
                  >
                    <Text
                      accessibilityLiveRegion="polite"
                      style={{ flex: 1, fontSize: 15, fontFamily: fonts.semibold }}
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
                  <View>
                    {journeys.map((journey) => (
                      <JourneyCard
                        key={journey.id}
                        journey={journey}
                        selected={journey.id === selectedId}
                        fastest={journey.duration === fastest}
                        onPress={() => usePlannerStore.getState().selectJourney(journey.id)}
                      />
                    ))}
                  </View>
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
                  <Text style={{ fontSize: 14, color: c.secondary, lineHeight: 20 }}>
                    {t('planner_timetable_note')}
                  </Text>
                </>
              )}
              {result.data?.warnings.map((warning) => (
                <Card key={warning} tone="warning" style={{ padding: 10 }}>
                  <Text style={{ fontSize: 13, color: c.warning }}>{warning}</Text>
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
