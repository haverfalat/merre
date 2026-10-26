import type { Alert } from '@/lib/transit/types/alerts';
import type { ReactNode } from 'react';
import { FlatList, type FlatListProps } from 'react-native';
import { usePullToRefresh } from '~/hooks/usePullToRefresh';
import { Empty } from './Empty';
import { QueryNotice, type QueryState } from './QueryNotice';
import { SkeletonRefreshControl } from './Skeleton';

interface QueryListProps<T> extends Omit<
  FlatListProps<T>,
  'refreshControl' | 'ListHeaderComponent' | 'ListEmptyComponent'
> {
  query: QueryState & { isPending: boolean };
  emptyMessage: string;
  header?: ReactNode;
  alerts?: Alert[] | null;
}

export function QueryList<T>({ query, emptyMessage, header, alerts, ...props }: QueryListProps<T>) {
  const refreshControl = usePullToRefresh(query.refetch);
  return (
    <FlatList
      {...props}
      refreshControl={<SkeletonRefreshControl {...refreshControl} />}
      ListHeaderComponent={
        <>
          <QueryNotice query={query} alerts={alerts} />
          {header}
        </>
      }
      ListEmptyComponent={
        query.isError ? undefined : (
          <Empty loading={query.isPending} message={query.isPending ? undefined : emptyMessage} />
        )
      }
    />
  );
}
