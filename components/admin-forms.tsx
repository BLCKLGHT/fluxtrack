"use client";

import { useActionState } from "react";
import { createTray, createUser } from "@/app/actions/admin";
import type { ActionState } from "@/app/actions/trays";

const initial: ActionState = {};

function Feedback({ state }: { state: ActionState }) {
  if (state.error) return <div className="notice notice-error mt-4">{state.error}</div>;
  if (state.success) return <div className="notice notice-success mt-4">{state.success}</div>;
  return null;
}

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, initial);
  return (
    <form action={action} className="card p-5">
      <h2 className="font-extrabold">Add user</h2><Feedback state={state} />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div><label className="label" htmlFor="displayName">Display name</label><input className="field" id="displayName" name="displayName" required /></div>
        <div><label className="label" htmlFor="newEmail">Email</label><input className="field" id="newEmail" name="email" type="email" required /></div>
        <div><label className="label" htmlFor="tempPassword">Temporary password</label><input className="field" id="tempPassword" name="password" type="password" minLength={12} required /></div>
        <div><label className="label" htmlFor="newRole">Role</label><select className="field" id="newRole" name="role"><option value="process_operator">Process operator</option><option value="team_viewer">Team viewer</option><option value="administrator">Administrator</option></select></div>
      </div>
      <button className="btn btn-primary mt-4" disabled={pending}>{pending ? "Creating…" : "Create user"}</button>
    </form>
  );
}

export function CreateTrayForm() {
  const [state, action, pending] = useActionState(createTray, initial);
  return (
    <form action={action} className="card mt-7 p-5">
      <h2 className="font-extrabold">Create tray</h2><Feedback state={state} />
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div><label className="label" htmlFor="newTrayCode">Tray code</label><input className="field uppercase" id="newTrayCode" name="trayCode" required /></div>
        <div><label className="label" htmlFor="newTrayName">Tray name</label><input className="field" id="newTrayName" name="trayName" required /></div>
        <div><label className="label" htmlFor="newTraySource">Source</label><input className="field" id="newTraySource" name="source" required /></div>
        <div><label className="label" htmlFor="startSample">First sample</label><input className="field" id="startSample" name="startSample" type="number" required /></div>
        <div><label className="label" htmlFor="endSample">Last sample</label><input className="field" id="endSample" name="endSample" type="number" required /></div>
      </div>
      <button className="btn btn-primary mt-4" disabled={pending}>{pending ? "Creating…" : "Create tray and samples"}</button>
    </form>
  );
}
