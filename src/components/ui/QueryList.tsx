import type { Alert } from '@/lib/transit/types/alerts';
import type { ReactNode } from 'react';
import { FlatList, type FlatListProps } from 'react-native';
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
  return (
    <FlatList
      {...props}
      refreshControl={
        <SkeletonRefreshControl
          refreshing={query.isFetching && !!query.data}
          onRefresh={() => {
            void query.refetch();
          }}
        />
      }
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
