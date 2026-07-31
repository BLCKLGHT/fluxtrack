import { TrayTable } from "@/components/tray-table";
import { getTrays } from "@/lib/queries";
import { requireProfile } from "@/lib/auth";
import { CreateTrayForm } from "@/components/admin-forms";

export default async function DashboardTraysPage() {
  const [trays, profile] = await Promise.all([getTrays(), requireProfile(["team_viewer", "administrator"])]);
  return (
    <main id="main">
      <p className="eyebrow">Records</p><h1 className="page-title mt-3">Trays</h1>
      <p className="muted mt-3">Search lifecycle, operator, sample, and issue totals.</p>
      {profile.role === "administrator" && <CreateTrayForm />}
      <TrayTable trays={trays} />
    </main>
  );
}
