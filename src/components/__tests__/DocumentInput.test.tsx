// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { DocumentInput } from '../DocumentInput';
import { axe } from 'vitest-axe';

test('DocumentInput renders correctly and allows switching tabs', async () => {
  const onParse = vi.fn();
  render(<DocumentInput onParse={onParse} />);
  
  const uploadButton = screen.getByRole('button', { name: /upload file/i });
  const pasteButton = screen.getByRole('button', { name: /paste text/i });
  
  expect(uploadButton).toBeInTheDocument();
  expect(pasteButton).toBeInTheDocument();
  
  // Switch to paste tab
  await userEvent.click(pasteButton);
  
  // Check if textbox is rendered
  const textbox = await screen.findByPlaceholderText(/paste your legal document text here/i);
  expect(textbox).toBeInTheDocument();
  
  // Verify consent checkbox exists
  const checkbox = screen.getByRole('checkbox');
  expect(checkbox).toBeInTheDocument();
});

test('DocumentInput should have no accessibility violations', async () => {
  const { container } = render(<DocumentInput onParse={vi.fn()} />);
  const results = await axe(container);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (expect(results) as any).toHaveNoViolations();
});
