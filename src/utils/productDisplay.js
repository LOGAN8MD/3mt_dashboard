export const isSecondHandProduct = (product) => product?.condition === 'used';

export const formatProductCurrency = (value) => {
  if (value === undefined || value === null || value === '') return '-';

  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });
};

export const getProductConditionLabel = (product) =>
  isSecondHandProduct(product) ? 'Second-Hand' : 'New';

export const getProductOfferLabel = (product) => {
  const labels = {
    sale: 'For Sale',
    rent: 'For Rent',
    both: 'Sale & Rent',
  };

  return labels[product?.availabilityType] || labels.sale;
};

export const getProductAvailabilityLabel = (product) => {
  const labels = {
    available: 'Available',
    on_rent: 'On Rent',
    unavailable: 'Unavailable',
    sold: 'Sold',
  };

  return labels[product?.availabilityStatus] || labels.available;
};

export const getProductOfferSummary = (product) => {
  const availabilityType = product?.availabilityType || 'sale';
  const salePrice = formatProductCurrency(product?.price);
  const rentalPrice = `${formatProductCurrency(product?.rentalPrice)} / ${product?.rentPeriod || 'period'}`;

  if (availabilityType === 'rent') return rentalPrice;
  if (availabilityType === 'both') return `${salePrice} | ${rentalPrice}`;
  return salePrice;
};

export const getConditionBadgeClass = (product) =>
  isSecondHandProduct(product)
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
    : 'border-blue-500/30 bg-blue-500/10 text-blue-300';

export const getOfferBadgeClass = (product) => {
  const styles = {
    sale: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    rent: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
    both: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300',
  };

  return styles[product?.availabilityType] || styles.sale;
};

export const getAvailabilityBadgeClass = (product) => {
  const styles = {
    available: 'border-green-500/30 bg-green-500/10 text-green-300',
    on_rent: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    unavailable: 'border-gray-500/30 bg-gray-500/10 text-gray-300',
    sold: 'border-red-500/30 bg-red-500/10 text-red-300',
  };

  return styles[product?.availabilityStatus] || styles.available;
};

export const formatProductDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-IN');
};
