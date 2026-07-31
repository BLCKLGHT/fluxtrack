"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { useRouter } from "next/navigation";
import { Camera, Keyboard, LoaderCircle } from "lucide-react";
import { parseTrustedTrayQr, trayCodeSchema } from "@/lib/validation";

export function QrScanner({ appOrigin }: { appOrigin: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [starting, setStarting] = useState(false);
  const [manual, setManual] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => controlsRef.current?.stop(), []);

  async function startCamera() {
    setError("");
    setStarting(true);
    try {
      if (!videoRef.current) return;
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (!result) return;
          const code = parseTrustedTrayQr(result.getText(), appOrigin);
          if (!code) {
            setError("That QR code is not a valid FluxTrack tray link.");
            return;
          }
          controlsRef.current?.stop();
          router.push(`/operator/trays/${code}`);
        },
      );
      setCameraOn(true);
    } catch {
      setError("Camera access was unavailable. Check permission or enter the tray code below.");
    } finally {
      setStarting(false);
    }
  }

  function openManual(event: React.FormEvent) {
    event.preventDefault();
    const parsed = trayCodeSchema.safeParse(manual);
    if (!parsed.success) {
      setError("Enter a tray code such as FLUX-TEST-001.");
      return;
    }
    router.push(`/operator/trays/${parsed.data}`);
  }

  return (
    <div>
      {error && <div className="notice notice-error mb-4" role="alert">{error}</div>}
      <div className="card overflow-hidden bg-[#13201a]">
        <div className={`relative aspect-[4/3] ${cameraOn ? "" : "grid place-items-center"}`}>
          <video ref={videoRef} className={`h-full w-full object-cover ${cameraOn ? "block" : "hidden"}`} muted playsInline aria-label="Camera preview" />
          {!cameraOn && (
            <div className="p-7 text-center text-white">
              <Camera className="mx-auto text-[var(--lime)]" size={42} aria-hidden />
              <p className="mt-4 font-extrabold">Point the camera at the tray label</p>
              <p className="mt-2 text-sm text-[#c6d2cc]">Only FluxTrack tray links are accepted.</p>
            </div>
          )}
          {cameraOn && <div className="pointer-events-none absolute inset-[16%] rounded-3xl border-2 border-[var(--lime)] shadow-[0_0_0_999px_rgba(0,0,0,.25)]" />}
        </div>
        <div className="p-3">
          <button className="btn btn-accent w-full" onClick={startCamera} disabled={starting || cameraOn}>
            {starting ? <LoaderCircle className="animate-spin" size={20} aria-hidden /> : <Camera size={20} aria-hidden />}
            {starting ? "Starting camera…" : cameraOn ? "Camera active" : "Use camera"}
          </button>
        </div>
      </div>
      <div className="my-7 flex items-center gap-3"><div className="hairline flex-1" /><span className="muted text-xs font-bold uppercase">or enter code</span><div className="hairline flex-1" /></div>
      <form onSubmit={openManual}>
        <label className="label" htmlFor="tray-code">Tray code</label>
        <input className="field uppercase" id="tray-code" placeholder="FLUX-TEST-001" autoCapitalize="characters" value={manual} onChange={(event) => setManual(event.target.value)} />
        <button className="btn btn-secondary mt-3 w-full" type="submit"><Keyboard size={20} aria-hidden /> Open tray</button>
      </form>
    </div>
  );
}
