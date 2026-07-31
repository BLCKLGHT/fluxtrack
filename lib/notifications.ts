export interface NotificationMessage {
  eventId: string;
  eventType: "issue_reported" | "tray_completed" | "tray_reopened";
  recipients: string[];
  subject: string;
  text: string;
}

export interface EmailAdapter {
  readonly name: string;
  send(message: NotificationMessage): Promise<{ providerMessageId: string }>;
}

export class DisabledEmailAdapter implements EmailAdapter {
  readonly name = "disabled";
  async send(_message: NotificationMessage): Promise<never> {
    void _message;
    throw new Error("Email delivery is not configured. The outbox event remains pending.");
  }
}

// A future worker should claim notification_outbox rows with SKIP LOCKED, resolve
// recipients from server-side configuration, send through an EmailAdapter, and
// update attempts/status. No recipient addresses belong in the browser bundle.
