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
