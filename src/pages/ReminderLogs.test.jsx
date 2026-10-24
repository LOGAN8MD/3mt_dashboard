import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ReminderLogs from './ReminderLogs';
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

const occurrence = (overrides = {}) => ({
  _id: 'occurrence-1',
  status: 'sent',
  scheduledAt: '2026-10-24T05:30:00.000Z',
  definition: { status: 'active', scheduleVersion: 1 },
  recipientSnapshot: { name: 'Deepak Mishra', email: 'deepak@example.com', phone: '9876543210' },
  contentSnapshot: {
    subjectEnglish: 'Machine reminder',
    bodyEnglish: 'Please return the machine.',
    bodyHindi: 'कृपया मशीन वापस करें।',
  },
  emailDelivery: { status: 'accepted' },
  whatsappDelivery: { status: 'manual_sent' },
  maxAttemptsPerChannel: 3,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockMode = 'rental';
});

test('rental log route requests rental scope and shows machine context', async () => {
  api.get.mockResolvedValue({ data: {
    occurrences: [occurrence({
      rental: { rentalCode: 'RNT-100', machineSnapshot: { name: 'Bosch Drill' } },
      plan: { planCode: 'RPL-RENTAL-1', planType: 'rental' },
    })],
    pagination: { pages: 1 },
  } });
  render(<ReminderLogs />);

  expect(screen.getByRole('heading', { name: 'Reminder Logs' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Rental Machines' })).toHaveAttribute('aria-current', 'page');
  expect(await screen.findByText('Bosch Drill')).toBeInTheDocument();
  expect(screen.getByText('RNT-100')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Manage rental' })).toHaveAttribute('href', '/admin/manage-reminders/rental');
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/reminders/occurrences', expect.objectContaining({
    params: expect.objectContaining({ scope: 'rental' }),
  })));
});

test('custom log route requests standalone scope and shows optional product context', async () => {
  mockMode = 'custom';
  api.get.mockResolvedValue({ data: {
    occurrences: [occurrence({
      plan: { planCode: 'RPL-CUSTOM-1', planType: 'standalone', productContextSnapshot: { name: 'Cutting Machine' } },
    })],
    pagination: { pages: 1 },
  } });
  render(<ReminderLogs />);

  expect(await screen.findByText('Cutting Machine')).toBeInTheDocument();
  expect(screen.getByText('RPL-CUSTOM-1')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Manage custom plan' })).toHaveAttribute('href', '/admin/manage-reminders/custom');
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/reminders/occurrences', expect.objectContaining({
    params: expect.objectContaining({ scope: 'standalone' }),
  })));
});

test('unknown log modes redirect to rental logs', () => {
  mockMode = 'unknown';
  render(<ReminderLogs />);

  expect(screen.getByTestId('redirect-target')).toHaveTextContent('/admin/reminder-logs/rental');
  expect(api.get).not.toHaveBeenCalled();
});
