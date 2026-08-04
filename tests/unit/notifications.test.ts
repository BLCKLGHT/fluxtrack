import { describe, expect, it } from "vitest";
import { buildIssueNotification, DisabledEmailAdapter } from "@/lib/notifications";

describe("notification adapter", () => {
  it("does not silently send when email is unconfigured", async () => {
    const adapter = new DisabledEmailAdapter();
    await expect(adapter.send({
      eventId: crypto.randomUUID(),
      eventType: "issue_reported",
      recipients: [],
      subject: "Synthetic test",
      text: "Synthetic test",
    })).rejects.toThrow(/not configured/i);
  });

  it("builds a useful flagged-sample message and escapes database text", () => {
    const message = buildIssueNotification({
      id: crypto.randomUUID(),
      outbox_id: crypto.randomUUID(),
      recipient_email: "manager@example.invalid",
      payload: {
        tray_code: "TRAY-15",
        sample_number: "2005",
        category_name: "Crumbly <urgent>",
        processing_stage: "Cell extraction",
        ownership: "Potroom",
        reported_by: "Synthetic Operator",
        comment: "Review & isolate",
      },
    });

    expect(message.recipients).toEqual(["manager@example.invalid"]);
    expect(message.subject).toContain("2005");
    expect(message.text).toContain("TRAY-15");
    expect(message.html).toContain("Crumbly &lt;urgent&gt;");
    expect(message.html).toContain("Review &amp; isolate");
  });
});
