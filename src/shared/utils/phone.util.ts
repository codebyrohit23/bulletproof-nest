import { type PhoneNumberType, parsePhoneNumberFromString } from 'libphonenumber-js/max';

export interface ParsedPhone {
  e164: string;
  type: PhoneNumberType | undefined;
}

export const parsePhone = (value: string): ParsedPhone | null => {
  const phone = parsePhoneNumberFromString(value.trim());

  if (!phone?.isValid()) {
    return null;
  }

  return { e164: phone.number, type: phone.getType() };
};

export const normalizePhone = (value: string): string => {
  const parsed = parsePhone(value);

  if (parsed) {
    return parsed.e164;
  }

  const digits = value.replace(/\D/g, '');

  return digits.length === 0 ? '' : `+${digits}`;
};
