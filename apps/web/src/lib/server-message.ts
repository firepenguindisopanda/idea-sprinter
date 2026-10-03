export const CONNECTION_ERROR = 'Could not reach the server. Check your connection and try again.';

/**
 * What to tell the user about a failed API call.
 *
 * When the server answered with a reason - a 503 once the model service has
 * failed past its retries - show it. Only a request that never got an answer
 * is a connection problem. Read by `code`, not `instanceof ApiError`, so it
 * holds wherever the API module is replaced.
 */
export function serverMessage(err: unknown, fallback: string = CONNECTION_ERROR): string {
  const answered = (err as { code?: string } | null)?.code === 'api_error';
  return answered && err instanceof Error && err.message ? err.message : fallback;
}
