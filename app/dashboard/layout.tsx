import { DashboardNav } from "@/components/dashboard-nav";
import { requireProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile(["team_viewer", "administrator"]);
  return (
    <div className="min-h-screen lg:pl-64">
      <DashboardNav role={profile.role} />
      <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
    </div>
  );
}
