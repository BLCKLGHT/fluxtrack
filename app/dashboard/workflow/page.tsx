import Link from "next/link";
import { ArrowRight, CirclePlay, Plus } from "lucide-react";
import { CreateTrayForm } from "@/components/admin-forms";
import { TrayStatusBadge } from "@/components/status-badge";
import { requireProfile } from "@/lib/auth";
import { getTrayTemplates } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

const OPEN = new Set(["created", "received", "in_progress", "reopened"]);

export default async function WorkflowPage() {
  const [templates, profile] = await Promise.all([getTrayTemplates(), requireProfile(["team_viewer", "administrator"])]);
  return (
    <main id="main">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Recurring rounds</p><h1 className="page-title mt-3">Tray workflow</h1><p className="muted mt-3 max-w-2xl">Physical trays are reused. Each processing day creates a new run while previous runs stay available for review.</p></div><Link href="/dashboard/labels" className="btn btn-secondary">Print QR labels</Link></div>
      {profile.role === "administrator" && <CreateTrayForm />}
      <p className="muted my-5 text-sm font-bold">{templates.length} physical {templates.length === 1 ? "tray" : "trays"}</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const runs = template.trays ?? [];
          const open = runs.find((run) => OPEN.has(run.status));
          const completed = runs.find((run) => run.status === "completed");
          return <article className="card flex flex-col p-5" key={template.id}>
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-black tracking-[-.04em]">{template.tray_code}</h2><p className="muted mt-1 text-sm">{template.tray_name} · {template.source}</p></div>{open ? <TrayStatusBadge status={open.status} /> : <span className="rounded-full bg-[#e7f4ed] px-3 py-1 text-xs font-extrabold text-[var(--green)]">Ready</span>}</div>
            <dl className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-[#f3f6f4] p-4 text-sm"><div><dt className="muted text-xs font-bold uppercase">Cells</dt><dd className="mt-1 font-extrabold">{template.tray_template_samples?.length ?? 0}</dd></div><div><dt className="muted text-xs font-bold uppercase">Runs</dt><dd className="mt-1 font-extrabold">{runs.length}</dd></div><div><dt className="muted text-xs font-bold uppercase">Last done</dt><dd className="mt-1 font-extrabold">{completed ? formatDate(completed.completed_at) : "—"}</dd></div></dl>
            {open ? <p className="mt-4 flex items-center gap-2 text-sm font-bold"><CirclePlay size={17} className="text-[var(--green)]" />Run {open.run_number} is open</p> : <p className="muted mt-4 flex items-center gap-2 text-sm"><Plus size={17} />Next scan can start a run</p>}
            <Link className="btn btn-secondary mt-auto pt-5" href={`/dashboard/tray-sets/${template.tray_code}`}>Review history <ArrowRight size={18} /></Link>
          </article>;
        })}
      </div>
    </main>
  );
}
