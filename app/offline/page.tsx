import { WifiOff } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";

export default function OfflinePage() {
  return (
    <main id="main" className="operator-shell flex min-h-screen flex-col justify-center">
      <Brand />
      <section className="card mt-8 p-7">
        <WifiOff size={40} className="text-[var(--red)]" aria-hidden />
        <h1 className="page-title mt-5">You’re offline</h1>
        <p className="muted mt-4 leading-7">
          A connection is required to load tray records and submit photographic evidence.
          FluxTrack does not store photos for later upload.
        </p>
        <Link href="/operator" className="btn btn-primary mt-6 w-full">Try again</Link>
      </section>
    </main>
  );
}
