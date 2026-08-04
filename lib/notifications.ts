import { createClient as createAdminClient } from "@supabase/supabase-js";
import { appUrl, SUPABASE_URL } from "@/lib/config";

export interface NotificationMessage {
  eventId: string;
  eventType: "issue_reported" | "tray_completed" | "tray_reopened";
  recipients: string[];
  subject: string;
  text: string;
  html?: string;
}

export interface EmailAdapter {
  readonly name: string;
  send(message: NotificationMessage): Promise<{ providerMessageId: string }>;
}

export class DisabledEmailAdapter implements EmailAdapter {
  readonly name = "disabled";
  async send(_message: NotificationMessage): Promise<never> {
    void _message;
    throw new Error("Email delivery is not configured. The notification remains pending.");
  }
}

export class ResendEmailAdapter implements EmailAdapter {
  readonly name = "resend";
  constructor(private readonly apiKey: string, private readonly from: string) {}

  async send(message: NotificationMessage) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: this.from, to: message.recipients, subject: message.subject,
        text: message.text, html: message.html,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    const body = await response.json().catch(() => ({})) as { id?: string; message?: string };
    if (!response.ok || !body.id) throw new Error(body.message ?? `Email provider returned ${response.status}`);
    return { providerMessageId: body.id };
  }
}

export function emailDeliveryConfigured() {
  return process.env.EMAIL_PROVIDER?.toLowerCase() === "resend"
    && Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM)
    && Boolean(process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getEmailAdapter(): EmailAdapter {
  if (emailDeliveryConfigured()) return new ResendEmailAdapter(process.env.EMAIL_API_KEY!, process.env.EMAIL_FROM!);
  return new DisabledEmailAdapter();
}

type ClaimedDelivery = {
  id: string;
  outbox_id: string;
  recipient_email: string;
  payload: Record<string, unknown>;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

export function buildIssueNotification(delivery: ClaimedDelivery): NotificationMessage {
  const value = (key: string, fallback = "—") => String(delivery.payload[key] ?? fallback);
  const trayCode = value("tray_code");
  const sampleNumber = value("sample_number");
  const category = value("category_name");
  const link = `${appUrl()}/dashboard/trays/${encodeURIComponent(trayCode)}`;
  const comment = value("comment", "No comment supplied");
  const lines = [
    `A sample was flagged in FluxTrack.`, "", `Tray: ${trayCode}`, `Sample: ${sampleNumber}`,
    `Category: ${category}`, `Stage: ${value("processing_stage")}`, `Ownership: ${value("ownership")}`,
    `Reported by: ${value("reported_by")}`, `Comment: ${comment}`, "", `Review the tray: ${link}`,
  ];
  return {
    eventId: delivery.id,
    eventType: "issue_reported",
    recipients: [delivery.recipient_email],
    subject: `[FluxTrack] Sample ${sampleNumber} flagged on ${trayCode}`,
    text: lines.join("\n"),
    html: `<h2>Sample flagged in FluxTrack</h2><p><strong>Tray:</strong> ${escapeHtml(trayCode)}<br><strong>Sample:</strong> ${escapeHtml(sampleNumber)}<br><strong>Category:</strong> ${escapeHtml(category)}<br><strong>Stage:</strong> ${escapeHtml(value("processing_stage"))}<br><strong>Ownership:</strong> ${escapeHtml(value("ownership"))}<br><strong>Reported by:</strong> ${escapeHtml(value("reported_by"))}</p><p><strong>Comment:</strong> ${escapeHtml(comment)}</p><p><a href="${escapeHtml(link)}">Review this tray in FluxTrack</a></p>`,
  };
}

export async function deliverPendingNotifications(limit = 20) {
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!emailDeliveryConfigured() || !serviceKey) return { configured: false, sent: 0, failed: 0 };
  const admin = createAdminClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc("claim_notification_deliveries", { p_limit: limit });
  if (error) throw new Error(`Unable to claim notifications: ${error.message}`);
  const deliveries = (data ?? []) as ClaimedDelivery[];
  const adapter = getEmailAdapter();
  let sent = 0;
  let failed = 0;
  const outboxIds = new Set<string>();

  for (const delivery of deliveries) {
    outboxIds.add(delivery.outbox_id);
    try {
      const result = await adapter.send(buildIssueNotification(delivery));
      await admin.from("notification_deliveries").update({
        status: "sent", processed_at: new Date().toISOString(), provider_message_id: result.providerMessageId,
      }).eq("id", delivery.id);
      sent += 1;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message.slice(0, 1000) : "Email delivery failed";
      await admin.from("notification_deliveries").update({
        status: "failed", last_error: message,
        available_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      }).eq("id", delivery.id);
      failed += 1;
    }
  }

  for (const outboxId of outboxIds) {
    const { data: remaining } = await admin.from("notification_deliveries").select("status").eq("outbox_id", outboxId);
    const statuses = remaining?.map((item) => item.status) ?? [];
    const complete = statuses.length > 0 && statuses.every((status) => status === "sent");
    await admin.from("notification_outbox").update({
      status: complete ? "sent" : "failed", processed_at: complete ? new Date().toISOString() : null,
      last_error: complete ? null : "One or more recipient deliveries are pending retry",
    }).eq("id", outboxId);
  }
  return { configured: true, claimed: deliveries.length, sent, failed };
}
