"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, History, ScanLine, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/operator/scan", label: "Scan", icon: ScanLine },
  { href: "/operator/tray-sets", label: "Tray workflow", icon: Workflow },
  { href: "/operator/completed", label: "Completed", icon: History },
  { href: "/operator/account", label: "Account", icon: CircleUserRound },
];

export function OperatorNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d8dfda] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Operator">
      <div className="mx-auto grid max-w-[680px] grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/operator/tray-sets" && (pathname.startsWith("/operator/tray-sets/") || pathname.startsWith("/operator/trays/")));
          return (
            <Link key={href} href={href} className={cn(
              "flex min-h-[72px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-bold no-underline",
              active ? "text-[var(--green)]" : "text-[#617069]",
            )} aria-current={active ? "page" : undefined}>
              <Icon size={23} strokeWidth={active ? 2.6 : 2} aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
