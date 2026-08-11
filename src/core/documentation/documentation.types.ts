import type { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

/**
 * OpenAPI object types, derived from the package's public surface.
 *
 * `@nestjs/swagger` declares these in `dist/interfaces/open-api-spec.interface`
 * but does not export them, and its `exports` map makes that path unreachable
 * under NodeNext resolution. Deriving them from types that *are* exported keeps
 * this to public API — a reach into `dist/` compiles today and breaks on a
 * patch release that reorganises the build.
 */
type Components = NonNullable<OpenAPIObject['components']>;

export type SchemaObject = NonNullable<Components['schemas']>[string];

export type SecuritySchemeObject = Parameters<DocumentBuilder['addBearerAuth']>[0];

/**
 * A sidebar group in the rendered reference.
 *
 * Declared by the module it describes, so the name and its description live
 * next to the controller rather than in a distant list that drifts out of date.
 */
export interface ApiTag {
  readonly name: string;

  readonly description: string;
}

/**
 * One published API surface.
 *
 * This is the abstraction the whole module turns on. Everything that differs
 * between the public API and the admin API — its title, its bearer scheme, the
 * paths it is served from, which routes belong to it — is data in one of these
 * objects rather than a branch somewhere in the code.
 *
 * The practical consequence: adding a third surface (a partner API, a webhook
 * reference) is one entry in `API_AUDIENCES`. Nothing loops twice, nothing
 * needs an `if (isAdmin)`, and no file has to be found and edited to match.
 */
export interface ApiAudience {
  /** Stable identifier used in logs and as a map key. */
  readonly key: string;

  readonly title: string;

  readonly description: string;

  /**
   * Shown in the reference header.
   *
   * The public API carries a real version because its clients ship separately
   * — a phone can be running a build from six months ago. The admin console
   * deploys with the backend, so it has nothing to lag behind.
   */
  readonly version: string;

  /**
   * Name of the bearer scheme, referenced by `@ApiBearerAuth(...)` on
   * controllers. Separate per audience so each reference's auth field asks for
   * the right credential — an admin token is not a user token.
   */
  readonly securityScheme: string;

  /** Where the rendered reference is served, e.g. `/docs`. */
  readonly docsPath: string;

  /** Where the raw OpenAPI JSON is served, e.g. `/docs/json`. */
  readonly specPath: string;

  /**
   * Sidebar order. The renderer presents tags in this order, and it is the
   * only thing between you and an alphabetised wall of two hundred endpoints.
   */
  readonly tags: readonly ApiTag[];

  /**
   * Decides whether a generated path belongs to this surface.
   *
   * A predicate rather than a prefix string because the rule is not always
   * "starts with". The public surface is defined by *exclusion* — everything
   * that is not an admin route — and that cannot be expressed as a prefix.
   */
  readonly includesPath: (path: string) => boolean;
}
