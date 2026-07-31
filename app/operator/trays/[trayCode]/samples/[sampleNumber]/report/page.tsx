import Link from "next/link";
import { redirect } from "next/navigation";
import { IssueReportForm } from "@/components/issue-report-form";
import { getCategories, getTray } from "@/lib/queries";
import { trayCodeSchema } from "@/lib/validation";

export default async function ReportIssuePage({ params }: {
  params: Promise<{ trayCode: string; sampleNumber: string }>;
}) {
  const { trayCode: rawCode, sampleNumber } = await params;
  const trayCode = trayCodeSchema.parse(rawCode);
  const [tray, categories] = await Promise.all([getTray(trayCode), getCategories()]);
  if (!["received", "in_progress", "reopened"].includes(tray.status)) redirect(`/operator/trays/${trayCode}`);
  const sample = tray.samples?.find((item) => item.sample_number === sampleNumber);
  if (!sample) redirect(`/operator/trays/${trayCode}?error=sample`);
  return (
    <main id="main" className="operator-shell">
      <Link href={`/operator/trays/${trayCode}`} className="text-sm font-bold text-[var(--green)]">← Back to tray {trayCode}</Link>
      <div className="mt-6">
        <IssueReportForm trayId={tray.id} trayCode={trayCode} sampleId={sample.id} sampleNumber={sample.sample_number} categories={categories} />
      </div>
    </main>
  );
}
