# Known prototype limitations

- Corporate SSO, MFA enforcement, automated user lifecycle, and password-reset
  policy are not configured; the Auth boundary is designed for a later provider.
- Tray access is role-wide in the prototype. Site, laboratory, shift, or
  assignment-level access rules require an additional membership model.
- Photographs are client-resized through browser canvas. Evidence quality and
  metadata stripping must be validated on approved devices and defect types.
- Failed post-upload issue creation calls an authenticated server cleanup route.
  Production should also run a scheduled reconciliation job for unlinked objects.
- Notification outbox events are created, but no worker, recipient registry, or
  email provider is enabled.
- The dashboard charts are operational summaries, not a validated statistical
  process-control system.
- Administrator user creation uses a temporary password for prototype setup.
  Production should use corporate identity provisioning or a secure invitation
  and forced-reset flow.
- Category management in this build supports activation/deactivation while
  preserving history. Rich editing should add effective dating and approval.
- Service-worker support caches only the offline fallback and manifest; the
  application deliberately does not provide offline record or photo submission.
- Database and end-to-end tests require a configured local Supabase instance and
  synthetic test accounts; they do not run against a production project.
- Retention, legal hold, export governance, backup recovery targets, monitoring,
  and support ownership remain organisational decisions.
