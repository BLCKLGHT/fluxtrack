# Data model

## Core entities

- `profiles` extends `auth.users` with display name, email, authoritative role,
  and active state. Users cannot update their own role.
- `trays` stores lifecycle timestamps/actors and an integer `version` used for
  optimistic concurrency.
- `samples` belongs to a tray and has a unique tray/sample-number pair. Its
  status is pending, issue reported, or processed.
- `issue_categories` is ordered, active/inactive configuration with stage,
  ownership, and comment requirements.
- `sample_issues` is append-only for operators and supports multiple issues per
  sample. It snapshots ownership and stores private object metadata plus a
  unique client idempotency key.
- `audit_events` is an append-only record of state transitions and administrator
  actions.
- `notification_outbox` records future delivery work for issue, completion, and
  reopen events without sending email in this prototype.

## State model

Tray transitions are `created → received → in_progress → completed`, with
administrator-only `completed → reopened`. A reopened tray returns to
`in_progress` on the next issue and may be completed again. Receiving,
completion, reopening, issue creation, and voiding are executed by security
definer database functions that derive identity, role, timestamps, ownership,
and status.

Samples begin `pending`. Creating an active issue sets the sample to
`issue_reported`. Completion changes only pending samples to `processed`;
issue-reporting samples remain visibly exceptional.

## Integrity and concurrency

- Foreign keys preserve tray/sample/category/profile relationships.
- Issue creation checks that the sample belongs to the tray.
- The idempotency key is globally unique and repeated requests return the same
  issue rather than creating a duplicate.
- State-transition functions compare an expected tray version when supplied,
  lock the tray row, and increment `version`.
- Operators cannot directly update operational records.
- Voiding preserves the issue and requires an administrator reason.

## Storage relationship

Private objects use
`{tray_id}/{sample_id}/{issue_id}/{generated-name}.jpg`. Storage policies verify
authentication and role; application access is through short-lived signed URLs.
The database issue row contains the exact storage path, MIME type, and byte size.

## Index strategy

Indexes support tray code/status, sample number and tray membership, reported
time, category, ownership, issue status, audit entity lookup, and pending outbox
processing. Dashboard queries aggregate active issue records only by default.

