import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard-charts";
import { getDashboardData } from "@/lib/queries";
import { isDemoMode } from "@/lib/demo-mode";
import { DateRangeFilter } from "@/components/date-range-filter";
import { dateRangeQuery, parseDashboardDateRange } from "@/lib/date-range";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const [params, demo] = await Promise.all([searchParams, isDemoMode()]);
  const range = parseDashboardDateRange(params);
  const { trays, issues } = await getDashboardData(demo, range);
  const activeIssues = issues.filter((issue) => issue.status === "active");
  const issueSamples = new Set(activeIssues.map((issue) => issue.sample_id)).size;
  const totalSamples = trays.reduce((sum, tray) => sum + (tray.samples?.length ?? 0), 0);
  const categoryCounts = activeIssues.reduce<Record<string, number>>((acc, issue) => {
    const name = issue.issue_categories?.name ?? "Unknown";
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  const common = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const metrics: [string, string | number][] = [
    ["Tray runs", trays.length],
    ["Awaiting receipt", trays.filter((tray) => tray.status === "created").length],
    ["Received", trays.filter((tray) => tray.status === "received").length],
    ["In progress", trays.filter((tray) => ["in_progress", "reopened"].includes(tray.status)).length],
    ["Completed", trays.filter((tray) => tray.status === "completed").length],
    ["Total issues", activeIssues.length],
    ["Issue rate", totalSamples ? `${((issueSamples / totalSamples) * 100).toFixed(1)}%` : "0%"],
    ["Most common", common],
  ];
  return (
    <main id="main">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Team dashboard</p><h1 className="page-title mt-3">Laboratory overview</h1><p className="muted mt-3">Operational results for the selected reporting period.</p></div>
        <Link className="btn btn-secondary" href={`/dashboard/trays?${dateRangeQuery(range)}`}>View tray runs <ArrowUpRight size={18} aria-hidden /></Link>
      </div>
      <DateRangeFilter range={range} />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => <div className="card metric" key={label}><p className="metric-value">{value}</p><p className="metric-label">{label}</p></div>)}
      </div>
      <div className="mt-8"><DashboardCharts issues={issues} timeBucket={range.preset === "year" || (new Date(range.to).getTime() - new Date(range.from).getTime()) > 62 * 86_400_000 ? "month" : "day"} /></div>
    </main>
  );
}
