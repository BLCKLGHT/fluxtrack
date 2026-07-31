import { IssueTable } from "@/components/issue-table";
import { getCategories, getIssues } from "@/lib/queries";
import { isDemoMode } from "@/lib/demo-mode";
import { DateRangeFilter } from "@/components/date-range-filter";
import { parseDashboardDateRange } from "@/lib/date-range";

export default async function IssuesPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const [demo, params] = await Promise.all([isDemoMode(), searchParams]);
  const range = parseDashboardDateRange(params);
  const [issues, categories] = await Promise.all([getIssues(demo, range), getCategories()]);
  return (
    <main id="main">
      <p className="eyebrow">Evidence register</p><h1 className="page-title mt-3">Sample issues</h1>
      <p className="muted mt-3">Filter records and export traceable issue data without photograph links.</p>
      <DateRangeFilter range={range} />
      <IssueTable issues={issues} categories={categories} />
    </main>
  );
}
