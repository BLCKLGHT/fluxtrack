import { z } from "zod";

export const trayCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{3,40}$/, "Enter a valid tray code.");

export const physicalTrayCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{3,35}$/, "Enter a physical tray code of 3 to 35 letters, numbers, or hyphens.");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, "Enter your name.").max(120),
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .regex(/[a-z]/, "Include a lowercase letter.")
      .regex(/[A-Z]/, "Include an uppercase letter.")
      .regex(/[0-9]/, "Include a number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const issueSchema = z
  .object({
    issueId: z.string().uuid(),
    idempotencyKey: z.string().uuid(),
    trayId: z.string().uuid(),
    sampleId: z.string().uuid(),
    categoryId: z.string().uuid(),
    processingStage: z.enum(["pressing", "xray_analysis", "other"]),
    comment: z.string().trim().max(2000).optional(),
    photoStoragePath: z.string().min(10).max(500),
    photoMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    photoSizeBytes: z.number().int().positive().max(12 * 1024 * 1024),
  })
  .strict();

export const reasonSchema = z.string().trim().min(5).max(1000);

export type TrustedFluxQr = { kind: "template" | "run"; code: string };

export function parseTrustedFluxQr(raw: string, expectedOrigin: string): TrustedFluxQr | null {
  try {
    const url = new URL(raw);
    if (url.origin !== expectedOrigin) return null;
    const template = url.pathname.match(/^\/operator\/tray-sets\/([A-Z0-9-]{3,40})\/?$/i);
    if (template?.[1]) return { kind: "template", code: trayCodeSchema.parse(decodeURIComponent(template[1])) };
    const run = url.pathname.match(/^\/operator\/trays\/([A-Z0-9-]{3,40})\/?$/i);
    if (run?.[1]) return { kind: "run", code: trayCodeSchema.parse(decodeURIComponent(run[1])) };
    return null;
  } catch {
    return null;
  }
}

export function parseTrustedTrayQr(raw: string, expectedOrigin: string): string | null {
  return parseTrustedFluxQr(raw, expectedOrigin)?.code ?? null;
}

export function parseSampleNumbers(input: string): string[] {
  const values: string[] = [];
  for (const token of input.split(/[\s,]+/).map((value) => value.trim()).filter(Boolean)) {
    const range = token.match(/^(\d+)-(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (end < start || end - start > 49) throw new Error("Each sample range must increase and contain no more than 50 samples.");
      for (let number = start; number <= end; number += 1) values.push(String(number));
    } else if (/^[A-Za-z0-9-]{1,40}$/.test(token)) {
      values.push(token.toUpperCase());
    } else {
      throw new Error(`Invalid sample number: ${token}`);
    }
  }
  if (!values.length || values.length > 50) throw new Error("Provide between 1 and 50 sample numbers.");
  if (new Set(values).size !== values.length) throw new Error("Sample numbers must be unique.");
  return values;
}
