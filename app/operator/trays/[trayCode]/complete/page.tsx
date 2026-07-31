import Link from "next/link";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { CompleteTrayForm } from "@/components/complete-tray-form";
import { getTray } from "@/lib/queries";
import { trayCodeSchema } from "@/lib/validation";

export default async function CompletePage({ params, searchParams }: {
  params: Promise<{ trayCode: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const parsed = trayCodeSchema.parse((await params).trayCode);
  const [tray, query] = await Promise.all([getTray(parsed), searchParams]);
  const samples = tray.samples ?? [];
  const issueSamples = samples.filter((sample) => sample.sample_issues?.some((issue) => issue.status === "active")).length;
  if (query.done === "1" || tray.status === "completed") {
    return (
      <main id="main" className="operator-shell">
        <section className="card mt-10 p-7 text-center">
          <CheckCircle2 className="mx-auto text-[var(--green)]" size={48} aria-hidden />
          <p className="eyebrow mt-5">Tray complete</p><h1 className="page-title mt-3">{tray.tray_code}</h1>
          <p className="muted mt-4">{samples.length} samples · {issueSamples} issue samples</p>
          <Link href="/operator/trays" className="btn btn-primary mt-7 w-full">Return to active trays</Link>
        </section>
      </main>
    );
  }
  return (
    <main id="main" className="operator-shell">
      <Link href={`/operator/trays/${tray.tray_code}`} className="text-sm font-bold text-[var(--green)]">← Back to tray</Link>
      <section className="mt-8">
        <p className="eyebrow">Final check</p><h1 className="page-title mt-3">Complete this tray?</h1>
        <p className="muted mt-4">Review the summary before completing {tray.tray_code}.</p>
        <div className="card mt-6 overflow-hidden">
          {[
            ["Total samples", samples.length],
            ["Samples with issues", issueSamples],
            ["Without recorded issues", samples.length - issueSamples],
          ].map(([label, value]) => <div key={String(label)} className="flex justify-between border-b border-[#e4e9e6] p-4 last:border-0"><span className="muted font-semibold">{label}</span><strong>{value}</strong></div>)}
        </div>
        <div className="notice notice-info mt-5 flex gap-3"><TriangleAlert className="shrink-0" size={21} aria-hidden /><p>Completion marks pending samples as processed and makes this tray read-only for process operators.</p></div>
        <div className="mt-7"><CompleteTrayForm trayId={tray.id} trayCode={tray.tray_code} version={tray.version} /></div>
        <Link href={`/operator/trays/${tray.tray_code}`} className="btn btn-secondary mt-3 w-full">Continue processing</Link>
      </section>
    </main>
  );
}
