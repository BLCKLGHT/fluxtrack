import { Bell, BellOff, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { setMyIssueNotifications } from "@/app/actions/notifications";
import { requireProfile } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/domain";

export default async function AccountPage() {
  const profile = await requireProfile();
  const subscribed = profile.notification_preferences?.issue_email_enabled ?? false;
  return (
    <main id="main" className="operator-shell">
      <p className="eyebrow mt-8">Account</p><h1 className="page-title mt-3">{profile.display_name}</h1>
      <section className="card mt-7 p-6">
        <dl className="grid gap-5">
          <div><dt className="muted text-xs font-bold uppercase tracking-wider">Email</dt><dd className="mt-1 font-bold">{profile.email}</dd></div>
          <div><dt className="muted text-xs font-bold uppercase tracking-wider">Role</dt><dd className="mt-1 font-bold">{ROLE_LABELS[profile.role]}</dd></div>
        </dl>
        <form action={signOut} className="mt-7"><button className="btn btn-secondary w-full" type="submit"><LogOut size={19} aria-hidden /> Sign out</button></form>
      </section>
      <section className="card mt-5 p-6">
        <div className="flex items-start gap-3">{subscribed ? <Bell className="text-[var(--green)]" /> : <BellOff className="muted" />}<div><h2 className="font-black">Flagged sample emails</h2><p className="muted mt-2 text-sm">Receive an email when any sample is flagged, even when you are not checking the dashboard.</p></div></div>
        <div className={`notice mt-5 ${subscribed ? "notice-success" : "notice-info"}`}>{subscribed ? `Subscribed at ${profile.email}` : "Email notifications are off."}</div>
        <form action={setMyIssueNotifications.bind(null, !subscribed)} className="mt-4"><button className="btn btn-secondary w-full" type="submit">{subscribed ? "Unsubscribe from emails" : "Subscribe to flagged sample emails"}</button></form>
      </section>
    </main>
  );
}
