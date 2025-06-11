

import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Formats phone numbers into E.164 format (Worldwide Support)
 * @param number - The raw phone number entered by the user
 * @returns Formatted phone number in E.164 format (e.g., +14155552671)
 * @throws Error if the phone number is invalid
 */
export const formatPhoneNumber = (number: string): string => {
  const phoneNumber = parsePhoneNumberFromString(number);

  if (!phoneNumber || !phoneNumber.isValid()) {
    throw new Error('Invalid phone number. Please enter a valid number.');
  }

  return phoneNumber.format('E.164'); 
};