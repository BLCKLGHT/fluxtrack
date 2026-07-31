"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { reasonSchema, trayCodeSchema } from "@/lib/validation";

export type ActionState = { error?: string; success?: string };

function friendlyDatabaseError(message: string) {
  if (/changed/i.test(message)) return "This tray changed. Refresh and try again.";
  if (/not found/i.test(message)) return "The tray could not be found.";
  if (/not authorised|permission/i.test(message)) return "You do not have permission for that action.";
  if (/current state|awaiting receipt|completed/i.test(message)) return message;
  return "The action could not be completed. Please try again.";
}

export async function receiveTray(trayId: string, trayCode: string, version: number): Promise<ActionState> {
  await requireProfile(["process_operator", "administrator"]);
  const safeCode = trayCodeSchema.parse(trayCode);
  const supabase = await createClient();
  const { error } = await supabase.rpc("log_tray_received", {
    p_tray_id: trayId,
    p_expected_version: version,
  });
  if (error) return { error: friendlyDatabaseError(error.message) };
  revalidatePath(`/operator/trays/${safeCode}`);
  return { success: "Tray received. Samples are ready." };
}

export async function completeTray(trayId: string, trayCode: string, version: number): Promise<ActionState> {
  await requireProfile(["process_operator", "administrator"]);
  const safeCode = trayCodeSchema.parse(trayCode);
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_tray", {
    p_tray_id: trayId,
    p_expected_version: version,
  });
  if (error) return { error: friendlyDatabaseError(error.message) };
  revalidatePath(`/operator/trays/${safeCode}`);
  revalidatePath("/dashboard");
  redirect(`/operator/trays/${safeCode}/complete?done=1`);
}

export async function reopenTray(trayId: string, trayCode: string, formData: FormData): Promise<ActionState> {
  await requireProfile(["administrator"]);
  const parsed = reasonSchema.safeParse(formData.get("reason"));
  if (!parsed.success) return { error: "Enter a reason of at least 5 characters." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("reopen_tray", {
    p_tray_id: trayId,
    p_reason: parsed.data,
  });
  if (error) return { error: friendlyDatabaseError(error.message) };
  revalidatePath(`/dashboard/trays/${trayCode}`);
  return { success: "Tray reopened with an audit record." };
}
