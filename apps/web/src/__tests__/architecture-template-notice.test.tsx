import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * Generic templates must not pass for generated options.
 *
 * When generation fails past its retries the backend serves the same
 * Monolithic / Microservices / Serverless starters for every project. The
 * cards showed them exactly like options written for this one (HANDOFF §44);
 * the backend now marks them `is_template`.
 */

vi.mock('@/components/markdown', () => ({
  Markdown: ({ children }: { children: string }) => <div>{children}</div>,
}));
vi.mock('@/components/architecture/option-challenge', () => ({ default: () => null }));

import ArchitectureOptions from '@/components/architecture/architecture-options';
import type { ArchitectureOption } from '@/types';

function option(overrides: Partial<ArchitectureOption> = {}): ArchitectureOption {
  return {
    id: 'option_monolithic',
    name: 'Monolithic',
    description: 'Single deployable unit.',
    components: ['Web Server'],
    tech_stack: { backend: 'FastAPI' },
    pros: ['Simple'],
    cons: ['Scaling'],
    ...overrides,
  };
}

describe('ArchitectureOptions template notice', () => {
  it('says a template is generic and not written for this project', () => {
    render(<ArchitectureOptions options={[option({ is_template: true })]} onSelect={() => {}} />);
    const notice = screen.getByRole('note');
    expect(notice.textContent).toMatch(/generic template/i);
    expect(notice.textContent).toMatch(/not written for this project/i);
    expect(notice.textContent).toMatch(/generate again/i);
  });

  it('shows no notice on a generated option', () => {
    render(<ArchitectureOptions options={[option({ name: 'Firebase MVP', is_template: false })]} onSelect={() => {}} />);
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('shows no notice when the flag is absent (sessions saved before it existed)', () => {
    render(<ArchitectureOptions options={[option({ name: 'Firebase MVP' })]} onSelect={() => {}} />);
    expect(screen.queryByRole('note')).toBeNull();
  });
});
