import { QrScanner } from "@/components/qr-scanner";
import { appUrl } from "@/lib/config";

export default function ScanPage() {
  return (
    <main id="main" className="operator-shell">
      <p className="eyebrow mt-8">Open tray</p>
      <h1 className="page-title mt-3">Scan tray QR</h1>
      <p className="muted mt-3 mb-7">Hold the permanent label inside the frame. An open run will appear immediately.</p>
      <QrScanner appOrigin={new URL(appUrl()).origin} />
    </main>
  );
}
