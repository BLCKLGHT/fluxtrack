export const IMAGE_CONFIG = {
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  maxInputBytes: Number(process.env.NEXT_PUBLIC_MAX_IMAGE_BYTES ?? 12 * 1024 * 1024),
  targetBytes: Number(process.env.NEXT_PUBLIC_IMAGE_TARGET_BYTES ?? 2_000_000),
  maxDimension: Number(process.env.NEXT_PUBLIC_IMAGE_MAX_DIMENSION ?? 2200),
  outputQuality: 0.86,
} as const;

export const APP_NAME = "FluxTrack";
export const PHOTO_BUCKET = "sample-issue-photos";

// Supabase publishable project settings are intentionally safe to ship to the
// browser. Environment variables override these defaults for preview, test, or
// future project migrations. RLS remains the security boundary.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://hbekdzqwjvrwxzoqezon.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_RQLrySsEg8tJyU-VmWVuQA_aTLcoR4u";

export function hasSupabaseEnv() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export function appUrl() {
  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}
