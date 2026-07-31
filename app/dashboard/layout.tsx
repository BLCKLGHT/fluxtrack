import Image from "next/image";
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
      <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mb-6 flex justify-end">
          <Image
            src="/hayes-industries.png"
            alt="Hayes Industries"
            width={2435}
            height={633}
            sizes="(min-width: 1024px) 140px, (min-width: 640px) 120px, 100px"
            className="h-auto w-[100px] sm:w-[120px] lg:w-[140px]"
            priority
          />
        </div>
        {demo && <DemoModeBanner />}{children}
      </div>
    </div>
  );
}
