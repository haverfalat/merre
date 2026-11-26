import { StyleSheet, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Disclosure } from '~/components/ui/Disclosure';
import { Text } from '~/components/ui/Text';
import { ModeCircle } from '~/components/ui/transit/ModeCircle';
import { useTranslation } from '~/hooks/useTranslation';
import type { RideDisplay } from './activity.ios';

const example: RideDisplay = {
  route: '20E', destination: 'Keleti pályaudvar M', color: '#009EE3', ink: '#0f172a',
  symbol: 'bus.fill', status: '+3 min', nextTime: '16:42',
  rows: [
    { name: 'Hősök tere M', time: '16:42', delay: '+3 min' },
    { name: 'Keleti pályaudvar M', time: '16:52', delay: '+2 min' },
  ],
};

export function RidePreview() {
  const { t } = useTranslation();
  const line = <View style={s.line}>
    <ModeCircle mode="BUS" color={example.color} size={24} />
    <Text style={s.bold}>{example.route}</Text>
  </View>;
  return <Disclosure title={t('ride_preview')}>
    <View style={{ gap: 8 }}>
      <Text>{t('ride_lock_screen')}</Text>
      <View style={s.banner}>
        <View style={s.line}>{line}<ArrowRight size={14} color="white" />
          <Text numberOfLines={1} style={[s.bold, { flexShrink: 1 }]}>{example.destination}</Text>
        </View>
        <Text style={s.detail}>{example.status}</Text>
        {example.rows.map((row, index) => <View key={row.name} style={s.line}>
          <Text style={{ color: example.color }}>{index === 0 ? '◉' : '○'}</Text>
          <Text numberOfLines={1} style={[s.stop, { flex: 1 }]}>{row.name}</Text>
          <Text style={s.detail}>{row.delay}</Text>
          <Text style={s.time}>{row.time}</Text>
        </View>)}
      </View>
      <Text>{t('ride_compact_island')}</Text>
      <View style={[s.line, s.island]}>{line}<Text style={s.time}>{example.nextTime}</Text></View>
    </View>
  </Disclosure>;
}
const s = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  banner: { backgroundColor: '#1c1c1e', borderRadius: 18, padding: 12, gap: 4 },
  island: { alignSelf: 'center', gap: 36, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 24, backgroundColor: '#000' },
  bold: { fontSize: 16, fontWeight: '700', color: 'white' },
  detail: { fontSize: 12, color: '#ddd', fontVariant: ['tabular-nums'] },
  stop: { fontSize: 14, color: 'white' },
  time: { fontSize: 14, fontWeight: '600', color: 'white', fontVariant: ['tabular-nums'] },
});
