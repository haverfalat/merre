import { useTranslation } from '@/hooks/useTranslation';

import { isRailMode } from '@/lib/transit/modes';

import { TableHeader } from '~/components/ui/TableHeader';

import { useWindowDimensions } from 'react-native';
import { useTheme } from '~/lib/theme';
import { platformColumnWidth, tripTimeColumnWidth } from '~/lib/transit-table';
export function TripTimelineHeader({ mode, showPlatform = false }: { mode?: string | null; showPlatform?: boolean }) {
  const c = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const timeWidth = tripTimeColumnWidth(fontScale);
  const train = isRailMode(mode);
  const reflow = fontScale > 1.3 || (train && (fontScale > 1.1 || width < 390));
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
