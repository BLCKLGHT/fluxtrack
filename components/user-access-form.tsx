"use client";

import { useActionState } from "react";
import { updateUserAccess } from "@/app/actions/admin";
import type { ActionState } from "@/app/actions/trays";
import type { Profile } from "@/lib/domain";

const initial: ActionState = {};

export function UserAccessForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateUserAccess.bind(null, profile.id), initial);
  return <form action={action} className="card mt-7 p-6">
    <h2 className="text-xl font-black">Access and privileges</h2>
    <p className="muted mt-2 text-sm">Roles are controlled privilege bundles and are enforced by Supabase policies and server actions.</p>
    {state.error && <div className="notice notice-error mt-4">{state.error}</div>}
    {state.success && <div className="notice notice-success mt-4">{state.success}</div>}
    <fieldset className="mt-5 grid gap-3">
      <legend className="label">Role</legend>
      {[
        ["process_operator", "Process operator", "Scan trays, report flagged samples, and complete processing runs."],
        ["team_viewer", "Team viewer", "View dashboards, evidence, filters, and exports without changing operations."],
        ["administrator", "Administrator", "Full dashboard, user, configuration, audit, and operational access."],
      ].map(([value, label, description]) => <label key={value} className="flex cursor-pointer gap-3 rounded-2xl border border-[var(--line)] p-4"><input type="radio" name="role" value={value} defaultChecked={profile.role === value} className="mt-1" /><span><strong>{label}</strong><span className="muted mt-1 block text-sm">{description}</span></span></label>)}
    </fieldset>
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <label className="flex items-start gap-3 rounded-2xl bg-[#f3f6f4] p-4"><input type="checkbox" name="active" defaultChecked={profile.active} className="mt-1" /><span><strong>Account active</strong><span className="muted mt-1 block text-sm">Allows this user to sign in and use assigned privileges.</span></span></label>
      <label className="flex items-start gap-3 rounded-2xl bg-[#f3f6f4] p-4"><input type="checkbox" name="issueEmailEnabled" defaultChecked={profile.notification_preferences?.issue_email_enabled ?? false} className="mt-1" /><span><strong>Email flagged samples</strong><span className="muted mt-1 block text-sm">Send an email whenever a sample issue is recorded.</span></span></label>
    </div>
    <button className="btn btn-primary mt-6" disabled={pending}>{pending ? "Saving…" : "Save user settings"}</button>
  </form>;
}
