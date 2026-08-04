import { CreateUserForm } from "@/components/admin-forms";
import { setUserActive } from "@/app/actions/admin";
import { requireProfile } from "@/lib/auth";
import { ROLE_LABELS, type Profile } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function UsersPage() {
  await requireProfile(["administrator"]);
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*, notification_preferences(issue_email_enabled)").order("created_at", { ascending: false });
  const profiles = (data ?? []) as (Profile & { created_at: string })[];
  return (
    <main id="main">
      <p className="eyebrow">Administration</p><h1 className="page-title mt-3">Users</h1>
      <p className="muted mt-3">Create prototype accounts and deactivate access. Roles are held in the database, not editable user metadata.</p>
      <div className="mt-7"><CreateUserForm /></div>
      <div className="table-wrap mt-7">
        <table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Status</th><th>Flag emails</th><th>Action</th></tr></thead>
          <tbody>{profiles.map((profile) => <tr key={profile.id}><td><strong>{profile.display_name}</strong></td><td>{profile.email}</td><td>{ROLE_LABELS[profile.role]}</td><td>{formatDate(profile.created_at)}</td><td>{profile.active ? "Active" : "Inactive"}</td><td>{profile.notification_preferences?.issue_email_enabled ? "Subscribed" : "Off"}</td><td><div className="flex gap-2"><Link href={`/dashboard/users/${profile.id}`} className="btn btn-secondary !min-h-10 !px-3 !py-2">Manage</Link><form action={setUserActive.bind(null, profile.id, !profile.active)}><button className="btn btn-secondary !min-h-10 !px-3 !py-2" type="submit">{profile.active ? "Deactivate" : "Reactivate"}</button></form></div></td></tr>)}</tbody>
        </table>
      </div>
    </main>
  );
}
