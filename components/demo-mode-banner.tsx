import Link from "next/link";
import { Presentation } from "lucide-react";

export function DemoModeBanner() {
  return <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6b73e] bg-[#fff8d8] px-4 py-3 text-sm"><p className="flex items-center gap-2 font-extrabold"><Presentation size={19} />Demo mode — synthetic records are shown alongside real data</p><Link href="/dashboard/settings" className="font-bold text-[var(--green-dark)]">Turn off</Link></div>;
}
