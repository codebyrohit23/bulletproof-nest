/**
 * The permissions in `requested` the caller does not hold — empty when the
 * request is within the caller's own permissions.
 *
 * Stops privilege escalation: nobody defines or assigns a role that grants
 * more than they have. One function for both planes, so the rule cannot be
 * applied one way to members and another to admins. `held` is the grant the
 * guard resolved for this request, never a second resolution.
 */
export function missingPermissions<Key extends string>(
  requested: Iterable<Key>,
  held: ReadonlySet<Key>,
): Key[] {
  const missing: Key[] = [];

  for (const key of requested) {
    if (!held.has(key)) {
      missing.push(key);
    }
  }

  return missing;
}
