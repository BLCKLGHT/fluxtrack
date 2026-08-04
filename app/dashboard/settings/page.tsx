import { Presentation, ShieldCheck } from "lucide-react";
import { setDemoMode } from "@/app/actions/settings";
import { requireProfile } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import { createClient } from "@/lib/supabase/server";
import { emailDeliveryConfigured } from "@/lib/notifications";
import { NotificationDeliveryPanel } from "@/components/notification-delivery-panel";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  await requireProfile(["administrator"]);
  const supabase = await createClient();
  const [demo, query, subscriberResult, queuedResult] = await Promise.all([
    isDemoMode(), searchParams,
    supabase.from("notification_preferences").select("profile_id", { count: "exact", head: true }).eq("issue_email_enabled", true),
    supabase.from("notification_deliveries").select("id", { count: "exact", head: true }).in("status", ["pending", "failed"]),
  ]);
  return <main id="main">
    <p className="eyebrow">Administration</p><h1 className="page-title mt-3">Settings</h1>
    {query.demo && <div className="notice notice-success mt-6">Demo mode turned {query.demo}.</div>}
    <NotificationDeliveryPanel configured={emailDeliveryConfigured()} subscribers={subscriberResult.count ?? 0} queued={queuedResult.count ?? 0} />
    <section className="card mt-7 p-6"><div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-2xl"><div className="flex items-center gap-3"><Presentation className="text-[var(--green)]" /><h2 className="text-xl font-black">Manager demonstration mode</h2></div><p className="muted mt-3">Instantly populate the dashboard with 15 synthetic physical trays, 30 processing runs, cell samples, issues, operators, charts, and history.</p><p className="mt-3 flex items-start gap-2 text-sm font-bold text-[var(--green-dark)]"><ShieldCheck className="mt-0.5 shrink-0" size={18} />Presentation data stays in this browser and is never written to Supabase.</p></div><form action={setDemoMode.bind(null, !demo)} className="flex items-center gap-3"><span className="text-sm font-extrabold">{demo ? "On" : "Off"}</span><button className={`relative h-9 w-16 rounded-full border-2 transition ${demo ? "border-[var(--green)] bg-[var(--green)]" : "border-[#aebbb4] bg-[#dfe5e1]"}`} type="submit" role="switch" aria-checked={demo} aria-label={`${demo ? "Turn off" : "Turn on"} manager demonstration mode`}><span className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow transition-all ${demo ? "left-8" : "left-1"}`} /></button></form></div></section>
  </main>;
}
