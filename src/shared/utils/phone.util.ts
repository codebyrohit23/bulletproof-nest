import { type NumberType, parsePhoneNumberFromString } from 'libphonenumber-js/max';

export interface ParsedPhone {
  e164: string;
  type: NumberType;
}

// `/max` metadata, not `/min`: `/min` checks length only, so `+10000000000`
// would pass, and number type (mobile vs landline) is unavailable without it.
// The bundle size that argues for `/min` in a browser does not matter here.
//
// No default country is passed, so input must carry `+<country code>`. Guessing
// a country for `9876543210` would silently bind a code to someone else's number.
export const parsePhone = (value: string): ParsedPhone | null => {
  const phone = parsePhoneNumberFromString(value.trim());

  if (!phone?.isValid()) {
    return null;
  }

  return { e164: phone.number, type: phone.getType() };
};

// The one normalization both the schema and the repositories apply, so a value
// written through one path is found through the other. The digit-strip fallback
// only runs for input the schema would have rejected — a job or script calling a
// repository directly — and matches how rows were normalized before parsing
// was introduced.
export const normalizePhone = (value: string): string => {
  const parsed = parsePhone(value);

  if (parsed) {
    return parsed.e164;
  }

  const digits = value.replace(/\D/g, '');

  return digits.length === 0 ? '' : `+${digits}`;
};
