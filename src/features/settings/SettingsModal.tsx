import { RideSettings } from '~/features/rides/RideSettings';
import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { Link } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import { Platform, ScrollView, View } from 'react-native';
import { ActionRow } from '~/components/ui/ActionRow';
import { BrandMark } from '~/components/ui/BrandMark';
import { Button } from '~/components/ui/Button';
import { Choice } from '~/components/ui/Choice';
import { ModalFrame } from '~/components/ui/ModalFrame';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { Section } from '~/components/ui/Section';
import { Text } from '~/components/ui/Text';
import { fonts } from '~/lib/theme';
import { WalletEntry } from '~/features/tickets/components/WalletEntry';
import { BasemapSettings } from './BasemapSettings';
import { ModeFilters } from './ModeFilters';

export function SettingsModal() {
  const open = useUIStore((s) => s.isSettingsOpen);
  const theme = useUIStore((s) => s.theme);
  const { t, language } = useTranslation();
  const close = () => useUIStore.getState().setIsSettingsOpen(false);
  return (
    <ModalFrame presentation="task" visible={open} onClose={close} testID="settings-card">
      <ModalHeader title={t('settings')} onClose={close} />
      <ScrollView
        testID="settings-scroll"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Section title={t('language')} />
        <ActionRow accessibilityRole="radiogroup" accessibilityLabel={t('language')} style={{ paddingHorizontal: 16 }}>
          <Choice
            kind="radio"
            label="English"
            checked={language === 'en'}
            onPress={() => useUIStore.getState().setLanguage('en')}
            style={{ flex: 1 }}
          />
          <Choice
            kind="radio"
            label="Magyar"
            checked={language === 'hu'}
            onPress={() => useUIStore.getState().setLanguage('hu')}
            style={{ flex: 1 }}
          />
        </ActionRow>
        <Section title={t('theme')} />
        <ActionRow accessibilityRole="radiogroup" accessibilityLabel={t('theme')} style={{ paddingHorizontal: 16 }}>
          <Choice
            kind="radio"
            label={t('light')}
            checked={theme === 'light'}
            onPress={() => useUIStore.getState().setTheme('light')}
            style={{ flex: 1 }}
          />
          <Choice
            kind="radio"
            label={t('dark')}
            checked={theme === 'dark'}
            onPress={() => useUIStore.getState().setTheme('dark')}
            style={{ flex: 1 }}
          />
        </ActionRow>
        <RideSettings />
        <ModeFilters />
        <BasemapSettings />
        {Platform.OS !== 'web' && (
          <ActionRow style={{ padding: 16 }}>
            <WalletEntry onOpen={close} />
          </ActionRow>
        )}
        <Section title={t('about_app')} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
          <BrandMark size={24} />
          <Text style={{ fontFamily: fonts.semibold, fontSize: 18 }}>Merre</Text>
        </View>

        <ActionRow style={{ paddingHorizontal: 16 }}>
          <Link
            href="https://github.com/haverfalat/merre"
            target="_blank"
            rel="noopener noreferrer"
            asChild
          >
            <Button
              icon={ExternalLink}
              variant="ghost"
              label={t('source_code_github')}
              accessibilityRole="link"
              style={{ alignSelf: 'flex-start' }}
            />
          </Link>
        </ActionRow>
      </ScrollView>
    </ModalFrame>
  );
}
