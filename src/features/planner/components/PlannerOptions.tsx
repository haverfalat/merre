import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ModalFrame } from '~/components/ui/ModalFrame';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { Button } from '~/components/ui/Button';
import { ModeChoices } from '~/components/ui/transit/ModeChoices';
import { Choice } from '~/components/ui/Choice';
import { Select } from '~/components/ui/Select';
import { Text } from '~/components/ui/Text';
import { QueryError } from '~/components/ui/QueryError';
import { Empty } from '~/components/ui/Empty';
import { useTranslation } from '~/hooks/useTranslation';
import { getTransit, transitQueryKey } from '~/lib/transit/service';
import type { JourneyPreferences } from '~/lib/transit/types/plan';
import { type, useTheme } from '~/lib/theme';
import { defaultJourneyPreferences, toggleOption } from '../model/options';

export function PlannerOptions({
  value,
  onApply,
  onClose,
}: {
  value: JourneyPreferences;
  onApply(value: JourneyPreferences): void;
  onClose(): void;
}) {
  const [draft, setDraft] = useState(value);
  const { t, language } = useTranslation();
  const c = useTheme();
  const catalog = useQuery({
    queryKey: transitQueryKey('plan-options', language),
    queryFn: ({ signal }) => getTransit(signal, language).planOptions(),
    staleTime: 3600_000,
  });
  const disabledClasses = new Set(
    catalog.data?.filterGroups.flatMap((group) =>
      group.options
        .filter((option) => draft[group.field].includes(option.id))
        .flatMap((option) => option.disables),
    ),
  );
  const heading = (label: string) => (
    <Text accessibilityRole="header" style={{ ...type.section, marginTop: 8 }}>{label}</Text>
  );
  return (
    <ModalFrame presentation="task" visible onClose={onClose}>
      <ModalHeader title={t('planner_options')} onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {heading(t('planner_transport'))}
        <ModeChoices
          selected={draft.modes}
          onChange={(modes) => setDraft((state) => ({ ...state, modes }))}
        />
        {!draft.modes.length && (
          <Text style={{ color: c.warning, fontSize: 13 }}>{t('planner_select_mode')}</Text>
        )}
        {heading(t('planner_walk_speed'))}
        <Select
          label={t('planner_walk_speed')}
          value={String(draft.walkSpeed)}
          options={[4, 5, 6].map((speed) => ({
            value: String(speed / 3.6),
            label: t('planner_speed', { speed }),
          }))}
          onChange={(walkSpeed) => setDraft({ ...draft, walkSpeed: Number(walkSpeed) })}
        />
        {heading(t('planner_transfer_buffer'))}
        <Select
          label={t('planner_transfer_buffer')}
          value={String(draft.minTransferTime)}
          options={[0, 5, 10, 15].map((minutes) => ({
            value: String(minutes * 60),
            label: minutes ? t('duration_minutes', { minutes }) : t('planner_default_buffer'),
          }))}
          onChange={(minTransferTime) =>
            setDraft({ ...draft, minTransferTime: Number(minTransferTime) })
          }
        />
        <Choice
          kind="checkbox"
          variant="row"
          label={t('planner_accessible')}
          checked={draft.wheelchair}
          onPress={() => setDraft({ ...draft, wheelchair: !draft.wheelchair })}
        />
        {catalog.isPending && <Empty loading />}
        {catalog.isError && (
          <QueryError
            retry={() => {
              void catalog.refetch();
            }}
          />
        )}
        {catalog.data?.comfortGroups.map((group, index) => (
          <View key={`comfort-${index}`} style={{ gap: 7 }}>
            {heading(group.label)}
            <Text style={{ color: c.secondary, fontSize: 14, lineHeight: 20 }}>
              {t(index === 0 ? 'planner_class_hint' : 'planner_bike_hint')}
            </Text>
            {group.options.map((option) => (
              <Choice
                key={option.id}
                kind="checkbox"
                variant="row"
                label={option.label}
                checked={draft.comfortLevels.includes(option.id)}
                disabled={disabledClasses.has(option.id)}
                style={{ opacity: disabledClasses.has(option.id) ? 0.4 : 1 }}
                onPress={() =>
                  setDraft({
                    ...draft,
                    comfortLevels: toggleOption(draft.comfortLevels, option.id),
                  })
                }
              />
            ))}
          </View>
        ))}
        {catalog.data?.filterGroups.map((group) => (
          <View key={group.field} style={{ gap: 7 }}>
            {heading(group.label)}
            {group.field === 'transitPassFilter' && (
              <Text style={{ color: c.secondary, fontSize: 14, lineHeight: 20 }}>{t('planner_pass_hint')}</Text>
            )}
            {group.options.map((option) => (
              <Choice
                key={option.id}
                kind="checkbox"
                variant="row"
                label={option.label}
                checked={draft[group.field].includes(option.id)}
                onPress={() =>
                  setDraft({
                    ...draft,
                    [group.field]: toggleOption(draft[group.field], option.id),
                    comfortLevels: draft[group.field].includes(option.id)
                      ? draft.comfortLevels
                      : draft.comfortLevels.filter((level) => !option.disables.includes(level)),
                  })
                }
              />
            ))}
          </View>
        ))}
      </ScrollView>
      <View
        style={{
          padding: 12,
          borderTopWidth: 1,
          borderColor: c.border,
          flexDirection: 'row',
          gap: 8,
        }}
      >
        <Button
          label={t('planner_reset_options')}
          onPress={() => setDraft(defaultJourneyPreferences())}
        />
        <Button
          label={t('planner_apply')}
          variant="primary"
          disabled={!draft.modes.length}
          onPress={() => {
            onApply(draft);
            onClose();
          }}
          style={{ flex: 1, minHeight: 48 }}
        />
      </View>
    </ModalFrame>
  );
}
