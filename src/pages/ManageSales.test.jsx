import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ManageSales from './ManageSales';
import api from '../utils/axiosInstance';

jest.mock('../utils/axiosInstance', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() }));
jest.mock('../components/AdminLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const customer = { _id: 'customer-1', name: 'Deepak Mishra', phone: '9876543210', email: 'deepak@example.com' };
const machine = { _id: 'machine-1', name: 'Bosch Drill', brand: 'BOSCH', model: 'D1', condition: 'used', availabilityType: 'both', availabilityStatus: 'available', stock: 1, salePrice: 15000 };
const sale = {
  _id: 'sale-1', saleCode: 'SAL-TEST-1', status: 'draft',
  machine: { _id: machine._id }, customer: { _id: customer._id },
  machineSnapshot: { name: machine.name, brand: machine.brand, model: machine.model, category: 'DRILL' },
  customerSnapshot: { name: customer.name, phone: customer.phone, email: customer.email },
  soldAt: '2026-11-15T04:30:00.000Z', agreedSalePricePaise: 1500000,
  paymentsReceivedPaise: 500000, paymentsRefundedPaise: 0, remainingBalancePaise: 1000000,
  payments: [{ _id: 'payment-1', amountPaise: 500000, method: 'cash', paidAt: '2026-11-15T04:30:00.000Z' }],
  notes: 'Paid draft', auditHistory: [{ _id: 'audit-1', action: 'machine_sale_draft_created', performedAt: '2026-11-15T04:30:00.000Z' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockImplementation((url) => {
    if (url === '/api/users') return Promise.resolve({ data: [customer] });
    if (url === '/api/products/inventory') return Promise.resolve({ data: [machine] });
    if (url === '/api/machine-sales') return Promise.resolve({ data: { sales: [sale], pagination: { page: 1, pages: 1, total: 1 } } });
    if (url === `/api/machine-sales/${sale._id}`) return Promise.resolve({ data: sale });
    return Promise.reject(new Error('Unexpected GET'));
  });
  api.post.mockResolvedValue({ data: sale });
  api.patch.mockResolvedValue({ data: sale });
  api.delete.mockResolvedValue({ data: {} });
});

const openSale = async () => {
  render(<ManageSales />);
  fireEvent.click(await screen.findByText('Bosch Drill'));
  await screen.findByText('Financial summary');
};

test('creates a completed machine sale with a partial initial payment', async () => {
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(<ManageSales />);
  fireEvent.click(screen.getByText('Create & edit'));
  await screen.findByText(/Deepak Mishra/);
  fireEvent.change(screen.getByLabelText('Customer'), { target: { value: customer._id } });
  fireEvent.change(screen.getByLabelText('Available second-hand machine'), { target: { value: machine._id } });
  fireEvent.change(screen.getByLabelText('Amount received (₹)'), { target: { value: '5000' } });
  await waitFor(() => expect(screen.getByLabelText('Agreed sale price (₹)')).toHaveValue(15000));
  expect(screen.getByLabelText('Amount received (₹)')).toHaveValue(5000);
  fireEvent.click(screen.getByText('Complete sale'));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/machine-sales', expect.objectContaining({
    status: 'completed', machineId: machine._id, customerId: customer._id,
    agreedSalePricePaise: 1500000, initialPayment: expect.objectContaining({ amountPaise: 500000 }),
  })));
  confirm.mockRestore();
});

test('records an additional payment against the remaining sale balance', async () => {
  await openSale();
  fireEvent.click(screen.getByText('Add payment'));
  fireEvent.change(screen.getByLabelText('Amount received (₹)'), { target: { value: '2500' } });
  fireEvent.click(screen.getByText('Record payment'));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith(`/api/machine-sales/${sale._id}/payments`, expect.objectContaining({ amountPaise: 250000 })));
});

test('paid draft cancellation requires and sends explicit refund confirmation', async () => {
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  await openSale();
  fireEvent.click(screen.getByText('Cancel draft'));
  fireEvent.change(screen.getByLabelText('Required cancellation reason'), { target: { value: 'Customer changed decision' } });
  fireEvent.click(screen.getByText(/I confirm/));
  fireEvent.click(screen.getByText('Confirm cancellation'));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith(`/api/machine-sales/${sale._id}/cancel`, {
    reason: 'Customer changed decision', refundConfirmed: true,
  }));
  confirm.mockRestore();
});

test('unpaid drafts expose permanent deletion', async () => {
  const unpaidSale = { ...sale, paymentsReceivedPaise: 0, remainingBalancePaise: sale.agreedSalePricePaise, payments: [] };
  api.get.mockImplementation((url) => {
    if (url === '/api/users') return Promise.resolve({ data: [customer] });
    if (url === '/api/products/inventory') return Promise.resolve({ data: [machine] });
    if (url === '/api/machine-sales') return Promise.resolve({ data: { sales: [unpaidSale], pagination: { page: 1, pages: 1, total: 1 } } });
    return Promise.resolve({ data: unpaidSale });
  });
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  await openSale();
  fireEvent.click(screen.getByText('Delete unpaid draft'));
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith(`/api/machine-sales/${sale._id}`));
  confirm.mockRestore();
});
