"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle, MailCheck, UserPlus } from "lucide-react";
import { signUp, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, initialState);

  if (state.success) {
    return (
      <div className="mt-7 text-center" role="status">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e2f3e9] text-[var(--green)]">
          <MailCheck size={28} aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-black">Confirm your email</h2>
        <p className="muted mt-3 leading-6">{state.success}</p>
        <Link href="/login" className="btn btn-primary mt-6 w-full">Return to sign in</Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-7 space-y-5" noValidate>
      {state.error && <div className="notice notice-error" role="alert">{state.error}</div>}
      <div>
        <label className="label" htmlFor="displayName">Full name</label>
        <input className="field" id="displayName" name="displayName" autoComplete="name" required maxLength={120} />
      </div>
      <div>
        <label className="label" htmlFor="registerEmail">Work email</label>
        <input className="field" id="registerEmail" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="registerPassword">Password</label>
        <input className="field" id="registerPassword" name="password" type="password" autoComplete="new-password" minLength={12} required aria-describedby="password-help" />
        <p id="password-help" className="muted mt-2 text-xs leading-5">At least 12 characters with uppercase, lowercase, and a number.</p>
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">Confirm password</label>
        <input className="field" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required />
      </div>
      <div className="notice notice-info text-sm">
        New accounts start as process operators. Elevated access is assigned by an administrator.
      </div>
      <button className="btn btn-primary w-full" disabled={pending} type="submit">
        {pending ? <LoaderCircle className="animate-spin" size={20} aria-hidden /> : <UserPlus size={20} aria-hidden />}
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
