import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ManageReminders from './ManageReminders';
import { ReminderDeliveryHistory } from '../components/ReminderWorkspace';
import api from '../utils/axiosInstance';

jest.mock('../utils/axiosInstance', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('../components/AdminLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

let mockMode;

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

const occurrence = {
  _id: '1', status: 'pending', scheduledAt: '2020-01-01T06:30:00Z',
  recipientSnapshot: { name: 'Rahul', email: 'rahul@example.com', phone: '9876543210' },
  contentSnapshot: { subjectEnglish: 'Drill return', bodyEnglish: 'Return drill', bodyHindi: 'Hindi reminder' },
  emailDelivery: { status: 'accepted' }, whatsappDelivery: { status: 'pending' },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockMode = undefined;
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

test('custom management route loads only standalone plans and exposes workspace links', async () => {
  mockMode = 'custom';
  api.get.mockResolvedValue({ data: { plans: [], pagination: { pages: 0 } } });
  render(<ManageReminders />);

  expect(screen.getByRole('heading', { name: 'Manage Reminders' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Custom Messages' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Create custom message' })).toHaveAttribute('href', '/admin/create-reminder/custom');
  expect(screen.getByRole('link', { name: 'View delivery logs' })).toHaveAttribute('href', '/admin/reminder-logs/custom');
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/reminders/plans', expect.objectContaining({
    params: expect.objectContaining({ planType: 'standalone' }),
  })));
});

test('reusable delivery history forwards a fixed rental scope', async () => {
  render(<ReminderDeliveryHistory scope="rental" />);

  await waitFor(() => expect(api.get).toHaveBeenCalledWith(
    '/api/reminders/occurrences',
    expect.objectContaining({ params: expect.objectContaining({ scope: 'rental' }) })
  ));
});
