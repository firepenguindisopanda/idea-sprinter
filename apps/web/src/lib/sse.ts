/**
 * Parse an SSE `data: {...}` line into a JSON object.
 * Returns null if the line is not a data line or isn't valid JSON.
 */
export function parseSSEDataLine<T = unknown>(line: string): T | null {
  if (!line.startsWith('data: ')) return null;
  try {
    return JSON.parse(line.slice(6)) as T;
  } catch {
    return null;
  }
}

/**
 * Read a streamed Response body and call `onEvent` for each parsed `data:`
 * event. Handles buffering of partial lines.
 */
export async function readSSEStream<T = unknown>(
  response: Response,
  onEvent: (event: T) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!response.body) {
    throw new Error('Streaming response has no body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Callers that already have a Response (the architecture page reads one
  // handed back by the API client) had no way to stop reading it, so a stream
  // outlived the page that started it and kept calling back into an unmounted
  // component.
  const onAbort = () => void reader.cancel().catch(() => {});
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const event = parseSSEDataLine<T>(line);
        if (event !== null) {
          onEvent(event);
        }
      }
    }
  } finally {
    signal?.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }
}

/**
 * Create an SSE-streaming POST request and read the response stream,
 * calling `onEvent` for each parsed data: event.
 *
 * Supports AbortSignal for cancellation.
 */
export async function streamSSEPost<T = unknown>(
  url: string,
  body: unknown,
  onEvent: (event: T) => void,
  headers?: Record<string, string>,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`SSE request failed: ${response.status} ${response.statusText}`);
  }

  return readSSEStream<T>(response, onEvent, signal);
}
