import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * Acting on a skeptic finding from the review sidebar.
 *
 * The skeptic no longer decides whether a section is approved - on unchanged
 * text its risk rating varied from call to call - so its findings are
 * suggestions, and the user chooses which to act on. "Fix this" sends one
 * finding through the same refine the section's own box uses, and the fix can
 * be undone.
 */

const refineSection = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    refineSection: (...args: unknown[]) => refineSection(...args),
  },
}));

import { useWorkspaceStore } from '@/lib/workspace-store';
import { QualitySidebar } from '@/components/workspace/quality-sidebar';
import { findingPrompt } from '@/lib/refine-section';
import type { AttackVector, DocSection, WorkspacePhase } from '@/types/workspace';

const SECRETS: AttackVector = {
  id: 'av-1',
  category: 'security_gap',
  description: 'No secrets management for the WMS API credentials.',
  severity: 'high',
  suggested_fix: 'Name a secrets store and a rotation policy.',
};

const STAMPEDE: AttackVector = {
  id: 'av-2',
  category: 'performance_pitfall',
  description: 'Cache stampede when popular SKUs expire together.',
  severity: 'medium',
};

const ORIGINAL = '## Security\nTLS everywhere.';
const FIXED = '## Security\nTLS everywhere. Credentials live in Vault and rotate every 90 days.';

function seed(
  phase: WorkspacePhase = 'refinement',
  status: DocSection['status'] = 'complete',
) {
  const store = useWorkspaceStore.getState();
  store.addDocSection({ id: 'sec-sa', title: 'Solution Architecture', status, content: ORIGINAL, order: 0 });
  store.mergeSectionReview('sec-sa', 'solution_architect', {
    skeptic: { riskLevel: 'high', summary: '-', attackVectors: [SECRETS, STAMPEDE] },
    judge: {
      score: 8,
      approved: true,
      issuesCount: 2,
      recommendedAction: 'accept',
      feedback: 'Consider the skeptic findings.',
    },
  });
  store.setPhase(phase);
}

function openCard() {
  render(<QualitySidebar />);
  fireEvent.click(screen.getByText('Solution Architect'));
}

const fixButton = (finding: AttackVector) =>
  screen.getByRole('button', { name: `Fix: ${finding.description}` }) as HTMLButtonElement;

const content = () => useWorkspaceStore.getState().documentSections[0].content;

describe('Fix this on a skeptic finding', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
    refineSection.mockReset();
  });

  it('says the findings do not affect approval', () => {
    seed();
    openCard();
    expect(screen.getByText(/don.t affect approval/i)).toBeDefined();
  });

  it('refines the section with the finding and its suggested fix', async () => {
    refineSection.mockResolvedValue({ section_id: 'sec-sa', content: FIXED, suggestions: [] });
    seed();
    openCard();

    fireEvent.click(fixButton(SECRETS));

    await waitFor(() => expect(content()).toBe(FIXED));
    const [sectionId, sent, prompt] = refineSection.mock.calls[0];
    expect(sectionId).toBe('sec-sa');
    expect(sent).toBe(ORIGINAL);
    expect(prompt).toContain(SECRETS.description);
    expect(prompt).toContain(SECRETS.suggested_fix);
    expect(screen.getByText('Applied')).toBeDefined();
    // The other finding is still there to act on.
    expect(fixButton(STAMPEDE).disabled).toBe(false);
  });

  it('undoes the fix and offers it again', async () => {
    refineSection.mockResolvedValue({ section_id: 'sec-sa', content: FIXED, suggestions: [] });
    seed();
    openCard();

    fireEvent.click(fixButton(SECRETS));
    await screen.findByText('Applied');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(content()).toBe(ORIGINAL);
    expect(screen.queryByText('Applied')).toBeNull();
    expect(fixButton(SECRETS)).toBeDefined();
  });

  it('builds each fix on the last and offers undo on the latest only', async () => {
    // The store undoes a section's most recent refinement, so an Undo beside
    // an earlier fix would remove a different one.
    const both = `${FIXED}\nEntries refresh behind a lock.`;
    refineSection
      .mockResolvedValueOnce({ section_id: 'sec-sa', content: FIXED, suggestions: [] })
      .mockResolvedValueOnce({ section_id: 'sec-sa', content: both, suggestions: [] });
    seed();
    openCard();

    fireEvent.click(fixButton(SECRETS));
    await screen.findByText('Applied');
    fireEvent.click(fixButton(STAMPEDE));

    await waitFor(() => expect(screen.getAllByText('Applied')).toHaveLength(2));
    expect(refineSection.mock.calls[1][1]).toBe(FIXED);
    expect(content()).toBe(both);
    expect(screen.getAllByRole('button', { name: 'Undo' })).toHaveLength(1);
  });

  it('reports an unchanged section as not applied', async () => {
    // The endpoint hands the original back when the model's reply is unusable.
    refineSection.mockResolvedValue({ section_id: 'sec-sa', content: ORIGINAL, suggestions: [] });
    seed();
    openCard();

    fireEvent.click(fixButton(SECRETS));

    await waitFor(() => expect(useWorkspaceStore.getState().error).toMatch(/\S/));
    // Not a failure: shown as a notice, not in the error red.
    expect(useWorkspaceStore.getState().errorTone).toBe('notice');
    expect(screen.queryByText('Applied')).toBeNull();
    expect(useWorkspaceStore.getState().refinementHistory).toHaveLength(0);
    expect(fixButton(SECRETS).disabled).toBe(false);
  });

  it('reports a failed request and leaves the section alone', async () => {
    refineSection.mockRejectedValue(new Error('503'));
    seed();
    openCard();

    fireEvent.click(fixButton(SECRETS));

    await waitFor(() => expect(useWorkspaceStore.getState().error).toMatch(/\S/));
    expect(useWorkspaceStore.getState().errorTone).toBe('error');
    expect(content()).toBe(ORIGINAL);
    expect(screen.queryByText('Applied')).toBeNull();
    expect(fixButton(SECRETS).disabled).toBe(false);
  });

  it('runs one fix at a time for a section', async () => {
    // Two in flight would both start from the same text, and the second
    // would discard the first.
    let finish: (value: unknown) => void = () => {};
    refineSection.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    seed();
    openCard();

    fireEvent.click(fixButton(SECRETS));

    expect(await screen.findByText('Fixing…')).toBeDefined();
    expect(fixButton(STAMPEDE).disabled).toBe(true);
    finish({ section_id: 'sec-sa', content: FIXED, suggestions: [] });
    await screen.findByText('Applied');
    expect(fixButton(STAMPEDE).disabled).toBe(false);
  });

  it.each([
    ['generating', 'complete'],
    ['interrupted', 'complete'],
    ['refinement', 'generating'],
  ] as const)('offers no fix while the phase is %s and the section %s', (phase, status) => {
    // The same rule as the section's own refine box.
    seed(phase, status);
    openCard();
    expect(screen.getByText(SECRETS.description)).toBeDefined();
    expect(screen.queryByText('Fix this')).toBeNull();
  });
});

describe('findingPrompt', () => {
  it('leaves out the fix line when the finding has none', () => {
    expect(findingPrompt(STAMPEDE)).toContain(STAMPEDE.description);
    expect(findingPrompt(STAMPEDE)).not.toContain('Suggested fix');
  });
});
