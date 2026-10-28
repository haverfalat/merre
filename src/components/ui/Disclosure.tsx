import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { fonts, useTheme } from '~/lib/theme';
import { ListRow } from './ListRow';
import { Text } from './Text';
import { useDensity } from './Density';

/** A labeled optional section. Its state is separate from a choice or checkbox. */
export function Disclosure({
  title,
  children,
  initialOpen = false,
  variant = 'default',
}: {
  title: string;
  children: ReactNode;
  initialOpen?: boolean;
  variant?: 'default' | 'section';
}) {
  const [expanded, setExpanded] = useState(initialOpen);
  const c = useTheme();
  const compact = useDensity() === 'compact';
  const Icon = expanded ? ChevronDown : ChevronRight;
  return (
    <View>
      <ListRow
        style={variant === 'section'
          ? { minHeight: 36, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: c.surface, borderBottomWidth: 1, borderColor: c.border }
          : compact ? { minHeight: 36, paddingVertical: 8 } : undefined}
        accessibilityLabel={title}
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={{
          flex: 1,
          fontFamily: compact ? fonts.semibold : fonts.medium,
          ...(compact ? { fontSize: 12, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.6 } : {}),
          ...(variant === 'section' ? { fontSize: 14, lineHeight: 20, includeFontPadding: false, fontFamily: fonts.semibold, color: c.text, textTransform: 'none', letterSpacing: 0 } : {}),
        }}>{title}</Text>
        <Icon size={18} color={c.muted} />
      </ListRow>
      {expanded && children}
    </View>
  );
}
