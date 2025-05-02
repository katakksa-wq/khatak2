import { useLanguage } from '../contexts/LanguageContext';

/**
 * Formats a date string to display in the appropriate locale with Gregorian calendar
 * @param dateString - ISO date string to format
 * @param options - Intl.DateTimeFormatOptions to customize the output
 * @returns Formatted date string in the user's locale using Gregorian calendar
 */
export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
) => {
  const { language } = useLanguage();
  
  // Always use Gregorian calendar (ميلادية) for Arabic locale
  // Use the Unicode extension 'ca-gregory' to specify Gregorian calendar
  const locale = language === 'ar' ? 'ar-SA-u-ca-gregory' : undefined;
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString || 'N/A';
  }
};

/**
 * Formats a date string to display in a short format
 * @param dateString - ISO date string to format
 * @returns Formatted date string in a short format (DD/MM/YYYY)
 */
export const formatShortDate = (dateString: string) => {
  return formatDate(dateString, {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit'
  });
};

/**
 * Formats a date string to display date and time
 * @param dateString - ISO date string to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateString: string) => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}; 