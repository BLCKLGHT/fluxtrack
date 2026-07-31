import Link from "next/link";
import { Plus } from "lucide-react";
import { QrLabelDirectory } from "@/components/qr-label-directory";
import { getTrayTemplates } from "@/lib/queries";

export default async function QrLabelsPage() {
  const trays = await getTrayTemplates();
  return (
    <main id="main">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Tray identification</p>
          <h1 className="page-title mt-3">QR labels</h1>
          <p className="muted mt-3 max-w-2xl">
            Generate one permanent QR label for each physical tray. Every scan opens its current run or starts the next processing round.
          </p>
        </div>
        <Link href="/dashboard/trays" className="btn btn-secondary"><Plus size={18} aria-hidden />Create or manage trays</Link>
      </div>
      <div className="notice notice-info mt-7 max-w-3xl">
        The label stays with the physical tray. Do not reprint it for each run; dated results remain separate in the run history.
      </div>
      <QrLabelDirectory trays={trays} />
    </main>
  );
}
