import { isSupportedCountry } from 'libphonenumber-js/max';
import { z } from 'zod';

const CURRENCIES: ReadonlySet<string> = new Set(Intl.supportedValuesOf('currency'));

/**
 * `Area/Location[/…]`, or `UTC`. Refuses the abbreviations the runtime would
 */
const IANA_ZONE_SHAPE = /^(?:UTC|[A-Z][A-Za-z_]+(?:\/[A-Z][A-Za-z0-9_+-]*)+)$/;

export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(2, 'Country must be a two-letter ISO code')
  .refine(isSupportedCountry, { message: 'Unknown country code' });

export const timezoneSchema = z
  .string()
  .trim()
  .refine((zone) => IANA_ZONE_SHAPE.test(zone) && isRuntimeTimeZone(zone), {
    message: 'Use an IANA time zone such as Asia/Kolkata',
  });

/** ISO 4217, e.g. `INR`. */
export const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(3, 'Currency must be a three-letter ISO code')
  .refine((currency) => CURRENCIES.has(currency), { message: 'Unknown currency code' });

function isRuntimeTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });

    return true;
  } catch {
    return false;
  }
}
