import { z } from "zod";

export const trayCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{3,40}$/, "Enter a valid tray code.");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
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

export function parseTrustedTrayQr(raw: string, expectedOrigin: string): string | null {
  try {
    const url = new URL(raw);
    if (url.origin !== expectedOrigin) return null;
    const match = url.pathname.match(/^\/operator\/trays\/([A-Z0-9-]{3,40})\/?$/i);
    if (!match?.[1]) return null;
    return trayCodeSchema.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}
