import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard-charts";
import { getDashboardData } from "@/lib/queries";

export default async function DashboardPage() {
  const { trays, issues } = await getDashboardData();
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
    ["Total trays", trays.length],
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
        <div><p className="eyebrow">Team dashboard</p><h1 className="page-title mt-3">Laboratory overview</h1><p className="muted mt-3">Live operational records across all accessible trays.</p></div>
        <Link className="btn btn-secondary" href="/dashboard/trays">View all trays <ArrowUpRight size={18} aria-hidden /></Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => <div className="card metric" key={label}><p className="metric-value">{value}</p><p className="metric-label">{label}</p></div>)}
      </div>
      <div className="mt-8"><DashboardCharts issues={issues} /></div>
    </main>
  );
}
