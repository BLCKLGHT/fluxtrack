import { TrayTable } from "@/components/tray-table";
import { getTrays } from "@/lib/queries";
import { requireProfile } from "@/lib/auth";
import { CreateTrayForm } from "@/components/admin-forms";
import { isDemoMode } from "@/lib/demo-mode";

export default async function DashboardTraysPage() {
  const demo = await isDemoMode();
  const [trays, profile] = await Promise.all([getTrays(undefined, demo), requireProfile(["team_viewer", "administrator"])]);
  return (
    <main id="main">
      <p className="eyebrow">Records</p><h1 className="page-title mt-3">Trays</h1>
      <p className="muted mt-3">Search individual dated processing runs, operator, sample, and issue totals.</p>
      {profile.role === "administrator" && <CreateTrayForm />}
      <TrayTable trays={trays} />
    </main>
  );
}
