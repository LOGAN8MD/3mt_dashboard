import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminLayout from './AdminLayout';

jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn() } }));
jest.mock('react-router-dom', () => ({
  NavLink: ({ children, to, className, onClick }) => <a href={to} onClick={onClick} className={typeof className === 'function' ? className({ isActive: false }) : className}>{children}</a>,
  Outlet: () => <div data-testid="route-outlet" />,
  useNavigate: () => jest.fn(),
}), { virtual: true });

const Page = ({ name }) => <h1>{name}</h1>;

beforeEach(() => {
  localStorage.setItem('userInfo', JSON.stringify({ name: 'Rahul Admin', role: 'admin' }));
  localStorage.setItem('token', 'test-token');
});

afterEach(() => localStorage.clear());

test('keeps the same sidebar and its scroll position across nested route changes', () => {
  const { rerender } = render(<AdminLayout><Page name="First page" /></AdminLayout>);

  const navigation = screen.getByRole('navigation', { name: 'Dashboard navigation' });
  navigation.scrollTop = 240;
  rerender(<AdminLayout><Page name="Second page" /></AdminLayout>);

  expect(screen.getByText('Second page')).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Dashboard navigation' })).toBe(navigation);
  expect(navigation.scrollTop).toBe(240);
});

test('shows the admin-only create reminder navigation entry', () => {
  render(<AdminLayout><Page name="Admin page" /></AdminLayout>);

  expect(screen.getByRole('link', { name: 'Create Reminder' })).toHaveAttribute(
    'href',
    '/admin/create-reminder'
  );
});
