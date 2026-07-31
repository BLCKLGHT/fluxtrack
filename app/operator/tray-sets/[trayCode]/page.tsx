import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, FlaskConical, History } from "lucide-react";
import { StartTrayRunButton } from "@/components/start-tray-run-button";
import { getOpenRunForPhysicalTray, getTrayTemplate } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { trayCodeSchema } from "@/lib/validation";

export default async function PhysicalTrayPage({ params }: { params: Promise<{ trayCode: string }> }) {
  const code = trayCodeSchema.parse((await params).trayCode);
  const open = await getOpenRunForPhysicalTray(code);
  if (open) redirect(`/operator/trays/${open.tray_code}`);
  const template = await getTrayTemplate(code);
  const runs = template.trays ?? [];
  const lastCompleted = runs.find((run) => run.status === "completed");
  return (
    <main id="main" className="operator-shell">
      <Link href="/operator/tray-sets" className="mt-6 inline-block text-sm font-bold text-[var(--green)]">← Physical trays</Link>
      <section className="mt-5"><p className="eyebrow">Physical tray</p><h1 className="page-title mt-2">{template.tray_code}</h1><p className="muted mt-2 font-semibold">{template.tray_name} · {template.source}</p></section>
      <div className="card mt-6 grid grid-cols-3 gap-px overflow-hidden bg-[var(--line)]">
        <div className="bg-white p-4"><FlaskConical size={18} className="text-[var(--green)]" /><p className="muted mt-3 text-xs font-bold uppercase">Cells</p><p className="mt-1 font-extrabold">{template.tray_template_samples?.length ?? 0}</p></div>
        <div className="bg-white p-4"><History size={18} className="text-[var(--green)]" /><p className="muted mt-3 text-xs font-bold uppercase">Runs</p><p className="mt-1 font-extrabold">{runs.length}</p></div>
        <div className="bg-white p-4"><CalendarDays size={18} className="text-[var(--green)]" /><p className="muted mt-3 text-xs font-bold uppercase">Last done</p><p className="mt-1 text-sm font-extrabold">{lastCompleted ? formatDate(lastCompleted.completed_at) : "Not yet"}</p></div>
      </div>
      <div className="card mt-6 p-5"><h2 className="font-black">Ready for the next processing day</h2><p className="muted mt-2 text-sm">Starting creates a fresh copy of all {template.tray_template_samples?.length ?? 0} cells. Previous results stay in history.</p><div className="mt-5"><StartTrayRunButton templateId={template.id} /></div></div>
    </main>
  );
}
