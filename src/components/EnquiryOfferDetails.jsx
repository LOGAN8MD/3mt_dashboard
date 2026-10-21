export default function EnquiryOfferDetails({ product }) {
  const money = (value) => Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  return <div className="mt-2 text-sm text-gray-300">
    <p>{product.intent === 'rent' ? 'Rental enquiry' : 'Purchase enquiry'}{product.conditionSnapshot ? ` · ${product.conditionSnapshot === 'used' ? 'Second-Hand' : 'New'}` : ''}</p>
    {product.intent === 'rent' ? <>
      <p>{money(product.rentalPriceSnapshot)} / {product.rentPeriodSnapshot}</p>
      <p>Deposit: {money(product.securityDepositSnapshot)}</p>
      <p className="text-xs text-gray-400">Duration and final quote to be confirmed. Excluded from sale totals.</p>
    </> : <p>{money(product.priceSnapshot)} x {product.quantity} = {money(product.lineTotal)}</p>}
  </div>;
}
