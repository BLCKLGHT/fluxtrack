import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-3 no-underline text-[var(--ink)]" aria-label="FluxTrack home">
      <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[var(--green)] text-sm font-black text-white shadow-sm">
        FX
      </span>
      <span>
        <span className="block text-lg font-black tracking-[-.04em]">FluxTrack</span>
        <span className="block text-[10px] font-bold uppercase tracking-[.13em] text-[var(--muted)]">Lab operations</span>
      </span>
    </Link>
  );
}
