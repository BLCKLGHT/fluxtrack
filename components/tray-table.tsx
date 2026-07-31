"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Tray, TrayStatus } from "@/lib/domain";
import { TrayStatusBadge } from "@/components/status-badge";
import { elapsed, formatDate } from "@/lib/utils";

export function TrayTable({ trays }: { trays: Tray[] }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [sample, setSample] = useState("");
  const [operator, setOperator] = useState("");
  const filtered = useMemo(() => trays.filter((tray) =>
    tray.tray_code.toLowerCase().includes(code.toLowerCase()) &&
    (!status || tray.status === status) &&
    (!sample || tray.samples?.some((item) => item.sample_number.includes(sample))) &&
    (!operator || [tray.received_profile?.display_name, tray.completed_profile?.display_name].some((name) => name?.toLowerCase().includes(operator.toLowerCase()))),
  ), [trays, code, status, sample, operator]);

  return (
    <>
      <div className="card mt-7 grid gap-4 p-5 md:grid-cols-4">
        <div><label className="label" htmlFor="tray-filter">Tray code</label><input className="field" id="tray-filter" value={code} onChange={(e) => setCode(e.target.value)} placeholder="FLUX-TEST" /></div>
        <div><label className="label" htmlFor="status-filter">Status</label><select className="field" id="status-filter" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{["created","received","in_progress","completed","reopened"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></div>
        <div><label className="label" htmlFor="sample-filter">Sample number</label><input className="field" id="sample-filter" value={sample} onChange={(e) => setSample(e.target.value)} inputMode="numeric" placeholder="2005" /></div>
        <div><label className="label" htmlFor="operator-filter">Operator</label><input className="field" id="operator-filter" value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="Name" /></div>
      </div>
      <p className="muted my-4 text-sm font-bold">{filtered.length} matching {filtered.length === 1 ? "tray" : "trays"}</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Tray</th><th>Status</th><th>Received</th><th>Completed</th><th>Samples</th><th>Issue samples</th><th>Issues</th><th>Elapsed</th><th><span className="sr-only">Action</span></th></tr></thead>
          <tbody>
            {filtered.map((tray) => {
              const samples = tray.samples ?? [];
              const issues = samples.flatMap((item) => item.sample_issues ?? []).filter((issue) => issue.status === "active");
              const issueSamples = new Set(issues.map((issue) => issue.sample_id)).size || samples.filter((item) => item.status === "issue_reported").length;
              return (
                <tr key={tray.id}>
                  <td><strong>{tray.tray_code}</strong><br /><span className="muted text-xs">{tray.source}</span></td>
                  <td><TrayStatusBadge status={tray.status as TrayStatus} /></td>
                  <td>{formatDate(tray.received_at)}<br /><span className="muted text-xs">{tray.received_profile?.display_name}</span></td>
                  <td>{formatDate(tray.completed_at)}<br /><span className="muted text-xs">{tray.completed_profile?.display_name}</span></td>
                  <td>{samples.length}</td><td>{issueSamples}</td><td>{issues.length}</td>
                  <td>{elapsed(tray.received_at, tray.completed_at)}</td>
                  <td><Link className="font-bold text-[var(--green)]" href={`/dashboard/trays/${tray.tray_code}`}>View</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
