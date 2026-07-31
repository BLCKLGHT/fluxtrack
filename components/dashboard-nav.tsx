import Link from "next/link";
import { ClipboardList, FlaskConical, Gauge, QrCode, ScanLine, Settings, ShieldCheck, Users, Workflow } from "lucide-react";
import { Brand } from "@/components/brand";
import type { UserRole } from "@/lib/domain";

const common = [
  { href: "/dashboard", label: "Overview", icon: Gauge },
  { href: "/dashboard/workflow", label: "Tray workflow", icon: Workflow },
  { href: "/dashboard/trays", label: "Trays", icon: ClipboardList },
  { href: "/dashboard/labels", label: "QR labels", icon: QrCode },
  { href: "/dashboard/issues", label: "Issues & export", icon: FlaskConical },
];
const admin = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/settings/categories", label: "Issue categories", icon: Settings },
  { href: "/dashboard/audit", label: "Audit records", icon: ShieldCheck },
];

export function DashboardNav({ role }: { role: UserRole }) {
  const items = role === "administrator" ? [...common, ...admin] : common;
  return (
    <aside className="border-b border-[#d8dfda] bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="p-5 lg:p-7"><Brand href="/dashboard" /></div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1 lg:px-4" aria-label="Dashboard">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-bold text-[#415047] no-underline hover:bg-[#eef3ef] hover:text-[var(--green-dark)]">
            <Icon size={19} aria-hidden />{label}
          </Link>
        ))}
        <Link href="/operator" className="flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-bold text-[#415047] no-underline hover:bg-[#eef3ef]">
          <ScanLine size={19} aria-hidden />Operator app
        </Link>
      </nav>
    </aside>
  );
}
