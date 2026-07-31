import { describe, expect, it } from "vitest";
import { issueSchema, parseTrustedTrayQr, registerSchema, trayCodeSchema } from "@/lib/validation";

describe("tray code validation", () => {
  it("normalises a valid code", () => {
    expect(trayCodeSchema.parse(" flux-test-001 ")).toBe("FLUX-TEST-001");
  });

  it("rejects unsafe characters", () => {
    expect(trayCodeSchema.safeParse("../admin").success).toBe(false);
  });
});

describe("trusted QR parsing", () => {
  it("accepts the exact local tray route", () => {
    expect(parseTrustedTrayQr(
      "https://flux.example/operator/trays/FLUX-TEST-001",
      "https://flux.example",
    )).toBe("FLUX-TEST-001");
  });

  it.each([
    "https://evil.example/operator/trays/FLUX-TEST-001",
    "https://flux.example/dashboard/trays/FLUX-TEST-001",
    "javascript:alert(1)",
    "not a URL",
  ])("rejects an invalid QR payload: %s", (value) => {
    expect(parseTrustedTrayQr(value, "https://flux.example")).toBeNull();
  });
});

describe("issue payload", () => {
  it("rejects unsupported photo types and oversized data", () => {
    const result = issueSchema.safeParse({
      issueId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      trayId: crypto.randomUUID(),
      sampleId: crypto.randomUUID(),
      categoryId: crypto.randomUUID(),
      processingStage: "pressing",
      comment: "",
      photoStoragePath: "valid/enough/path.jpg",
      photoMimeType: "image/gif",
      photoSizeBytes: 20_000_000,
    });
    expect(result.success).toBe(false);
  });
});

describe("registration validation", () => {
  it("accepts a strong matching password", () => {
    expect(registerSchema.safeParse({
      displayName: "Test Operator",
      email: "operator@example.test",
      password: "LongLaboratory9",
      confirmPassword: "LongLaboratory9",
    }).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    expect(registerSchema.safeParse({
      displayName: "Test Operator",
      email: "operator@example.test",
      password: "LongLaboratory9",
      confirmPassword: "DifferentPassword9",
    }).success).toBe(false);
  });
});
