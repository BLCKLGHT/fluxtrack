import { describe, expect, it } from "vitest";
import { DisabledEmailAdapter } from "@/lib/notifications";

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
});
