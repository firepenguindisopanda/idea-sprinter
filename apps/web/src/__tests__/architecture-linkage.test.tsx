import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * `/architecture` used to float alone: sessions and ADRs were addressable only
 * by URL parameter, and the only way to start one was to retype the
 * requirements. These cover both directions of the link - a spec handing itself
 * over, and finished architecture work being findable again.
 */

const listArchitectureSessions = vi.fn();
const listDecisions = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    listArchitectureSessions: (...args: unknown[]) => listArchitectureSessions(...args),
    listDecisions: (...args: unknown[]) => listDecisions(...args),
  },
}));

import ArchitectureList from '@/components/dashboard/architecture-list';
import {
  prefillFromProject,
  requirementsFromSections,
} from '@/lib/architecture-prefill';

describe('requirementsFromSections', () => {
  it('carries the spec body over, section by section', () => {
    const requirements = requirementsFromSections([
      { title: 'Solution Architect', content: 'Event-driven, three services.' },
      { title: 'Data Architect', content: 'Postgres with an outbox.' },
    ]);
    expect(requirements).toContain('## Solution Architect');
    expect(requirements).toContain('Event-driven, three services.');
    expect(requirements).toContain('## Data Architect');
    expect(requirements).toContain('Postgres with an outbox.');
  });

  it('drops empty sections rather than emitting bare headings', () => {
    const requirements = requirementsFromSections([
      { title: 'Solution Architect', content: 'Real content.' },
      { title: 'Never Generated', content: '   ' },
    ]);
    expect(requirements).not.toContain('Never Generated');
  });

  it('announces truncation instead of silently sending half a spec', () => {
    // Requirements are re-sent on every option generation, so the cap is real -
    // but a session reasoning from a truncated spec must say so.
    const requirements = requirementsFromSections([
      { title: 'Huge', content: 'x'.repeat(20000) },
    ]);
    expect(requirements.length).toBeLessThan(20000);
    expect(requirements).toMatch(/truncated/i);
  });
});

describe('prefillFromProject', () => {
  it('labels workspace sections with their stored titles', () => {
    const prefill = prefillFromProject('Task Manager', {
      _workspace: {
        sections: [
          { id: 'sec-overview', title: 'Project Overview', content: 'A task manager.', order: 0 },
        ],
      },
    });
    expect(prefill.projectName).toBe('Task Manager');
    expect(prefill.requirements).toContain('## Project Overview');
    expect(prefill.requirements).toContain('A task manager.');
  });

  it('formats agent roles as names rather than raw keys', () => {
    const prefill = prefillFromProject('Spec', {
      api_designer: 'REST, versioned by path.',
    });
    // "api_designer" would read as a database key in the requirements body.
    expect(prefill.requirements).toContain('## API Designer');
    expect(prefill.requirements).not.toContain('api_designer');
  });

  it('leaves the requirements empty when a project has no spec to hand over', () => {
    expect(prefillFromProject('Empty', {}).requirements).toBe('');
  });
});

describe('ArchitectureList', () => {
  beforeEach(() => {
    listArchitectureSessions.mockReset();
    listDecisions.mockReset();
  });

  const SESSION = {
    id: 'sess-1',
    project_name: 'Task Manager',
    status: 'completed' as const,
    options_count: 3,
    selected_option_id: 'opt-2',
    created_at: '2026-08-01T10:00:00Z',
  };

  const DECISION = {
    id: 'dec-1',
    session_id: 'sess-1',
    option_id: 'opt-2',
    title: 'Event-driven ingestion',
    chosen_pattern: 'Event-driven',
    context: '',
    decision: '',
    alternatives: [],
    consequences: [],
    contested: [],
    edited_by_user: true,
    status: 'accepted',
    created_at: '2026-08-01T11:00:00Z',
    updated_at: '2026-08-01T11:00:00Z',
  };

  it('lists sessions and ADRs, each linking back to its session', async () => {
    listArchitectureSessions.mockResolvedValue([SESSION]);
    listDecisions.mockResolvedValue([DECISION]);

    render(<ArchitectureList />);

    await waitFor(() => expect(screen.getByText('Task Manager')).toBeDefined());
    expect(screen.getByText('Event-driven ingestion')).toBeDefined();
    // The whole point: the session is reachable again after leaving the page.
    const links = screen.getAllByRole('link');
    expect(links.every((l) => l.getAttribute('href') === '/architecture?session_id=sess-1')).toBe(
      true,
    );
  });

  it('renders nothing when the user has no architecture work', async () => {
    listArchitectureSessions.mockResolvedValue([]);
    listDecisions.mockResolvedValue([]);

    const { container } = render(<ArchitectureList />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('still shows decisions when the sessions endpoint fails', async () => {
    // One failing endpoint must not blank the other - both are separate reads.
    listArchitectureSessions.mockRejectedValue(new Error('boom'));
    listDecisions.mockResolvedValue([DECISION]);

    render(<ArchitectureList />);
    await waitFor(() => expect(screen.getByText('Event-driven ingestion')).toBeDefined());
  });

  it('reports an error only when both reads fail', async () => {
    listArchitectureSessions.mockRejectedValue(new Error('boom'));
    listDecisions.mockRejectedValue(new Error('boom'));

    render(<ArchitectureList />);
    await waitFor(() =>
      expect(screen.getByText('Could not load your architecture work.')).toBeDefined(),
    );
  });
});
