import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { useTranslation } from '~/hooks/useTranslation';
import { RidePreview } from './RidePreview';
import { Choice } from '~/components/ui/Choice';
import { Section } from '~/components/ui/Section';
import { Text } from '~/components/ui/Text';
import { available, isTracking, resumeTracking, setTracking } from './tracking.ios';

export function RideSettings() {
  const { t, language } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!available) return;
    const refresh = () => { void isTracking().then(setEnabled).catch(() => setError(true)).finally(() => setBusy(false)); };
    refresh();

  }, []);
  return <View style={{ paddingHorizontal: 16, gap: 6 }}>
    <Section title={t('ride_activity')} />
    <Choice kind="checkbox" checked={enabled} disabled={!available || busy} label={t('ride_detection')}
      onPress={async () => {
        setBusy(true);
        setError(false);
        try { await setTracking(!enabled, language); setEnabled(!enabled); }
        catch { setError(true); }
        finally { setBusy(false); }
      }} />
    <Text>{t(!available ? 'ride_build' : error ? 'ride_error' : 'ride_help')}</Text>
    <RidePreview />
  </View>;
}
export function useRideTracking() {
  useEffect(() => {
    if (!available) return;
    const refresh = () => { void resumeTracking().catch(() => {}); };
    refresh();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => listener.remove();
  }, []);
}
