import type { ServerResponse } from 'node:http';

import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { OpenAPIObject } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { FastifyRequest } from 'fastify';

import type { ApiAudience } from '../documentation.types.js';

import { SCALAR_CDN, SCALAR_CSP, SCALAR_THEME } from './scalar.constants.js';

/**
 * The Fastify half of Scalar's return type.
 *
 * `apiReference()` is typed as a union of an Express handler and a Fastify one,
 * chosen at runtime by the `withFastify` flag. TypeScript cannot follow that, so
 * calling the union demands arguments satisfying *both* signatures — which no
 * real request does. Narrowing to the branch `withFastify: true` actually
 * returns is the whole reason for the assertion below.
 */
type FastifyReferenceHandler = (request: FastifyRequest, response: ServerResponse) => void;

/**
 * Mounts one audience: the rendered reference, and the raw specification it
 * reads.
 *
 * The only file in this module that names Scalar. Everything upstream produces
 * an `OpenAPIObject` and knows nothing about how it is displayed, which is what
 * makes changing or removing the renderer a single-file edit rather than an
 * archaeology exercise.
 *
 * Routes are registered on the Fastify instance directly rather than through a
 * Nest controller. A controller would appear in the very document it serves,
 * and would be subject to the global prefix, the versioning strategy, and every
 * global guard — none of which should apply to a documentation page.
 */
export function mountScalarReference(
  app: NestFastifyApplication,
  audience: ApiAudience,
  document: OpenAPIObject,
): void {
  const fastify = app.getHttpAdapter().getInstance();

  /*
   * The specification, served separately from the page that renders it.
   *
   * Scalar fetches this at runtime rather than having the document inlined into
   * the HTML, which keeps the page small and means a client-side code generator
   * can consume exactly what the reference displays.
   */
  fastify.get(audience.specPath, (_request, reply) => {
    reply.type('application/json').send(document);
  });

  const render = apiReference({
    withFastify: true,
    url: audience.specPath,
    pageTitle: audience.title,
    cdn: SCALAR_CDN,
    theme: SCALAR_THEME,
    /*
     * Sends the bearer token with every request made from the page, so a
     * developer authenticates once instead of pasting a token per endpoint.
     */
    persistAuth: true,
  }) as FastifyReferenceHandler;

  fastify.get(audience.docsPath, (request, reply) => {
    /*
     * Overrides the global helmet policy for this route only.
     *
     * The reference is a rendered HTML application: it needs an inline
     * configuration script and inline styles, which the default `script-src
     * 'self'` correctly forbids for an API. Narrowing the exception to the two
     * documentation routes keeps that default intact everywhere a real
     * response is served.
     */
    reply.raw.setHeader('Content-Security-Policy', SCALAR_CSP);

    /*
     * Scalar's Fastify handler writes to the raw response, so `reply` must not
     * also be used to send. Passing `reply.raw` is the supported integration
     * and is why nothing here calls `reply.send()`.
     */
    render(request, reply.raw);
  });
}
