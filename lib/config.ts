export const IMAGE_CONFIG = {
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  maxInputBytes: Number(process.env.NEXT_PUBLIC_MAX_IMAGE_BYTES ?? 12 * 1024 * 1024),
  targetBytes: Number(process.env.NEXT_PUBLIC_IMAGE_TARGET_BYTES ?? 2_000_000),
  maxDimension: Number(process.env.NEXT_PUBLIC_IMAGE_MAX_DIMENSION ?? 2200),
  outputQuality: 0.86,
} as const;

export const APP_NAME = "FluxTrack";
export const PHOTO_BUCKET = "sample-issue-photos";

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
