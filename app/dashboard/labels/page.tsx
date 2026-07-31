import Link from "next/link";
import { Plus } from "lucide-react";
import { QrLabelDirectory } from "@/components/qr-label-directory";
import { getTrays } from "@/lib/queries";

export default async function QrLabelsPage() {
  const trays = await getTrays();
  return (
    <main id="main">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Tray identification</p>
          <h1 className="page-title mt-3">QR labels</h1>
          <p className="muted mt-3 max-w-2xl">
            Choose a tray to generate its assigned QR label. Print the A4 sheet, cut out the label if needed, and attach it to the matching physical tray.
          </p>
        </div>
        <Link href="/dashboard/trays" className="btn btn-secondary"><Plus size={18} aria-hidden />Create or manage trays</Link>
      </div>
      <div className="notice notice-info mt-7 max-w-3xl">
        Each QR contains this application’s direct tray URL. It is automatically assigned from the unique tray code and remains linked to that tray record.
      </div>
      <QrLabelDirectory trays={trays} />
    </main>
  );
}
