"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Printer, QrCode, Search } from "lucide-react";
import type { Tray } from "@/lib/domain";
import { TrayStatusBadge } from "@/components/status-badge";

export function QrLabelDirectory({ trays }: { trays: Tray[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return trays;
    return trays.filter((tray) =>
      tray.tray_code.toLowerCase().includes(value) ||
      tray.tray_name.toLowerCase().includes(value) ||
      tray.source.toLowerCase().includes(value),
    );
  }, [query, trays]);

  return (
    <>
      <div className="relative mt-7 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={20} aria-hidden />
        <label className="sr-only" htmlFor="label-tray-search">Find a tray</label>
        <input
          id="label-tray-search"
          className="field pl-12"
          placeholder="Search tray code, name, or source"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <p className="muted my-4 text-sm font-bold">{filtered.length} {filtered.length === 1 ? "tray" : "trays"} ready for labels</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((tray) => {
          const samples = tray.samples ?? [];
          const sampleNumbers = samples.map((sample) => Number(sample.sample_number)).filter(Number.isFinite);
          const first = sampleNumbers.length ? Math.min(...sampleNumbers) : null;
          const last = sampleNumbers.length ? Math.max(...sampleNumbers) : null;
          return (
            <article className="card flex flex-col p-5" key={tray.id}>
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e7f4ed] text-[var(--green)]">
                  <QrCode size={24} aria-hidden />
                </span>
                <TrayStatusBadge status={tray.status} />
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-[-.04em]">{tray.tray_code}</h2>
              <p className="muted mt-1 text-sm font-semibold">{tray.tray_name} · {tray.source}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#f3f6f4] p-4 text-sm">
                <div><dt className="muted text-xs font-bold uppercase">Samples</dt><dd className="mt-1 font-extrabold">{samples.length}</dd></div>
                <div><dt className="muted text-xs font-bold uppercase">Range</dt><dd className="mt-1 font-extrabold">{first !== null ? `${first}–${last}` : "—"}</dd></div>
              </dl>
              <p className="mt-4 text-xs font-bold text-[var(--green-dark)]">QR assigned to this tray code</p>
              <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
                <Link className="btn btn-primary" href={`/dashboard/trays/${tray.tray_code}/qr`}>
                  <Printer size={18} aria-hidden />Generate & print
                </Link>
                <Link className="btn btn-secondary" href={`/dashboard/trays/${tray.tray_code}`}>
                  <ExternalLink size={18} aria-hidden />Tray record
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {!filtered.length && <div className="card p-8 text-center"><p className="font-bold">No trays match that search.</p></div>}
    </>
  );
}
