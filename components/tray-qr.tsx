"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";

export function TrayQr({ trayCode, url }: { trayCode: string; url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 420,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#17211d", light: "#ffffff" },
    }).catch(() => setError("QR code could not be generated."));
  }, [url]);

  async function downloadPng() {
    const data = await QRCode.toDataURL(url, { width: 1200, margin: 3 });
    const link = document.createElement("a");
    link.download = `${trayCode}-qr.png`; link.href = data; link.click();
  }
  async function downloadSvg() {
    const svg = await QRCode.toString(url, { type: "svg", margin: 3, width: 1200 });
    const objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.download = `${trayCode}-qr.svg`; link.href = objectUrl; link.click();
    URL.revokeObjectURL(objectUrl);
  }
  return (
    <>
      {error && <div className="notice notice-error">{error}</div>}
      <canvas ref={canvasRef} className="mx-auto h-auto w-full max-w-[420px]" role="img" aria-label={`QR code to open tray ${trayCode}`} />
      <div className="no-print mt-7 flex flex-wrap justify-center gap-3">
        <button className="btn btn-primary" onClick={() => window.print()}><Printer size={19} aria-hidden />Print A4 label</button>
        <button className="btn btn-secondary" onClick={downloadPng}><Download size={19} aria-hidden />PNG</button>
        <button className="btn btn-secondary" onClick={downloadSvg}><Download size={19} aria-hidden />SVG</button>
      </div>
    </>
  );
}
