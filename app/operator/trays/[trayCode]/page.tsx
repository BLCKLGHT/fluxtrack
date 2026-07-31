import Link from "next/link";
import { CheckCircle2, Clock3, FlaskConical, PackageCheck } from "lucide-react";
import { ReceiveTrayButton } from "@/components/tray-action-button";
import { SampleList } from "@/components/sample-list";
import { TrayStatusBadge } from "@/components/status-badge";
import { getTray } from "@/lib/queries";
import { formatDate, formatDay } from "@/lib/utils";
import { trayCodeSchema } from "@/lib/validation";

export default async function OperatorTrayPage({ params, searchParams }: {
  params: Promise<{ trayCode: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const raw = (await params).trayCode;
  const parsed = trayCodeSchema.safeParse(raw);
  if (!parsed.success) return <main id="main" className="operator-shell"><div className="notice notice-error mt-8">Invalid tray code.</div></main>;
  const [tray, query] = await Promise.all([getTray(parsed.data), searchParams]);
  const samples = tray.samples ?? [];
  const issues = samples.flatMap((sample) => sample.sample_issues ?? []).filter((issue) => issue.status === "active");
  const readOnly = tray.status === "created" || tray.status === "completed";

  return (
    <main id="main" className="operator-shell">
      {query.submitted === "1" && <div className="notice notice-success mt-5" role="status">Issue saved with photographic evidence.</div>}
      <section className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="eyebrow">Processing run {tray.run_number ?? 1}</p><h1 className="page-title mt-2">{tray.tray_code}</h1><p className="muted mt-2 font-semibold">{tray.tray_name} · {tray.source} · {formatDay(tray.processing_date)}</p></div>
          <TrayStatusBadge status={tray.status} />
        </div>
        <div className="card mt-6 grid grid-cols-2 gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-4">
          {[
            [FlaskConical, "Samples", String(samples.length)],
            [PackageCheck, "Issues", String(issues.length)],
            [Clock3, "Received", tray.received_at ? formatDate(tray.received_at) : "Not yet"],
            [CheckCircle2, "Completed", tray.completed_at ? formatDate(tray.completed_at) : "Not yet"],
          ].map(([Icon, label, value]) => {
            const ItemIcon = Icon as typeof FlaskConical;
            return <div key={String(label)} className="bg-white p-4"><ItemIcon size={18} className="text-[var(--green)]" aria-hidden /><p className="muted mt-3 text-xs font-bold uppercase">{String(label)}</p><p className="mt-1 text-sm font-extrabold">{String(value)}</p></div>;
          })}
        </div>
      </section>
      {tray.status === "created" && <div className="mt-6"><ReceiveTrayButton trayId={tray.id} trayCode={tray.tray_code} version={tray.version} /></div>}
      {tray.status === "completed" && <div className="notice notice-info mt-6">This tray is complete and read-only for process operators.</div>}
      {tray.status !== "created" && <div className="mt-9"><SampleList samples={samples} trayCode={tray.tray_code} readOnly={readOnly} /></div>}
      {!readOnly && (
        <div className="sticky bottom-[82px] mt-8 rounded-[20px] border border-[#ccd6d0] bg-white/95 p-3 shadow-[0_-8px_30px_rgba(23,33,29,.10)] backdrop-blur">
          <Link href={`/operator/trays/${tray.tray_code}/complete`} className="btn btn-secondary w-full">Complete Tray</Link>
        </div>
      )}
    </main>
  );
}
