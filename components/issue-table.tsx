"use client";

import { useMemo, useState } from "react";
import type { IssueCategory, SampleIssue } from "@/lib/domain";
import { formatDate } from "@/lib/utils";
import { STAGE_LABELS } from "@/lib/domain";

export function IssueTable({ issues, categories }: { issues: SampleIssue[]; categories: IssueCategory[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [stage, setStage] = useState("");
  const [ownership, setOwnership] = useState("");
  const [operator, setOperator] = useState("");
  const filtered = useMemo(() => issues.filter((issue) =>
    (!query || issue.trays?.tray_code.toLowerCase().includes(query.toLowerCase()) || issue.samples?.sample_number.includes(query)) &&
    (!category || issue.category_id === category) &&
    (!stage || issue.processing_stage === stage) &&
    (!ownership || issue.ownership_snapshot === ownership) &&
    (!operator || issue.profiles?.display_name.toLowerCase().includes(operator.toLowerCase())),
  ), [issues, query, category, stage, ownership, operator]);

  function exportCsv() {
    const head = ["issue_id","tray_code","sample_number","category","processing_stage","ownership","comment","operator","reported_at","status","photo_present"];
    const rows = filtered.map((issue) => [
      issue.id, issue.trays?.tray_code, issue.samples?.sample_number, issue.issue_categories?.name,
      issue.processing_stage, issue.ownership_snapshot, issue.comment ?? "", issue.profiles?.display_name,
      issue.reported_at, issue.status, Boolean(issue.photo_storage_path),
    ]);
    const csv = [head, ...rows].map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `fluxtrack-issues-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="card mt-7 grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
        <div><label className="label" htmlFor="issue-query">Tray or sample</label><input className="field" id="issue-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="FLUX or 2005" /></div>
        <div><label className="label" htmlFor="issue-category">Category</label><select className="field" id="issue-category" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
        <div><label className="label" htmlFor="issue-stage">Stage</label><select className="field" id="issue-stage" value={stage} onChange={(e) => setStage(e.target.value)}><option value="">All stages</option>{Object.entries(STAGE_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></div>
        <div><label className="label" htmlFor="issue-owner">Ownership</label><select className="field" id="issue-owner" value={ownership} onChange={(e) => setOwnership(e.target.value)}><option value="">All ownership</option>{["potrooms","laboratory","equipment","unclassified"].map((value) => <option value={value} key={value}>{value}</option>)}</select></div>
        <div><label className="label" htmlFor="issue-operator">Operator</label><input className="field" id="issue-operator" value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="Name" /></div>
      </div>
      <div className="my-4 flex items-center justify-between gap-4"><p className="muted text-sm font-bold">{filtered.length} matching issues</p><button className="btn btn-secondary !min-h-11" onClick={exportCsv}>Export filtered CSV</button></div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Issue ID</th><th>Tray</th><th>Sample</th><th>Category</th><th>Stage</th><th>Ownership</th><th>Operator</th><th>Reported</th><th>Photo</th></tr></thead>
          <tbody>{filtered.map((issue) => <tr key={issue.id}><td className="font-mono text-xs">{issue.id.slice(0,8)}…</td><td>{issue.trays?.tray_code}</td><td><strong>{issue.samples?.sample_number}</strong></td><td>{issue.issue_categories?.name}</td><td>{STAGE_LABELS[issue.processing_stage]}</td><td>{issue.ownership_snapshot}</td><td>{issue.profiles?.display_name}</td><td>{formatDate(issue.reported_at)}</td><td>{issue.photo_storage_path ? "Yes" : "No"}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
