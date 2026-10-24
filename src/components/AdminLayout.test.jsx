import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

test('shows the three admin-only reminder workspace entries', () => {
  render(<AdminLayout><Page name="Admin page" /></AdminLayout>);

  expect(screen.getByRole('link', { name: 'Create Reminders' })).toHaveAttribute('href', '/admin/create-reminder');
  expect(screen.getByRole('link', { name: 'Manage Reminders' })).toHaveAttribute('href', '/admin/manage-reminders');
  expect(screen.getByRole('link', { name: 'Reminder Logs' })).toHaveAttribute('href', '/admin/reminder-logs');
  expect(screen.queryByRole('link', { name: 'Rentals' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Reminders' })).not.toBeInTheDocument();
});

test('organizes admin navigation into business-focused groups and keeps useful ordering', () => {
  render(<AdminLayout><Page name="Admin page" /></AdminLayout>);

  ['Overview', 'Catalog', 'People', 'Business', 'Communication', 'Insights'].forEach((heading) => {
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  });
  const links = screen.getAllByRole('link').map((link) => link.textContent.trim());
  expect(links.indexOf('Manage Products')).toBeLessThan(links.indexOf('Pending Products'));
  expect(links.indexOf('Create Reminders')).toBeLessThan(links.indexOf('Manage Reminders'));
  expect(links.indexOf('Manage Reminders')).toBeLessThan(links.indexOf('Reminder Logs'));
});

test('shows only employee groups for an employee account', () => {
  localStorage.setItem('userInfo', JSON.stringify({ name: 'Deepak Employee', role: 'employee' }));
  render(<AdminLayout><Page name="Employee page" /></AdminLayout>);

  expect(screen.getByRole('heading', { name: 'Product Requests' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Add Product Request' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Manage Products' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Create Reminders' })).not.toBeInTheDocument();
  expect(screen.getByText('Employee Workspace')).toBeInTheDocument();
});

test('mobile menu exposes clear open and close controls', () => {
  render(<AdminLayout><Page name="Admin page" /></AdminLayout>);

  const openButton = screen.getByRole('button', { name: 'Open admin menu' });
  expect(openButton).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(openButton);
  expect(openButton).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getAllByRole('button', { name: 'Close dashboard menu' })).toHaveLength(2);
});
