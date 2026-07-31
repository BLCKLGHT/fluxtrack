# Production-readiness checklist

This prototype is not approved for live operational data merely because it can
be deployed.

- [ ] Complete internal cybersecurity architecture and penetration review.
- [ ] Integrate corporate identity, MFA, joiner/mover/leaver controls, and SSO.
- [ ] Confirm data classification for records, comments, and photographs.
- [ ] Approve photograph retention, deletion, legal-hold, and export policy.
- [ ] Complete privacy assessment and worker-notice requirements.
- [ ] Test laboratory Wi-Fi, loss/recovery behaviour, latency, and camera uploads.
- [ ] Validate approved phones, browsers, cases, gloves, and lighting conditions.
- [ ] Define backup schedule, point-in-time recovery, RPO/RTO, and restore drills.
- [ ] Configure database, Storage, Auth, error-rate, capacity, and outbox monitoring.
- [ ] Approve audit retention, access, review cadence, and tamper-evidence needs.
- [ ] Document incident response, escalation contacts, and evidence preservation.
- [ ] Assign application, data, infrastructure, and security ownership.
- [ ] Establish support hours, service targets, user help, and administrator cover.
- [ ] Put releases, schema changes, rollbacks, and emergency fixes under change control.
- [ ] Complete representative user acceptance testing with process operators.
- [ ] Validate workflows and records against laboratory quality-system requirements.
- [ ] Load/performance test expected concurrent trays and photograph volumes.
- [ ] Reconcile orphaned Storage objects and validate signed-URL expiry behaviour.
- [ ] Review RLS/storage policies after every schema change with negative tests.
- [ ] Obtain formal approval before entering real laboratory or corporate data.
