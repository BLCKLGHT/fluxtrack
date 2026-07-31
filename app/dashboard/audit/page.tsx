import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function AuditPage() {
  await requireProfile(["administrator"]);
  const supabase = await createClient();
  const { data } = await supabase.from("audit_events").select("*, profiles:profiles!audit_events_actor_id_fkey(display_name)").order("occurred_at", { ascending: false }).limit(500);
  return (
    <main id="main">
      <p className="eyebrow">Traceability</p><h1 className="page-title mt-3">Audit records</h1>
      <p className="muted mt-3">Append-only operational and administrator events. Showing the latest 500 records.</p>
      <div className="table-wrap mt-7">
        <table className="data-table"><thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>Actor</th><th>Reason</th></tr></thead>
          <tbody>{(data ?? []).map((event) => <tr key={event.id}><td>{formatDate(event.occurred_at)}</td><td><strong>{event.action.replaceAll("_", " ")}</strong></td><td>{event.entity_type}<br /><span className="font-mono text-xs">{event.entity_id}</span></td><td>{event.profiles?.display_name ?? "System"}</td><td>{event.reason ?? "—"}</td></tr>)}</tbody>
        </table>
      </div>
    </main>
  );
}
