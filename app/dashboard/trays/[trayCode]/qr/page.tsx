import Link from "next/link";
import { TrayQr } from "@/components/tray-qr";
import { appUrl } from "@/lib/config";
import { getTray } from "@/lib/queries";
import { trayCodeSchema } from "@/lib/validation";

export default async function TrayQrPage({ params }: { params: Promise<{ trayCode: string }> }) {
  const trayCode = trayCodeSchema.parse((await params).trayCode);
  const tray = await getTray(trayCode);
  const url = `${appUrl()}/operator/trays/${tray.tray_code}`;
  return (
    <main id="main">
      <div className="no-print"><Link href={`/dashboard/trays/${tray.tray_code}`} className="text-sm font-bold text-[var(--green)]">← Back to tray</Link></div>
      <section className="print-sheet card mx-auto mt-7 max-w-[800px] p-8 text-center sm:p-14">
        <p className="eyebrow">FluxTrack laboratory tray</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-.05em]">{tray.tray_code}</h1>
        <p className="muted mt-3 text-xl font-bold">{tray.tray_name} · {tray.source}</p>
        <div className="mx-auto mt-9 max-w-[440px] rounded-[28px] border-2 border-[#d8dfda] bg-white p-3"><TrayQr trayCode={tray.tray_code} url={url} /></div>
        <p className="mt-7 text-xl font-black">Scan to open tray</p>
        <p className="muted mt-3 break-all text-sm">{url}</p>
      </section>
    </main>
  );
}
