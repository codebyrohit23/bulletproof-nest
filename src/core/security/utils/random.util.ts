import { randomBytes, randomInt } from 'node:crypto';

export function randomToken(byteLength: number): string {
  return randomBytes(byteLength).toString('base64url');
}

export function randomDigits(length: number): string {
  let code = '';

  for (let index = 0; index < length; index += 1) {
    code += randomInt(0, 10).toString();
  }

  return code;
}
