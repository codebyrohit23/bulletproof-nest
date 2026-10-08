import type { PermissionEntry } from '../catalogue/index.js';

/** A permission row as both mirror tables store it. */
export interface PermissionMirrorRow {
  readonly key: string;

  readonly resource: string;

  readonly action: string;

  readonly name: string;

  readonly description: string;

  readonly restricted: boolean;
}

export interface PermissionMirrorPlan {
  readonly create: readonly PermissionMirrorRow[];

  readonly update: readonly PermissionMirrorRow[];

  /** In the table, not in the catalogue. Reported, never deleted — a role may still grant it. */
  readonly stale: readonly string[];
}

/**
 * What a permission seeder must write so that a mirror table matches its
 * catalogue. Shared by the workspace and admin seeders so both mirrors follow
 * one rule; each seeder applies the plan to its own table.
 */
export function planPermissionMirror(
  entries: readonly PermissionEntry<string, string>[],
  rows: readonly PermissionMirrorRow[],
): PermissionMirrorPlan {
  const existing = new Map(rows.map((row) => [row.key, row]));

  const create: PermissionMirrorRow[] = [];

  const update: PermissionMirrorRow[] = [];

  for (const entry of entries) {
    const desired = toRow(entry);

    const current = existing.get(entry.key);

    if (current === undefined) {
      create.push(desired);
    } else if (!sameRow(current, desired)) {
      update.push(desired);
    }
  }

  const known = new Set(entries.map((entry) => entry.key));

  const stale = rows.filter((row) => !known.has(row.key)).map((row) => row.key);

  return { create, update, stale };
}

function toRow(entry: PermissionEntry<string, string>): PermissionMirrorRow {
  return {
    key: entry.key,
    resource: entry.resource,
    action: entry.action,
    name: entry.name,
    description: entry.description,
    restricted: entry.restricted,
  };
}

function sameRow(a: PermissionMirrorRow, b: PermissionMirrorRow): boolean {
  return (
    a.resource === b.resource &&
    a.action === b.action &&
    a.name === b.name &&
    a.description === b.description &&
    a.restricted === b.restricted
  );
}
