import Link from "next/link";
import { ChevronRight, PlayCircle } from "lucide-react";
import { getTrayTemplates } from "@/lib/queries";
import { TrayStatusBadge } from "@/components/status-badge";

const OPEN = new Set(["created", "received", "in_progress", "reopened"]);

export default async function PhysicalTraysPage() {
  const templates = (await getTrayTemplates()).filter((item) => item.active);
  return (
    <main id="main" className="operator-shell">
      <p className="eyebrow mt-8">Recurring workflow</p><h1 className="page-title mt-3">Physical trays</h1>
      <p className="muted mt-3">Choose the tray in front of you. FluxTrack will resume its open run or start a new dated run.</p>
      <div className="mt-7 grid gap-3">
        {templates.map((template) => {
          const open = template.trays?.find((run) => OPEN.has(run.status));
          return <Link key={template.id} href={`/operator/tray-sets/${template.tray_code}`} className="card flex min-h-[104px] items-center justify-between gap-4 p-5 text-inherit no-underline">
            <div><p className="text-xl font-black">{template.tray_code}</p><p className="muted mt-1 text-sm">{template.tray_name} · {template.tray_template_samples?.length ?? 0} cells</p><div className="mt-3">{open ? <TrayStatusBadge status={open.status} /> : <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--green)]"><PlayCircle size={16} />Ready for next run</span>}</div></div>
            <ChevronRight aria-hidden />
          </Link>;
        })}
        {!templates.length && <div className="card p-8 text-center"><p className="font-bold">No physical trays configured</p><p className="muted mt-2 text-sm">An administrator can add them in the dashboard.</p></div>}
      </div>
    </main>
  );
}
