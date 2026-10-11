import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * The profile page offers only what the app uses (multi-agent-system HANDOFF §173).
 *
 * Its Models tab saved a chat, a summary and an embedding model into the user's
 * preferences, and no backend code read a model from them: the model is
 * chosen per role on the server (ultra in every role, §163), and nothing has
 * embedded since revamp I4. A choice that does nothing is gone.
 */

const updatePreferences = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getCacheHealth: vi.fn(async () => ({ status: 'healthy', keys_tracked: 0, ttl_seconds: 300 })),
    getPreferences: vi.fn(async () => ({ preferences: { chatModel: 'some/model' } })),
    updatePreferences: (...args: unknown[]) => updatePreferences(...args),
    invalidateUserCache: vi.fn(async () => ({})),
  },
}));

vi.mock('@/components/persona/persona-selector', () => ({ PersonaSelector: () => null }));

vi.mock('@/lib/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 1, email: 'a@example.com', full_name: 'A', avatar_url: null } }),
}));

import ProfileForm from '@/components/profile/profile-form';

describe('the profile page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updatePreferences.mockResolvedValue({ preferences: {} });
  });

  it('offers no model choice the server would ignore', async () => {
    render(<ProfileForm />);
    await waitFor(() => expect(screen.getByRole('tab', { name: /telemetry/i })).toBeTruthy());
    expect(screen.queryByRole('tab', { name: /models/i })).toBeNull();
  });

  it('asks for no API key: nothing on the server reads one from here (HANDOFF §174)', async () => {
    render(<ProfileForm />);
    await waitFor(() => expect(screen.getByRole('tab', { name: /telemetry/i })).toBeTruthy());
    expect(screen.queryByRole('tab', { name: /api keys/i })).toBeNull();
    fireEvent.mouseDown(screen.getByRole('tab', { name: /telemetry/i }));
    expect(screen.queryByLabelText(/api key/i)).toBeNull();
  });

  it('saves no key', async () => {
    render(<ProfileForm />);
    fireEvent.click(await screen.findByRole('button', { name: /save/i }));

    await waitFor(() => expect(updatePreferences).toHaveBeenCalledTimes(1));
    expect(Object.keys(updatePreferences.mock.calls[0][0]).filter((k) => k.toLowerCase().includes('key'))).toEqual([]);
  });

  it('saves no model preferences', async () => {
    render(<ProfileForm />);
    fireEvent.click(await screen.findByRole('button', { name: /save/i }));

    await waitFor(() => expect(updatePreferences).toHaveBeenCalledTimes(1));
    const sent = updatePreferences.mock.calls[0][0];
    expect(Object.keys(sent).filter((k) => k.toLowerCase().includes('model'))).toEqual([]);
  });
});
