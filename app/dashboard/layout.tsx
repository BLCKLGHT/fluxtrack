import { DashboardNav } from "@/components/dashboard-nav";
import { requireProfile } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import { DemoModeBanner } from "@/components/demo-mode-banner";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, demo] = await Promise.all([requireProfile(["team_viewer", "administrator"]), isDemoMode()]);
  return (
    <div className="min-h-screen lg:pl-64">
      <DashboardNav role={profile.role} />
      <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{demo && <DemoModeBanner />}{children}</div>
    </div>
  );
}
