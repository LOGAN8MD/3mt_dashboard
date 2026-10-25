import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReminderLogGroupDetail from './ReminderLogGroupDetail';
import api from '../utils/axiosInstance';
import { confirmAction } from '../utils/confirmationDialog';

jest.mock('../utils/axiosInstance', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('../utils/confirmationDialog', () => ({ confirmAction: jest.fn() }));
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => ({ search: '?search=Deepak&sortBy=scheduledAt&direction=asc&page=2' }),
}), { virtual: true });

const detail = {
  group: {
    groupKey: 'plan:plan-1', groupType: 'plan', groupId: 'plan-1',
    recipientSnapshot: { name: 'Deepak Mishra', email: 'deepak@example.com', phone: '8286104286' },
    createdAt: '2026-10-24T04:00:00.000Z',
  },
  plans: [{
    _id: 'plan-1', planCode: 'RPL-CUSTOM-1', status: 'active',
    startsAt: '2026-10-24T04:00:00.000Z', endsAt: '2026-10-28T04:00:00.000Z',
    productContextSnapshot: { name: 'Bosch Drill' },
  }],
  rentals: [],
  definitions: [
    { _id: 'definition-start', status: 'active' },
    { _id: 'definition-reminder', status: 'active' },
  ],
  occurrences: [
    {
      _id: 'occurrence-start', definition: 'definition-start', definitionType: 'standalone_custom',
      planRowKey: 'STARTING_MESSAGE', scheduledAt: '2026-10-24T04:00:00.000Z',
      scheduleVersion: 1, status: 'failed', channels: ['email', 'whatsapp'],
      recipientSnapshot: { name: 'Deepak Mishra', email: 'deepak@example.com', phone: '8286104286' },
      contentSnapshot: { bodyEnglish: 'Welcome to 3MT.', bodyHindi: '3MT mein swagat hai.' },
      emailDelivery: { status: 'failed', attemptsCount: 1, lastError: 'Provider unavailable' },
      whatsappDelivery: { status: 'pending' }, maxAttemptsPerChannel: 3,
      deliveryAttempts: [{
        _id: 'attempt-1', channel: 'email', attemptNumber: 1, status: 'failed',
        startedAt: '2026-10-24T04:00:01.000Z', errorMessage: 'Provider unavailable',
      }],
    },
    {
      _id: 'occurrence-reminder', definition: 'definition-reminder', definitionType: 'standalone_custom',
      planRowKey: 'ROW-1', scheduledAt: '2026-10-25T04:00:00.000Z', scheduleVersion: 2,
      status: 'sent', channels: ['email'],
      recipientSnapshot: { name: 'Deepak Mishra', email: 'deepak@example.com', phone: '8286104286' },
      contentSnapshot: { bodyEnglish: 'Scheduled message.', bodyHindi: 'Nirdharit sandesh.' },
      emailDelivery: { status: 'accepted', attemptsCount: 1 },
      whatsappDelivery: { status: 'not_selected' }, maxAttemptsPerChannel: 3, deliveryAttempts: [],
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockImplementation((url) => {
    if (url.includes('/whatsapp')) return Promise.resolve({ data: { message: 'WhatsApp text', url: 'https://wa.me/918286104286' } });
    return Promise.resolve({ data: detail });
  });
  api.post.mockResolvedValue({ data: {} });
  confirmAction.mockResolvedValue(true);
});

test('loads exact group history and preserves overview query on back navigation', async () => {
  render(<ReminderLogGroupDetail scope="standalone" mode="custom" groupType="plan" groupId="plan-1" />);

  expect(await screen.findByRole('heading', { name: 'Deepak Mishra' })).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith('/api/reminders/log-groups/plan/plan-1', expect.objectContaining({ params: { scope: 'standalone' } }));
  expect(screen.getByText('Bosch Drill')).toBeInTheDocument();
  expect(screen.getByText('Starting message')).toBeInTheDocument();
  expect(screen.getByText('Version 2')).toBeInTheDocument();
  expect(screen.getByText('Delivery attempts (1)')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to reminder logs' })).toHaveAttribute('href', '/admin/reminder-logs/custom?search=Deepak&sortBy=scheduledAt&direction=asc&page=2');
});

test('previews bilingual content and retries an eligible failed email', async () => {
  render(<ReminderLogGroupDetail scope="standalone" mode="custom" groupType="plan" groupId="plan-1" />);
  await screen.findByText('Starting message');

  fireEvent.click(screen.getAllByRole('button', { name: 'View message' })[0]);
  expect(screen.getByText('Welcome to 3MT.')).toBeInTheDocument();
  expect(screen.getByText('3MT mein swagat hai.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));

  fireEvent.click(screen.getByRole('button', { name: 'Retry email' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/reminders/occurrences/occurrence-start/send-email'));
});

test('prepares WhatsApp and records manual sent confirmation on the relevant occurrence', async () => {
  render(<ReminderLogGroupDetail scope="standalone" mode="custom" groupType="plan" groupId="plan-1" />);
  await screen.findByText('Starting message');

  fireEvent.click(screen.getByRole('button', { name: 'Share on WhatsApp' }));
  expect(await screen.findByText('WhatsApp text')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open WhatsApp' })).toHaveAttribute('href', 'https://wa.me/918286104286');
  fireEvent.click(screen.getByRole('button', { name: 'Mark as sent' }));
  await waitFor(() => expect(confirmAction).toHaveBeenCalled());
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/reminders/occurrences/occurrence-start/whatsapp-sent', { confirmed: true }));
});

test('renders detail API errors with retry and preserved back navigation', async () => {
  api.get.mockRejectedValueOnce({ response: { data: { message: 'History unavailable' } } });
  render(<ReminderLogGroupDetail scope="standalone" mode="custom" groupType="plan" groupId="plan-1" />);

  expect(await screen.findByRole('alert')).toHaveTextContent('History unavailable');
  api.get.mockResolvedValueOnce({ data: detail });
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('heading', { name: 'Deepak Mishra' })).toBeInTheDocument();
});

test('keeps every historical occurrence status visible and labels rental confirmation', async () => {
  const statuses = ['pending', 'processing', 'partially_failed', 'missed', 'cancelled'];
  const history = statuses.map((status, index) => ({
    ...detail.occurrences[1],
    _id: `history-${status}`,
    definition: `history-definition-${status}`,
    definitionType: index === 0 ? 'rental_activation_confirmation' : 'rental_return',
    status,
    scheduledAt: `2026-10-${20 + index}T04:00:00.000Z`,
    scheduleVersion: index + 1,
    emailDelivery: { status: status === 'processing' ? 'processing' : 'not_selected' },
    whatsappDelivery: { status: 'not_selected' },
  }));
  api.get.mockResolvedValueOnce({ data: {
    ...detail,
    definitions: history.map((item) => ({ _id: item.definition, status: 'active' })),
    occurrences: history,
  } });
  render(<ReminderLogGroupDetail scope="rental" mode="rental" groupType="rental" groupId="rental-1" />);

  expect(await screen.findByText('Rental confirmation')).toBeInTheDocument();
  for (const status of statuses) {
    expect(screen.getAllByText(status.replaceAll('_', ' ')).length).toBeGreaterThan(0);
  }
  expect(screen.getByText('Version 5')).toBeInTheDocument();
});
