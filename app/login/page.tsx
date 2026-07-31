import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { getSessionProfile } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/config";
import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  if (hasSupabaseEnv() && (await getSessionProfile())) redirect("/operator");
  const { message } = await searchParams;
  return (
    <main id="main" className="shell grid min-h-screen items-center gap-12 py-10 lg:grid-cols-2">
      <section className="max-w-xl">
        <Brand />
        <p className="eyebrow mt-16">Secure access</p>
        <h1 className="display mt-4">Back to the work in seconds.</h1>
        <p className="muted mt-6 text-lg leading-8">Sign in to receive a tray, capture evidence, or review laboratory records.</p>
      </section>
      <section className="card mx-auto w-full max-w-md p-7 sm:p-9">
        <h2 className="page-title">Sign in</h2>
        <p className="muted mt-3">Use your FluxTrack account.</p>
        <p className="muted mt-2 text-sm">Need an account? <Link href="/register" className="font-bold text-[var(--green)]">Register here</Link></p>
        {message && <div className="notice notice-info mt-5">{message}</div>}
        {!hasSupabaseEnv() ? (
          <div className="notice notice-error mt-6" role="alert">
            Supabase is not configured. Copy <code>.env.example</code> to <code>.env.local</code> and add the project values.
          </div>
        ) : <LoginForm />}
      </section>
    </main>
  );
}
