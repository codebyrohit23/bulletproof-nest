/**
 * Generates the Ed25519 signing keypair used to sign and verify JWTs.
 *
 *     pnpm keys:generate
 *
 * Prints the environment lines and stops. It deliberately does not write to
 * `.env`, because the failure mode of a script that edits a secrets file is
 * silently replacing keys that are still in use.
 *
 * ---------------------------------------------------------------------------
 * WHERE TO RUN IT
 * ---------------------------------------------------------------------------
 * On a developer machine, for every environment — then paste the output into
 * `.env` locally, or into the secret manager for staging and production. The
 * server receives keys; it never creates them.
 *
 * Never generate at boot. Every deploy would invalidate every token in flight,
 * and two instances behind a load balancer would sign with different keys and
 * reject each other's tokens.
 *
 * Each environment gets its own keypair. Dev keys must never reach production —
 * `JWT_ISSUER` is the second line of defence if one ever does.
 *
 * ---------------------------------------------------------------------------
 * ROTATING
 * ---------------------------------------------------------------------------
 * 1. Run this to get a new pair.
 * 2. Move the *current* `JWT_PUBLIC_KEY` value to `JWT_PUBLIC_KEY_PREVIOUS`.
 * 3. Set the new pair as `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`, and deploy.
 * 4. Once the longest token lifetime has elapsed, delete
 *    `JWT_PUBLIC_KEY_PREVIOUS`.
 *
 * Skipping step 2 signs every user out at the instant of deploy.
 */
import { createHash, generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('ed25519');

const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

const toEnvValue = (pem: string): string => Buffer.from(pem, 'utf8').toString('base64');

/**
 * The RFC 7638 thumbprint that `core/jwt` will use as the `kid`.
 *
 * Printed for operators only — it is never configured. Reproducing it here
 * means a token's `kid` header can be matched against a key by eye during an
 * incident, without having to guess which key a running instance holds.
 *
 * The member order below is required: the spec hashes the JWK's *required*
 * members, lexicographically ordered, with no whitespace. For an OKP key those
 * are exactly `crv`, `kty`, `x`.
 */
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
