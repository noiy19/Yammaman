import { useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

/**
 * useAsync — minimal async state for blocks that read from the commerce engine.
 *
 * Deliberately tiny. The storefront has exactly two async reads today (products,
 * fabrics) and pulling in a data-fetching library for that would be a dependency
 * the dev team then has to audit. If this grows past a handful of call sites,
 * replace it with the library of Pratap's choice — the call sites do not change.
 *
 * The cancellation flag matters: without it, a fast unmount (route change,
 * Storybook story switch) resolves into setState on a dead component.
 */
export function useAsync<T>(
  load: () => Promise<T>,
  key: string,
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: undefined,
    error: undefined,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: undefined, error: undefined, loading: true });

    load()
      .then((data) => {
        if (!cancelled) setState({ data, error: undefined, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: undefined,
            error: error instanceof Error ? error : new Error(String(error)),
            loading: false,
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // `key` is the intentional dependency: `load` is a fresh closure every
    // render, so depending on it would refetch forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
