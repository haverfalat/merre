import { useTranslation } from '@/hooks/useTranslation';
import { safeExternalUrl } from '@/lib/external-url';
import type { Alert } from '@/lib/transit/types/alerts';
import { useState } from 'react';
import { View } from 'react-native';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { fonts, useTheme } from '~/lib/theme';
import { Button } from '../Button';
import { Card } from '../Card';
import { ExternalLink } from '../ExternalLink';

export function AlertCard({ alert }: { alert: Alert }) {
  const c = useTheme();
  const { language, t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const translated = (
    translations: Alert['alertHeaderTextTranslations'],
    fallback: string | null,
  ) => translations?.find((x) => x.language?.startsWith(language))?.text || fallback;
  const header = translated(alert.alertHeaderTextTranslations, alert.alertHeaderText);
  const description = translated(
    alert.alertDescriptionTextTranslations,
    alert.alertDescriptionText,
  );
  const url = safeExternalUrl(translated(alert.alertUrlTranslations, alert.alertUrl));
  const severity =
    alert.alertSeverityLevel === 'SEVERE'
      ? c.danger
      : alert.alertSeverityLevel === 'WARNING'
        ? c.warning
        : c.accent;
  return (
    <Card
      surface="surface"
      style={{
        marginHorizontal: 10,
        marginVertical: 4,
        padding: 9,
        gap: 5,
        borderRadius: 3,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 7, alignItems: 'flex-start' }}>
        <View
          style={{ width: 7, height: 7, marginTop: 4, borderRadius: 4, backgroundColor: severity }}
        />
        <View style={{ flex: 1, gap: 4 }}>
          {!!header && (
            <TransitLabel html={header} style={{ fontFamily: fonts.semibold, fontSize: 14 }} />
          )}
          {!!description && (
            <TransitLabel
              html={description}
              numberOfLines={expanded ? undefined : 3}
              style={{ fontSize: 14, color: c.secondary, lineHeight: 21 }}
            />
          )}
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            {!!description && description.length > 140 && (
              <Button
                variant="text"
                size="small"
                label={t(expanded ? 'show_less' : 'show_more')}
                aria-expanded={expanded}
                accessibilityState={{ expanded }}
                onPress={() => setExpanded(!expanded)}
              />
            )}
            {url && <ExternalLink label={t('details')} url={url} />}
          </View>
        </View>
      </View>
    </Card>
  );
}
