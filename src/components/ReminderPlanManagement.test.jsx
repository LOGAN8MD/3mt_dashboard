import * as dialogs from '../utils/confirmationDialog';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReminderPlanManagement from './ReminderPlanManagement';
import api from '../utils/axiosInstance';

jest.mock('../utils/axiosInstance', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn() }));
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const plan = {
  _id: 'plan-1', planCode: 'RPL-TEST-1', planType: 'standalone', status: 'active', version: 1,
  recipientSnapshot: { name: 'Deepak Mishra', email: 'deepak@example.com', phone: '9876543210' },
  customer: { _id: 'customer-1', name: 'Deepak Mishra', email: 'deepak@example.com', phone: '9876543210' },
  product: { _id: 'product-1' }, productContextSnapshot: { name: 'Bosch Drill' },
  startsAt: '2099-11-15T04:30:00.000Z', endsAt: '2099-11-16T04:30:00.000Z',
  rows: [{ rowKey: 'OFFSET-60M' }],
};
const occurrence = {
  _id: 'occurrence-1', planRowKey: 'OFFSET-60M', scheduleVersion: 1, status: 'pending',
  scheduledAt: '2099-11-16T03:30:00.000Z', channels: ['email', 'whatsapp'],
  contentSnapshot: { bodyEnglish: 'Please visit.', bodyHindi: 'कृपया आएं।' },
  emailDelivery: { status: 'failed', lastError: 'Provider unavailable' },
  whatsappDelivery: { status: 'pending' },
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockImplementation((url) => Promise.resolve({ data: url === '/api/reminders/plans'
    ? { plans: [plan], pagination: { pages: 1 } }
    : { ...plan, occurrences: [occurrence], definitions: [] } }));
  api.post.mockResolvedValue({ data: {} });
  api.patch.mockResolvedValue({ data: {} });
});

test('lists plans, shows independent delivery detail, and pauses an active plan', async () => {
  render(<ReminderPlanManagement />);
  await screen.findByText('RPL-TEST-1');
  fireEvent.click(screen.getByRole('button', { name: 'Details' }));
  expect(await screen.findByText('Provider unavailable')).toBeInTheDocument();
  expect(screen.getByText('pending')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Pause plan' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/reminders/plans/plan-1/pause', undefined));
});

test('cancels one unsent occurrence without cancelling the plan', async () => {
  const prompt = jest.spyOn(dialogs, 'requestReason').mockResolvedValue('Customer requested cancellation');
  render(<ReminderPlanManagement />);
  await screen.findByText('RPL-TEST-1');
  fireEvent.click(screen.getByRole('button', { name: 'Details' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel reminder' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith(
    '/api/reminders/occurrences/occurrence-1/cancel',
    { reason: 'Customer requested cancellation' }
  ));
  prompt.mockRestore();
});

test('shows empty and request-error states accessibly', async () => {
  api.get.mockResolvedValueOnce({ data: { plans: [], pagination: { pages: 0 } } });
  const { unmount } = render(<ReminderPlanManagement />);
  expect(await screen.findByText('No reminder plans found.')).toHaveAttribute('role', 'status');
  unmount();

  api.get.mockRejectedValueOnce({ response: { data: { message: 'Plan service unavailable' } } });
  render(<ReminderPlanManagement />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Plan service unavailable');
});

test('supports long plan content and closes the detail dialog with Escape', async () => {
  const longName = 'Deepak Mishra '.repeat(20);
  const longMessage = 'Please return the machine safely. '.repeat(80);
  api.get.mockImplementation((url) => Promise.resolve({ data: url === '/api/reminders/plans'
    ? { plans: [{ ...plan, recipientSnapshot: { ...plan.recipientSnapshot, name: longName } }], pagination: { pages: 1 } }
    : { ...plan, recipientSnapshot: { ...plan.recipientSnapshot, name: longName }, occurrences: [{
      ...occurrence,
      contentSnapshot: { ...occurrence.contentSnapshot, bodyEnglish: longMessage },
    }], definitions: [] } }));

  render(<ReminderPlanManagement />);
  await screen.findByText(longName.trim());
  fireEvent.click(screen.getByRole('button', { name: 'Details' }));
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'View message' }));
  expect(screen.getByText(longMessage.trim())).toHaveClass('break-words');
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

test('fixed plan type hides the type filter and scopes the plan request', async () => {
  render(<ReminderPlanManagement fixedPlanType="rental" />);

  await screen.findByText('RPL-TEST-1');
  expect(screen.queryByLabelText('Plan type')).not.toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith('/api/reminders/plans', {
    params: expect.objectContaining({ planType: 'rental' }),
  });
});
