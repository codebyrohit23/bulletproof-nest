// import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
// import { z } from 'zod';

// export const phoneSchema = z
//   .string()
//   .trim()
//   .transform((value, ctx) => {
//     const phone = parsePhoneNumberFromString(value);

//     if (!phone || !phone.isValid()) {
//       ctx.addIssue({
//         code: 'custom',
//         message: 'Invalid phone number',
//       });

//       return z.NEVER;
//     }

//     return phone.number;
//   });
