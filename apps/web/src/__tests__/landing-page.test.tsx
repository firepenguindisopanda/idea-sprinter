import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * The landing page names Practise (multi-agent-system HANDOFF §174).
 *
 * The project's goal is learning (§80, §83), and the landing page offered only
 * the Workshop: Practise was reachable from the header alone. It now says what
 * Practise is and links to it, through login for a visitor, as the Workshop's
 * button does.
 */

let user: { id: number } | null = null;
const rememberIntendedRoute = vi.fn();

vi.mock('@/lib/auth-store', () => ({ useAuthStore: () => ({ user }) }));
vi.mock('@/lib/post-login-redirect', () => ({
  rememberIntendedRoute: (...args: unknown[]) => rememberIntendedRoute(...args),
}));
vi.mock('@/components/persona/persona-selector', () => ({ PersonaSelector: () => null }));

import Home from '@/app/page';

const practise = () => screen.getByRole('link', { name: /practise on an exercise/i });

describe('the landing page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    user = null;
  });

  it('links a signed-in learner straight to Practise', () => {
    user = { id: 1 };
    render(<Home />);
    expect(practise().getAttribute('href')).toBe('/learn');
  });

  it('sends a visitor through login and remembers Practise as where they were going', () => {
    render(<Home />);
    expect(practise().getAttribute('href')).toBe('/auth/login');
    fireEvent.click(practise());
    expect(rememberIntendedRoute).toHaveBeenCalledWith('/learn');
  });

  it('says what Practise is', () => {
    render(<Home />);
    expect(screen.getByText(/draft a design yourself/i)).toBeTruthy();
  });
});
