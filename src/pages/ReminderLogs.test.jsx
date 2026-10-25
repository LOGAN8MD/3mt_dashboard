import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReminderLogs from './ReminderLogs';
import api from '../utils/axiosInstance';

jest.mock('../utils/axiosInstance', () => ({ get: jest.fn(), post: jest.fn() }));

let mockMode = 'rental';
let mockGroupType;
let mockGroupId;

jest.mock('react-router-dom', () => {
  const ReactModule = require('react');
  return {
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
    NavLink: ({ children, to, className }) => (
      <a href={to} aria-current={to.endsWith(`/${mockMode}`) ? 'page' : undefined} className={typeof className === 'function' ? className({ isActive: to.endsWith(`/${mockMode}`) }) : className}>
        {children}
      </a>
    ),
    Navigate: ({ to }) => <span data-testid="redirect-target">{to}</span>,
    useParams: () => ({ mode: mockMode, groupType: mockGroupType, groupId: mockGroupId }),
    useLocation: () => ({ search: '?sortBy=scheduledAt&page=2' }),
    useSearchParams: () => {
      const [params, setParams] = ReactModule.useState(() => new URLSearchParams());
      return [params, (next) => setParams(new URLSearchParams(next))];
    },
  };
}, { virtual: true });

const group = (overrides = {}) => ({
  groupKey: 'rental:rental-1', groupType: 'rental', groupId: 'rental-1', occurrenceCount: 3,
  recipientSnapshot: { name: 'Deepak Mishra', email: 'deepak@example.com', phone: '9876543210' },
  createdAt: '2026-10-24T05:30:00.000Z', scheduledAt: '2026-10-26T05:30:00.000Z',
  context: { rentalCode: 'RNT-100', machine: { name: 'Bosch Drill' } },
  statusSummary: { pending: 1, sent: 1, failed: 1, partiallyFailed: 0, missed: 0, cancelled: 0 },
  channelSummary: {
    email: { successful: 1, pending: 1, failed: 1 },
    whatsapp: { successful: 1, pending: 2, failed: 0 },
  },
  ...overrides,
});

const response = (groups = [group()], pagination = { page: 1, pages: 1, total: groups.length }) => ({ data: { groups, pagination } });

beforeEach(() => {
  jest.clearAllMocks();
  mockMode = 'rental';
  mockGroupType = undefined;
  mockGroupId = undefined;
});

test('rental log route requests grouped rental scope and links to complete history with query state', async () => {
  api.get.mockResolvedValue(response());
  render(<ReminderLogs />);

  expect(screen.getByRole('heading', { name: 'Reminder Logs' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Rental Machines' })).toHaveAttribute('aria-current', 'page');
  expect(await screen.findByText('Bosch Drill')).toBeInTheDocument();
  expect(screen.getByText('RNT-100')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Deepak Mishra/ })).toHaveAttribute(
    'href', '/admin/reminder-logs/rental/rental/rental-1?sortBy=scheduledAt&page=2'
  );
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/reminders/log-groups', expect.objectContaining({
    params: { scope: 'rental', search: '', sortBy: 'createdAt', sortDirection: 'desc', page: 1, limit: 12 },
  })));
});

test('custom log route requests standalone groups and shows optional product context', async () => {
  mockMode = 'custom';
  api.get.mockResolvedValue(response([group({
    groupKey: 'plan:plan-1', groupType: 'plan', groupId: 'plan-1',
    context: { planCode: 'RPL-CUSTOM-1', product: { name: 'Cutting Machine' } },
  })]));
  render(<ReminderLogs />);

  expect(await screen.findByText('Cutting Machine')).toBeInTheDocument();
  expect(screen.getByText('RPL-CUSTOM-1')).toBeInTheDocument();
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/reminders/log-groups', expect.objectContaining({
    params: expect.objectContaining({ scope: 'standalone' }),
  })));
});

test('group controls request server sorting, pagination and debounced customer search', async () => {
  api.get.mockResolvedValue(response([], { page: 1, pages: 2, total: 13 }));
  render(<ReminderLogs />);
  await screen.findByText('No reminder groups found');

  fireEvent.change(screen.getByLabelText('Sort reminder logs'), { target: { value: 'scheduledAt' } });
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/reminders/log-groups', expect.objectContaining({
    params: expect.objectContaining({ sortBy: 'scheduledAt' }),
  })));
  fireEvent.change(screen.getByLabelText('Sort direction'), { target: { value: 'asc' } });
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/reminders/log-groups', expect.objectContaining({
    params: expect.objectContaining({ sortDirection: 'asc' }),
  })));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/reminders/log-groups', expect.objectContaining({
    params: expect.objectContaining({ page: 2 }),
  })));
  fireEvent.change(screen.getByLabelText('Search reminder customers'), { target: { value: ' Deepak ' } });
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/reminders/log-groups', expect.objectContaining({
    params: expect.objectContaining({ search: 'Deepak' }),
  })), { timeout: 1500 });
});

test('group overview renders API error with retry control', async () => {
  api.get.mockRejectedValueOnce({ response: { data: { message: 'Grouped logs unavailable' } } });
  render(<ReminderLogs />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Grouped logs unavailable');

  api.get.mockResolvedValueOnce(response([]));
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('No reminder groups found')).toBeInTheDocument();
});

test('unknown log modes redirect to rental logs', () => {
  mockMode = 'unknown';
  render(<ReminderLogs />);
  expect(screen.getByTestId('redirect-target')).toHaveTextContent('/admin/reminder-logs/rental');
  expect(api.get).not.toHaveBeenCalled();
});
