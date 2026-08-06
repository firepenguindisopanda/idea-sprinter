import { describe, it, expect, beforeEach } from 'vitest';
import {
  rememberIntendedRoute,
  consumeIntendedRoute,
  DEFAULT_POST_LOGIN_ROUTE,
} from '@/lib/post-login-redirect';

/**
 * Signing in used to end on the marketing page, so a user who clicked "Start
 * Workshop", got bounced to sign in, and came back was asked to click it again.
 */
describe('post-login redirect', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('resumes where the user was headed', () => {
    rememberIntendedRoute('/workspace');
    expect(consumeIntendedRoute()).toBe('/workspace');
  });

  it('keeps query parameters, which carry real intent', () => {
    rememberIntendedRoute('/architecture?project_id=12');
    expect(consumeIntendedRoute()).toBe('/architecture?project_id=12');
  });

  it('lands on the signed-in home when nothing was remembered', () => {
    expect(consumeIntendedRoute()).toBe(DEFAULT_POST_LOGIN_ROUTE);
    // And that home is not the marketing page.
    expect(DEFAULT_POST_LOGIN_ROUTE).not.toBe('/');
  });

  it('is consumed once, so a later sign-in does not reuse a stale route', () => {
    rememberIntendedRoute('/workspace');
    expect(consumeIntendedRoute()).toBe('/workspace');
    expect(consumeIntendedRoute()).toBe(DEFAULT_POST_LOGIN_ROUTE);
  });

  it('refuses to send the user off-site', () => {
    // `//evil.example` is protocol-relative: the browser would leave the site.
    rememberIntendedRoute('//evil.example/phish');
    expect(consumeIntendedRoute()).toBe(DEFAULT_POST_LOGIN_ROUTE);

    rememberIntendedRoute('https://evil.example');
    expect(consumeIntendedRoute()).toBe(DEFAULT_POST_LOGIN_ROUTE);
  });

  it('refuses to loop back to the auth pages', () => {
    rememberIntendedRoute('/auth/login');
    expect(consumeIntendedRoute()).toBe(DEFAULT_POST_LOGIN_ROUTE);
  });

  it('rejects a hostile value written directly into storage', () => {
    // `rememberIntendedRoute` is not the only way a value gets in there.
    sessionStorage.setItem('post-login-redirect', '//evil.example');
    expect(consumeIntendedRoute()).toBe(DEFAULT_POST_LOGIN_ROUTE);
  });
});
