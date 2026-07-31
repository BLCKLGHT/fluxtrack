import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { RegisterForm } from "@/components/register-form";
import { getSessionProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getSessionProfile()) redirect("/operator");

  return (
    <main id="main" className="shell grid min-h-screen items-center gap-12 py-10 lg:grid-cols-2">
      <section className="max-w-xl">
        <Brand />
        <p className="eyebrow mt-16">Operator access</p>
        <h1 className="display mt-4">Create your FluxTrack account.</h1>
        <p className="muted mt-6 text-lg leading-8">
          Register with your work email, confirm it, and start receiving and processing assigned laboratory trays.
        </p>
      </section>
      <section className="card mx-auto w-full max-w-md p-7 sm:p-9">
        <h2 className="page-title">Register</h2>
        <p className="muted mt-3">Already registered? <Link href="/login" className="font-bold text-[var(--green)]">Sign in</Link></p>
        <RegisterForm />
      </section>
    </main>
  );
}
