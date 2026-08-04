"use client";

import { useActionState } from "react";
import { BellRing, Send } from "lucide-react";
import { deliverNotificationsNow } from "@/app/actions/notifications";
import type { ActionState } from "@/app/actions/trays";

const initial: ActionState = {};

export function NotificationDeliveryPanel({ configured, subscribers, queued }: { configured: boolean; subscribers: number; queued: number }) {
  const [state, action, pending] = useActionState(deliverNotificationsNow, initial);
  return <section className="card mt-7 p-6">
    <div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-2xl"><div className="flex items-center gap-3"><BellRing className="text-[var(--green)]" /><h2 className="text-xl font-black">Flagged sample email notifications</h2></div><p className="muted mt-3">Subscribed active users receive an individual email when an operator flags a sample. Delivery records are queued durably and retried after transient failures.</p></div><span className={`status ${configured ? "status-completed" : "status-created"}`}>{configured ? "Email configured" : "Provider required"}</span></div>
    <dl className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#f3f6f4] p-4"><dt className="muted text-xs font-bold uppercase">Subscribers</dt><dd className="mt-1 text-2xl font-black">{subscribers}</dd></div><div className="rounded-2xl bg-[#f3f6f4] p-4"><dt className="muted text-xs font-bold uppercase">Awaiting delivery</dt><dd className="mt-1 text-2xl font-black">{queued}</dd></div></dl>
    {!configured && <div className="notice notice-info mt-5">Add <strong>EMAIL_PROVIDER=resend</strong>, <strong>EMAIL_API_KEY</strong>, <strong>EMAIL_FROM</strong>, a Supabase server key, and <strong>CRON_SECRET</strong> to Vercel. Subscriptions and queued alerts are preserved until then.</div>}
    {state.error && <div className="notice notice-error mt-4">{state.error}</div>}{state.success && <div className="notice notice-success mt-4">{state.success}</div>}
    <form action={action} className="mt-5"><button className="btn btn-secondary" disabled={pending || !configured}><Send size={18} />{pending ? "Delivering…" : "Deliver pending now"}</button></form>
  </section>;
}
