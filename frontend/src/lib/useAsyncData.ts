'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './api';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface AsyncData<T> extends AsyncState<T> {
  reload: () => Promise<void>;
  setData: (updater: (current: T | null) => T | null) => void;
  setError: (message: string | null) => void;
}

/**
 * Runs `fetcher` on mount and whenever it changes, exposing loading/error state.
 * `fetcher` must be memoised by the caller (e.g. with `useCallback`).
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, fallbackError: string): AsyncData<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });

  const reload = useCallback(async (): Promise<void> => {
    try {
      const data = await fetcher();
      setState({ data, error: null, loading: false });
    } catch (caught) {
      setState((current) => ({
        ...current,
        loading: false,
        error: caught instanceof ApiError ? caught.message : fallbackError,
      }));
    }
  }, [fetcher, fallbackError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setData = useCallback((updater: (current: T | null) => T | null): void => {
    setState((current) => ({ ...current, data: updater(current.data) }));
  }, []);

  const setError = useCallback((message: string | null): void => {
    setState((current) => ({ ...current, error: message }));
  }, []);

  return { ...state, reload, setData, setError };
}
