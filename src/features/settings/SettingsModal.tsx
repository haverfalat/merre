import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { Moon, Sun } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { ActionRow } from '~/components/ui/ActionRow';
import { Button } from '~/components/ui/Button';
import { ModalFooter } from '~/components/ui/ModalFooter';
import { ModalFrame } from '~/components/ui/ModalFrame';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { Section } from '~/components/ui/Section';
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
