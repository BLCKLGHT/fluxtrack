import { TrayTable } from "@/components/tray-table";
import { getTrays } from "@/lib/queries";
import { requireProfile } from "@/lib/auth";
import { CreateTrayForm } from "@/components/admin-forms";
import { isDemoMode } from "@/lib/demo-mode";
import { DateRangeFilter } from "@/components/date-range-filter";
import { parseDashboardDateRange } from "@/lib/date-range";

export default async function DashboardTraysPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const [demo, params] = await Promise.all([isDemoMode(), searchParams]);
  const range = parseDashboardDateRange(params);
  const [trays, profile] = await Promise.all([getTrays(undefined, demo, range), requireProfile(["team_viewer", "administrator"])]);
  return (
    <main id="main">
      <p className="eyebrow">Records</p><h1 className="page-title mt-3">Trays</h1>
      <p className="muted mt-3">Search individual dated processing runs, operator, sample, and issue totals.</p>
      <DateRangeFilter range={range} />
      {profile.role === "administrator" && <CreateTrayForm />}
      <TrayTable trays={trays} />
    </main>
  );
}
