"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Camera, ChevronRight, Search, TriangleAlert } from "lucide-react";
import { SampleStatusBadge } from "@/components/status-badge";
import type { Sample } from "@/lib/domain";

export function SampleList({
  samples,
  trayCode,
  readOnly,
}: {
  samples: Sample[];
  trayCode: string;
  readOnly: boolean;
}) {
  const [query, setQuery] = useState("");
  const [issuesOnly, setIssuesOnly] = useState(false);
  const visible = useMemo(
    () => samples.filter((sample) =>
      sample.sample_number.includes(query.trim()) &&
      (!issuesOnly || (sample.sample_issues?.some((issue) => issue.status === "active") ?? false)),
    ),
    [samples, query, issuesOnly],
  );
  const issueSamples = samples.filter((sample) => sample.sample_issues?.some((issue) => issue.status === "active")).length;

  return (
    <section aria-labelledby="samples-heading">
      <div className="flex items-end justify-between gap-4">
        <div><h2 id="samples-heading" className="text-xl font-black">Samples</h2><p className="muted mt-1 text-sm">{issueSamples} issues recorded from {samples.length} samples</p></div>
      </div>
      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={20} aria-hidden />
        <label className="sr-only" htmlFor="sample-search">Search sample number</label>
        <input id="sample-search" className="field pl-12" inputMode="numeric" placeholder="Search sample number" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="mt-3 grid grid-cols-2 rounded-2xl bg-[#e8ece9] p-1" role="group" aria-label="Sample filter">
        <button className={`min-h-12 rounded-xl text-sm font-extrabold ${!issuesOnly ? "bg-white shadow-sm" : ""}`} onClick={() => setIssuesOnly(false)} aria-pressed={!issuesOnly}>All samples</button>
        <button className={`min-h-12 rounded-xl text-sm font-extrabold ${issuesOnly ? "bg-white shadow-sm" : ""}`} onClick={() => setIssuesOnly(true)} aria-pressed={issuesOnly}>Issues only ({issueSamples})</button>
      </div>
      <div className="mt-4 grid gap-3">
        {visible.map((sample) => {
          const activeIssues = sample.sample_issues?.filter((issue) => issue.status === "active") ?? [];
          const content = (
            <>
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid h-14 w-16 shrink-0 place-items-center rounded-2xl bg-[#eef2ef] text-xl font-black">{sample.sample_number}</span>
                <div className="min-w-0">
                  <SampleStatusBadge status={sample.status} />
                  {activeIssues.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-[var(--muted)]">
                      <span className="flex items-center gap-1"><TriangleAlert size={14} aria-hidden /> {activeIssues.length} {activeIssues.length === 1 ? "issue" : "issues"}</span>
                      <span className="flex items-center gap-1"><Camera size={14} aria-hidden /> Photo</span>
                    </div>
                  )}
                </div>
              </div>
              {!readOnly && <ChevronRight size={23} className="shrink-0 text-[var(--muted)]" aria-hidden />}
            </>
          );
          return readOnly ? (
            <div key={sample.id} className="card flex min-h-[82px] items-center justify-between gap-3 p-3">{content}</div>
          ) : (
            <Link key={sample.id} href={`/operator/trays/${trayCode}/samples/${sample.sample_number}/report`} className="card flex min-h-[82px] items-center justify-between gap-3 p-3 text-inherit no-underline">{content}</Link>
          );
        })}
        {visible.length === 0 && <div className="card p-7 text-center"><p className="font-bold">No samples match this filter.</p></div>}
      </div>
    </section>
  );
}
