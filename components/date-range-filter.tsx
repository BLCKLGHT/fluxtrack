import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { DashboardDateRange, DateRangePreset } from "@/lib/date-range";

const presets: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

export function DateRangeFilter({ range }: { range: DashboardDateRange }) {
  return <section className="card mt-7 p-4" aria-label="Dashboard date range">
    <div className="flex flex-wrap items-center gap-2">
      <CalendarDays size={19} className="mr-1 text-[var(--green)]" aria-hidden />
      {presets.map((preset) => <Link key={preset.value} href={`?range=${preset.value}`} className={`rounded-xl px-3 py-2 text-sm font-extrabold no-underline ${range.preset === preset.value ? "bg-[var(--green)] text-white" : "bg-[#eef3ef] text-[var(--ink)]"}`} aria-current={range.preset === preset.value ? "page" : undefined}>{preset.label}</Link>)}
    </div>
    <form className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]" method="get">
      <input type="hidden" name="range" value="custom" />
      <div><label className="label" htmlFor="date-from">From</label><input className="field" id="date-from" name="from" type="date" defaultValue={range.from} required /></div>
      <div><label className="label" htmlFor="date-to">To</label><input className="field" id="date-to" name="to" type="date" defaultValue={range.to} required /></div>
      <button className="btn btn-secondary" type="submit">Apply range</button>
    </form>
    <p className="muted mt-3 text-xs font-bold">Showing {range.label} · tray processing dates and issue report dates · Australia/Hobart time</p>
  </section>;
}
