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
modules/          features: user-auth, users, verification, health
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

`core/auth/ports/session-validator.port.ts` is the example. The guard must read
`user_sessions`, that table belongs to `modules/user-auth`, and `core` cannot
import a feature module. So `core/auth` declares the requirement, the module
satisfies it, and `AppModule` — the only place entitled to know both — connects
them:

```ts
// modules/user-auth/user-auth.module.ts
providers: [{ provide: SessionValidator, useExisting: UserSessionService }];
exports: [SessionValidator];

// app.module.ts
AuthModule.forRoot({ imports: [UserAuthModule] });
```

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

Existing ports: `SessionValidator`, `CacheStore`, `RateLimitStore`,
`EmailTransport`.

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

**Make drift a build error** where the language allows it. Two examples already
in the tree:

- `EMAIL_TEMPLATES … satisfies Record<EmailTemplateId, …>` — adding a template
  id without registering its template fails the build.
- `SessionDeviceColumns = Pick<Prisma.UserSessionUncheckedCreateInput, keyof DeviceContext>`
  in `modules/user-auth/interfaces/device-context.interface.ts` — a field added
  to `DeviceContext` that is not a column fails the build, because the spread
  that writes it bypasses excess-property checking.

**Comments explain why, and what was rejected.** The codebase is written this
way throughout; a comment restating the code is noise, and a comment that
survives a refactor is the only documentation that was ever true. When removing
one, check it is not the last record of a decision.

**Guards, filters, pipes and interceptors** are bound with `APP_GUARD` /
`APP_FILTER` / `APP_PIPE` / `APP_INTERCEPTOR` inside their own module, never in
`bootstrap/`. Bootstrap is only for what the container cannot do — Fastify
plugins, adapter options, versioning, shutdown. Registration order in
`AppModule` is guard execution order.

**Config** is validated by Zod at startup and fails loudly. Every variable is
documented in `.env.example`.

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
  fire on rollback go in `runAfterCommit` — `JobDispatcher` already does this,
  so enqueueing inside a transaction is safe.
- Soft delete is a `deletedAt` update, not `delete`. The extension filters reads
  for models listed in `SOFT_DELETABLE_MODELS`. `delete`/`deleteMany` still hard
  delete, deliberately.
- Some constraints cannot be expressed in `schema.prisma` — partial unique
  indexes live in the migration, with a comment in the schema pointing at it.

---

## Testing

**There are currently no unit tests.** `pnpm test` passes because of
`--passWithNoTests`. The only test is `test/app.e2e-spec.ts`, which boots the
container and is a real smoke test — it connects Postgres and Redis.

When adding tests, start with the logic that needed a paragraph of explanation:
`RateLimitService.consumeAll` refunds, the soft-delete extension, session
device-binding concurrency, `PasswordService.verify`'s null branch.

---

## Planned — deliberately not built

These had empty directories reserving their names. An empty folder reads as
abandoned rather than intended, and it cannot say _why_ it is empty or _when_ to
fill it, so the folders were removed and the intent recorded here. Create the
directory when you write the first file in it, not before.

| Area                                | Build it when                                                       | Notes                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/events/`                      | a second consumer needs to react to something a module already does | `@nestjs/event-emitter` is not a dependency yet. `TransactionService.runAfterCommit` already covers "do X after this write commits", which is what most of the demand looks like — reach for events when one write needs _several_ independent reactions. Domain events are modelled in `docs/phase-2-domain-model/06-domain-events.md`.                                                       |
| `core/permissions/`                 | with the workspace/membership schema                                | RBAC per ADR-002. Needs `permissions`, `organization_roles` and `role_permissions` tables first; a permission guard with nothing to resolve against is not testable. Resolution should cache through `CacheService`.                                                                                                                                                                           |
| `infrastructure/communication/sms/` | phone verification ships                                            | Mirrors `infrastructure/communication/email/`: an `SmsTransport` abstract class, a provider adapter, and a log adapter for local development. The schema already supports it (`IdentifierType.PHONE`, `VerificationPurpose.PHONE_VERIFICATION`) but no flow sends a code by SMS. Note the queue is named `email`, not `mail` — a separate SMS queue is a workload-class decision to make then. |
| `modules/user-auth/mappers/`        | a row shape stops matching its DTO                                  | Today the services narrow rows by hand, explicitly, which is safer than a mapper while the shapes are small — see `buildAuthUser`. Add mappers when the same narrowing appears in three places, not before.                                                                                                                                                                                    |
| `shared/decorators/`                | a decorator is needed by two layers                                 | Nothing is shared yet. Context decorators live in `core/context/decorators/`, rate limiting in `core/rate-limit/decorators/`, CSRF in `core/csrf/decorators/` — each with the subsystem that gives it meaning, which is where they should stay unless a genuinely generic one appears.                                                                                                         |

Two folders are intentionally kept with an `export {}` barrel rather than
deleted, because the barrel documents a plan precise enough to follow:
`shared/pipes/` (a `parse-uuid.pipe.ts` for the first `:id` route) and
`shared/validators/` (id, contact and text schema primitives). `core/context/index.ts`
carries the same kind of note for fields that arrive with RBAC and OpenTelemetry.

---

## Decisions

Architecture decisions are recorded in `docs/adr/`:

- ADR-001 — multi-organization membership
- ADR-002 — RBAC model
- ADR-003 — CSRF strategy

Product and domain modelling is in `docs/phase-*/`. Note that these describe the
intended system: multi-tenancy, RBAC and the CRM domain are **designed but not
yet built**. The schema today covers identity only.
