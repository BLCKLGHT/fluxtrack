"use client";

import { useActionState } from "react";
import { voidIssue } from "@/app/actions/admin";
import type { ActionState } from "@/app/actions/trays";

const initial: ActionState = {};

export function VoidIssueForm({ issueId, trayCode }: { issueId: string; trayCode: string }) {
  const action = voidIssue.bind(null, issueId, trayCode);
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction} className="mt-4 rounded-xl border border-[#ead0d0] bg-[#fff7f7] p-3">
      {state.error && <p className="text-sm font-bold text-[var(--red)]">{state.error}</p>}
      {state.success && <p className="text-sm font-bold text-[var(--green)]">{state.success}</p>}
      {!state.success && <div className="flex flex-wrap items-end gap-2"><div className="min-w-52 flex-1"><label className="label" htmlFor={`void-${issueId}`}>Void reason</label><input className="field !min-h-11" id={`void-${issueId}`} name="reason" minLength={5} required /></div><button className="btn btn-danger !min-h-11" disabled={pending}>{pending ? "Voiding…" : "Void issue"}</button></div>}
    </form>
  );
}
