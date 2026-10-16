/**
 * Currency & Number Formatting Utility
 *
 * Formats large amounts with standard abbreviations (K, M, B, T):
 * - < 1,000 => '950'
 * - 1,000 - 999,999 => '1.5K', '25K', '150K'
 * - 1,000,000 - 999,999,999 => '1M', '1.5M', '100M'
 * - 1,000,000,000 - 999,999,999,999 => '1B', '2.5B', '100B'
 * - >= 1,000,000,000,000 => '1T', '2.5T'
 */
export const formatCompactBalance = (value, options = {}) => {
  const amount = Number(value);
  if (isNaN(amount) || amount === 0) return '0';
  if (amount < 0) return `-${formatCompactBalance(-amount, options)}`;

  if (amount < 1000) {
    return Math.floor(amount).toLocaleString('en-IN');
  }

  const { maxDecimals = 1 } = options;

  if (amount >= 1e12) {
    const val = amount / 1e12;
    const str = val >= 100 ? Math.floor(val).toString() : val.toFixed(maxDecimals).replace(/\.0$/, '');
    return `${str}T`;
  }
  if (amount >= 1e9) {
    const val = amount / 1e9;
    const str = val >= 100 ? Math.floor(val).toString() : val.toFixed(maxDecimals).replace(/\.0$/, '');
    return `${str}B`;
  }
  if (amount >= 1e6) {
    const val = amount / 1e6;
    const str = val >= 100 ? Math.floor(val).toString() : val.toFixed(maxDecimals).replace(/\.0$/, '');
    return `${str}M`;
  }
  if (amount >= 1e3) {
    const val = amount / 1e3;
    const str = val >= 100 ? Math.floor(val).toString() : val.toFixed(maxDecimals).replace(/\.0$/, '');
    return `${str}K`;
  }

  return amount.toLocaleString('en-IN');
};

export const formatDiamondValue = (value) => formatCompactBalance(value);
export const formatBeanValue = (value) => formatCompactBalance(value);

export default formatCompactBalance;
