import Link from "next/link";
import { ArrowRight, QrCode, ScanLine } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getTrays } from "@/lib/queries";
import { TrayStatusBadge } from "@/components/status-badge";

export default async function OperatorHome() {
  const [profile, trays] = await Promise.all([
    requireProfile(),
    getTrays(["created", "received", "in_progress", "reopened"]),
  ]);
  const latest = trays[0];
  return (
    <main id="main" className="operator-shell">
      <p className="eyebrow mt-8">Operator workspace</p>
      <h1 className="page-title mt-3">Hello, {profile.display_name.split(" ")[0]}</h1>
      <p className="muted mt-3">Scan a tray or return to work already in progress.</p>
      <Link href="/operator/scan" className="btn btn-accent mt-7 w-full !min-h-16 text-lg">
        <ScanLine size={24} aria-hidden /> Scan tray QR code
      </Link>
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Most recent tray</h2>
        <Link href="/operator/trays" className="text-sm font-bold text-[var(--green)]">View all</Link>
      </div>
      {latest ? (
        <Link href={`/operator/trays/${latest.tray_code}`} className="card mt-4 block p-5 text-inherit no-underline">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-2xl font-black tracking-[-.04em]">{latest.tray_code}</p><p className="muted mt-1 text-sm">{latest.tray_name} · {latest.source}</p></div>
            <ArrowRight size={22} aria-hidden />
          </div>
          <div className="mt-5"><TrayStatusBadge status={latest.status} /></div>
        </Link>
      ) : (
        <div className="card mt-4 p-6 text-center">
          <QrCode className="mx-auto text-[var(--muted)]" aria-hidden />
          <p className="mt-3 font-bold">No active trays</p>
        </div>
      )}
    </main>
  );
}
