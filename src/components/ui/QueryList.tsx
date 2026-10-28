import type { Alert } from '@/lib/transit/types/alerts';
import type { ReactNode } from 'react';
import { FlatList, View, type FlatListProps } from 'react-native';
import { usePullToRefresh } from '~/hooks/usePullToRefresh';
import { Empty } from './Empty';
import { QueryNotice, type QueryState } from './QueryNotice';
import { RefreshSkeleton, SkeletonRows, SkeletonRefreshControl, type SkeletonVariant } from './Skeleton';

interface QueryListProps<T> extends Omit<
  FlatListProps<T>,
  'refreshControl' | 'ListHeaderComponent' | 'ListEmptyComponent'
> {
  query: QueryState & { isPending: boolean };
  emptyMessage: string;
  pullToRefresh?: boolean;
  header?: ReactNode;
  alerts?: Alert[] | null;
  loadingVariant?: SkeletonVariant;
}

export function QueryList<T>({ query, emptyMessage, header, alerts, pullToRefresh = true, loadingVariant, ...props }: QueryListProps<T>) {
  const refreshControl = usePullToRefresh(query.refetch);
  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      <FlatList
        style={{ flex: 1 }}
        {...props}
        refreshControl={pullToRefresh ? <SkeletonRefreshControl {...refreshControl} /> : undefined}
        ListHeaderComponent={
          <>
            <QueryNotice query={query} alerts={alerts} />
            {header}
          </>
        }
        ListEmptyComponent={
          query.isError ? undefined : query.isPending
            ? <SkeletonRows variant={loadingVariant} /> : <Empty message={emptyMessage} />
        }
      />
      <RefreshSkeleton active={query.isFetching && !!query.data} />
    </View>
  );
}
