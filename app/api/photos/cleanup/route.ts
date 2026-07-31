import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PHOTO_BUCKET } from "@/lib/config";
import { z } from "zod";

const bodySchema = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[A-Za-z0-9-]+\.jpg$/),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: linked } = await userClient
    .from("sample_issues")
    .select("id")
    .eq("photo_storage_path", parsed.data.path)
    .maybeSingle();
  if (linked) return NextResponse.json({ error: "Linked photographs cannot be deleted." }, { status: 409 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Orphan cleanup unavailable: server credentials are not configured.");
    return NextResponse.json({ queued: false }, { status: 503 });
  }
  const admin = createAdminClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.storage.from(PHOTO_BUCKET).remove([parsed.data.path]);
  if (error) return NextResponse.json({ error: "Cleanup failed." }, { status: 500 });
  return NextResponse.json({ removed: true });
}
