"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SampleIssue } from "@/lib/domain";

export function DashboardCharts({ issues }: { issues: SampleIssue[] }) {
  const countBy = (key: "category" | "ownership" | "stage" | "time") => {
    const map = new Map<string, number>();
    for (const issue of issues.filter((item) => item.status === "active")) {
      const value = key === "category"
        ? issue.issue_categories?.name ?? "Unknown"
        : key === "ownership"
          ? issue.ownership_snapshot
          : key === "time"
            ? new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short" }).format(new Date(issue.reported_at))
            : issue.processing_stage;
      map.set(value, (map.get(value) ?? 0) + 1);
    }
    return [...map].map(([name, count]) => ({ name: name.replaceAll("_", " "), count }));
  };
  const charts = [
    ["Issues by category", countBy("category")],
    ["Issues by ownership", countBy("ownership")],
    ["Issues by processing stage", countBy("stage")],
    ["Issues over time", countBy("time")],
  ] as const;
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {charts.map(([title, data]) => (
        <section key={title} className="card p-5">
          <h2 className="font-extrabold">{title}</h2>
          <div className="mt-5 h-56" role="img" aria-label={`${title}: ${data.map((item) => `${item.name} ${item.count}`).join(", ") || "no issues"}`}>
            {data.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ left: -22 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e7e3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={56} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ fill: "#f0f4f1" }} />
                  <Bar dataKey="count" fill="#176b4d" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="grid h-full place-items-center text-sm font-bold text-[var(--muted)]">No issue data yet</div>}
          </div>
        </section>
      ))}
    </div>
  );
}
