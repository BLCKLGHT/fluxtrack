# FluxTrack product requirements

## Purpose

FluxTrack is a mobile-first laboratory sample-tray tracking PWA. It lets process
operators acknowledge a tray, report sample defects with photographic evidence,
and complete the tray without interrupting physical laboratory work. A separate
desktop dashboard gives authorised staff traceability, filters, exports, and
administrative controls.

## Prototype scope

- One seeded tray: `FLUX-TEST-001`, named `2001 - 2021`, sourced from pot cells.
- Twenty-one samples numbered 2001 through 2021.
- Email/password authentication backed by Supabase Auth.
- Roles: process operator, team viewer, and administrator.
- Private photographs in the `sample-issue-photos` Supabase Storage bucket.
- Database-controlled categories, roles, state transitions, auditing, and
  notification outbox events.

## Operator journey

1. Sign in and scan a trusted FluxTrack URL or enter a tray code.
2. Open the tray and select **Log Tray Received**.
3. Tap a large sample number, select a processing stage and issue category,
   optionally comment, then select **Take Photo and Submit Issue**.
4. Camera capture is the final confirmation. The image uploads immediately and
   the transactional database operation creates the issue.
5. Return later without losing server records, add further issues, then complete
   the tray with a simple confirmation.

## Functional requirements

- Reject invalid or foreign QR URLs and unknown tray codes.
- Show tray status, timestamps, sample counts, issue counts, and the next action.
- Support sample search and all/issues-only filters.
- Require a comment only for the database category configured to require one.
- Allow multiple immutable issue records per sample.
- Disable operator changes for completed trays.
- Complete pending samples as processed in the same database transaction.
- Generate and print/download a tray QR code from the dashboard.
- Provide dashboard metrics, tray and issue detail, accessible charts, filters,
  photo viewing with short-lived signed URLs, CSV export, and administrator
  audit/category/user surfaces.

## Non-functional requirements

- Strict TypeScript, server-side validation with Zod, RLS on exposed tables, and
  role checks in both application and database layers.
- At least 44px touch targets, visible focus, semantic controls, live status
  announcements, high contrast, and no colour-only status meaning.
- Do not cache sensitive responses or photographs. Do not persist captured files
  in localStorage, IndexedDB, Cache API, or an application offline queue.
- Database timestamps and authenticated identity are authoritative.
- Issue creation is idempotent and compensates for failed post-upload creation.
- The prototype is deployable to Vercel but is not represented as approved for
  real operational data.

## Acceptance criteria

The first vertical slice is complete when an authenticated operator can receive
`FLUX-TEST-001`, report an issue for sample 2001 with a private photograph, and
see the persistent result on the tray. The wider prototype is complete when tray
completion, QR workflows, role-gated dashboard records, export, audit, PWA
behaviour, tests, and setup/deployment documentation are present and validated.

