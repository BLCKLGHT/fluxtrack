"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { completeTray } from "@/app/actions/trays";

export function CompleteTrayForm({ trayId, trayCode, version }: { trayId: string; trayCode: string; version: number }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <>
      {error && <div className="notice notice-error mb-4" role="alert">{error}</div>}
      <button className="btn btn-primary w-full !min-h-16" disabled={pending} onClick={() => {
        startTransition(async () => {
          const result = await completeTray(trayId, trayCode, version);
          if (result?.error) setError(result.error);
        });
      }}>
        {pending ? <LoaderCircle className="animate-spin" size={22} aria-hidden /> : <CheckCircle2 size={22} aria-hidden />}
        {pending ? "Completing tray…" : "Yes, complete tray"}
      </button>
    </>
  );
}
