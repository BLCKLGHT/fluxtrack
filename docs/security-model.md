# Security model

## Trust boundaries

The browser is untrusted. It may provide tray/sample/category identifiers,
stage, comment, idempotency key, and uploaded-object metadata, but never the
operator identity, role, ownership, authoritative time, or desired tray state.
Those values are resolved in PostgreSQL from `auth.uid()`, profiles, and category
configuration.

## Authentication and authorisation

Supabase Auth manages email/password sessions. Server-rendered protected layouts
refresh and verify sessions and read the database-backed profile. The structure
allows a later SSO identity provider without changing domain authorisation.

Every exposed table has RLS enabled. Operators receive scoped reads and can only
mutate through security-definer transition functions. Team viewers are
read-only. Administrators manage configuration and invoke reason-required
reopen/void functions. No client bundle receives the service-role key.

## Photograph protection

`sample-issue-photos` is private. Authenticated operators may insert only under
tray/sample paths they can access; overwrite and delete are denied to clients.
Viewers obtain short-lived signed URLs after server-side role checks. Exports
include only a photo-present boolean. The service worker excludes Supabase,
application data routes, and images from caching.

The app handles camera files only in memory. Canvas re-encoding strips most
metadata in ordinary browsers. Successful uploads clear the input, revoke any
preview URL, and release references. The browser/OS may temporarily manage a
camera file internally; the application does not intentionally persist it.

## Audit and operational security

Audit rows are generated inside database transitions and cannot be edited by
operators or viewers. Notification events use an outbox with no real recipient
addresses in client code. Logs expose operator-friendly error codes rather than
secrets or raw database details.

Before real use: perform corporate identity, cybersecurity, privacy, data
classification, photograph-retention, device/network, backup/recovery,
monitoring, incident-response, support, change-control, quality-validation, and
user-acceptance reviews.

