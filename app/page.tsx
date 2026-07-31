import Link from "next/link";
import { ArrowRight, Camera, QrCode, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";

export default function HomePage() {
  return (
    <main id="main">
      <header className="shell flex items-center justify-between py-6">
        <Brand />
        <Link className="btn btn-secondary !min-h-11" href="/login">Sign in</Link>
      </header>
      <section className="shell grid min-h-[calc(100vh-100px)] items-center gap-12 py-14 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="eyebrow">Laboratory sample control</p>
          <h1 className="display mt-5 max-w-[760px]">Evidence captured at the moment it matters.</h1>
          <p className="muted mt-7 max-w-2xl text-lg leading-8">
            FluxTrack gives process operators a fast, glove-friendly way to receive trays,
            record sample problems with a photo, and keep every handoff traceable.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/operator/scan">Open operator app <ArrowRight size={19} aria-hidden /></Link>
            <Link className="btn btn-secondary" href="/dashboard">Team dashboard</Link>
          </div>
        </div>
        <div className="card relative overflow-hidden p-6 sm:p-9">
          <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[80px] bg-[var(--lime)]" />
          <p className="relative text-sm font-bold text-[var(--muted)]">Designed for the lab floor</p>
          <div className="relative mt-8 grid gap-4">
            {[
              [QrCode, "Scan straight to the tray", "Trusted QR links and manual fallback."],
              [Camera, "Photo is confirmation", "One action uploads evidence and records the issue."],
              [ShieldCheck, "Traceability by design", "Roles, private storage, audit events, and immutable issues."],
            ].map(([Icon, title, text]) => {
              const ItemIcon = Icon as typeof QrCode;
              return (
                <div key={String(title)} className="flex gap-4 rounded-2xl bg-[#f5f7f4] p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[var(--green)]">
                    <ItemIcon size={22} aria-hidden />
                  </span>
                  <div><h2 className="font-extrabold">{String(title)}</h2><p className="muted mt-1 text-sm leading-6">{String(text)}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
