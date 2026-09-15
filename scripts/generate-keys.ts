import { createHash, generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('ed25519');

const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

const toEnvValue = (pem: string): string => Buffer.from(pem, 'utf8').toString('base64');

const jwk = publicKey.export({ format: 'jwk' });

const thumbprint = createHash('sha256')
  .update(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x }), 'utf8')
  .digest('base64url');

console.log(`
# Ed25519 JWT keypair — key id (kid): ${thumbprint}
#
# Paste into .env locally, or into the secret manager for a deployed
# environment. Treat JWT_PRIVATE_KEY as you would a database password: never
# commit it, never log it, never share it between environments.

JWT_PRIVATE_KEY=${toEnvValue(privatePem)}
JWT_PUBLIC_KEY=${toEnvValue(publicPem)}
`);
