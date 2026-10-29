import { useTranslation } from '@/hooks/useTranslation';

import { TableHeader } from '~/components/ui/TableHeader';

import { usePanelDimensions } from '~/components/panels/PanelLayout';
import { useTheme } from '~/lib/theme';
import { platformColumnWidth, tripTableLayout } from '~/lib/transit-table';
export function TripTimelineHeader({ mode, showPlatform = false }: { mode?: string | null; showPlatform?: boolean }) {
  const c = useTheme();
  const { width, fontScale } = usePanelDimensions();
  const { timeWidth, train, reflow } = tripTableLayout(width, fontScale, mode);
  const { t } = useTranslation();
  if (!train && !showPlatform) return null;
  return (
    <TableHeader
      style={{ paddingLeft: 37, backgroundColor: c.surface }}
      columns={[
        { key: 'station', label: reflow ? `${t('station')} · ${t('departure')}` : t('station') },
        ...(!reflow ? [
          ...(train ? [{ key: 'arrival', label: t('arrival'), width: timeWidth, align: 'right' as const }] : []),
          { key: 'departure', label: t('departure'), width: timeWidth, align: 'right' as const },
        ] : []),
        ...(showPlatform ? [{
          key: 'platform',
          label: t('platform_short'),
          accessibilityLabel: t('platform'),
          width: platformColumnWidth(fontScale),
          align: 'center' as const,
        }] : []),
      ]}
    />
  );
}
