import { render, screen } from '@testing-library/react';
import EnquiryOfferDetails from './EnquiryOfferDetails';

test('renders saved second-hand rental terms without adding them to purchase totals', () => {
  render(<EnquiryOfferDetails product={{
    intent: 'rent',
    conditionSnapshot: 'used',
    rentalPriceSnapshot: 9000,
    rentPeriodSnapshot: 'month',
    securityDepositSnapshot: 25000,
  }} />);

  expect(screen.getByText(/Rental enquiry.*Second-Hand/)).toBeInTheDocument();
  expect(screen.getByText(/9,000.*month/)).toBeInTheDocument();
  expect(screen.getByText(/Deposit.*25,000/)).toBeInTheDocument();
  expect(screen.getByText(/Excluded from sale totals/)).toBeInTheDocument();
});

test('keeps legacy enquiry products compatible as purchase enquiries', () => {
  render(<EnquiryOfferDetails product={{
    priceSnapshot: 12500,
    quantity: 2,
    lineTotal: 25000,
  }} />);

  expect(screen.getByText('Purchase enquiry')).toBeInTheDocument();
  expect(screen.getByText(/12,500.*2.*25,000/)).toBeInTheDocument();
});
