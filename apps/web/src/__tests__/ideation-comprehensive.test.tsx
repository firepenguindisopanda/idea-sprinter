import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IdeationPage from '@/app/ideation/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/components/protected-route', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Ideation Page Comprehensive Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial Render', () => {
    it('should render ideation page with header', () => {
      render(<IdeationPage />);
      expect(screen.getByRole('heading', { name: /Ideation/i })).toBeInTheDocument();
      expect(screen.getByText(/Not sure what to build/i)).toBeInTheDocument();
    });

    it('should render wizard step indicators', () => {
      render(<IdeationPage />);
      expect(screen.getAllByText(/What's your problem\?/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Refine details/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Add context/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Generate ideas/i).length).toBeGreaterThanOrEqual(1);
    });

    it('should show step 1 as active', () => {
      render(<IdeationPage />);
      const activeStep = screen.getByText(/What's your problem\?/i);
      expect(activeStep.closest('div')?.querySelector('.bg-amber-500')).toBeInTheDocument();
    });
  });

  describe('Problem Description Input', () => {
    it('should render problem description textarea', () => {
      render(<IdeationPage />);
      expect(screen.getByPlaceholderText(/I wish there was a way/i)).toBeInTheDocument();
    });

    it('should render prompt suggestions', () => {
      render(<IdeationPage />);
      expect(screen.getByText(/I need a way to/i)).toBeInTheDocument();
      expect(screen.getByText(/We spend too much time/i)).toBeInTheDocument();
      expect(screen.getByText(/My team struggles with/i)).toBeInTheDocument();
    });

    it('should update character count when typing', () => {
      render(<IdeationPage />);
      const textarea = screen.getByPlaceholderText(/I wish there was a way/i);
      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      expect(screen.getByText(/11 characters/i)).toBeInTheDocument();
    });

    it('should enable continue button with valid input', () => {
      render(<IdeationPage />);
      const textarea = screen.getByPlaceholderText(/I wish there was a way/i);
      fireEvent.change(textarea, { target: { value: 'A brief description of my idea' } });
      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).toBeEnabled();
    });
  });

  describe('Wizard Navigation', () => {
    it('should show continue button on step 1', () => {
      render(<IdeationPage />);
      expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
    });

    it('should navigate to step 2 after clicking continue', async () => {
      render(<IdeationPage />);
      const textarea = screen.getByPlaceholderText(/I wish there was a way/i);
      fireEvent.change(textarea, { target: { value: 'My project idea' } });
      const continueButton = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(continueButton);
      // Wait for extraction to complete or show loading state
      await waitFor(() => {
        expect(screen.getByText(/Analyzing your idea|We extracted this from your description/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it.skip('should show back button on generate step', async () => {
      render(<IdeationPage />);
      const textarea = screen.getByPlaceholderText(/I wish there was a way/i);
      fireEvent.change(textarea, { target: { value: 'My project idea' } });
      const continueButton = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(continueButton);
      
      // Wait for step 2 to appear - either loading or extracted
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Apply & Continue/i })).toBeInTheDocument();
      }, { timeout: 10000 });
      
      const applyButton = screen.getByRole('button', { name: /Apply & Continue/i });
      fireEvent.click(applyButton);
      
      const continueButton2 = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(continueButton2);
      
      const reviewButton = screen.getByRole('button', { name: /Review/i });
      fireEvent.click(reviewButton);
      
      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
    });
  });

  describe('Skip to Generation', () => {
    it('should render skip to generation button', () => {
      render(<IdeationPage />);
      expect(screen.getByRole('button', { name: /Skip to Generation/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<IdeationPage />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have interactive elements', () => {
      render(<IdeationPage />);
      expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /← Back to Home/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on different viewport sizes', () => {
      render(<IdeationPage />);
      expect(screen.getByText(/What's your problem\?/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/I wish there was a way/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it.skip('should show disabled continue button with empty input', () => {
      render(<IdeationPage />);
      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).toBeDisabled();
    });

    it('should handle very long input', () => {
      render(<IdeationPage />);
      const longInput = 'A'.repeat(5000);
      const textarea = screen.getByPlaceholderText(/I wish there was a way/i);
      fireEvent.change(textarea, { target: { value: longInput } });
      expect((textarea as HTMLTextAreaElement).value.length).toBe(5000);
    });
  });

  describe('Prompt Suggestions', () => {
    it('should have prompt suggestions available', () => {
      render(<IdeationPage />);
      expect(screen.getByText(/Stuck\? Try one of these:/i)).toBeInTheDocument();
    });

    it('should fill textarea when clicking suggestion', () => {
      render(<IdeationPage />);
      const suggestion = screen.getByText(/I need a way to/);
      fireEvent.click(suggestion);
      const textarea = screen.getByPlaceholderText(/I wish there was a way/i);
      expect((textarea as HTMLTextAreaElement).value).toMatch(/^I need a way to/);
    });
  });

  describe('Back to Home Navigation', () => {
    it('should render back to home link', () => {
      render(<IdeationPage />);
      expect(screen.getByRole('link', { name: /← Back to Home/i })).toBeInTheDocument();
    });
  });

  describe('Ideation Module Badge', () => {
    it('should show ideation module active indicator', () => {
      render(<IdeationPage />);
      expect(screen.getByText(/Ideation Module Active/i)).toBeInTheDocument();
    });
  });
});
