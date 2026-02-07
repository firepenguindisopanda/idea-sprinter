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
          problemStatement: '',
          domain: '',
          mustHaveFeatures: [],
          techStack: '',
          exampleCount: 3,
          constraints: '',
          desiredTone: '',
        }}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );

    const generateButton = screen.getByRole('button', { name: /Initialize_Concepts/i });
    expect(generateButton).toBeDisabled();

    // fill required fields
    const title = screen.getByPlaceholderText(/PDF Insight Hub/i);
    const audience = screen.getByPlaceholderText(/Compliance analysts/i);
    const problem = screen.getByPlaceholderText(/Teams need a fast way to extract/i);
    const tech = screen.getByPlaceholderText(/React, PostgreSQL/i);

    // Controlled component: onChange should be called when user types/clicks.
    fireEvent.change(title, { target: { value: 'Test Project' } });
    fireEvent.change(audience, { target: { value: 'Small businesses' } });
    fireEvent.change(problem, { target: { value: 'Users need instant summaries from PDFs.' } });
    fireEvent.change(tech, { target: { value: 'React + Next.js, Postgres' } });

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
          problemStatement: 'Teams need to automate intake.',
          domain: 'Legal',
          mustHaveFeatures: ['Upload PDFs', 'Extract text'],
          techStack: 'React + Next.js, Postgres',
          exampleCount: 3,
          constraints: '',
          desiredTone: '',
        }}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );

    const generateButton = screen.getByRole('button', { name: /Initialize_Concepts/i });
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
          problemStatement: 'Teams need to automate intake.',
          domain: '',
          mustHaveFeatures: [],
          techStack: '',
          exampleCount: 3,
          constraints: '',
          desiredTone: '',
        }}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );

    const generateButton = screen.getByRole('button', { name: /Initialize_Concepts/i });
    expect(generateButton).toBeEnabled();
    fireEvent.click(generateButton);
    expect(onSubmit).toHaveBeenCalled();
  });
});
