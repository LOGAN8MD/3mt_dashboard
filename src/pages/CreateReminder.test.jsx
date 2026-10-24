import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CreateReminder from './CreateReminder';
import api from '../utils/axiosInstance';

jest.mock('../utils/axiosInstance', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

let mockMode = 'rental';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  NavLink: ({ children, to, className }) => (
    <a
      href={to}
      aria-current={to.endsWith(`/${mockMode}`) ? 'page' : undefined}
      className={typeof className === 'function' ? className({ isActive: to.endsWith(`/${mockMode}`) }) : className}
    >
      {children}
    </a>
  ),
  Navigate: ({ to }) => <span data-testid="redirect-target">{to}</span>,
  useParams: () => ({ mode: mockMode }),
}), { virtual: true });

test('routes rental reminders to the existing rental creation workspace', () => {
  mockMode = 'rental';
  render(<CreateReminder />);

  expect(screen.getByRole('heading', { name: 'Rental Machine' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Rental Machine' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Open rental setup' })).toHaveAttribute(
    'href',
    '/admin/rentals?workspace=create'
  );
  expect(screen.queryByRole('button', { name: /submit|send|create/i })).not.toBeInTheDocument();
});

test('creates a standalone custom reminder plan with optional product context', async () => {
  mockMode = 'custom';
  api.get.mockImplementation((url) => Promise.resolve({ data: url === '/api/users'
    ? [{ _id: 'customer-1', name: 'Deepak Mishra', email: 'deepak@example.com', phone: '9876543210' }]
    : [{ _id: 'product-1', name: 'Bosch Drill', brand: 'BOSCH', model: 'D1' }] }));
  api.post.mockResolvedValue({ data: { planCode: 'RPL-TEST-1', reminders: [] } });
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(<CreateReminder />);

  expect(screen.getByRole('heading', { name: 'Custom Message' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Custom Message' })).toHaveAttribute('aria-current', 'page');
  await screen.findByRole('option', { name: /Deepak Mishra/ });
  fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'customer-1' } });
  fireEvent.change(screen.getByLabelText('Product or machine context (optional)'), { target: { value: 'product-1' } });
  fireEvent.change(screen.getByLabelText('Shared English message'), { target: { value: 'Please visit the shop.' } });
  fireEvent.change(screen.getByLabelText('Shared Hindi message'), { target: { value: 'कृपया दुकान पर आएं।' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply to all reminders' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create reminder plan' }));

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/reminders/plans', expect.objectContaining({
    customerId: 'customer-1',
    productId: 'product-1',
    reminders: [expect.objectContaining({ offsetMinutes: 60 })],
  })));
  expect(await screen.findByText(/RPL-TEST-1/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View reminder history' })).toHaveAttribute('href', '/admin/reminders');
  confirm.mockRestore();
});

test('redirects unknown creation modes to rental reminders', () => {
  mockMode = 'unknown';
  render(<CreateReminder />);

  expect(screen.getByTestId('redirect-target')).toHaveTextContent('/admin/create-reminder/rental');
});
