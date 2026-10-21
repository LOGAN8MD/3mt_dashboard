import {
  formatProductCurrency,
  getAvailabilityBadgeClass,
  getProductAvailabilityLabel,
  getProductConditionLabel,
  getProductOfferLabel,
  getProductOfferSummary,
} from './utils/productDisplay';

test('legacy products use the original new, sale, and available display defaults', () => {
  const legacyProduct = { name: 'Legacy Drill', price: 12500 };

  expect(getProductConditionLabel(legacyProduct)).toBe('New');
  expect(getProductOfferLabel(legacyProduct)).toBe('For Sale');
  expect(getProductAvailabilityLabel(legacyProduct)).toBe('Available');
  expect(getProductOfferSummary(legacyProduct)).toBe(formatProductCurrency(12500));
});

test('second-hand rental products show rental price, period, and live availability', () => {
  const rentalProduct = {
    condition: 'used',
    availabilityType: 'rent',
    availabilityStatus: 'on_rent',
    rentalPrice: 1500,
    rentPeriod: 'day',
  };

  expect(getProductConditionLabel(rentalProduct)).toBe('Second-Hand');
  expect(getProductOfferLabel(rentalProduct)).toBe('For Rent');
  expect(getProductOfferSummary(rentalProduct)).toBe(`${formatProductCurrency(1500)} / day`);
  expect(getProductAvailabilityLabel(rentalProduct)).toBe('On Rent');
  expect(getAvailabilityBadgeClass(rentalProduct)).toContain('blue');
});

test('combined second-hand listings show both sale and rental offers', () => {
  const combinedProduct = {
    condition: 'used',
    availabilityType: 'both',
    availabilityStatus: 'available',
    price: 150000,
    rentalPrice: 9000,
    rentPeriod: 'month',
  };

  expect(getProductOfferLabel(combinedProduct)).toBe('Sale & Rent');
  expect(getProductOfferSummary(combinedProduct)).toBe(
    `${formatProductCurrency(150000)} | ${formatProductCurrency(9000)} / month`
  );
});
