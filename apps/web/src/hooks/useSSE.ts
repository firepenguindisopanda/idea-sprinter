"use client";

import { useState, useRef, useCallback } from 'react';
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
          (event) => optionsRef.current.onEvent?.(event),
          headers,
          controller.signal,
        );
        optionsRef.current.onComplete?.();
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Stream failed';
        setError(message);
        optionsRef.current.onError?.(err instanceof Error ? err : new Error(message));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [cancel],
  );

  const startResponse = useCallback(
    async (response: Response) => {
      setIsStreaming(true);
      setError(null);

      try {
        await readSSEStream<T>(response, (event) => optionsRef.current.onEvent?.(event));
        optionsRef.current.onComplete?.();
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Stream failed';
        setError(message);
        optionsRef.current.onError?.(err instanceof Error ? err : new Error(message));
      } finally {
        setIsStreaming(false);
      }
    },
    [],
  );

  return { startStream, startResponse, cancel, isStreaming, error };
}
