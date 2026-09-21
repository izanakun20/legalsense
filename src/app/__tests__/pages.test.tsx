// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Page from '../page';
import WorkspacePage from '../workspace/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img alt="mock" {...props} />
}));

test('Landing Page renders', () => {
  const { container } = render(<Page />);
  expect(container).toBeInTheDocument();
});

test('Workspace Page renders', () => {
  const { container } = render(<WorkspacePage />);
  expect(container).toBeInTheDocument();
});
