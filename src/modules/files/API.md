# Files — API contract

The contract `modules/files` implements: uploading a file, confirming it,
reading its state, and the attach contract every owning module calls. Written
before the code; the schema is in `prisma/schema.prisma` (`StoredFile`,
`StoredFileVariant`, `WorkspaceStorageUsage`) and its model comments carry the
reasons for each table's shape. Storage itself is `infrastructure/storage`.

---

## The model in one paragraph

A file is uploaded by its client straight to storage, never through this
service. The client asks for an upload, this module records a `PENDING` row
and returns a presigned URL; the client `PUT`s the bytes and calls
`complete`; this module checks the object's size and queues processing,
which sniffs the real type, re-encodes what is public and writes the
thumbnail. A file belongs to nothing until an owning module **attaches** it —
a user's avatar, a workspace's logo. An unattached upload expires after a day.
A replaced or deleted file is soft-deleted and purged from storage 30 days
later.

---

## One upload route per scope, not per purpose

Three upload routes — user, workspace, admin — each taking the purpose in the
body. A new purpose is a row in `FILE_PURPOSE_POLICY`, not a route.

One route for every scope cannot exist here: a route's audience is its path,
so an admin's upload must be under `/admin/`, and a route carries exactly one
marker, so an avatar (`@NoWorkspace()`) and a logo (`@AnyMember()`) cannot
share one.

A route per purpose (`/workspace/logo/upload-url`,
`/workspace/leads/:id/documents/upload-url`, …) was rejected. Each would repeat
upload and confirm in its owner, and a chat attachment has no owner yet when
it is uploaded — the message does not exist until it is sent. The shape here
is the one Slack, Notion and Linear use: upload first, then reference the id.

## Who decides what

| Decided by               | What                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `FILE_PURPOSE_POLICY`    | Per purpose: scope, visibility, allowed types, maximum size, variants                      |
| This module              | The object key, the status, expiry, quota, who may read a file through `/files` routes     |
| The owning module        | Whether the caller may attach a file there — its route carries the permission              |
| `infrastructure/storage` | Bucket names, signing, the S3 protocol                                                     |
| The client               | Only the purpose, the file's name, type and size — **never** the bucket, key or visibility |

**Uploading authorizes nothing; attaching does.** An upload route needs only
the scope's audience (`@NoWorkspace()`, `@AnyMember()`, `@AnyAdmin()`). The
permission lives on the attach route — `PUT /workspace/logo` carries
`workspace.update`, and a lead's documents route will carry the lead's key.
What an upload with no attach permission behind it can do is bounded: it
counts against quota, the per-uploader cap and the rate limit, nobody else
can see it, and it is purged unattached within a day. If that ever proves
too loose, a policy can name an `uploadPermission` — not before.

**A file is read through its owner.** The `/files` routes below serve only the
uploader, to follow their own upload. Everyone else sees a file inside the
owning resource's response — the avatar in a profile, the logo in the
workspace — where that resource's permission already applied.

---

## Purposes

`FILE_PURPOSE_POLICY` in `constants/`, `satisfies Record<FilePurpose, FilePolicy>`
— a purpose added to the enum without a policy fails the build.

| Purpose          | Scope       | Visibility | Types                                   | Max  | Stored as                           |
| ---------------- | ----------- | ---------- | --------------------------------------- | ---- | ----------------------------------- |
| `USER_AVATAR`    | `user`      | `PUBLIC`   | `image/jpeg`, `image/png`, `image/webp` | 5 MB | WebP ≤ 1024 px + `THUMBNAIL` 256 px |
| `ADMIN_AVATAR`   | `admin`     | `PUBLIC`   | same                                    | 5 MB | same                                |
| `WORKSPACE_LOGO` | `workspace` | `PUBLIC`   | same                                    | 5 MB | same, transparency kept             |

Refused for every purpose, whatever a policy says: SVG (it runs script),
HTML, executables, archives. HEIC is not accepted: the prebuilt `sharp`
cannot decode it, and iOS converts on upload when the page asks for JPEG.

The scope decides which route accepts the purpose and what the file belongs
to: `user` and `admin` files have no `workspace_id`; `workspace` files carry
the caller's, from `x-workspace-id`.

---

## Routes

Marker legend as in `modules/workspaces/API.md`: **N** `@NoWorkspace()` ·
**M** `@AnyMember()` · **A** `@AnyAdmin()`.

| Method | Path                            | Marker | Purpose                     |
| ------ | ------------------------------- | ------ | --------------------------- |
| POST   | `/users/me/files/uploads`       | N      | Start a `user`-scope upload |
| POST   | `/users/me/files/:id/complete`  | N      | Confirm it                  |
| GET    | `/users/me/files/:id`           | N      | Follow it                   |
| POST   | `/workspace/files/uploads`      | M      | Start a `workspace` upload  |
| POST   | `/workspace/files/:id/complete` | M      | Confirm it                  |
| GET    | `/workspace/files/:id`          | M      | Follow it                   |
| POST   | `/admin/me/files/uploads`       | A      | Start an `admin` upload     |
| POST   | `/admin/me/files/:id/complete`  | A      | Confirm it                  |
| GET    | `/admin/me/files/:id`           | A      | Follow it                   |

Attach routes are the owners'. Specified here because they are this module's
callers:

| Method | Path               | Marker             | Owner                |
| ------ | ------------------ | ------------------ | -------------------- |
| PUT    | `/users/me/avatar` | N                  | `modules/users`      |
| DELETE | `/users/me/avatar` | N                  | `modules/users`      |
| PUT    | `/admin/me/avatar` | A                  | `modules/admins`     |
| DELETE | `/admin/me/avatar` | A                  | `modules/admins`     |
| PUT    | `/workspace/logo`  | `workspace.update` | `modules/workspaces` |
| DELETE | `/workspace/logo`  | `workspace.update` | `modules/workspaces` |

```jsonc
// PUT body, all three
{ "fileId": "…" }
```

A `:id` that is not the caller's upload in that scope is `404 FILE_NOT_FOUND`,
the same answer as no such file: a caller learns nothing about files that are
not theirs. A workspace file is the caller's only in the workspace it was
uploaded to.

---

### POST `…/files/uploads` — start

```jsonc
// request
{
  "purpose": "USER_AVATAR", // a purpose of this route's scope
  "fileName": "me.png", // 1–255, display only
  "contentType": "image/png", // in the purpose's allowlist
  "sizeBytes": 482113, // 1 – the purpose's maximum
}
```

Checks, in order: the purpose belongs to this scope (`422
FILE_PURPOSE_NOT_ALLOWED`); the type is allowed (`422 FILE_TYPE_NOT_ALLOWED`);
the size is within the maximum (`422 FILE_TOO_LARGE`); the uploader holds
fewer than `MAX_UNATTACHED_UPLOADS` unattached files (`429
TOO_MANY_UNATTACHED_UPLOADS`); for a `workspace` file, the declared size fits
the quota (`403 STORAGE_QUOTA_EXCEEDED`).

Then one row, `PENDING`, `expires_at` a day out, and a presigned URL:

```jsonc
// 201
{
  "file": {/* FileView, status PENDING */},
  "upload": {
    "method": "PUT",
    "url": "https://…", // a bearer credential for 5 minutes
    "headers": { "Content-Type": "image/png" }, // send exactly these
    "expiresAt": "…",
  },
}
```

The client sends `PUT url` with `headers` and the bytes as the body. The type
is signed into the URL: any other `Content-Type` is refused by storage. The
size is not — R2 has no presigned POST — which is what `complete` checks.

A `PUBLIC` file is uploaded to `incoming/<id>` in the **private** bucket. Only
the re-encoded result ever reaches the public one, so no byte a client chose
is served from the CDN.

Rate limited per uploader (`FILE_RATE_LIMIT.UPLOAD`).

### POST `…/files/:id/complete` — confirm

No body. Reads the object's size from storage.

- no object — `409 FILE_NOT_UPLOADED`; the client may `PUT` and call again
  until the file expires
- size differs from `sizeBytes` — status `REJECTED` (`SIZE_MISMATCH`), the
  object deleted, `422 FILE_SIZE_MISMATCH`
- otherwise status `UPLOADED`, `uploaded_at` set, the workspace's usage
  incremented under the quota, and processing dispatched as
  `file-process-<id>` — all in one transaction

`200` with the `FileView`. Idempotent: on a file already `UPLOADED` or `READY`
it returns the current view and does nothing. `REJECTED` is `409
FILE_REJECTED`, with the reason in the view. A `PENDING` file past
`expires_at` is `404 FILE_NOT_FOUND` — the purge may already have taken it.

The quota is checked again here with a conditional update, because two
uploads that both passed the check at start must not both fit.

### GET `…/files/:id` — follow

`200` with the `FileView`. What the client polls after `complete`, until
`status` is `READY` or `REJECTED` — every 2 seconds for about 30 is enough for
an image. Until then the client shows its own local preview
(`URL.createObjectURL`), so a user never waits on processing to see what they
chose.

---

## FileView

```jsonc
{
  "id": "…",
  "purpose": "USER_AVATAR",
  "status": "READY", // PENDING | UPLOADED | READY | REJECTED
  "rejectReason": null, // FileRejectReason when REJECTED
  "name": "me.png",
  "contentType": "image/webp", // detected once processed, declared before
  "sizeBytes": 48211,
  "width": 1024, // null when not an image or video, or not yet known
  "height": 1024,
  "durationMs": null,
  "url": "https://cdn…/…", // null until READY
  "urlExpiresAt": null, // set only for a PRIVATE file's signed URL
  "thumbnail": { "url": "https://cdn…/…", "width": 256, "height": 256 }, // or null
  "attachedAt": "…", // null while unattached
  "expiresAt": null, // set while unattached
  "createdAt": "…",
}
```

**No URL is stored.** A row holds a key; the URL is built when the view is. A
`PUBLIC` file's is permanent — CDN base and key, no signature. A `PRIVATE`
file's is signed for 10 minutes on each read; signing is local, so a page of
them costs no round trip. A client re-reads the owning resource for a fresh
one rather than caching it.

`url` is `null` before `READY` for both visibilities: a public file has no
public copy until it is re-encoded, and a private one has not had its type
checked.

Owners embed a smaller shape, built by `FilesService.viewsFor(ids)` in one
query for a whole list:

```jsonc
"avatar": { "url": "…", "thumbnailUrl": "…", "width": 1024, "height": 1024 } // or null
```

`null` both when there is no avatar and while the attached one is still
processing.

---

## Attaching — the contract for owning modules

`FilesService.attach(fileId, { purpose, uploader })`, inside the owner's
transaction. Succeeds only if the file:

- was uploaded by `uploader` — a user id or an admin id, never interchangeable,
  and for a workspace file, in the caller's workspace
- has the expected `purpose` — else `422 FILE_PURPOSE_MISMATCH`, which is what
  stops a user's upload becoming an admin's avatar
- is `UPLOADED` or `READY` — else `409 FILE_NOT_ATTACHABLE`; a client may
  attach before processing finishes, and the owner's view shows no URL until
  it does
- is not attached already — else `409 FILE_ALREADY_ATTACHED`; one file, one
  owner, which the unique indexes on `avatar_file_id` and `logo_file_id`
  enforce as well

Anything else is `404 FILE_NOT_FOUND`.

It sets `attached_at` and clears `expires_at`; the owner then writes its own
reference. Replacing is one transaction: attach the new file, write the
reference, `FilesService.release(oldId)` — a soft delete. `DELETE` on the
owner's route is the reference cleared and the file released.

A list owner — a lead's documents, a message's attachments — attaches each id
it is given, in one transaction with the rows that reference them.

---

## Storage keys

Built from ids only, by this module:

```
private  incoming/<fileId>                                   PUBLIC uploads, until processed
private  ws/<workspaceId>/<purpose>/<fileId>/original.<ext>  PRIVATE files (none yet)
private  ws/<workspaceId>/<purpose>/<fileId>/thumbnail.webp
public   users/<userId>/avatar/<fileId>/original.webp
public   admins/<adminId>/avatar/<fileId>/original.webp
public   ws/<workspaceId>/logo/<fileId>/original.webp
public   …/<fileId>/thumbnail.webp
```

A key never holds a client's file name: it would be a traversal vector, put
personal data in URLs and collide. Because the file id is in the key, an
object never changes once written, and public objects are served with
`Cache-Control: public, max-age=31536000, immutable` — a new avatar is a new
URL, so no cache is ever purged. A workspace prefix makes a tenant's export or
erasure a listing.

---

## Lifecycle and cleanup

```
PENDING ──complete──▶ UPLOADED ──processed──▶ READY
   │                     │
   │ size mismatch       │ type check failed
   ▼                     ▼
REJECTED ◀───────────────┘
```

`attached_at` and `deleted_at` are separate from the status: a file can be
attached while it is still processing.

| Job                      | When   | What                                                                                   |
| ------------------------ | ------ | -------------------------------------------------------------------------------------- |
| `files.process`          | queued | Sniff, re-encode, variants, `READY` — or `REJECTED` and the object deleted             |
| `files.purge-unattached` | hourly | `expires_at` past: objects deleted, then the row                                       |
| `files.purge-deleted`    | daily  | `deleted_at` older than 30 days: objects and variants, then the row, usage decremented |

Storage is always deleted before the row. If storage fails the next run
retries; the other order would orphan objects nothing points at. `REJECTED`
rows still carry `expires_at`, so the hourly purge takes them.

Processing runs on its own `media` queue, so a video encode never delays an
email. Its job id is derived from the file, and every step is safe to repeat.

---

## Errors

| Code                          | HTTP | When                                                    |
| ----------------------------- | ---- | ------------------------------------------------------- |
| `FILE_NOT_FOUND`              | 404  | Not the caller's, wrong scope, expired, or no such file |
| `FILE_PURPOSE_NOT_ALLOWED`    | 422  | A purpose of another scope on this route                |
| `FILE_TYPE_NOT_ALLOWED`       | 422  | Declared type outside the purpose's allowlist           |
| `FILE_TOO_LARGE`              | 422  | Declared size above the purpose's maximum               |
| `TOO_MANY_UNATTACHED_UPLOADS` | 429  | The uploader's unattached files are at the cap          |
| `STORAGE_QUOTA_EXCEEDED`      | 403  | The workspace's usage plus this file exceeds its quota  |
| `FILE_NOT_UPLOADED`           | 409  | `complete` before the object is in storage              |
| `FILE_SIZE_MISMATCH`          | 422  | The stored object is not the declared size              |
| `FILE_REJECTED`               | 409  | `complete` on a file already rejected                   |
| `FILE_PURPOSE_MISMATCH`       | 422  | Attaching a file of another purpose                     |
| `FILE_NOT_ATTACHABLE`         | 409  | Attaching a file that is `PENDING` or `REJECTED`        |
| `FILE_ALREADY_ATTACHED`       | 409  | Attaching a file another owner holds                    |

---

## Constants

In `constants/`, reviewed in a pull request like every other budget:

| Name                            | Value     | Why                                                       |
| ------------------------------- | --------- | --------------------------------------------------------- |
| `UNATTACHED_FILE_TTL_MS`        | 24 h      | Long enough to finish a form; short enough not to pile up |
| `DELETED_FILE_GRACE_MS`         | 30 days   | Undo and support requests, before storage is purged       |
| `MAX_UNATTACHED_UPLOADS`        | 20        | Per uploader; a form rarely holds more                    |
| `WORKSPACE_STORAGE_QUOTA_BYTES` | 5 GiB     | A placeholder until plans exist                           |
| `FILE_RATE_LIMIT.UPLOAD`        | 60 / hour | Per uploader                                              |

---

## Deliberately not here

- **Private purposes** — `LEAD_DOCUMENT`, `MESSAGE_ATTACHMENT`. Each arrives
  with its module and join table; the private bucket, signed reads and `ws/…`
  keys are specified above so that each arrives as a policy row, not a design.
- **Video and documents.** No purpose accepts them yet; `ffmpeg` and the
  `media` queue's video path come with the first that does.
- **Multipart upload** for files above ~100 MB. `upload` is an object so that
  `parts` can be added beside `url` without breaking a client.
- **Malware scanning.** Room for a `SCANNING` status before `READY` when
  documents from outside arrive.
- **Further image sizes** — a value in `FileVariantKind`, not a column.
- **Versioning** of a document.
- **Push on `READY`.** Polling until a socket exists for chat.
- **Deduplication** by checksum.
