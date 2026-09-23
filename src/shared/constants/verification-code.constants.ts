/**
 * The shape of a one-time code, and only its shape.
 *
 * Two layers must agree on it: `core/security` generates the code and every
 * DTO that accepts one validates it. They used to hold a `6` each, with nothing
 * connecting them — changing one would have sent codes that no request could
 * ever pass, with every check green.
 *
 * Lifetime, attempt budget and resend interval are deliberately not here. They
 * are policy, and the user and admin audiences are free to set them apart.
 */
export const VERIFICATION_CODE_LENGTH = 6;

export const VERIFICATION_CODE_PATTERN = new RegExp(`^\\d{${VERIFICATION_CODE_LENGTH}}$`);
