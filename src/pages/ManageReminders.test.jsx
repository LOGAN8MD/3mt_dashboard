import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ManageReminders from './ManageReminders';
import api from '../utils/axiosInstance';

jest.mock('../utils/axiosInstance', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('../components/AdminLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const occurrence = {
  _id: '1', status: 'pending', scheduledAt: '2020-01-01T06:30:00Z',
  recipientSnapshot: { name: 'Rahul', email: 'rahul@example.com', phone: '9876543210' },
  contentSnapshot: { subjectEnglish: 'Drill return', bodyEnglish: 'Return drill', bodyHindi: 'Hindi reminder' },
  emailDelivery: { status: 'accepted' }, whatsappDelivery: { status: 'pending' },
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockImplementation((url) => Promise.resolve({ data: url.endsWith('/whatsapp')
    ? { url: 'https://wa.me/919876543210?text=test', message: 'Return drill' }
    : { occurrences: [occurrence], pagination: { pages: 1 } } }));
  api.post.mockResolvedValue({ data: {} });
});

test('email is shown sent while WhatsApp stays ready until explicit admin confirmation', async () => {
  render(<ManageReminders />);
  fireEvent.click(screen.getByRole('tab', { name: 'Delivery history' }));
  expect(await screen.findByText('Sent')).toBeInTheDocument();
  expect(screen.getByText('Message ready')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Share on WhatsApp'));
  const link = await screen.findByText('Open WhatsApp');
  expect(link).toHaveAttribute('href', 'https://wa.me/919876543210?text=test');
  expect(api.post).not.toHaveBeenCalled();
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  fireEvent.click(screen.getByText('Mark as sent'));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/reminders/occurrences/1/whatsapp-sent', { confirmed: true }));
  confirm.mockRestore();
});

test('cancelled reminders have no share action even when their WhatsApp channel was pending', async () => {
  api.get.mockResolvedValue({ data: { occurrences: [{ ...occurrence, status: 'cancelled' }], pagination: { pages: 1 } } });
  render(<ManageReminders />);
  fireEvent.click(screen.getByRole('tab', { name: 'Delivery history' }));
  await screen.findByText('Rahul');
  expect(screen.queryByText('Share on WhatsApp')).not.toBeInTheDocument();
});
