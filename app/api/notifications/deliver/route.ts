import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deliverPendingNotifications } from "@/lib/notifications";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("active").eq("id", data.claims.sub).eq("active", true).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Active account required." }, { status: 403 });
  try {
    return NextResponse.json(await deliverPendingNotifications(20));
  } catch (error) {
    console.error("Notification delivery failed", error);
    return NextResponse.json({ error: "Notification delivery is temporarily unavailable." }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }
  try {
    return NextResponse.json(await deliverPendingNotifications(100));
  } catch (error) {
    console.error("Scheduled notification delivery failed", error);
    return NextResponse.json({ error: "Notification delivery is temporarily unavailable." }, { status: 503 });
  }
}
