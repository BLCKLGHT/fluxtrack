# Implementation plan

## Phase 1 — Foundation

- Create a strict Next.js App Router project with Tailwind.
- Add browser/server/middleware Supabase clients and protected role layouts.
- Add enums, tables, indexes, triggers, transition functions, RLS, storage
  bucket/policies, seed data, and safe Auth-user provisioning instructions.
- Validate with typecheck, lint, unit tests, and migration review.

## Phase 2 — Operator vertical slice

- Build sign-in, operator navigation, tray list/detail, receive transition,
  sample search/filter, issue form, in-memory image processing, direct private
  upload, compensating cleanup, idempotent issue creation, and completion.
- Add offline/online status and accessible feedback.
- Validate the complete receive → issue/photo → persistent result flow.

## Phase 3 — QR workflow

- Add a guarded browser scanner with trusted-origin/path parsing and manual
  fallback.
- Add an A4 print page with tray label, fallback URL, and SVG/PNG download.

## Phase 4 — Dashboard

- Add overview metrics and accessible charts, filtered tray and issue tables,
  tray lifecycle/detail, signed photo viewer, CSV export, and administrator
  users/categories/audit surfaces.

## Phase 5 — Hardening and handoff

- Add manifest, generated icons, restricted service worker and offline fallback.
- Add unit/component/database-function and Playwright tests with synthetic data.
- Complete environment, Supabase, Vercel, security, production-readiness, and
  limitation documentation.
- Run lint, strict typecheck, tests, and production build; resolve failures.

## Vertical-slice gate

Dashboard work begins only after the code path for sign-in, tray receipt, sample
2001 selection, category selection, photo upload, issue creation, and persistent
tray display is implemented without TODO placeholders.

