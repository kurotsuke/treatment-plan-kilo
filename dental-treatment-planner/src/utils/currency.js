// Utility functions for currency formatting

export const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CHF: 'Fr.',
    CAD: '$',
    MAD: 'DH',
    TND: 'DT',
    DZD: 'DA',
    XOF: 'FCFA'
  };
  return symbols[currencyCode] || currencyCode;
};

export const formatCurrency = (amount, currencyCode = null) => {
  // Get the stored currency from localStorage if not provided
  const currency = currencyCode || localStorage.getItem('clinicCurrency') || 'EUR';
  
  // Define locale mappings for each currency
  const localeMap = {
    EUR: 'fr-FR',
    USD: 'en-US',
    GBP: 'en-GB',
    CHF: 'fr-CH',
    CAD: 'fr-CA',
    MAD: 'fr-FR', // Use French locale to get "DH" instead of Arabic "د.م."
    TND: 'fr-FR', // Use French locale to get "DT" instead of Arabic
    DZD: 'fr-FR', // Use French locale to get "DA" instead of Arabic
    XOF: 'fr-FR'
  };
  
  const locale = localeMap[currency] || 'fr-FR';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    const symbol = getCurrencySymbol(currency);
    const formattedAmount = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    
    // Position symbol based on currency convention
    if (['USD', 'GBP', 'CAD'].includes(currency)) {
      return `${symbol}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${symbol}`;
    }
  }
};

export const getCurrencyInputSymbol = () => {
  const currency = localStorage.getItem('clinicCurrency') || 'EUR';
  return getCurrencySymbol(currency);
};

export const getCurrentCurrency = () => {
  return localStorage.getItem('clinicCurrency') || 'EUR';
};