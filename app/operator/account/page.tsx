import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { requireProfile } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/domain";

export default async function AccountPage() {
  const profile = await requireProfile();
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
    </main>
  );
}
