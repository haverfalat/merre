import { usePlannerStore } from '~/store/usePlannerStore';
import { useTranslation } from '@/hooks/useTranslation';
import { DEFAULT_SHEET_FRACTION } from '@/lib/mobile-sheet';
import { useUIStore } from '@/store/useUIStore';
import { Search, Settings, X, Route } from 'lucide-react-native';
import { useEffect, useId, useRef, useState, type ComponentRef } from 'react';
import {
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Button } from '~/components/ui/Button';
import { BrandMark } from '~/components/ui/BrandMark';
import { Empty } from '~/components/ui/Empty';
import { Section } from '~/components/ui/Section';
import { Skeleton } from '~/components/ui/Skeleton';
import { Text } from '~/components/ui/Text';
import { feedback } from '~/lib/feedback';
import { fonts, useTheme } from '~/lib/theme';
import type { SearchResult } from './search-results';
import { SearchResultRow } from './SearchResultRow';
import { useTransitSearch } from './useTransitSearch';

export function SearchHeader() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const listId = useId();
  const root = useRef<ComponentRef<typeof View>>(null);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const list = useRef<FlatList<SearchResult>>(null);
  const focused = useUIStore((s) => s.searchFocused);
  const { t } = useTranslation();
  const c = useTheme();
  const { height } = useWindowDimensions();
  const { results, searching, failed, retry } = useTransitSearch(query, focused);
  const dismiss = () => {
    useUIStore.getState().setSearchFocused(false);
    input.current?.blur();
    Keyboard.dismiss();
  };
  const select = (result: SearchResult) => {
    feedback();
    result.select();
    useUIStore.getState().setMobileSheetFraction(DEFAULT_SHEET_FRACTION);
    setQuery('');
    dismiss();
  };
  useEffect(() => {
    if (!focused || Platform.OS !== 'web') return;
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !(root.current as unknown as HTMLElement)?.contains(event.target)
      ) {
        useUIStore.getState().setSearchFocused(false);
        input.current?.blur();
        setActive(-1);
      }
    };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [focused]);
  return (
    <View ref={root} style={{ flexShrink: 1 }}>
      <View
        style={[
          styles.bar,
          { backgroundColor: c.card, borderColor: focused ? c.accent : c.border },
        ]}
      >
        {searching && focused && query ? (
          <Skeleton width={19} height={19} />
        ) : focused ? (
          <Search size={19} color={c.muted} />
        ) : (
          <BrandMark size={24} />
        )}
        <TextInput
          ref={input}
          role="combobox"
          aria-expanded={focused && !!query.trim()}
          aria-busy={searching}
          {...(Platform.OS === 'web'
            ? {
                'aria-controls': focused && query.trim() ? listId : undefined,
                'aria-autocomplete': 'list',
                'aria-activedescendant':
                  focused && active >= 0 && results[active] ? `${listId}-${active}` : undefined,
              }
            : {})}
          accessibilityState={{ expanded: focused && !!query.trim(), busy: searching }}
          accessibilityLabel={t('search_placeholder')}
          placeholder={t('search_placeholder')}
          placeholderTextColor={c.muted}
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            setActive(-1);
            useUIStore.getState().setSearchFocused(true);
          }}
          onFocus={() => useUIStore.getState().setSearchFocused(true)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (results[active < 0 ? 0 : active]) select(results[active < 0 ? 0 : active]);
          }}
          onKeyPress={(event) => {
            const key = event.nativeEvent.key;
            if (key === 'Escape') {
              event.preventDefault();
              dismiss();
            }
            if ((key === 'ArrowDown' || key === 'ArrowUp') && results.length) {
              event.preventDefault();
              const direction = key === 'ArrowDown' ? 1 : -1;
              const next =
                active < 0
                  ? direction > 0
                    ? 0
                    : results.length - 1
                  : (active + direction + results.length) % results.length;
              setActive(next);
              list.current?.scrollToIndex({ index: next, viewPosition: 0.5 });
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 42,
            fontFamily: fonts.regular,
            fontSize: 16,
            color: c.text,
          }}
        />
        {!!query && (
          <Button
            variant="ghost"
            size="icon"
            icon={X}
            label={t('clear_search')}
            onPress={() => {
              setQuery('');
              input.current?.focus();
            }}
            style={styles.icon}
          />
        )}
        {!focused && (
          <Button
            variant="ghost"
            size="regular"
            icon={Route}
            label={t('planner_entry')}
            onPress={() => {
              dismiss();
              usePlannerStore.getState().openPlanner();
            }}
            style={styles.icon}
          />
        )}
        <Button
          variant="ghost"
          size={focused ? 'regular' : 'icon'}
          icon={focused ? undefined : Settings}
          label={focused ? t('cancel') : t('settings')}
          onPress={() => {
            dismiss();
            if (!focused) useUIStore.getState().setIsSettingsOpen(true);
          }}
          style={styles.icon}
        />
      </View>
      {focused && !!query.trim() && (
        <View
          style={[
            styles.results,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              maxHeight: Math.max(100, Math.min(448, height - 110)),
            },
          ]}
        >
          <FlatList
            ref={list}
            nativeID={listId}
            accessibilityRole={Platform.OS === 'web' ? 'listbox' : 'list'}
            accessibilityLabel={t('search_results')}
            data={results}
            keyExtractor={(r) => r.key}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={12}
            onScrollToIndexFailed={({ averageItemLength, index }) =>
              list.current?.scrollToOffset({ offset: averageItemLength * index })
            }
            ListEmptyComponent={
              !searching && !failed ? <Empty message={t('no_results')} /> : undefined
            }
            ListFooterComponent={
              <>
                {searching && <Empty loading message={t('searching')} />}
                {failed && (
                  <View style={{ padding: 9, gap: 5 }}>
                    <Text style={{ fontSize: 11, color: c.warning }}>
                      {t('partial_search_error')}
                    </Text>
                    <Button variant="ghost" label={t('retry')} onPress={retry} />
                  </View>
                )}
              </>
            }
            renderItem={({ item, index }) => (
              <View>
                {(index === 0 || results[index - 1].section !== item.section) && (
                  <Section title={t(item.section)} />
                )}
                <SearchResultRow
                  item={item}
                  id={`${listId}-${index}`}
                  active={active === index}
                  onActivate={() => setActive(index)}
                  onSelect={() => select(item)}
                />
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 11,
    paddingRight: 3,
    gap: 7,
    borderRadius: 10,
    borderWidth: 1,
    boxShadow: '0 4px 12px #00000030',
  },
  icon: { paddingHorizontal: 9 },
  results: {
    flexShrink: 1,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: '0 8px 24px #00000040',
  },
});
