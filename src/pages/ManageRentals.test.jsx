import * as dialogs from '../utils/confirmationDialog';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ManageRentals from './ManageRentals';
import api from '../utils/axiosInstance';

jest.mock('../utils/axiosInstance', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() }));
jest.mock('../components/AdminLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const customer = { _id: 'customer-1', name: 'Deepak Mishra', email: 'deepak@example.com', phone: '9876543210' };
const machine = { _id: 'machine-1', name: 'Bosch Drill', brand: 'BOSCH', model: 'D1', condition: 'used', availabilityType: 'rent', availabilityStatus: 'available', stock: 1, rentalPrice: 500, rentPeriod: 'day', securityDeposit: 2000 };

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState({}, '', '/admin/rentals');
  api.get.mockImplementation((url) => {
    if (url === '/api/users') return Promise.resolve({ data: [customer] });
    if (url === '/api/products/inventory') return Promise.resolve({ data: [machine] });
    return Promise.resolve({ data: { rentals: [], pagination: { pages: 0 } } });
  });
  api.post.mockImplementation((url) => url === '/api/rentals/quote'
    ? Promise.resolve({ data: { plannedRentalChargePaise: 50000, derivedDailyRatePaise: 50000, plannedBillablePeriods: 1, plannedExtraDays: 0 } })
    : Promise.resolve({ data: {} }));
});

test('opens the existing creation workspace from the create reminder route', async () => {
  window.history.replaceState({}, '', '/admin/rentals?workspace=create');
  render(<ManageRentals />);

  expect(screen.getByRole('tab', { name: 'Create & drafts' })).toHaveAttribute('aria-selected', 'true');
  await screen.findByText(/Deepak Mishra/);
});

test('does not load rental creation data while only management is visible', async () => {
  render(<ManageRentals />);

  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/rentals', expect.any(Object)));
  expect(api.get).not.toHaveBeenCalledWith('/api/users', expect.any(Object));
  expect(api.get).not.toHaveBeenCalledWith('/api/products/inventory');
});

test('loads eligible rental setup data and calculates a server quote', async () => {
  render(<ManageRentals />);
  fireEvent.click(screen.getByText('Create & drafts'));
  await screen.findByText(/Deepak Mishra/);
  fireEvent.change(screen.getByLabelText('Customer'), { target: { value: customer._id } });
  fireEvent.change(screen.getByLabelText('Available second-hand machine'), { target: { value: machine._id } });
  fireEvent.click(screen.getByText('Calculate quote'));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/rentals/quote', expect.objectContaining({ agreedRatePaise: 50000 })));
  expect((await screen.findAllByText(/₹500/)).length).toBeGreaterThanOrEqual(2);
});

test('confirmation creates an active rental while draft action preserves draft status', async () => {
  const confirm = jest.spyOn(dialogs, 'confirmAction').mockResolvedValue(true);
  render(<ManageRentals />);
  fireEvent.click(screen.getByText('Create & drafts'));
  await screen.findByText(/Deepak Mishra/);
  fireEvent.change(screen.getByLabelText('Customer'), { target: { value: customer._id } });
  fireEvent.change(screen.getByLabelText('Available second-hand machine'), { target: { value: machine._id } });
  fireEvent.click(screen.getByText('Confirm rental'));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/rentals', expect.objectContaining({ status: 'active', machineId: machine._id, customerId: customer._id })));
  confirm.mockRestore();
});

test('submits custom bilingual reminder rows with the rental', async () => {
  const confirm = jest.spyOn(dialogs, 'confirmAction').mockResolvedValue(true);
  render(<ManageRentals />);
  fireEvent.click(screen.getByText('Create & drafts'));
  await screen.findByText(/Deepak Mishra/);
  fireEvent.change(screen.getByLabelText('Customer'), { target: { value: customer._id } });
  fireEvent.change(screen.getByLabelText('Available second-hand machine'), { target: { value: machine._id } });
  fireEvent.click(screen.getByRole('tab', { name: 'Custom reminders' }));
  fireEvent.change(screen.getByLabelText('Reminder 1 English message'), { target: { value: 'Please return the drill.' } });
  fireEvent.change(screen.getByLabelText('Reminder 1 Hindi message'), { target: { value: 'कृपया ड्रिल वापस करें।' } });
  fireEvent.click(screen.getByText('Confirm rental'));

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/rentals', expect.objectContaining({
    status: 'active',
    reminderSettings: {
      mode: 'custom',
      reminders: [expect.objectContaining({ offsetMinutes: 60, channels: ['email', 'whatsapp'] })],
    },
  })));
  confirm.mockRestore();
});
