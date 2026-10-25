import { useTranslation } from '@/hooks/useTranslation';

import { isRailMode } from '@/lib/transit/modes';

import { TableHeader } from '~/components/ui/TableHeader';

import { useTheme } from '~/lib/theme';
export function TripTimelineHeader({ mode }: { mode?: string | null }) {
  const c = useTheme();
  const { t } = useTranslation();
  if (!isRailMode(mode)) return null;
  return (
    <TableHeader
      style={{ paddingLeft: 41, backgroundColor: c.surface }}
      columns={[
        { key: 'station', label: t('station') },
        { key: 'arrival', label: t('arrival'), width: 44, align: 'right' },
        { key: 'departure', label: t('departure'), width: 44, align: 'right' },
        {
          key: 'platform',
          label: t('platform_short'),
          accessibilityLabel: t('platform'),
          width: 30,
          align: 'center',
        },
      ]}
    />
  );
}
