import Link from "next/link";
import { QrCode } from "lucide-react";
import { TrayStatusBadge } from "@/components/status-badge";
import { getTrayTemplate } from "@/lib/queries";
import { formatDate, formatDay } from "@/lib/utils";
import { trayCodeSchema } from "@/lib/validation";
import { isDemoMode } from "@/lib/demo-mode";

export default async function TrayHistoryPage({ params }: { params: Promise<{ trayCode: string }> }) {
  const code = trayCodeSchema.parse((await params).trayCode);
  const template = await getTrayTemplate(code, await isDemoMode());
  const runs = template.trays ?? [];
  return <main id="main">
    <Link href="/dashboard/workflow" className="text-sm font-bold text-[var(--green)]">← Tray workflow</Link>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Physical tray history</p><h1 className="page-title mt-3">{template.tray_code}</h1><p className="muted mt-2">{template.tray_name} · {template.source} · {template.tray_template_samples?.length ?? 0} cells</p></div>{!template.is_demo && <Link href={`/dashboard/tray-sets/${template.tray_code}/qr`} className="btn btn-secondary"><QrCode size={18} />Permanent QR</Link>}</div>
    <div className="table-wrap mt-7"><table className="data-table"><thead><tr><th>Run</th><th>Processing date</th><th>Status</th><th>Received</th><th>Completed</th><th>Samples</th><th>Issues</th><th></th></tr></thead><tbody>{runs.map((run) => {
      const samples = run.samples ?? []; const issues = samples.flatMap((sample) => sample.sample_issues ?? []).filter((issue) => issue.status === "active");
      return <tr key={run.id}><td><strong>Run {run.run_number ?? 1}</strong><br/><span className="muted text-xs">{run.tray_code}</span></td><td>{formatDay(run.processing_date)}</td><td><TrayStatusBadge status={run.status} /></td><td>{formatDate(run.received_at)}</td><td>{formatDate(run.completed_at)}</td><td>{samples.length}</td><td>{issues.length}</td><td><Link className="font-bold text-[var(--green)]" href={`/dashboard/trays/${run.tray_code}`}>Review</Link></td></tr>;
    })}</tbody></table></div>
    {!runs.length && <div className="card mt-7 p-8 text-center font-bold">No processing runs yet. The first operator scan can start one.</div>}
  </main>;
}
