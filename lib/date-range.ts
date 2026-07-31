export type DateRangePreset = "today" | "week" | "month" | "year" | "custom";

export interface DashboardDateRange {
  preset: DateRangePreset;
  from: string;
  to: string;
  fromUtc: string;
  toExclusiveUtc: string;
  label: string;
}

type DateParams = { range?: string | string[]; from?: string | string[]; to?: string | string[] };
const TIME_ZONE = "Australia/Hobart";

function localDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function startOfZonedDay(value: string) {
  const [year, month, day] = value.split("-").map(Number) as [number, number, number];
  const target = Date.UTC(year, month - 1, day);
  let guess = target;
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = new Intl.DateTimeFormat("en-AU", {
      timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const local = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const represented = Date.UTC(Number(local.year), Number(local.month) - 1, Number(local.day), Number(local.hour), Number(local.minute), Number(local.second));
    guess -= represented - target;
  }
  return new Date(guess).toISOString();
}

function formatRange(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  if (from === to) return formatter.format(new Date(`${from}T12:00:00Z`));
  return `${formatter.format(new Date(`${from}T12:00:00Z`))} – ${formatter.format(new Date(`${to}T12:00:00Z`))}`;
}

export function parseDashboardDateRange(params: DateParams = {}, now = new Date()): DashboardDateRange {
  const today = localDate(now);
  const requested = Array.isArray(params.range) ? params.range[0] : params.range;
  const preset: DateRangePreset = ["today", "week", "month", "year", "custom"].includes(requested ?? "")
    ? requested as DateRangePreset : "week";
  let from = today;
  let to = today;

  if (preset === "week") {
    const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
    from = addDays(today, -((weekday + 6) % 7));
    to = addDays(from, 6);
  } else if (preset === "month") {
    from = `${today.slice(0, 8)}01`;
    to = addDays(`${today.slice(0, 8)}01`, 32);
    to = addDays(`${to.slice(0, 8)}01`, -1);
  } else if (preset === "year") {
    from = `${today.slice(0, 4)}-01-01`;
    to = `${today.slice(0, 4)}-12-31`;
  } else if (preset === "custom") {
    const requestedFrom = Array.isArray(params.from) ? params.from[0] : params.from;
    const requestedTo = Array.isArray(params.to) ? params.to[0] : params.to;
    if (validDate(requestedFrom) && validDate(requestedTo)) {
      from = requestedFrom <= requestedTo ? requestedFrom : requestedTo;
      to = requestedFrom <= requestedTo ? requestedTo : requestedFrom;
    } else {
      from = `${today.slice(0, 8)}01`;
    }
  }

  return {
    preset, from, to, fromUtc: startOfZonedDay(from),
    toExclusiveUtc: startOfZonedDay(addDays(to, 1)), label: formatRange(from, to),
  };
}

export function dateRangeQuery(range: DashboardDateRange) {
  const params = new URLSearchParams({ range: range.preset });
  if (range.preset === "custom") { params.set("from", range.from); params.set("to", range.to); }
  return params.toString();
}
