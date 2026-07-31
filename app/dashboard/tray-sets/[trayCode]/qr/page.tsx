import Link from "next/link";
import { TrayQr } from "@/components/tray-qr";
import { appUrl } from "@/lib/config";
import { getTrayTemplate } from "@/lib/queries";
import { trayCodeSchema } from "@/lib/validation";

export default async function PhysicalTrayQrPage({ params }: { params: Promise<{ trayCode: string }> }) {
  const code = trayCodeSchema.parse((await params).trayCode);
  const tray = await getTrayTemplate(code);
  const url = `${appUrl()}/operator/tray-sets/${tray.tray_code}`;
  return <main id="main">
    <div className="no-print flex flex-wrap gap-5"><Link href="/dashboard/labels" className="text-sm font-bold text-[var(--green)]">← All QR labels</Link><Link href={`/dashboard/tray-sets/${tray.tray_code}`} className="text-sm font-bold text-[var(--green)]">View run history</Link></div>
    <section className="print-sheet card mx-auto mt-7 max-w-[800px] p-8 text-center sm:p-14"><p className="eyebrow">FluxTrack physical laboratory tray</p><h1 className="mt-4 text-5xl font-black tracking-[-.05em]">{tray.tray_code}</h1><p className="muted mt-3 text-xl font-bold">{tray.tray_name} · {tray.source}</p><div className="mx-auto mt-9 max-w-[440px] rounded-[28px] border-2 border-[#d8dfda] bg-white p-3"><TrayQr trayCode={tray.tray_code} url={url} /></div><p className="mt-7 text-xl font-black">Scan to resume or start this tray</p><p className="muted mt-3">Permanent label · reuse every round</p><p className="muted mt-3 break-all text-sm">{url}</p></section>
  </main>;
}
