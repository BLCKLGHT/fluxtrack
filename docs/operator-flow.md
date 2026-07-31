# Operator flow

## Navigation

The phone navigation exposes Scan, Active trays, Completed trays, and Account.
Primary workflow actions remain visible in the page rather than being placed in
menus.

## Receive a tray

Opening `/operator/trays/FLUX-TEST-001` shows identity, range, state, totals, and
timestamps. A created tray presents one dominant **Log Tray Received** action.
The server validates the state, records the current operator and database time,
adds an audit event, and returns the updated version.

## Report an issue

The operator taps a large sample row. The report page keeps
`Reporting issue for sample {number}` prominent, then asks for stage and category
using large labelled controls. Comment is optional unless the chosen category
requires it.

Selecting **Take Photo and Submit Issue** opens a rear-camera-preferred image
input. Selection immediately:

1. validates format and input size;
2. resizes and re-encodes large images in memory;
3. reserves a client UUID and uploads to a private generated path;
4. calls the idempotent issue database function;
5. removes the uploaded object if database creation fails;
6. clears all file and preview references on success and returns to the tray.

Controls are disabled throughout. Network and upload failures keep the selected
stage/category/comment in React memory and show a retry message, but never claim
success or create a partial issue.

## Complete a tray

The persistent completion action opens a confirmation summary. Confirmation
states that the tray becomes read-only and provides **Yes, complete tray** and
**Continue processing**. The database operation marks pending samples processed,
completes the tray, audits the action, and enqueues notification work atomically.

## Error prevention

- QR parsing accepts only this application's origin and exact operator tray path.
- Issue routes resolve both tray and sample; every camera action repeats the
  sample number.
- Created and completed tray states block issue submission in UI and database.
- Button locking plus database idempotency protects against double taps.
- Version checks and row locks protect concurrent transitions.
- Offline UI states clearly require reconnection; photos are never queued.

