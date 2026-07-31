import { describe, expect, it } from "vitest";
import { buildDemoData } from "@/lib/demo-data";

describe("manager demonstration data", () => {
  it("builds a realistic recurring tray population", () => {
    const demo = buildDemoData();
    expect(demo.templates).toHaveLength(15);
    expect(demo.trays).toHaveLength(30);
    expect(demo.issues.length).toBeGreaterThan(20);
    expect(demo.templates.every((template) => {
      const count = template.tray_template_samples?.length ?? 0;
      return count >= 20 && count <= 25 && template.trays?.length === 2 && template.is_demo;
    })).toBe(true);
  });

  it("marks every synthetic record so it cannot be mistaken for live data", () => {
    const demo = buildDemoData();
    expect(demo.trays.every((tray) => tray.is_demo)).toBe(true);
    expect(demo.issues.every((issue) => issue.is_demo)).toBe(true);
  });
});
