# FluxTrack

FluxTrack is a production-oriented prototype for fast, traceable laboratory
sample-tray handling. A phone-first PWA lets process operators receive a tray,
record sample problems with photographic evidence, and complete the tray. A
desktop dashboard gives team viewers and administrators searchable records,
private evidence viewing, CSV export, metrics, configuration, and audit history.

The prototype is deployable but is **not approved for real operational data**
until the reviews in
[the production-readiness checklist](docs/production-readiness-checklist.md)
are complete.

## Operator workflow

1. Sign in with a Supabase Auth email/password account.
2. Scan a trusted tray QR or enter `FLUX-TEST-001`.
3. Select **Log Tray Received**. The database records the authenticated operator
   and authoritative timestamp.
4. Tap a sample, select stage and reason, optionally comment, then select
   **Take Photo and Submit Issue**.
5. Taking/choosing the photo is final confirmation. The app validates and
   re-encodes it in memory, uploads it to private Storage, and calls an
   idempotent database operation. There is no second submit button.
6. Return later and continue from the database-backed tray state.
7. Select **Complete Tray**, review the counts, and confirm.

## State model

Tray state:

```text
created → received → in_progress → completed
                                  ↘ administrator: reopened → in_progress
```

The first issue changes a received/reopened tray to `in_progress`. Completion
changes pending samples to `processed` and makes the tray read-only for process
operators. Only an administrator may reopen a completed tray, with an audit
reason.

Samples are `pending`, `issue_reported`, or `processed`. A sample can have many
immutable issue records. Completing a tray changes only pending samples;
exception samples remain `issue_reported`.

## Architecture

- Next.js App Router, strict TypeScript, React, and Tailwind CSS
- Supabase Postgres/Auth/Storage with explicit RLS and storage policies
- Security-definer PostgreSQL functions for receive, issue, complete, reopen,
  and void transitions
- Zod at external boundaries and React Hook Form on the issue workflow
- `@zxing/browser` scanning and `qrcode` label generation
- Private `sample-issue-photos` bucket and five-minute signed dashboard URLs
- Notification outbox plus an email adapter boundary; no external mail by default
- Vercel-compatible deployment and a narrow service worker that caches no
  records or photographs

Design and security details are in:

- [Product requirements](docs/product-requirements.md)
- [Data model](docs/data-model.md)
- [Operator flow](docs/operator-flow.md)
- [Security model](docs/security-model.md)
- [Implementation plan](docs/implementation-plan.md)
- [Known limitations](docs/known-limitations.md)

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- A Supabase project (or Supabase CLI with Docker for local development)
- A Vercel account for deployment

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Add the values below before signing in.

## Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server | Optional override for the integrated Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server | Optional override for the integrated publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Auth administration and orphan-photo cleanup |
| `NEXT_PUBLIC_APP_URL` | Browser/server | Exact application origin used in QR validation/generation |
| `NEXT_PUBLIC_MAX_IMAGE_BYTES` | Browser | Maximum input bytes; default 12 MiB |
| `NEXT_PUBLIC_IMAGE_TARGET_BYTES` | Browser | Compression target; default ~2 MB |
| `NEXT_PUBLIC_IMAGE_MAX_DIMENSION` | Browser | Long-edge resize; default 2200 px |
| `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM` | Server only | Reserved for a future outbox worker |

Never prefix the service-role key with `NEXT_PUBLIC_`, place it in source
control, or use it in browser code.

The repository includes this deployment's Supabase URL and publishable key as
browser-safe defaults, so Vercel deployments from Git connect automatically.
Setting the corresponding `NEXT_PUBLIC_` variables overrides those defaults.
RLS—not secrecy of the publishable key—is the data-security boundary.

## Supabase setup

### Hosted project

1. Create a Supabase project and copy its URL, anon/publishable key, and
   service-role key into `.env.local`.
2. Install and authenticate the CLI:

   ```bash
   npm install --global supabase
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Apply schema, functions, RLS, private bucket, and Storage policies:

   ```bash
   supabase db push
   ```

4. Seed only synthetic tray/category data:

   ```bash
   psql "$SUPABASE_DB_URL" -f supabase/seed.sql
   ```

   Alternatively paste `supabase/seed.sql` into the hosted SQL editor. Do not
   put the database password in a committed file.

### Local Supabase

```bash
supabase init
supabase start
supabase db reset
```

`supabase db reset` applies files in `supabase/migrations` and then
`supabase/seed.sql`. Copy the local URL, anon key, and service-role key printed
by `supabase status` into `.env.local`.

The migration creates:

- all enums, tables, constraints, and indexes;
- an Auth-user profile trigger;
- authoritative transition functions and optimistic version checks;
- RLS on every exposed table;
- the private `sample-issue-photos` bucket and Storage policies;
- audit and notification outbox records.

### Create synthetic Auth users safely

Do not commit passwords. Create three synthetic email/password users in
Supabase Authentication or from the administrator UI after bootstrapping. The
profile trigger creates each `profiles` row as a process operator.

For the first administrator, create the Auth user in the Supabase dashboard,
then run this once in the SQL editor using the synthetic email:

```sql
update public.profiles
set role = 'administrator'
where id = (select id from auth.users where email = 'YOUR_SYNTHETIC_ADMIN_EMAIL');
```

Create a team viewer and set its role similarly:

```sql
update public.profiles
set role = 'team_viewer'
where id = (select id from auth.users where email = 'YOUR_SYNTHETIC_VIEWER_EMAIL');
```

Leave the operator profile at its default `process_operator` role. The
administrator’s `/dashboard/users` page can then create/deactivate prototype
users using server-only Auth administration. Share temporary credentials only
through an approved secure channel.

## Photograph behaviour

Accepted inputs are JPEG, PNG, and WebP. Large inputs are resized and
re-encoded as JPEG in browser memory; canvas re-encoding removes most
unnecessary metadata. The upload path is generated as:

```text
{tray_id}/{sample_id}/{issue_id}/{timestamp}-{random_uuid}.jpg
```

The app does not intentionally save photographs to localStorage, IndexedDB,
Cache API, an offline queue, or application-controlled phone storage. After
success it clears the file input and releases references. A browser or mobile
OS may temporarily manage a camera file internally; FluxTrack does not claim
control over that platform behaviour.

If issue creation fails after upload, the authenticated cleanup route removes
the unlinked object with a server-only key. Production should additionally run
a scheduled orphan reconciliation job.

## Tray QR code

After setting `NEXT_PUBLIC_APP_URL` to the exact deployed origin, open:

```text
/dashboard/trays/FLUX-TEST-001/qr
```

The page renders an A4 label, readable code and fallback URL, and PNG/SVG
downloads. Its payload is:

```text
https://YOUR_APP_DOMAIN/operator/trays/FLUX-TEST-001
```

The scanner accepts only the configured origin and exact operator tray route.

## Tests and quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Database tests use pgTAP:

```bash
supabase test db
```

For the synthetic end-to-end flow, reset the seed tray, configure a test
operator, and run:

```bash
E2E_OPERATOR_EMAIL='synthetic-operator@example.invalid' \
E2E_OPERATOR_PASSWORD='YOUR_NONCOMMITTED_TEST_PASSWORD' \
npm run test:e2e
```

The Playwright suite covers authentication, receipt, sample 2005, the crumbly
category, photo/issue persistence, return-to-tray, completion/read-only state,
duplicate-action protection, unauthenticated routes, and private Storage.
Database tests verify transition functions and idempotency constraints. Test
fixtures contain no laboratory information.

## Deploy to Vercel

### Vercel CLI

1. Push the project to a private source repository.
2. From the project directory:

   ```bash
   npm install --global vercel
   vercel login
   vercel
   ```

3. Add every variable from `.env.example` in Vercel Project Settings →
   Environment Variables. Set `NEXT_PUBLIC_APP_URL` to the final HTTPS domain.
   Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
4. In Supabase Authentication → URL Configuration, set the Site URL to the
   Vercel domain and add:

   ```text
   https://YOUR_APP_DOMAIN/auth/callback
   ```

5. Deploy the exact configured version:

   ```bash
   vercel --prod
   ```

6. Reprint QR labels after the production domain is final.

### Vercel dashboard

Import the repository, keep the detected framework as Next.js, leave the build
command as `npm run build`, add the same environment variables, and deploy.
Then complete steps 4–6 above.

## Security assumptions

- HTTPS is mandatory outside local development.
- Browser access uses the anon/publishable key and RLS; the service role is used
  only in two server-side administrative paths.
- Role authority comes from `profiles`, never editable Auth user metadata.
- Operators cannot update issues or delete photos/records.
- Team viewers are read-only.
- Administrators’ reopen and void operations require reasons and preserve history.
- Signed URLs are short-lived and omitted from CSV exports.
- The service worker never caches Supabase responses, application APIs, or images.

## Recommended production steps

Complete the [production-readiness checklist](docs/production-readiness-checklist.md),
then prioritise corporate SSO/MFA, scope-based tray permissions, scheduled
Storage reconciliation, outbox delivery/monitoring, approved-device evidence
quality testing, retention automation, backup/restore drills, security testing,
and laboratory quality-system validation.
