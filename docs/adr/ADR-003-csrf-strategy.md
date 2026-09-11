# ADR-003 — CSRF strategy

**Status:** Accepted
**Date:** 2026-09-12
**Supersedes:** nothing
**Related:** ADR-002 (RBAC model)

---

## Context

Cross-site request forgery works because a browser attaches credentials to a
request on its own, without regard for which page started it. A defence has to
require something the browser does _not_ attach automatically.

That framing decides most of this. The threat applies to credentials the
browser sends by itself, and to nothing else.

### What this API actually authenticates with

| Surface                                      | Credential                    | Attached automatically? |
| -------------------------------------------- | ----------------------------- | ----------------------- |
| Every route behind `UserAuthGuard`           | `Authorization: Bearer <jwt>` | **No**                  |
| `POST /api/v1/auth/refresh` — web clients    | `lf_rt` cookie                | **Yes**                 |
| `POST /api/v1/auth/refresh` — native clients | `refreshToken` in body        | No                      |

No page can make a browser send an `Authorization` header cross-site, so every
business endpoint is immune by construction. The entire CSRF attack surface is
**one endpoint**, and only for web clients.

### What that one endpoint can be made to do

An attacker can cause a refresh, but cannot read the response — CORS refuses an
origin outside `CORS_ORIGINS`. The browser stores the rotated cookie and the
victim stays signed in. The realistic worst case is two forged refreshes racing,
one presenting an already-spent token, tripping reuse detection and signing the
victim out. That is a nuisance, bounded further by the `refresh-by-ip` budget.

No data is read, no state belonging to the user is changed, nothing is charged.

### What already protects it

- `SameSite=Lax` — a browser does not attach the cookie to a cross-site POST
- `httpOnly` — page script cannot read the token
- `Secure` in production
- `path=/api/v1/auth` — the cookie is not sent to any other route
- `CORS_ORIGINS` — an attacker cannot read a response even when a request lands

### The gaps `SameSite=Lax` leaves

1. **A sibling subdomain.** `SameSite` reasons about the _registrable domain_,
   not the origin. A request from `anything.leadflow.com` is `same-site` and
   carries the cookie. This is not hypothetical here: workspaces are likely to
   be given subdomains, and a tenant that can put content on one would sit
   inside the boundary.
2. **A client that ignores `SameSite`.** Rare in 2026, and free to cover.

---

## Decision

**Validate `Sec-Fetch-Site` and `Origin` on state-changing requests. Do not
implement a CSRF token scheme.**

Implemented as `CsrfGuard` in `core/csrf`, bound globally through `APP_GUARD`,
controlled by `CSRF_ENABLED`.

```
Safe method (GET / HEAD / OPTIONS)  →  allow
Sec-Fetch-Site: cross-site          →  refuse            403
Origin present, not in CORS_ORIGINS →  refuse            403
Neither header present              →  allow
```

### Why both headers

`Sec-Fetch-Site` is a forbidden header name — page script cannot set or alter
it — so it is evidence rather than a claim. But its `same-site` answer is
exactly the subdomain gap. `Origin` is origin-precise and closes that, but is
absent on same-origin requests and on older clients. Each covers the other's
blind spot.

### Why absent headers pass

A caller sending neither is not a browser: curl, a native app, a provider
posting a webhook. A non-browser caller holds no ambient cookie, so there is
nothing for a forgery to spend.

### Why the CORS allowlist is reused

Two lists naming the origins this API serves would eventually disagree, and the
disagreement would present as a client that passes CORS and is then refused by
this guard. `CORS_ORIGINS=*` disables the origin half of the check; the
`Sec-Fetch-Site` half still holds.

---

## Alternatives considered

### Rely on `SameSite=Lax` alone

Rejected. It is a real defence and it is already in place, but it cannot see the
subdomain case, and that case is on this product's roadmap. Leaving `CSRF_ENABLED`
as a flag with nothing behind it was also untenable: a flag that reads `true` and
does nothing is worse than no flag, because it is read as an assurance.

### A CSRF token scheme (`@fastify/csrf-protection`)

Rejected **for this architecture**, not on principle.

Token schemes are the standard answer for cookie-session applications, where a
session cookie authenticates every request and the entire API is exposed. This
is a bearer-token API with one cookie on one route. A token would add a fetch, a
second cookie and a client contract, to cover a threat the two headers already
cover — and would put the cost on a web client that does not exist yet.

The professional answer to "do you implement CSRF protection?" is not a
checkbox; it is this document.

### `Origin` alone, without `Sec-Fetch-Site`

Rejected. It works, but it depends entirely on an allowlist staying correct, and
it cannot distinguish "no origin because same-origin" from "no origin because
not a browser". `Sec-Fetch-Site` answers both directly and needs no
configuration.

---

## Consequences

**Gained**

- The subdomain gap is closed before subdomains exist
- No client-side work, now or later
- One allowlist governs both reading and acting
- `CSRF_ENABLED` now controls something real

**Accepted**

- A browser that sends neither header is unprotected by this guard. It still has
  `SameSite=Lax`
- `CORS_ORIGINS=*` silently disables half the check
- A future browser-facing endpoint that authenticates by cookie from a
  third-party origin needs `@SkipCsrf()` and its own reasoning

---

## Revisit when any of these becomes true

1. **The web client moves to a different registrable domain.** The refresh
   cookie then needs `SameSite=None` to be sent at all, which removes the
   `SameSite` layer entirely and leaves this guard alone. Re-evaluate a token
   scheme at that point.
2. **Any endpoint other than refresh starts authenticating by cookie.** The
   surface stops being one low-impact route.
3. **Session cookies replace bearer tokens** for the API. The architecture this
   decision rests on would no longer hold, and the standard answer would become
   the right one.
4. **A customer's security review requires tokens specifically.** A defensible
   position is not always an accepted one; implementing then is cheap, because
   the endpoint and the web client will both exist.
