// Utility functions for number parsing and formatting

/**
 * Parse a number string that may contain commas as thousand separators
 * @param str - String to parse (e.g., "49,340.00", "9,925,585.00")
 * @returns number - Parsed number (e.g., 49340, 9925585)
 */
export const parseNumberWithCommas = (str: string | number): number => {
  if (typeof str === 'number') {
    return str;
  }
  
  if (!str || str === '') {
    return 0;
  }
  
  // Remove all commas and whitespace
  const cleanStr = String(str).replace(/,/g, '').trim();
  
  // Parse as float
  const parsed = parseFloat(cleanStr);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format number with commas as thousand separators
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns string - Formatted number (e.g., "49,340.00")
 */
export const formatNumberWithCommas = (num: number, decimals: number = 2): string => {
  if (isNaN(num)) return '0';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Check if a string represents a valid number (with or without commas)
 * @param str - String to check
 * @returns boolean - True if it's a valid number
 */
export const isValidNumber = (str: string | number): boolean => {
  if (typeof str === 'number') {
    return !isNaN(str) && isFinite(str);
  }
  
  if (!str || str === '') {
    return false;
  }
  
  const cleanStr = String(str).replace(/,/g, '').trim();
  const parsed = parseFloat(cleanStr);
  
  return !isNaN(parsed) && isFinite(parsed);
};

/**
 * Extract numeric values from an array of mixed data
 * @param values - Array of mixed values
 * @returns number[] - Array of parsed numbers
 */
export const extractNumbers = (values: any[]): number[] => {
  return values
    .map(val => parseNumberWithCommas(val))
    .filter(num => !isNaN(num) && isFinite(num));
};
