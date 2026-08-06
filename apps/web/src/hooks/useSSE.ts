"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { streamSSEPost, readSSEStream } from '@/lib/sse';

export interface UseSSEOptions<T> {
  onEvent?: (event: T) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export interface UseSSEReturn {
  startStream: (
    url: string,
    body: unknown,
    headers?: Record<string, string>,
  ) => Promise<void>;
  startResponse: (response: Response) => Promise<void>;
  cancel: () => void;
  isStreaming: boolean;
  error: string | null;
}

export function useSSE<T = Record<string, unknown>>(
  options: UseSSEOptions<T> = {},
): UseSSEReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // A stream used to outlive the component that started it. Nothing aborted on
  // unmount, so navigating away mid-generation left the fetch running and its
  // `onComplete` fired minutes later - from whatever page the user was on by
  // then, typically yanking them to a results view they had left.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  // Callbacks fire only while mounted. Aborting is not enough on its own: the
  // read can already be past the abort check when the component goes away.
  const emit = useCallback(<A extends unknown[]>(fn: ((...a: A) => void) | undefined, ...args: A) => {
    if (mountedRef.current) fn?.(...args);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(
    async (url: string, body: unknown, headers?: Record<string, string>) => {
      cancel();
      setIsStreaming(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamSSEPost<T>(
          url,
          body,
          (event) => emit(optionsRef.current.onEvent, event),
          headers,
          controller.signal,
        );
        emit(optionsRef.current.onComplete);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Stream failed';
        if (mountedRef.current) setError(message);
        emit(optionsRef.current.onError, err instanceof Error ? err : new Error(message));
      } finally {
        if (mountedRef.current) setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [cancel, emit],
  );

  const startResponse = useCallback(
    async (response: Response) => {
      cancel();
      setIsStreaming(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await readSSEStream<T>(
          response,
          (event) => emit(optionsRef.current.onEvent, event),
          controller.signal,
        );
        emit(optionsRef.current.onComplete);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Stream failed';
        if (mountedRef.current) setError(message);
        emit(optionsRef.current.onError, err instanceof Error ? err : new Error(message));
      } finally {
        if (mountedRef.current) setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [cancel, emit],
  );

  return { startStream, startResponse, cancel, isStreaming, error };
}
