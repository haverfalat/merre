import { useTranslation } from '@/hooks/useTranslation';
import { useMapStore } from '@/store/useMapStore';
import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ActionRow } from '~/components/ui/ActionRow';
import { Button } from '~/components/ui/Button';
import { ModeIcon } from '~/components/ui/transit/ModeIcon';
import { RouteDestination } from '~/components/ui/transit/RouteDestination';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { fonts, useTheme } from '~/lib/theme';

export function PanelHeader({
  title,
  subtitle,
  routeLabel,
  mode,
  color,
  actions,
  headerActions,
  boarding = 'none',
  variant = 'regular',
  bkk = false,
}: {
  bkk?: boolean;
  title?: string | null;
  subtitle?: string | null;
  routeLabel?: string | null;
  mode?: string | null;
  color?: string | null;
  actions?: ReactNode;
  headerActions?: ReactNode;
  boarding?: 'none' | 'front-door';
  variant?: 'compact' | 'regular';
}) {
  const c = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: c.border,
        gap: 4,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {!routeLabel && variant !== 'compact' && (
          <ModeIcon mode={mode} size={20} color={c.secondary} />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          {routeLabel ? (
            <RouteDestination
              bkk={bkk}
              leading="mode"
              size="regular"
              boarding={boarding}
              label={routeLabel}
              mode={mode}
              color={color}
              destination={title || t('details')}
              lines={2}
            />
          ) : (
            <TransitLabel
              html={title || t('details')}
              placeName
              accessibilityRole="header"
              style={{ fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26 }}
            />
          )}
          {!!subtitle && <TransitLabel html={subtitle} style={{ fontSize: 14, lineHeight: 20, color: c.secondary }} />}
        </View>
        {headerActions}
        <Button
          icon={X}
          size="icon"
          label={t('close')}
          onPress={useMapStore.getState().clearSelection}
          variant="ghost"
        />
      </View>
      {actions && <ActionRow>{actions}</ActionRow>}
    </View>
  );
}
