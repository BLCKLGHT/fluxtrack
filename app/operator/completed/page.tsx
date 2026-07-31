import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTrays } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export default async function CompletedTraysPage() {
  const trays = await getTrays(["completed"]);
  return (
    <main id="main" className="operator-shell">
      <p className="eyebrow mt-8">History</p><h1 className="page-title mt-3">Completed trays</h1>
      <div className="mt-7 grid gap-3">
        {trays.map((tray) => (
          <Link key={tray.id} href={`/operator/trays/${tray.tray_code}`} className="card flex min-h-[86px] items-center justify-between p-5 text-inherit no-underline">
            <div><p className="text-lg font-black">{tray.tray_code}</p><p className="muted mt-1 text-sm">{formatDate(tray.completed_at)}</p></div><ChevronRight aria-hidden />
          </Link>
        ))}
        {!trays.length && <div className="card p-8 text-center font-bold">No completed trays yet.</div>}
      </div>
    </main>
  );
}
