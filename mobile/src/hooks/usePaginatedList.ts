import { useCallback, useEffect, useRef, useState } from 'react';

interface PageResult<T> {
  items: T[];
  hasMore: boolean;
}

// Ref-backed page/hasMore/loading state keeps `loadMore` a stable, zero-dependency
// callback, so it's safe to call from `onEndReached` without re-subscribing.
export function usePaginatedList<T>(fetchPage: (page: number) => Promise<PageResult<T>>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const nextPage = pageRef.current + 1;
    fetchPageRef
      .current(nextPage)
      .then((result) => {
        setItems((prev) => [...prev, ...result.items]);
        pageRef.current = nextPage;
        hasMoreRef.current = result.hasMore;
      })
      .catch((err) => {
        console.warn('Liste yüklenemedi', err);
      })
      .finally(() => {
        loadingRef.current = false;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  return { items, loadMore, loading };
}
