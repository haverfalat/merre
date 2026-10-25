import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { Moon, Sun } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { ActionRow } from '~/components/ui/ActionRow';
import { BrandMark } from '~/components/ui/BrandMark';
import { Button } from '~/components/ui/Button';
import { ModalFooter } from '~/components/ui/ModalFooter';
import { ModalFrame } from '~/components/ui/ModalFrame';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { Section } from '~/components/ui/Section';
import { Text } from '~/components/ui/Text';
import { fonts } from '~/lib/theme';
import { BasemapSettings } from './BasemapSettings';
import { ModeFilters } from './ModeFilters';

export function SettingsModal() {
  const open = useUIStore((s) => s.isSettingsOpen);
  const theme = useUIStore((s) => s.theme);
  const { t, language } = useTranslation();
  const close = () => useUIStore.getState().setIsSettingsOpen(false);
  return (
    <ModalFrame visible={open} onClose={close} testID="settings-card">
      <ModalHeader title={t('settings')} onClose={close} />
      <ScrollView
        testID="settings-scroll"
        contentContainerStyle={{ paddingBottom: 10 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
          <BrandMark size={36} />
          <Text style={{ fontFamily: fonts.semibold, fontSize: 24 }}>Merre</Text>
        </View>
        <Section title={t('language')} />
        <ActionRow style={{ paddingHorizontal: 12 }}>
          <Button
            label="English"
            selected={language === 'en'}
            onPress={() => useUIStore.getState().setLanguage('en')}
            style={{ flex: 1 }}
          />
          <Button
            label="Magyar"
            selected={language === 'hu'}
            onPress={() => useUIStore.getState().setLanguage('hu')}
            style={{ flex: 1 }}
          />
        </ActionRow>
        <Section title={t('theme')} />
        <ActionRow style={{ paddingHorizontal: 12 }}>
          <Button
            icon={Sun}
            label={t('light')}
            selected={theme === 'light'}
            onPress={() => useUIStore.getState().setTheme('light')}
            style={{ flex: 1 }}
          />
          <Button
            icon={Moon}
            label={t('dark')}
            selected={theme === 'dark'}
            onPress={() => useUIStore.getState().setTheme('dark')}
            style={{ flex: 1 }}
          />
        </ActionRow>
        <ModeFilters />
        <BasemapSettings />
      </ScrollView>
      <ModalFooter onClose={close} variant="primary" />
    </ModalFrame>
  );
}
