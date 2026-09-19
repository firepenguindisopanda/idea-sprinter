import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { StatusBanner } from '@/components/workspace/status-banner';

/**
 * The workspace's message strip.
 *
 * Its text used `text-destructive-foreground` - the colour for text on a solid
 * destructive fill - over a 10% tint: #690005 on near-black in dark mode, white
 * on pale pink in light, unreadable in both. And a refine that came back
 * unchanged, which is not a failure, was shown in the same red as one.
 */
describe('StatusBanner', () => {
  it('sets its message in the body text colour, not a colour meant for a solid fill', () => {
    render(<StatusBanner message="Could not reach the server." tone="error" onDismiss={() => {}} />);
    const text = screen.getByText('Could not reach the server.');
    expect(text.className).toContain('text-foreground');
    expect(text.className).not.toMatch(/text-(destructive|warning)-foreground/);
  });

  it('marks an error with the destructive accent and announces it as an alert', () => {
    render(<StatusBanner message="Failed." tone="error" onDismiss={() => {}} />);
    const banner = screen.getByRole('alert');
    expect(banner.className).toContain('border-destructive');
  });

  it('shows a notice in the warning accent, announced politely rather than as an alert', () => {
    render(
      <StatusBanner
        message="The section came back unchanged. Try again, or reword the request."
        tone="notice"
        onDismiss={() => {}}
      />,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    const banner = screen.getByRole('status');
    expect(banner.className).toContain('border-warning');
    expect(banner.className).not.toContain('destructive');
  });

  it('can be dismissed', () => {
    const onDismiss = vi.fn();
    render(<StatusBanner message="Failed." tone="error" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
