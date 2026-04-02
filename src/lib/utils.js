export function formatMoney(amount, currencySymbol = '৳') {
  // Use South Asian numbering (Lakhs/Crores) for specific currencies, default to US for others
  const isSouthAsian = ['৳', '₹', 'Rp'].includes(currencySymbol);
  const locale = isSouthAsian ? 'en-IN' : 'en-US';

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

  return `${currencySymbol}${formattedNumber}`;
}