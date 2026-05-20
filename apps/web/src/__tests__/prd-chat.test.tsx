import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrdChat from '@/components/prd/prd-chat';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }), useSearchParams: () => ({ get: (_: string) => null }) }));
vi.mock('@/components/protected-route', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/lib/api', () => ({ api: { startPrdSession: vi.fn(), prdChat: vi.fn() } }));

describe('PrdChat component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input and start button (disabled when empty)', () => {
    render(<PrdChat initialSessionId={null} />);
    const textarea = screen.getByLabelText('prd-input');
    const startBtn = screen.getByRole('button', { name: /Start PRD/i });
    expect(textarea).toBeInTheDocument();
    expect(startBtn).toBeInTheDocument();
    expect(startBtn).toBeDisabled();
  });

  it('starts a new PRD session and shows agent response', async () => {
    const { api } = await import('@/lib/api');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.startPrdSession as any).mockResolvedValue({
      session_id: 'sess-42',
      message: 'Thanks — can you clarify the users?',
    });

    render(<PrdChat initialSessionId={null} />);
    const textarea = screen.getByLabelText('prd-input') as HTMLTextAreaElement;
    const startBtn = screen.getByRole('button', { name: /Start PRD/i });

    fireEvent.change(textarea, { target: { value: 'Primary users are product managers' } });
    expect(startBtn).toBeEnabled();

    fireEvent.click(startBtn);

    await waitFor(() => expect(api.startPrdSession).toHaveBeenCalled());
    expect(await screen.findByText(/PRD Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/Thanks — can you clarify the users\?/i)).toBeInTheDocument();
  });
});