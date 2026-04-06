/**
 * Formats a number according to the Indian numbering system (Lakh/Crore).
 * @param amount The number to format
 * @param symbol The currency symbol (e.g., ₹)
 * @returns Formatted string
 */
export const formatIndianCurrency = (amount: number, symbol: string = '₹'): string => {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (absAmount >= 10000000) {
    return `${sign}${symbol}${(absAmount / 10000000).toFixed(2)} Crore`;
  } else if (absAmount >= 100000) {
    return `${sign}${symbol}${(absAmount / 100000).toFixed(2)} Lakh`;
  }
  
  // Standard Indian formatting for smaller numbers
  const x = absAmount.toFixed(2).split('.');
  let x1 = x[0];
  const x2 = x.length > 1 ? '.' + x[1] : '';
  const lastThree = x1.substring(x1.length - 3);
  const otherNumbers = x1.substring(0, x1.length - 3);
  if (otherNumbers !== '') {
    x1 = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  } else {
    x1 = lastThree;
  }
  
  return `${sign}${symbol}${x1}${x2}`;
};
