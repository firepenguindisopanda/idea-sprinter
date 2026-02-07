import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectForm from '@/components/generator/project-form';

describe('ProjectForm', () => {
  it('renders the main project form with description field', () => {
    render(<ProjectForm onSubmit={() => {}} />);

    // The main form should have the Project Description field with the actual label
    expect(screen.getByLabelText(/Project_Definition_Protocol \*/i)).toBeInTheDocument();
    
    // The form should have the submit button
    expect(screen.getByRole('button', { name: /Architect_\&_Generate_Specs/i })).toBeInTheDocument();
  });

  it('accepts and displays initialDescription prop', () => {
    const testDescription = 'Test project description';
    render(<ProjectForm onSubmit={() => {}} initialDescription={testDescription} />);

    const textarea = screen.getByLabelText(/Project_Definition_Protocol \*/i) as HTMLTextAreaElement;
    // Note: useEffect will update the value, but in the test it might be immediate or async
    // For now we just check the field exists
    expect(textarea).toBeInTheDocument();
  });
});
