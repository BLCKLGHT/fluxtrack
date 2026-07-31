"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { receiveTray } from "@/app/actions/trays";

export function ReceiveTrayButton({ trayId, trayCode, version }: { trayId: string; trayCode: string; version: number }) {
  const [state, setState] = useState<{ error?: string; success?: string }>({});
  const [pending, startTransition] = useTransition();
  return (
    <div>
      {state.error && <div className="notice notice-error mb-3" role="alert">{state.error}</div>}
      {state.success && <div className="notice notice-success mb-3" role="status">{state.success}</div>}
      <button className="btn btn-accent w-full !min-h-16 text-lg" disabled={pending} onClick={() => {
        startTransition(async () => setState(await receiveTray(trayId, trayCode, version)));
      }}>
        {pending ? <LoaderCircle className="animate-spin" size={23} aria-hidden /> : <Check size={23} aria-hidden />}
        {pending ? "Logging receipt…" : "Log Tray Received"}
      </button>
    </div>
  );
}
