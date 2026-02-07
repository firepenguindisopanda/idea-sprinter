import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IdeationPage from '@/app/ideation/page';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock the protected route component
vi.mock('@/components/protected-route', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Ideation Page - Core Functionality', () => {

  describe('Wizard Steps', () => {

    it('should show problem description as first step', () => {
      render(<IdeationPage />);

      expect(screen.getByText(/What's your problem?/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/I wish there was a way/i)).toBeInTheDocument();
    });

    it('should show prompt suggestions', () => {
      render(<IdeationPage />);

      expect(screen.getByText(/Stuck\? Try one of these:/i)).toBeInTheDocument();
      expect(screen.getByText(/I need a way to/i)).toBeInTheDocument();
    });

    it('should show character count', () => {
      render(<IdeationPage />);

      expect(screen.getByText(/0 characters/i)).toBeInTheDocument();
    });
  });

  describe('Problem Input', () => {

    it('should enable continue button when problem is entered', () => {
      render(<IdeationPage />);

      const textarea = screen.getByPlaceholderText(/I wish there was a way/i);
      fireEvent.change(textarea, { target: { value: 'I need a way to automate contract review' } });

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).toBeEnabled();
    });

    it('should disable continue button when problem is empty', () => {
      render(<IdeationPage />);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {

    it('should have skip to generation button', () => {
      render(<IdeationPage />);

      const skipButton = screen.getByRole('button', { name: /Skip to Generation/i });
      expect(skipButton).toBeInTheDocument();
    });

    it('should have back to home link', () => {
      render(<IdeationPage />);

      const backLink = screen.getByRole('link', { name: /← Back to Home/i });
      expect(backLink).toBeInTheDocument();
    });
  });

  describe('User Experience', () => {

    it('should show wizard step indicators', () => {
      render(<IdeationPage />);

      const problemSteps = screen.getAllByText(/What's your problem\?/i);
      expect(problemSteps.length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Refine details/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Add context/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Generate ideas/i).length).toBeGreaterThanOrEqual(1);
    });

    it('should apply suggestion when clicking prompt suggestion', () => {
      render(<IdeationPage />);

      const suggestion = screen.getByText(/I need a way to/);
      fireEvent.click(suggestion);

      const textarea = screen.getByPlaceholderText(/I wish there was a way/i);
      expect((textarea as HTMLTextAreaElement).value).toContain('I need a way to');
    });
  });

  describe('API Integration', () => {

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle successful API response', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({
          examples: [
            { id: '1', title: 'Example 1', one_line: 'One line', scope_bullets: [], full_text: 'Full text' }
          ]
        }), {
          headers: { 'Content-Type': 'application/json' },
        }))
      ) as any;

      render(<IdeationPage />);

      const textarea = screen.getByPlaceholderText(/I wish there was a way/i);
      fireEvent.change(textarea, { target: { value: 'I need a contract review tool' } });

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(continueButton);
    });
  });

  describe('Edge Cases', () => {

    it('should handle special characters in input', () => {
      render(<IdeationPage />);

      const textarea = screen.getByPlaceholderText(/I wish there was a way/i);
      fireEvent.change(textarea, { target: { value: 'App with émojis 🎉 and "quotes"' } });

      expect((textarea as HTMLTextAreaElement).value).toContain('🎉');
    });

    it('should update character count on input', () => {
      render(<IdeationPage />);

      const textarea = screen.getByPlaceholderText(/I wish there was a way/i);
      fireEvent.change(textarea, { target: { value: 'test' } });

      expect(screen.getByText(/4 characters/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {

    it.skip('should show disabled continue button with empty input', () => {
      render(<IdeationPage />);

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Draft Persistence', () => {

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should save draft to local storage when form changes', () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem');

      render(<IdeationPage />);

      const textarea = screen.getByPlaceholderText(/I wish there was a way/i);
      fireEvent.change(textarea, { target: { value: 'Test idea' } });

      expect(mockSetItem).toHaveBeenCalled();
    });
  });
});
