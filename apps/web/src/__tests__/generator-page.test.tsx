import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GeneratorPage from '@/app/generator/page';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));
vi.mock('@/components/protected-route', () => ({ default: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/generator/results-display', () => ({ default: () => <div /> }));
vi.mock('@/components/generator/save-modal', () => ({ default: () => <div /> }));

describe('GeneratorPage integration', () => {
  it('opens examples modal when generating from pre-gen form and displays results', async () => {
    // Mock fetch to return JSON examples
    const mockExamples = [
      { id: '1', title: 'A', one_line: 'One line', full_text: 'Full text', scope_bullets: ['a', 'b'], tags: ['MVP'] },
    ];
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ examples: mockExamples }), {
        headers: { 'Content-Type': 'application/json' },
      })
    ) as any;

    render(<GeneratorPage />);

    // Fill the pre-gen fields - need to fill ALL required fields (title, audience, problemStatement)
    const preTitle = screen.getByPlaceholderText(/e.g. PDF Insight Hub/i);
    const preAudience = screen.getByPlaceholderText(/e.g. Compliance analysts/i);
    const preProblem = screen.getByPlaceholderText(/Teams need a fast way to extract/i);
    
    fireEvent.change(preTitle, { target: { value: 'My App' } });
    fireEvent.change(preAudience, { target: { value: 'Small businesses' } });
    fireEvent.change(preProblem, { target: { value: 'Users need to automate their workflow' } });

    // Click generate in pre-gen section
    const generate = screen.getByRole('button', { name: /Initialize_Concepts/i });
    expect(generate).toBeEnabled();
    fireEvent.click(generate);

    // Wait for modal open and examples to appear
    const header = await screen.findByText(/Generated_Mockups/i);
    expect(header).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/One line/i)).toBeInTheDocument());
  });
});
