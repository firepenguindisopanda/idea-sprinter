import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DraftBanner from '@/components/landing/draft-banner';
import { useMostRecentDraft, useDraftStore } from '@/lib/draft-store';

// Mock the draft store hooks
vi.mock('@/lib/draft-store', () => ({
  useMostRecentDraft: vi.fn(),
  useDraftStore: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} data-testid="mock-link">{children}</a>
  ),
}));

describe('DraftBanner', () => {
  const mockClearIdeationDraft = vi.fn();
  const mockClearGenerationDraft = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation for useDraftStore
    (useDraftStore as ReturnType<typeof vi.fn>).mockReturnValue({
      clearIdeationDraft: mockClearIdeationDraft,
      clearGenerationDraft: mockClearGenerationDraft,
    });
  });

  describe('When no draft exists', () => {
    it('should not render anything', () => {
      (useMostRecentDraft as ReturnType<typeof vi.fn>).mockReturnValue({
        type: null,
        updatedAt: null,
      });

      const { container } = render(<DraftBanner />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when type is null but updatedAt exists', () => {
      (useMostRecentDraft as ReturnType<typeof vi.fn>).mockReturnValue({
        type: null,
        updatedAt: Date.now(),
      });

      const { container } = render(<DraftBanner />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when updatedAt is null but type exists', () => {
      (useMostRecentDraft as ReturnType<typeof vi.fn>).mockReturnValue({
        type: 'ideation',
        updatedAt: null,
      });

      const { container } = render(<DraftBanner />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('When ideation draft exists', () => {
    beforeEach(() => {
      (useMostRecentDraft as ReturnType<typeof vi.fn>).mockReturnValue({
        type: 'ideation',
        updatedAt: Date.now() - 60000, // 1 minute ago
      });
    });

    it('should render the banner', () => {
      render(<DraftBanner />);
      expect(screen.getByText('Ideation Draft')).toBeInTheDocument();
    });

    it('should show the Sparkles icon for ideation', () => {
      render(<DraftBanner />);
      // The Sparkles icon is rendered in the amber-colored container
      const iconContainer = document.querySelector('.bg-amber-500\\/10');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should link to /ideation page', () => {
      render(<DraftBanner />);
      const resumeLink = screen.getByRole('link', { name: /resume/i });
      expect(resumeLink).toHaveAttribute('href', '/ideation');
    });

    it('should call clearIdeationDraft when dismiss is clicked', () => {
      render(<DraftBanner />);
      const dismissButton = screen.getByTitle('Discard draft');
      
      fireEvent.click(dismissButton);
      
      expect(mockClearIdeationDraft).toHaveBeenCalledTimes(1);
      expect(mockClearGenerationDraft).not.toHaveBeenCalled();
    });
  });

  describe('When generation draft exists', () => {
    beforeEach(() => {
      (useMostRecentDraft as ReturnType<typeof vi.fn>).mockReturnValue({
        type: 'generation',
        updatedAt: Date.now() - 3600000, // 1 hour ago
      });
    });

    it('should render the banner', () => {
      render(<DraftBanner />);
      expect(screen.getByText('Generation In Progress')).toBeInTheDocument();
    });

    it('should show the FileText icon for generation', () => {
      render(<DraftBanner />);
      // The FileText icon is rendered in the primary-colored container
      const iconContainer = document.querySelector('.bg-primary\\/10');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should link to /generate page', () => {
      render(<DraftBanner />);
      const resumeLink = screen.getByRole('link', { name: /resume/i });
      expect(resumeLink).toHaveAttribute('href', '/generate');
    });

    it('should call clearGenerationDraft when dismiss is clicked', () => {
      render(<DraftBanner />);
      const dismissButton = screen.getByTitle('Discard draft');
      
      fireEvent.click(dismissButton);
      
      expect(mockClearGenerationDraft).toHaveBeenCalledTimes(1);
      expect(mockClearIdeationDraft).not.toHaveBeenCalled();
    });
  });

  describe('Time ago display', () => {
    it('should show "just now" for recent drafts (< 60 seconds)', () => {
      (useMostRecentDraft as ReturnType<typeof vi.fn>).mockReturnValue({
        type: 'ideation',
        updatedAt: Date.now() - 30000, // 30 seconds ago
      });

      render(<DraftBanner />);
      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('should show minutes for drafts < 1 hour', () => {
      (useMostRecentDraft as ReturnType<typeof vi.fn>).mockReturnValue({
        type: 'ideation',
        updatedAt: Date.now() - 5 * 60000, // 5 minutes ago
      });

      render(<DraftBanner />);
      expect(screen.getByText('5m ago')).toBeInTheDocument();
    });

    it('should show hours for drafts < 24 hours', () => {
      (useMostRecentDraft as ReturnType<typeof vi.fn>).mockReturnValue({
        type: 'ideation',
        updatedAt: Date.now() - 3 * 3600000, // 3 hours ago
      });

      render(<DraftBanner />);
      expect(screen.getByText('3h ago')).toBeInTheDocument();
    });

    it('should show days for drafts < 7 days', () => {
      (useMostRecentDraft as ReturnType<typeof vi.fn>).mockReturnValue({
        type: 'ideation',
        updatedAt: Date.now() - 2 * 24 * 3600000, // 2 days ago
      });

      render(<DraftBanner />);
      expect(screen.getByText('2d ago')).toBeInTheDocument();
    });

    it('should show date for drafts >= 7 days', () => {
      const oldDate = new Date(Date.now() - 10 * 24 * 3600000); // 10 days ago
      (useMostRecentDraft as ReturnType<typeof vi.fn>).mockReturnValue({
        type: 'ideation',
        updatedAt: oldDate.getTime(),
      });

      render(<DraftBanner />);
      // The date format depends on locale, so just check it's not "d ago"
      expect(screen.queryByText(/d ago$/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (useMostRecentDraft as ReturnType<typeof vi.fn>).mockReturnValue({
        type: 'ideation',
        updatedAt: Date.now(),
      });
    });

    it('should have a resume link accessible by role', () => {
      render(<DraftBanner />);
      const resumeLink = screen.getByRole('link', { name: /resume/i });
      expect(resumeLink).toBeInTheDocument();
    });

    it('should have dismiss button with accessible title', () => {
      render(<DraftBanner />);
      const dismissButton = screen.getByTitle('Discard draft');
      expect(dismissButton).toBeInTheDocument();
    });
  });
});
