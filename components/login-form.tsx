"use client";

import { useActionState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import { signIn, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initialState);
  return (
    <form action={action} className="mt-7 space-y-5" noValidate>
      {state.error && <div className="notice notice-error" role="alert">{state.error}</div>}
      <div>
        <label className="label" htmlFor="email">Work email</label>
        <input className="field" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="field" id="password" name="password" type="password" autoComplete="current-password" minLength={8} required />
      </div>
      <button className="btn btn-primary w-full" disabled={pending} type="submit">
        {pending ? <LoaderCircle className="animate-spin" size={20} aria-hidden /> : <LogIn size={20} aria-hidden />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
