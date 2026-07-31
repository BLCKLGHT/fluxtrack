"use client";

import { useActionState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { startTrayRun, type ActionState } from "@/app/actions/trays";

const initial: ActionState = {};

export function StartTrayRunButton({ templateId, resume = false }: { templateId: string; resume?: boolean }) {
  const action = startTrayRun.bind(null, templateId);
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction}>
      {state.error && <div className="notice notice-error mb-3">{state.error}</div>}
      <button className="btn btn-accent w-full" disabled={pending}>
        {resume ? <RotateCcw size={20} aria-hidden /> : <Play size={20} aria-hidden />}
        {pending ? "Opening…" : resume ? "Resume current run" : "Start today’s run"}
      </button>
    </form>
  );
}
