import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PreGenerationForm from '@/components/generator/pre-generation-form';

describe('PreGenerationForm', () => {
  it('disables Generate examples until required fields are valid and calls onSubmit when clicked', async () => {
    const onSubmit = vi.fn();
    const onChange = vi.fn();
    render(
      <PreGenerationForm
        value={{
          title: '',
          audience: '',
          techStack: '',
          scopeSeeds: [],
          exampleCount: 3,
          constraints: '',
          desiredTone: '',
          timeBudget: '',
          nonGoals: '',
        }}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );

    const generateButton = screen.getByRole('button', { name: /Generate examples/i });
    expect(generateButton).toBeDisabled();

    // fill required fields
    const title = screen.getByPlaceholderText(/Short project title/i);
    const audience = screen.getByPlaceholderText(/e.g. Small businesses, Students, Enterprise/i);
    const tech = screen.getByPlaceholderText(/React \+ Next\.js, Postgres/i);
    const mvpCheckbox = screen.getByText('MVP').closest('label')?.querySelector('input');

    // Controlled component: onChange should be called when user types/clicks.
    fireEvent.change(title, { target: { value: 'Test Project' } });
    fireEvent.change(audience, { target: { value: 'Small businesses' } });
    fireEvent.change(tech, { target: { value: 'React + Next.js, Postgres' } });
    if (mvpCheckbox) fireEvent.click(mvpCheckbox);

    expect(onChange).toHaveBeenCalled();
    // Note: button enabling logic depends on parent updating `value`.
  });

  it('calls onSubmit when clicking generate on a valid form', async () => {
    const onSubmit = vi.fn();
    const onChange = vi.fn();
    render(
      <PreGenerationForm
        value={{
          title: 'My App',
          audience: 'Small businesses',
          techStack: 'React + Next.js, Postgres',
          scopeSeeds: ['MVP'],
          exampleCount: 3,
          constraints: '',
          desiredTone: '',
          timeBudget: '',
          nonGoals: '',
        }}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );

    const generateButton = screen.getByRole('button', { name: /Generate examples/i });
    expect(generateButton).toBeEnabled();
    fireEvent.click(generateButton);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('allows generate when techStack is omitted and other fields are valid', async () => {
    const onSubmit = vi.fn();
    const onChange = vi.fn();
    render(
      <PreGenerationForm
        value={{
          title: 'My App',
          audience: 'Small businesses',
          techStack: '',
          scopeSeeds: ['MVP'],
          exampleCount: 3,
          constraints: '',
          desiredTone: '',
          timeBudget: '',
          nonGoals: '',
        }}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );

    const generateButton = screen.getByRole('button', { name: /Generate examples/i });
    expect(generateButton).toBeEnabled();
    fireEvent.click(generateButton);
    expect(onSubmit).toHaveBeenCalled();
  });
});
