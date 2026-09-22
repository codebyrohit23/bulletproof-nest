# LeadFlow — backend service

A multi-tenant CRM API for real-estate agencies. NestJS 11 on Fastify 5, Prisma 7
over PostgreSQL, Redis for cache / rate limits / queues, BullMQ for background
work, Zod for validation, Resend for email.

Native ESM (`"type": "module"`, `module: NodeNext`). Node ^26, pnpm.

---

## Commands

|                       |                                                                |
| --------------------- | -------------------------------------------------------------- |
| `pnpm start:dev`      | Watch mode                                                     |
| `pnpm check`          | format · lint · typecheck · test · e2e · build — the full gate |
| `pnpm check:quick`    | lint · typecheck — what `pre-push` runs                        |
| `pnpm db:migrate:dev` | Create and apply a migration                                   |
| `pnpm keys:generate`  | Ed25519 JWT keypair, base64 PEM, for `.env`                    |

`pre-commit` runs lint-staged; `commit-msg` runs commitlint (conventional
commits).

---

## Layering

This is the rule the whole `src` tree is arranged around. It is enforced by
`no-restricted-imports` blocks in `eslint.config.mjs` — a violation fails
`pnpm lint`, not review.

```
modules/          features: user-auth, users, verification, communication, health
   │
   ├──→ core/            policy: auth, cache, csrf, rate-limit, jwt,
   │                     logger, context, exceptions, documentation, …
   │       │
   │       └──→ infrastructure/   mechanism: prisma, redis, queue,
   │                              cache store, rate-limit store, email transport
   │
   └──→ shared/          pure, dependency-free
config/  ──→ shared/     only
```

### The two exceptions, stated because they look like violations

**`core` may import `infrastructure`.** That is the intended direction, not a
leak: `core` owns policy, `infrastructure` owns mechanism. `CacheService`
(policy: TTLs, keys, stampede control) sits over `RedisCacheStore` (mechanism:
Redis commands). `RateLimitService` over `RateLimitStore`. Same shape each time.

**`infrastructure` may import `core/logger` and `core/context` — nothing else.**
These are ambient cross-cutting concerns: everything logs, and everything runs
inside a request or job context. This is not infrastructure depending on
business policy; it is everything depending on the two things everything needs.

Any other `infrastructure → core` import is a real violation.

### The rest

| Layer                      | May import                                                   |
| -------------------------- | ------------------------------------------------------------ |
| `shared/`                  | **nothing internal.** It is the leaf everyone depends on     |
| `config/`                  | `#/shared/**` and its own tree, **nothing else** — see below |
| `core/`, `infrastructure/` | each other per the exceptions above; **never `modules/`**    |
| `modules/`                 | another module's **barrel only**, never a file inside it     |

---

## `config/` may only import `shared/`

`config/` is evaluated during bootstrap, before the DI container exists. Every
import it makes into `core/` is a chance to close a startup cycle:

```
config/app/app.schema.ts
  → #/core/logger/index.js          (barrel)
    → AppLoggerModule
      → AppConfigModule
        → config/app/index.js       ← back where it started
```

The process then dies with `Cannot access 'X' before initialization`.

**This has happened twice.** Both times `typecheck`, `lint` and `build` were all
green — TypeScript resolves types straight through a cycle, so the only symptom
is a service that will not start. Both times a comment warning about it had been
removed during a tidy-up.

So: a constant `config/` needs lives in `shared/constants/`. Header names and
the log-level vocabulary are already there for exactly this reason.

The same hazard applies to any `core/*` barrel, because a barrel exports that
area's Nest module, and a Nest module imports `AppConfigModule`.

---

## Ports: when an abstract class is justified

There is one rule and it has an acid test.

**Declare a port only when there is a real DI seam** — when `core` needs
something only a feature module can provide, and importing that module would
invert the layering.

`core/auth/ports/user-session-validator.port.ts` is the example. The guard must
read `user_sessions`, that table belongs to `modules/user-auth`, and `core`
cannot import a feature module. So `core/auth` declares the requirement, the
module satisfies it, and `AppModule` — the only place entitled to know both —
connects them:

```ts
// modules/user-auth/user-auth.module.ts
providers: [{ provide: UserSessionValidator, useExisting: UserSessionService }];
exports: [UserSessionValidator];

// app.module.ts
AuthModule.forRoot({ imports: [UserAuthModule] });
```

`AdminSessionValidator` is the same seam for `admin_sessions`, and is
deliberately a **second port rather than one port generic over the session
kind**: one provider answering for both would be the single place where an
admin session could satisfy a user route.

**Abstract class, not an interface.** An interface is erased and cannot be an
injection token, so the alternative is a `Symbol` plus an interface plus
`@Inject(TOKEN)` at every call site — three things to keep aligned with no
compiler check that the provider matches. An abstract class is one thing: a type
_and_ a runtime token, with `useExisting` type-checked against it.

Prefer `extends` over `implements` for the same reason — `implements` lets a
class drift from the contract without failing the build.

**One implementation is fine.** The seam exists to pin the dependency
direction, not to anticipate a second adapter. Do not add a port without one of
these reasons; an abstraction with a single caller and no layering problem is
indirection.

`MessageRecorder` has the same shape. `core/communication` states what
recording a sent message needs; `outbound_messages` belongs to
`modules/communication`, which satisfies it; `AppModule` wires them with
`EmailModule.forRoot({ imports: [CommunicationModule] })`. `EmailModule` is
global for the reason `AuthModule` is — a module importing the plain class would
get a second copy with no recorder behind it.

Existing ports: `UserSessionValidator`, `AdminSessionValidator`,
`MessageRecorder`, `CacheStore`, `RateLimitStore`, `EmailTransport`.

---

## DI and `import type`

`emitDecoratorMetadata` and `verbatimModuleSyntax` are both on. A constructor
parameter imported with `import type` is **erased at compile time**, so Nest
records `Object` for it and cannot resolve the dependency.

```ts
import type { PrismaService } from '…'; // ✗ boot fails, opaquely
import { PrismaService } from '…'; // ✓
```

**Anything injected must be a value import.** Types used only in signatures
should still use `import type`.

This already shipped once as a latent bug and was invisible because the class
was not yet registered as a provider.

**The same metadata is why nothing that boots a Nest container can run under
`tsx`.** `tsx` is esbuild, and esbuild does not resolve types, so it cannot emit
`design:paramtypes` at all — every injected constructor parameter arrives as
`undefined` and the container dies on the first provider it builds, naming a
property on `undefined` rather than the missing metadata. `tsx` is fine for a
script that imports nothing from `src/` (`scripts/generate-keys.ts`); anything
that resolves a provider goes through `dist`, as `start:prod` and `db:seed` do.

---

## Module boundaries

A module's `index.ts` is its public API. Everything else is internal.

```ts
import { VERIFICATION_CODE_PATTERN } from '#/modules/verification/index.js'; // ✓
import { VERIFICATION_CODE_PATTERN } from '#/modules/verification/constants/index.js'; // ✗
```

Within your own module use **relative** paths, never `#/modules/<self>/…`.

---

## Conventions

**Constants** live in a `constants/` folder next to the code that owns them, or
in `shared/constants/` when two layers must agree on the value. Rate-limit
budgets, TTLs and column widths are code, not environment variables — they are
decisions reviewed in a pull request and identical everywhere the app runs.

**Make drift a build error** where the language allows it. Examples already in
the tree:

- `EMAIL_TEMPLATES … satisfies Record<EmailTemplateId, …>` — adding a template
  id without registering its template fails the build.
- `MESSAGE_CHANNEL_COLUMN … satisfies Record<MessageChannel, …>` in
  `modules/communication` — a channel added to the port without a database value
  fails the build.
- `SessionDeviceColumns = Pick<Prisma.UserSessionUncheckedCreateInput, keyof DeviceContext>`
  in `modules/user-auth/interfaces/device-context.interface.ts` — a field added
  to `DeviceContext` that is not a column fails the build, because the spread
  that writes it bypasses excess-property checking.

**Comments explain why, and what was rejected.** The codebase is written this
way throughout; a comment restating the code is noise, and a comment that
survives a refactor is the only documentation that was ever true. When removing
one, check it is not the last record of a decision.

**`mappers/` translate a shape; `utils/` do everything else.** A mapper takes
one shape and returns another — a row to a snapshot, a snapshot to a DTO, a DTO
to a repository input — and decides nothing on the way. `user.mapper.ts`,
`user-session.mapper.ts` and `auth-user.mapper.ts` are the examples. Anything
that parses, derives or builds a query stays in `utils/`: `user-agent.util.ts`
reads a header, `device-context.util.ts` derives a device from several sources,
`session-query.util.ts` builds a Prisma `where`.

They were one folder until the same narrowing appeared in five places across
two modules, which is the threshold this file used to reserve the name for.
The split is worth having because the two are tested and changed differently:
a mapper changes when a DTO changes, a util when the logic does.

**Guards, filters, pipes and interceptors** are bound with `APP_GUARD` /
`APP_FILTER` / `APP_PIPE` / `APP_INTERCEPTOR` inside their own module, never in
`bootstrap/`. Bootstrap is only for what the container cannot do — Fastify
plugins, adapter options, versioning, shutdown. Registration order in
`AppModule` is guard execution order.

**Config** is validated by Zod at startup and fails loudly. Every variable is
documented in `.env.example`.

---

## Audiences: user and admin

This API serves two audiences and they do not share credentials. An admin
access token must never open a user route, nor a user token an admin route.

**A route's audience is its path.** `resolveApiAudience` in `shared/utils/`
answers it from the matched route pattern: anything containing `/admin/` is the
admin audience, everything else is the user audience. So **an admin controller
must be mounted under `admin/`** — that is not cosmetic, it is the whole
declaration. `API_AUDIENCE` lives in `shared/constants/` because `core/auth`
dispatches on it and `core/documentation` slices the two OpenAPI documents by
it, and the two must not be able to disagree.

**One global guard.** `ApiAuthGuard` is the only `APP_GUARD`. It resolves the
audience, does everything common — `@Public()`, the bearer token, the device id,
the refusal — then delegates to `UserAuthenticator` or `AdminAuthenticator`,
which differ in exactly three things: which audience they verify against, which
session table, which identity field. The dispatch table is typed
`Record<ApiAudienceKey, RequestAuthenticator>`, so a third audience fails the
build until it has an authenticator.

Per-controller `@UseGuards` was rejected, and not narrowly: it defaults to
_unprotected_, so a forgotten decorator opens a route with no error and no
failing test. Worse here — with a global guard already in place it would force
`@Public()` onto admin controllers, one careless refactor away from being the
only decorator left. A forgotten `@Public()` merely 401s your own login
endpoint on the first call.

**Three layers, in order of strength.** The session table is the real
guarantee: an admin token's `sid` is not in `user_sessions`, so the wrong token
fails the lookup. Above it, the `aud` claim — `JWT_AUDIENCE.USER` or
`.ADMIN`, enforced by jose inside `jwtVerify` and covered by the signature —
which is what still holds if the path dispatch is ever wrong and the table
lookup never gets its chance. The dispatch itself is the outermost and the
weakest, because it is our code. `typ` stays `access` for both: it discriminates
token _kind_, not audience. One keypair serves both.

**`core/jwt` knows token kinds; it does not know actors.** A method per token
kind, because each has its own payload schema; the audience is a required
_parameter_. So a new actor is a value added to `JWT_AUDIENCE` and to
`API_AUDIENCE`, and neither the signer nor the verifier changes — while
required-ness means no call site can obtain a payload whose audience nobody
checked. Choosing the audience is `core/auth`'s job and happens once per
authenticator.

Authentication is global; **authorization is per route** — a permission
decorator that is missing leaves a route authenticated-but-unrestricted, which
is a visible state rather than a hole. That is where `core/permissions` lands.

---

## Errors and logging

`GlobalExceptionFilter` maps everything through a handler chain
(`core/exceptions/handlers/`). Add a handler, do not add a `try/catch` that
swallows.

Log levels are chosen by **who is at fault**: 5xx is this service failing and is
the only thing that should page anyone; 4xx is this service correctly telling a
client it got the request wrong.

`LOGGER_REDACT_PATHS` covers the field names this codebase actually uses. Before
adding one, grep for it — the list once contained `otp` (used once) and not
`code` (used ten times), and live one-time codes reached the log. The bare and
wildcard lists are derived from one array so they cannot diverge.

Nothing logs a whole payload. `JobRunner` logs queue, name, id and attempt;
`query-logging.extension` never logs Prisma `args`.

---

## Database

Prisma 7 with the `pg` driver adapter over an app-owned pool.

- Repositories use `prisma.db`, which returns the ambient transaction client
  when one is open and the root client otherwise. **Never construct a
  `PrismaClient`.** This is what lets a repository be written once and behave
  correctly inside or outside a transaction.
- Wrap multi-step writes in `TransactionService.run`. Side effects that must not
  fire on rollback go in `runAfterCommit`. Jobs go through `JobDispatcher`,
  which writes them to the outbox inside the transaction — see the next section.
- Soft delete is a `deletedAt` update, not `delete`. The extension filters reads
  for models listed in `SOFT_DELETABLE_MODELS`. `delete`/`deleteMany` still hard
  delete, deliberately.
- Some things cannot be expressed in `schema.prisma`: partial unique indexes,
  check constraints, storage parameters. They are listed in a `///` comment on
  the model and **added to the migration by hand** after
  `migrate dev --create-only`. Prisma neither generates them nor notices when
  they are missing — they were left out twice while the outbox was built. Never
  edit a migration once applied (its checksum is recorded); add a new one.

---

## Pagination

Every list endpoint returns `data: { items, pagination }`. The outer shape is
the same for every list in the API, so a client writes one list component;
only the `pagination` block differs by strategy. Pagination lives in `data`,
not the envelope's `meta` — `meta` describes the response, pagination describes
the data. There is no `strategy` field: a route uses one for its lifetime.

**Offset** is built; **cursor** is not yet — its interface and builder exist in
`shared/pagination`, and its response schema and Prisma helper arrive with the
first feed or long list.

| Piece                                       | Where                                           |
| ------------------------------------------- | ----------------------------------------------- |
| `offsetPaginationQuerySchema(filters?)`     | `shared/pagination` — request                   |
| `offsetPageSchema(itemSchema)`              | `shared/pagination` — response `data`           |
| `paginate(items, buildOffsetPagination(…))` | `shared/pagination` — what a service returns    |
| `OffsetSlice<Row>` = `{ rows, total }`      | `shared/pagination` — what a repository returns |
| `toOffsetArgs(query, orderBy)`              | `infrastructure/database/prisma`                |
| `createZodDto(…)`                           | the module — it is framework, so not `shared/`  |

The flow, and why each layer stops where it does: the **controller** takes
`@Query() query` and calls the service — HTTP only. The **service** scopes the
request (user, workspace), calls the repository, maps rows to the DTO and
returns `paginate(…)` — so it is callable from a job as well as a route. The
**repository** owns `where`, `select` and the sort, runs count and page, and
returns an `OffsetSlice` of rows as stored — it knows the table, not the
response. `sessions` in `modules/user-auth` is the reference implementation.

There is deliberately no `PaginationService`. It would hold no state and no
dependencies — the reason `TransactionService` is injectable — and a service
calling it would pass `where` and `orderBy`, carrying Prisma out of the
repositories. A `$allModels` extension (`prisma.db.lead.findPage`) was also
declined for now: heavy generic typing, three models with no `id`, and magic in
a codebase that prefers explicit calls. Revisit it when lists are numerous.

Rules that are not visible from the code that follows them:

- **The query schema is a builder, never an object to spread.** The depth check
  is a refinement, and `z.object({ ...schema.shape, status })` — the usual
  idiom — drops it without a word. Pass filters in:
  `offsetPaginationQuerySchema({ status: … })`. `page` and `limit` are spread
  last, so a filter cannot redefine them.
- **A page DTO must be built with `offsetPageSchema`.** `@ApiSuccessResponse`
  attaches `ZodSerializerDto`, which strips every field the DTO does not name —
  a hand-rolled `{ items }` schema delivers the items and silently drops
  `pagination`.
- **Every offset `orderBy` ends in `id`, and `toOffsetArgs` enforces it.** It
  takes the sort and appends `{ id: 'desc' }`, so `skip`/`take` cannot be had
  without a total order. Rows that tie on every sort key would otherwise come
  back in a different order per query and appear on two pages, or none. A
  misspelt column, or a model with no `id`, is a compile error. Never write
  `skip`/`take` by hand.
- **`MAX_OFFSET` is 10,000.** `OFFSET` computes every skipped row, so cost grows
  with depth; a few `?page=999999` requests would hold the small connection pool
  while the rate limiter, which counts requests rather than their cost, lets
  them through. Refused in the schema, before any query runs. Deeper than that
  is an export or a sync, and wants a cursor.
- `limit` above 100 is a 422, never silently clamped. An empty list is page 1 of
  1; a page past the end is an empty `items` with `200`, not a `404`.
- Count and page run in `Promise.all`, not `$transaction` — `prisma.db` may
  already be a transaction client, which cannot open another.
- `sortBy` is never part of the shared schema. Each module declares an enum of
  the columns it allows, as a filter — an open string reaching `orderBy` is an
  injection surface and a full scan.

---

## Jobs, the outbox and email

`JobDispatcher.dispatch` is the one way to enqueue work. `OutboxRepository` and
`JobPublisher` are deliberately not exported from `QueueModule`: a caller that
wrote the outbox or published directly would skip the commit guarantee or the
context capture.

**A committed transaction means the job will run.** `dispatch` writes the job to
`outbox_messages` through `prisma.db`, so it commits or rolls back with the
caller's writes, and publishes it as soon as the transaction commits. If that
fails — Redis unreachable, the process killed between commit and publish — the
row stays `PENDING` and `OutboxRelay` publishes it. The relay runs with the
workers, leases rows with `FOR UPDATE SKIP LOCKED` so several can run at once,
backs off, gives up loudly after ten attempts, and purges finished rows after a
day. Readiness reports the backlog but never fails on it.

Rules that are not visible from the code that follows them:

- **A job id is derived from what the job is about** — `verification-<codeId>` —
  never a timestamp or a random value. It is the deduplication key in the
  outbox, in BullMQ and at the email provider; a unique-per-attempt id defeats
  all three at once.
- **A job id never contains `:`.** BullMQ rejects it; `dispatch` refuses it up
  front.
- **Payloads carry ids, not documents, and handlers are idempotent.** Delivery
  is at least once.
- **Anything carrying a one-time code sets `expiresAt`**, so it is dropped
  rather than delivered late — by the relay if it never left the outbox, by the
  worker if it waited in the queue.
- Retries and retention per queue live in `QUEUE_SETTINGS` and are applied to
  every job by `JobPublisher` — BullMQ's own default is a single attempt. The
  email queue keeps no completed jobs, because their payloads carry codes.
- The BullMQ connection needs `maxRetriesPerRequest: null`; BullMQ refuses to
  start otherwise.

**Email** goes through `EmailService.send` only. It records the message in
`outbound_messages` inside the caller's transaction, then dispatches. The record
never holds the body — a code travels in it. Status only moves forward
(`MESSAGE_STATUS_RANK`), because provider webhooks arrive out of order. A flow
that issues a one-time code uses `issueAndDeliver` in `UserAuthService`, so the
code and its email commit together.

---

## Seeding

`pnpm db:seed` compiles and runs `src/seed.ts`, which boots `SeedModule` and
asks `SeedRunner` to run the registered seeders. `prisma.config.ts` points its
seed hook at the same script, so `prisma migrate reset` leaves a usable
environment rather than an empty one.

**A seeder lives with the table it seeds** — `modules/<x>/seeds/` — extends the
`Seeder` port from `core`, and is exported by its module. `core` declares the
port for the usual reason: it needs seeders, the tables belong to feature
modules, and `core` may not import one. `modules/admins` is the example.

**`SeedModule` is not `AppModule`.** `AppModule` starts the BullMQ workers,
which in a seed script means a process that never exits — a CI job that hangs
rather than one that fails. It lists only what a seeder needs.

**Order is the list**, in `SeedingModule.forRoot({ imports, seeders })`: the
seeders run in the order they are named there, and that is the one place to
read what runs before what. **Nest has no multi-provider** — a second
`{ provide: Seeder }` replaces the first rather than joining it — so the
seeders are listed as classes and collected by a factory. Discovery by
decorator was the alternative, and it gives no order at all.

**Each seeder declares a `kind`,** because the word covers things with different
rules: `reference` (permissions, roles — every environment, every deploy,
upserted by natural key) and `bootstrap` (the first admin — once per
environment, created and never overwritten). `db:seed` runs everything;
`--only=<key>` names seeders explicitly and `--kinds=<kind>` filters.

There is no `demo` kind. Nothing generates fixtures yet, and the environment
gate one would need — refusing to run outside development — is not worth writing
against no caller. Add both in the same change as the first fixture seeder.

**Seeders never delete.** A permission the catalogue no longer defines may still
be referenced by a role — report it in `notes` and let a human decide.

---

## Testing

**There are currently no unit tests.** `pnpm test` passes because of
`--passWithNoTests`. The only test is `test/app.e2e-spec.ts`, which boots the
container and is a real smoke test — it connects Postgres and Redis.

When adding tests, start with the logic that needed a paragraph of explanation:
`RateLimitService.consumeAll` refunds, the soft-delete extension, session
device-binding concurrency, `PasswordService.verify`'s null branch, the outbox
lease and relay, and `MESSAGE_STATUS_RANK`.

---

## Planned — deliberately not built

These had empty directories reserving their names. An empty folder reads as
abandoned rather than intended, and it cannot say _why_ it is empty or _when_ to
fill it, so the folders were removed and the intent recorded here. Create the
directory when you write the first file in it, not before.

| Area                                | Build it when                                                       | Notes                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/events/`                      | a second consumer needs to react to something a module already does | `@nestjs/event-emitter` is not a dependency yet. `JobDispatcher` and its outbox already cover "do X after this write commits", durably, which is what most of the demand looks like — reach for events when one write needs _several_ independent reactions. Domain events are modelled in `docs/phase-2-domain-model/06-domain-events.md`.                                                    |
| `core/permissions/`                 | with the workspace/membership schema                                | RBAC per ADR-002. Needs `permissions`, `organization_roles` and `role_permissions` tables first; a permission guard with nothing to resolve against is not testable. Resolution should cache through `CacheService`.                                                                                                                                                                           |
| `infrastructure/communication/sms/` | phone verification ships                                            | Mirrors `infrastructure/communication/email/`: an `SmsTransport` abstract class, a provider adapter, and a log adapter for local development. The schema already supports it (`IdentifierType.PHONE`, `VerificationPurpose.PHONE_VERIFICATION`) but no flow sends a code by SMS. Note the queue is named `email`, not `mail` — a separate SMS queue is a workload-class decision to make then. |
| `shared/decorators/`                | a decorator is needed by two layers                                 | Nothing is shared yet. Context decorators live in `core/context/decorators/`, rate limiting in `core/rate-limit/decorators/`, CSRF in `core/csrf/decorators/` — each with the subsystem that gives it meaning, which is where they should stay unless a genuinely generic one appears.                                                                                                         |

`core/context/index.ts` carries a note of the same kind for fields that arrive
with RBAC and OpenTelemetry.

Shared schema primitives live in `shared/schemas/`. `idSchema` is what an id is
in this system; a URL id is validated with `@Param('id', ParseIdPipe)` from
`core/validation` — Nest machinery stays out of `shared/`, which imports no
framework. Email, phone and identifier
schemas come in two strengths: `emailSchema` / `phoneSchema` / `identifierSchema`
for **creating** an identity (disposable-domain blocklist, mobile-only), and
`lookupEmailSchema` / `lookupPhoneSchema` / `lookupIdentifierSchema` for
**finding** one that exists. Every login, OTP, verification and reset flow uses a
`lookup*` schema — the strict one there would lock existing users out the day
their domain joins the blocklist.

---

## Decisions

Architecture decisions are recorded in `docs/adr/`:

- ADR-001 — multi-organization membership
- ADR-002 — RBAC model
- ADR-003 — CSRF strategy

Product and domain modelling is in `docs/phase-*/`. Note that these describe the
intended system: multi-tenancy, RBAC and the CRM domain are **designed but not
yet built**. The schema today covers identity only.
