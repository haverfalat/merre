import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { controls, type, useTheme } from '~/lib/theme';
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
          ? { minHeight: controls.target, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: c.border }
          : compact ? { minHeight: controls.compact, paddingVertical: 8 } : undefined}
        accessibilityLabel={title}
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={{
          flex: 1,
          ...type.section,
          color: c.text,
          ...(variant === 'section' ? { includeFontPadding: false } : {}),
        }}>{title}</Text>
        <Icon size={18} color={c.muted} />
      </ListRow>
      {expanded && children}
    </View>
  );
}
