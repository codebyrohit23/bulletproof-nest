/**
 * What kind of data a seeder writes, which is what decides how it behaves on a
 * second run.
 *
 *   REFERENCE  Data the application reads at runtime and cannot work without —
 *              the permission catalogue, system roles. Belongs in every
 *              environment, and runs on every deploy. Upserts by natural key.
 *
 *   BOOTSTRAP  Data an environment needs once to become usable — the first
 *              admin. Creates what is absent and never overwrites: re-running
 *              must not reset a password somebody has since changed.
 *
 * There is deliberately no `demo` kind. Nothing generates fixtures yet, and the
 * environment gate one would need — refusing to run outside development — is
 * not worth writing against no caller. Add it with the first fixture seeder,
 * and add the gate in the same change.
 */
export const SEED_KIND = {
  REFERENCE: 'reference',

  BOOTSTRAP: 'bootstrap',
} as const;

export type SeedKind = (typeof SEED_KIND)[keyof typeof SEED_KIND];

/**
 * The order seeders run in, supplied by the composition root.
 *
 * A token rather than a field on each seeder: ordering is a statement about how
 * seeders relate to each other — roles reference permissions, so permissions go
 * first — and that is readable in one list and not in numbers scattered across
 * files.
 */
export const SEED_ORDER = 'seeding:order';

export const SEEDING_LOG_CONTEXT = 'Seeding';
