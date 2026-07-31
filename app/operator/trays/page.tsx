import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTrays } from "@/lib/queries";
import { TrayStatusBadge } from "@/components/status-badge";

export default async function ActiveTraysPage() {
  const trays = await getTrays(["created", "received", "in_progress", "reopened"]);
  return (
    <main id="main" className="operator-shell">
      <p className="eyebrow mt-8">Work queue</p><h1 className="page-title mt-3">Active trays</h1>
      <p className="muted mt-3">{trays.length} {trays.length === 1 ? "tray" : "trays"} available</p>
      <div className="mt-7 grid gap-3">
        {trays.map((tray) => (
          <Link key={tray.id} href={`/operator/trays/${tray.tray_code}`} className="card flex min-h-[96px] items-center justify-between gap-4 p-5 text-inherit no-underline">
            <div><p className="text-xl font-black">{tray.tray_code}</p><p className="muted mt-1 text-sm">{tray.tray_name} · {tray.source}</p><div className="mt-3"><TrayStatusBadge status={tray.status} /></div></div>
            <ChevronRight aria-hidden />
          </Link>
        ))}
        {!trays.length && <div className="card p-8 text-center"><p className="font-bold">No active trays</p><p className="muted mt-2 text-sm">Scan a QR code to open a tray directly.</p></div>}
      </div>
    </main>
  );
}
