import Link from "next/link";
import { QrCode } from "lucide-react";
import { PhotoViewer } from "@/components/photo-viewer";
import { ReopenForm } from "@/components/reopen-form";
import { TrayStatusBadge } from "@/components/status-badge";
import { requireProfile } from "@/lib/auth";
import { PHOTO_BUCKET } from "@/lib/config";
import { STAGE_LABELS } from "@/lib/domain";
import { getAuditForEntity, getTray } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { trayCodeSchema } from "@/lib/validation";
import { VoidIssueForm } from "@/components/void-issue-form";
import { isDemoMode } from "@/lib/demo-mode";

export default async function TrayDetailPage({ params }: { params: Promise<{ trayCode: string }> }) {
  const trayCode = trayCodeSchema.parse((await params).trayCode);
  const [profile, demo] = await Promise.all([requireProfile(["team_viewer", "administrator"]), isDemoMode()]);
  const tray = await getTray(trayCode, demo);
  const issues = (tray.samples ?? []).flatMap((sample) => (sample.sample_issues ?? []).map((issue) => ({ ...issue, sample })));
  const supabase = await createClient();
  const signed = new Map<string, string>();
  await Promise.all(issues.filter((issue) => issue.photo_storage_path).map(async (issue) => {
    const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(issue.photo_storage_path, 300);
    if (data?.signedUrl) signed.set(issue.id, data.signedUrl);
  }));
  const audit = profile.role === "administrator" ? await getAuditForEntity(tray.id) : [];
  const timeline = [
    ["Created", tray.created_at],
    ["Received", tray.received_at],
    ["Reopened", tray.reopened_at],
    ["Completed", tray.completed_at],
  ].filter(([, value]) => value);

  return (
    <main id="main">
      <Link href="/dashboard/trays" className="text-sm font-bold text-[var(--green)]">← All trays</Link>
      <div className="mt-7 flex flex-wrap items-start justify-between gap-5">
        <div><p className="eyebrow">Tray record</p><h1 className="page-title mt-3">{tray.tray_code}</h1><p className="muted mt-3">{tray.tray_name} · {tray.source}</p></div>
        <div className="flex flex-wrap items-center gap-3"><TrayStatusBadge status={tray.status} />{tray.tray_templates?.tray_code && !tray.is_demo && <Link href={`/dashboard/tray-sets/${tray.tray_templates.tray_code}/qr`} className="btn btn-secondary"><QrCode size={18} aria-hidden />Permanent QR</Link>}</div>
      </div>
      <section className="card mt-7 p-6">
        <h2 className="font-extrabold">Lifecycle</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-4">
          {timeline.map(([label, value]) => <li key={label} className="border-l-2 border-[var(--green)] pl-4"><p className="text-sm font-extrabold">{label}</p><p className="muted mt-1 text-xs">{formatDate(value)}</p></li>)}
        </ol>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-black">Samples and evidence</h2>
        <div className="mt-4 grid gap-4">
          {(tray.samples ?? []).map((sample) => (
            <article className="card p-5" key={sample.id}>
              <div className="flex items-center justify-between"><h3 className="text-xl font-black">Sample {sample.sample_number}</h3><span className={`status status-${sample.status}`}>{sample.status.replaceAll("_", " ")}</span></div>
              {(sample.sample_issues ?? []).length ? (
                <div className="mt-5 grid gap-4">
                  {(sample.sample_issues ?? []).map((issue) => (
                    <div className="grid gap-4 border-t border-[#e1e7e3] pt-4 md:grid-cols-[1fr_auto]" key={issue.id}>
                      <dl className="grid gap-3 text-sm sm:grid-cols-3">
                        <div><dt className="muted text-xs font-bold uppercase">Category</dt><dd className="mt-1 font-bold">{issue.issue_categories?.name}</dd></div>
                        <div><dt className="muted text-xs font-bold uppercase">Stage</dt><dd className="mt-1">{STAGE_LABELS[issue.processing_stage]}</dd></div>
                        <div><dt className="muted text-xs font-bold uppercase">Ownership</dt><dd className="mt-1">{issue.ownership_snapshot}</dd></div>
                        <div><dt className="muted text-xs font-bold uppercase">Reported by</dt><dd className="mt-1">{issue.profiles?.display_name}</dd></div>
                        <div><dt className="muted text-xs font-bold uppercase">Reported</dt><dd className="mt-1">{formatDate(issue.reported_at)}</dd></div>
                        <div><dt className="muted text-xs font-bold uppercase">Status</dt><dd className="mt-1">{issue.status}</dd></div>
                        {issue.comment && <div className="sm:col-span-3"><dt className="muted text-xs font-bold uppercase">Comment</dt><dd className="mt-1">{issue.comment}</dd></div>}
                      </dl>
                      {issue.is_demo ? <div className="notice notice-info text-sm">Demonstration photograph recorded</div> : signed.get(issue.id) ? <PhotoViewer url={signed.get(issue.id)!} alt={`Evidence for sample ${sample.sample_number}, ${issue.issue_categories?.name}`} /> : <div className="notice notice-error text-sm">Photo unavailable</div>}
                      {profile.role === "administrator" && issue.status === "active" && !issue.is_demo && <div className="md:col-span-2"><VoidIssueForm issueId={issue.id} trayCode={tray.tray_code} /></div>}
                    </div>
                  ))}
                </div>
              ) : <p className="muted mt-3 text-sm">No issue records.</p>}
            </article>
          ))}
        </div>
      </section>
      {profile.role === "administrator" && (
        <section className="mt-8">
          {tray.status === "completed" && !tray.is_demo && <ReopenForm trayId={tray.id} trayCode={tray.tray_code} />}
          <div className="card mt-5 p-5"><h2 className="font-extrabold">Audit history</h2>{audit.length ? <ol className="mt-4 space-y-3">{audit.map((event) => <li key={event.id} className="border-l-2 border-[#cad4ce] pl-4 text-sm"><strong>{event.action.replaceAll("_", " ")}</strong><p className="muted mt-1">{formatDate(event.occurred_at)} · {event.profiles?.display_name ?? "System"}</p>{event.reason && <p className="mt-1">{event.reason}</p>}</li>)}</ol> : <p className="muted mt-3 text-sm">No audit events visible.</p>}</div>
        </section>
      )}
    </main>
  );
}
