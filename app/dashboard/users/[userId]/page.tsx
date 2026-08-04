import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UserAccessForm } from "@/components/user-access-form";
import { ROLE_LABELS, type Profile } from "@/lib/domain";
import { formatDate } from "@/lib/utils";

export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireProfile(["administrator"]);
  const { userId } = await params;
  const supabase = await createClient();
  const [{ data }, { data: deliveries }] = await Promise.all([
    supabase.from("profiles").select("*, notification_preferences(issue_email_enabled)").eq("id", userId).single(),
    supabase.from("notification_deliveries").select("id, status, attempts, created_at, processed_at, last_error, payload").eq("recipient_profile_id", userId).order("created_at", { ascending: false }).limit(20),
  ]);
  if (!data) notFound();
  const profile = data as unknown as Profile & { created_at: string };
  return <main id="main">
    <Link href="/dashboard/users" className="text-sm font-bold text-[var(--green)]">← Users</Link>
    <div className="mt-6"><p className="eyebrow">User account</p><h1 className="page-title mt-3">{profile.display_name}</h1><p className="muted mt-2">{profile.email} · {ROLE_LABELS[profile.role]} · created {formatDate(profile.created_at)}</p></div>
    <UserAccessForm profile={profile} />
    <section className="card mt-7 p-6"><h2 className="text-xl font-black">Recent email notifications</h2><p className="muted mt-2 text-sm">Recipient-level delivery records are retained for operational troubleshooting.</p>
      {(deliveries ?? []).length ? <div className="table-wrap mt-5"><table className="data-table"><thead><tr><th>Created</th><th>Tray</th><th>Sample</th><th>Status</th><th>Attempts</th><th>Result</th></tr></thead><tbody>{(deliveries ?? []).map((delivery) => { const payload = delivery.payload as Record<string, string>; return <tr key={delivery.id}><td>{formatDate(delivery.created_at)}</td><td>{payload.tray_code}</td><td>{payload.sample_number}</td><td>{delivery.status}</td><td>{delivery.attempts}</td><td>{delivery.last_error ?? (delivery.processed_at ? `Sent ${formatDate(delivery.processed_at)}` : "Queued")}</td></tr>; })}</tbody></table></div> : <p className="muted mt-5 text-sm font-bold">No notifications have been queued for this user.</p>}
    </section>
  </main>;
}
