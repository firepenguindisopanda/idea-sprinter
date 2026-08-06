/**
 * Where to land after signing in.
 *
 * Login used to end on the marketing page: a user who clicked "Start Workshop",
 * got bounced to sign in, and came back was asked to click "Start Workshop" a
 * second time. The destination cannot ride along as a query parameter because
 * the flow leaves the origin for Google and returns to a fixed callback URL, so
 * the intent is stashed in `sessionStorage` - same tab, same origin, cleared
 * when the tab closes.
 */

const KEY = 'post-login-redirect';

/** Signed-in home. Not `/`, which is the marketing page. */
export const DEFAULT_POST_LOGIN_ROUTE = '/dashboard';

/**
 * Only same-origin app paths. A stored value is attacker-influencable in
 * principle, and `//evil.example` is a protocol-relative URL that would leave
 * the site entirely.
 */
function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//');
}

/** Remember where the user was headed before being sent to sign in. */
export function rememberIntendedRoute(path: string): void {
  if (typeof window === 'undefined') return;
  // Sending them back to the login screen after logging in is a loop.
  if (!isSafeInternalPath(path) || path.startsWith('/auth')) return;
  try {
    window.sessionStorage.setItem(KEY, path);
  } catch {
    // Private-mode or storage-disabled browsers just get the default route.
  }
}

/** Read and clear the intended route. Falls back to the signed-in home. */
export function consumeIntendedRoute(): string {
  if (typeof window === 'undefined') return DEFAULT_POST_LOGIN_ROUTE;
  try {
    const stored = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    if (stored && isSafeInternalPath(stored) && !stored.startsWith('/auth')) {
      return stored;
    }
  } catch {
    // Fall through to the default.
  }
  return DEFAULT_POST_LOGIN_ROUTE;
}
