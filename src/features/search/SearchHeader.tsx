import { useTranslation } from '@/hooks/useTranslation';
import { DEFAULT_SHEET_FRACTION } from '@/lib/mobile-sheet';
import { useUIStore } from '@/store/useUIStore';
import { Search, X } from 'lucide-react-native';
import { useEffect, useId, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { Easing, FadeInDown, FadeOutUp, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { Presence } from '~/components/ui/Presence';
import { Button } from '~/components/ui/Button';
import { BrandMark } from '~/components/ui/BrandMark';
import { Empty } from '~/components/ui/Empty';
import { Section } from '~/components/ui/Section';
import { RefreshSkeleton, SkeletonRows } from '~/components/ui/Skeleton';
import { Text } from '~/components/ui/Text';
import { feedback } from '~/lib/feedback';
import { elevation, fonts, radii, useTheme } from '~/lib/theme';
import type { SearchResult } from './search-results';
import { SearchResultRow } from './SearchResultRow';
import { useTransitSearch } from './useTransitSearch';
import { useViewport } from '~/hooks/useViewport';

const searchEnter = FadeInDown.duration(180).easing(Easing.bezier(0.22, 1, 0.36, 1))
  .withInitialValues({ translateY: -8 }).reduceMotion(ReduceMotion.System);
const searchExit = FadeOutUp.duration(140).withTargetValues({ translateY: -6 }).reduceMotion(ReduceMotion.System);
const searchLayout = LinearTransition.duration(180).easing(Easing.bezier(0.22, 1, 0.36, 1)).reduceMotion(ReduceMotion.System);

export function SearchHeader({ docked = false, floating = false }: { docked?: boolean; floating?: boolean }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const listId = useId();
  const root = useRef<ComponentRef<typeof View>>(null);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const list = useRef<FlatList<SearchResult>>(null);
  const focused = useUIStore((s) => s.searchFocused);
  useEffect(() => {
    if (focused) input.current?.focus();
  }, [focused]);
  const { t } = useTranslation();
  const c = useTheme();
  const viewport = useViewport();
  const grow = focused && !floating;
  const { results, searching, failed, retry } = useTransitSearch(query, focused);
  const dismiss = () => {
    setActive(-1);
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
    <Animated.View ref={root} pointerEvents="box-none" layout={Platform.OS === 'web' ? undefined : searchLayout}
      style={{ flexGrow: grow ? 1 : 0, flexShrink: 1, flexBasis: grow ? 0 : 'auto', minHeight: 0 }}>
      <View
        style={[
          styles.bar,
          { backgroundColor: docked ? c.surface : c.card, borderColor: focused ? c.focus : c.border },
          docked && { margin: 12, boxShadow: 'none' },
        ]}
      >
        <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          {searching && focused && query ? (
            <ActivityIndicator size="small" color={c.secondary} accessibilityLabel={t('searching')} />
          ) : focused || docked || floating ? (
            <Search size={19} color={c.muted} />
          ) : (
            <BrandMark size={24} />
          )}
        </View>
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
            minHeight: 40,
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
              setActive(-1);
              input.current?.focus();
            }}
            style={styles.icon}
          />
        )}
        {focused && !floating && <Button variant="ghost" label={t('cancel')} onPress={dismiss} />}
      </View>
      <Presence visible={focused && !!query.trim()} preset="dropdown"
          testID="search-results-panel"
          entering={searchEnter}
          exiting={searchExit}
          style={[
            styles.results,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              ...(docked ? { marginTop: 0, borderWidth: 0, borderRadius: 0, boxShadow: 'none' } : {}),
              ...(floating ? { position: 'absolute', top: 54, left: 0, right: 0, marginTop: 0,
                flexGrow: 0, flexBasis: 'auto', height: Math.max(0, Math.min(448, viewport.height - viewport.insets.top - viewport.insets.bottom - 94)) } : {}),
            },
          ]}
        >
          <FlatList
            ref={list}
            nativeID={listId}
            accessibilityRole={Platform.OS === 'web' ? 'listbox' : 'list'}
            accessibilityLabel={t('search_results')}
            data={results}
            style={{ flex: 1, minHeight: 0 }}
            keyExtractor={(r) => r.key}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={12}
            onScrollToIndexFailed={({ averageItemLength, index }) =>
              list.current?.scrollToOffset({ offset: averageItemLength * index })
            }
            ListEmptyComponent={
              searching ? <SkeletonRows variant="search" count={4} />
                : !failed ? <Empty message={t('no_results')} /> : undefined
            }
            ListFooterComponent={
              <>
                {failed && (
                  <View style={{ padding: 9, gap: 5 }}>
                    <Text style={{ fontSize: 13, color: c.warning }}>
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
          <RefreshSkeleton active={searching && results.length > 0} />
      </Presence>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  bar: {
    flexShrink: 0,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 3,
    gap: 7,
    borderRadius: radii.card,
    borderWidth: 1,
    boxShadow: elevation.map,
  },
  icon: { paddingHorizontal: 9 },
  results: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minHeight: 0,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: radii.card,
    overflow: 'hidden',
    boxShadow: elevation.panel,
  },
});
