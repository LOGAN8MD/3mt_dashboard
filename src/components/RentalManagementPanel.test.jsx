import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RentalManagementPanel from './RentalManagementPanel';
import api from '../utils/axiosInstance';

jest.mock('../utils/axiosInstance', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const rental = {
  _id: 'rental-1', rentalCode: 'RNT-TEST-1', status: 'active',
  machineSnapshot: { name: 'Bosch Drill', brand: 'BOSCH', model: 'D1', category: 'DRILL' },
  customerSnapshot: { name: 'Deepak Mishra', phone: '9876543210', email: 'deepak@example.com', address: 'Delhi' },
  handoverAt: '2026-11-15T04:30:00.000Z', expectedReturnAt: '2026-11-18T04:30:00.000Z',
  billingPeriod: 'day', agreedRatePaise: 50000, plannedRentalChargePaise: 150000,
  finalRentalChargePaise: 0, lateChargePaise: 0, rentalPaymentsReceivedPaise: 50000,
  securityDepositReceivedPaise: 200000, remainingBalancePaise: 0,
  payments: [{ _id: 'pay-1', amountPaise: 50000, method: 'cash', paidAt: '2026-11-15T04:30:00.000Z' }],
  auditHistory: [{ _id: 'audit-1', action: 'rental_created_and_activated', note: 'Confirmed', performedAt: '2026-11-15T04:30:00.000Z' }],
};

const preview = {
  finalRentalChargePaise: 100000, lateDays: 0, lateChargePaise: 0,
  depositAppliedPaise: 50000, depositRefundPaise: 150000,
  rentalPaymentsReceivedPaise: 50000, rentalPaymentRefundPaise: 0,
  otherApprovedChargesPaise: 0, remainingBalancePaise: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockImplementation((url) => {
    if (url === '/api/rentals') return Promise.resolve({ data: { rentals: [rental], pagination: { page: 1, pages: 1, total: 1 } } });
    if (url === `/api/rentals/${rental._id}`) return Promise.resolve({ data: rental });
    if (url === '/api/reminders/occurrences') return Promise.resolve({ data: { occurrences: [] } });
    return Promise.reject(new Error('Unexpected GET'));
  });
  api.post.mockImplementation((url) => {
    if (url.endsWith('/return-preview')) return Promise.resolve({ data: preview });
    return Promise.resolve({ data: rental });
  });
});

const openRental = async () => {
  render(<RentalManagementPanel />);
  fireEvent.click(await screen.findByText('Bosch Drill'));
  await screen.findByRole('dialog', { name: 'Rental details' });
  await screen.findByText('Financial summary');
};

test('opens complete rental detail and records an extension', async () => {
  await openRental();
  fireEvent.click(screen.getByText('Extend rental'));
  fireEvent.change(screen.getByLabelText('New expected return'), { target: { value: '2026-11-19T10:00' } });
  fireEvent.change(screen.getByLabelText('Required extension note'), { target: { value: 'Customer requested two more days' } });
  fireEvent.click(screen.getByText('Confirm extension'));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith(`/api/rentals/${rental._id}/extend`, expect.objectContaining({ note: 'Customer requested two more days' })));
});

test('previews the authoritative settlement before confirming a return', async () => {
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  await openRental();
  fireEvent.click(screen.getByText('Record return'));
  fireEvent.change(screen.getByLabelText('Deposit to apply (₹)'), { target: { value: '500' } });
  fireEvent.click(screen.getByText('Preview settlement'));
  await screen.findByLabelText('Return settlement preview');
  expect(api.post).toHaveBeenCalledWith(`/api/rentals/${rental._id}/return-preview`, expect.objectContaining({ depositAppliedPaise: 50000 }));
  fireEvent.click(screen.getByText('Confirm return'));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith(`/api/rentals/${rental._id}/return`, expect.objectContaining({ depositAppliedPaise: 50000 })));
  confirm.mockRestore();
});

test('records an additional rental payment in paise', async () => {
  await openRental();
  fireEvent.click(screen.getByText('Add payment'));
  fireEvent.change(screen.getByLabelText('Amount received (₹)'), { target: { value: '250.50' } });
  fireEvent.change(screen.getByLabelText('Reference'), { target: { value: 'UPI-22' } });
  fireEvent.click(screen.getByText('Record payment'));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith(`/api/rentals/${rental._id}/payments`, expect.objectContaining({ amountPaise: 25050, reference: 'UPI-22' })));
});

test('requires and sends a cancellation reason', async () => {
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  await openRental();
  fireEvent.click(screen.getByText('Cancel rental'));
  fireEvent.change(screen.getByLabelText('Required cancellation reason'), { target: { value: 'Customer cancelled before collection' } });
  fireEvent.click(screen.getByText('Confirm cancellation'));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith(`/api/rentals/${rental._id}/cancel`, { reason: 'Customer cancelled before collection' }));
  confirm.mockRestore();
});
