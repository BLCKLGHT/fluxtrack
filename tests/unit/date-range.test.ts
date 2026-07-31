import { describe, expect, it } from "vitest";
import { parseDashboardDateRange } from "@/lib/date-range";

const hobartAugustFirst = new Date("2026-07-31T14:30:00.000Z");

describe("dashboard date ranges", () => {
  it("defaults to the current Hobart week", () => {
    const range = parseDashboardDateRange({}, hobartAugustFirst);
    expect(range).toMatchObject({ preset: "week", from: "2026-07-27", to: "2026-08-02" });
  });

  it("uses Monday through Sunday for this week", () => {
    const range = parseDashboardDateRange({ range: "week" }, hobartAugustFirst);
    expect(range).toMatchObject({ from: "2026-07-27", to: "2026-08-02" });
  });

  it("covers the full calendar month", () => {
    const range = parseDashboardDateRange({ range: "month" }, hobartAugustFirst);
    expect(range).toMatchObject({ from: "2026-08-01", to: "2026-08-31" });
  });

  it("turns Hobart dates into precise UTC query boundaries", () => {
    const range = parseDashboardDateRange({ range: "custom", from: "2026-08-01", to: "2026-08-01" }, hobartAugustFirst);
    expect(range.fromUtc).toBe("2026-07-31T14:00:00.000Z");
    expect(range.toExclusiveUtc).toBe("2026-08-01T14:00:00.000Z");
  });

  it("normalises a reversed custom range", () => {
    const range = parseDashboardDateRange({ range: "custom", from: "2026-08-10", to: "2026-08-04" }, hobartAugustFirst);
    expect(range).toMatchObject({ from: "2026-08-04", to: "2026-08-10" });
  });
});
