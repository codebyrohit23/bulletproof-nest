declare const PERMISSION_PLANE: unique symbol;

export type PermissionPlaneBrand<Plane extends string> = {
  readonly [PERMISSION_PLANE]: Plane;
};

export interface PermissionDefinition<DefaultRole extends string = string> {
  readonly name: string;

  readonly description: string;

  readonly restricted?: true;

  readonly defaultFor?: readonly DefaultRole[];
}

export type PermissionCatalogueShape<DefaultRole extends string = string> = Readonly<
  Record<string, Readonly<Record<string, PermissionDefinition<DefaultRole>>>>
>;

type BrandedKey<
  Resource extends string,
  Action extends string,
  Plane extends string,
> = `${Resource}.${Action}` & PermissionPlaneBrand<Plane>;

/** The union of every key the shape defines, branded with the plane. */
export type PermissionKeyOf<Shape extends PermissionCatalogueShape, Plane extends string> = {
  [Resource in keyof Shape & string]: {
    [Action in keyof Shape[Resource] & string]: BrandedKey<Resource, Action, Plane>;
  }[keyof Shape[Resource] & string];
}[keyof Shape & string];

/** The same keys as a tree, for `CATALOGUE.resource.action` at a call site. */
export type PermissionKeyTree<Shape extends PermissionCatalogueShape, Plane extends string> = {
  readonly [Resource in keyof Shape & string]: {
    readonly [Action in keyof Shape[Resource] & string]: BrandedKey<Resource, Action, Plane>;
  };
};

export interface PermissionEntry<Key extends string, DefaultRole extends string = string> {
  readonly key: Key;

  readonly resource: string;

  readonly action: string;

  readonly name: string;

  readonly description: string;

  readonly restricted: boolean;

  readonly defaultFor: readonly DefaultRole[];
}

export interface PermissionCatalogue<Key extends string, DefaultRole extends string = never> {
  readonly plane: string;

  /** Every permission, in declaration order — what the seeder writes and a UI lists. */
  readonly entries: readonly PermissionEntry<Key, DefaultRole>[];

  readonly keys: readonly Key[];

  readonly restrictedKeys: ReadonlySet<Key>;

  /** The default roles this plane has, in the order the catalogue declared them. */
  readonly defaultRoles: readonly DefaultRole[];

  /**
   * A default role's whole permission set: every key whose `defaultFor` names
   * it. What the seeder syncs the role's grants to.
   */
  defaultsFor(role: DefaultRole): ReadonlySet<Key>;

  has(value: string): value is Key;

  /**
   * Keeps only the keys this catalogue defines. Applied to every set read from
   * the database, so a grant left behind by a rollback — a key this build no
   * longer knows — authorizes nothing.
   */
  narrow(values: Iterable<string>): ReadonlySet<Key>;
}

export interface DefinedPermissionCatalogue<
  Shape extends PermissionCatalogueShape,
  Plane extends string,
  DefaultRole extends string,
> {
  readonly tree: PermissionKeyTree<Shape, Plane>;

  readonly catalogue: PermissionCatalogue<PermissionKeyOf<Shape, Plane>, DefaultRole>;
}

export interface DefinePermissionCatalogueOptions<DefaultRole extends string> {
  /**
   * The plane's default roles. A `defaultFor` naming anything else is refused.
   * Omitted for a plane with no default roles, which makes every `defaultFor`
   * an error.
   */
  readonly defaultRoles?: readonly DefaultRole[];
}

/** camelCase, one word or several — never a dot, which is the separator. */
const SEGMENT_PATTERN = /^[a-z][a-zA-Z0-9]*$/;

export function definePermissionCatalogue<
  Shape extends PermissionCatalogueShape<DefaultRole>,
  Plane extends string,
  DefaultRole extends string = never,
>(
  plane: Plane,
  shape: Shape,
  options: DefinePermissionCatalogueOptions<DefaultRole> = {},
): DefinedPermissionCatalogue<Shape, Plane, DefaultRole> {
  type Key = PermissionKeyOf<Shape, Plane>;

  const defaultRoles = options.defaultRoles ?? [];

  const knownRoles = new Set<string>(defaultRoles);

  const entries: PermissionEntry<Key, DefaultRole>[] = [];

  const tree: Record<string, Record<string, Key>> = {};

  for (const [resource, actions] of Object.entries(shape)) {
    assertSegment(plane, resource);

    const branch: Record<string, Key> = {};

    for (const [action, definition] of Object.entries(actions)) {
      assertSegment(plane, action);

      const key = `${resource}.${action}` as Key;

      const defaultFor = definition.defaultFor ?? [];

      assertGrantRules(plane, key, definition.restricted === true, defaultFor, knownRoles);

      branch[action] = key;

      entries.push({
        key,
        resource,
        action,
        name: definition.name,
        description: definition.description,
        restricted: definition.restricted === true,
        defaultFor,
      });
    }

    tree[resource] = branch;
  }

  const known = new Set<string>(entries.map((entry) => entry.key));

  const has = (value: string): value is Key => known.has(value);

  const defaults = new Map<DefaultRole, ReadonlySet<Key>>(
    defaultRoles.map((role) => [
      role,
      new Set(entries.filter((entry) => entry.defaultFor.includes(role)).map((entry) => entry.key)),
    ]),
  );

  return {
    tree: tree as PermissionKeyTree<Shape, Plane>,

    catalogue: {
      plane,

      entries,

      keys: entries.map((entry) => entry.key),

      restrictedKeys: new Set(
        entries.filter((entry) => entry.restricted).map((entry) => entry.key),
      ),

      defaultRoles,

      defaultsFor(role: DefaultRole): ReadonlySet<Key> {
        const set = defaults.get(role);

        if (set === undefined) {
          throw new Error(`Permission catalogue "${plane}": "${role}" is not a default role.`);
        }

        return set;
      },

      has,

      narrow(values: Iterable<string>): ReadonlySet<Key> {
        const narrowed = new Set<Key>();

        for (const value of values) {
          if (has(value)) {
            narrowed.add(value);
          }
        }

        return narrowed;
      },
    },
  };
}

function assertSegment(plane: string, segment: string): void {
  if (!SEGMENT_PATTERN.test(segment)) {
    throw new Error(
      `Permission catalogue "${plane}": "${segment}" is not a valid segment — ` +
        'use camelCase letters and digits, starting with a letter.',
    );
  }
}

/**
 * A restricted key in a default role would hand the apex's power to whoever is
 * given that role — the one thing `restricted` exists to prevent.
 */
function assertGrantRules(
  plane: string,
  key: string,
  restricted: boolean,
  defaultFor: readonly string[],
  knownRoles: ReadonlySet<string>,
): void {
  if (restricted && defaultFor.length > 0) {
    throw new Error(
      `Permission catalogue "${plane}": "${key}" is restricted and cannot name default roles.`,
    );
  }

  for (const role of defaultFor) {
    if (!knownRoles.has(role)) {
      throw new Error(
        `Permission catalogue "${plane}": "${key}" names "${role}", which is not a default role ` +
          'of this plane.',
      );
    }
  }

  if (new Set(defaultFor).size !== defaultFor.length) {
    throw new Error(`Permission catalogue "${plane}": "${key}" names a default role twice.`);
  }
}
