"use client";

import { useActionState } from "react";
import { reopenTray, type ActionState } from "@/app/actions/trays";

const initial: ActionState = {};

export function ReopenForm({ trayId, trayCode }: { trayId: string; trayCode: string }) {
  const action = async (_: ActionState, formData: FormData) => reopenTray(trayId, trayCode, formData);
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction} className="card p-5">
      <h2 className="font-extrabold">Administrator action</h2>
      <p className="muted mt-2 text-sm">Reopening requires a reason and creates an audit event.</p>
      {state.error && <div className="notice notice-error mt-4">{state.error}</div>}
      {state.success && <div className="notice notice-success mt-4">{state.success}</div>}
      <label className="label mt-5" htmlFor="reopen-reason">Reopen reason</label>
      <textarea className="field min-h-24" id="reopen-reason" name="reason" required minLength={5} maxLength={1000} />
      <button className="btn btn-danger mt-3" disabled={pending} type="submit">{pending ? "Reopening…" : "Reopen completed tray"}</button>
    </form>
  );
}
