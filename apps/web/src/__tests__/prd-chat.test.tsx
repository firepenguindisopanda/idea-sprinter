import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrdChat from '@/components/prd/prd-chat';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }), useSearchParams: () => ({ get: (_: string) => null }) }));
vi.mock('@/components/protected-route', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/lib/api', () => ({ api: { prdChat: vi.fn() } }));

describe('PrdChat component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input and send button (prefill shown)', () => {
    // Render with a prefill via query param is handled by useSearchParams in real page;
    // here we just assert basic rendering of the component.
    render(<PrdChat initialSessionId={null} />);
    const textarea = screen.getByLabelText('prd-input');
    const sendBtn = screen.getByRole('button', { name: /Send/i });
    expect(textarea).toBeInTheDocument();
    expect(sendBtn).toBeInTheDocument();
    expect(sendBtn).toBeDisabled();
  });

  it('sends message and displays agent response', async () => {
    const mockAgent = {
      session_id: 'sess-42',
      agent_response: 'Thanks — can you clarify the users?',
      section_tag: 'Stakeholders',
      missing_sections: ['features']
    };

    const { api } = await import('@/lib/api');
    (api.prdChat as any).mockResolvedValue(mockAgent);

    render(<PrdChat initialSessionId={null} />);
    const textarea = screen.getByLabelText('prd-input') as HTMLTextAreaElement;
    const sendBtn = screen.getByRole('button', { name: /Send/i });

    fireEvent.change(textarea, { target: { value: 'Primary users are product managers' } });
    expect(sendBtn).toBeEnabled();

    fireEvent.click(sendBtn);

    await waitFor(() => expect(api.prdChat).toHaveBeenCalled());
    expect(await screen.findByText(/PRD Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/Thanks — can you clarify the users\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Section: Stakeholders/i)).toBeInTheDocument();
    expect(screen.getByText(/Missing: features/i)).toBeInTheDocument();
  });
});