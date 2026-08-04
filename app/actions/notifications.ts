"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deliverPendingNotifications } from "@/lib/notifications";
import type { ActionState } from "@/app/actions/trays";

export async function setMyIssueNotifications(enabled: boolean) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_my_issue_email_subscription", { p_enabled: enabled });
  if (error) throw new Error("Your notification preference could not be updated.");
  revalidatePath("/operator/account");
}

export async function deliverNotificationsNow(previousState: ActionState): Promise<ActionState> {
  void previousState;
  await requireProfile(["administrator"]);
  try {
    const result = await deliverPendingNotifications(100);
    revalidatePath("/dashboard/settings");
    if (!result.configured) return { error: "Email delivery needs Resend and server credentials in Vercel before messages can be sent." };
    return { success: `Delivery complete: ${result.sent} sent, ${result.failed} failed.` };
  } catch {
    return { error: "Pending notifications could not be delivered. Check the provider configuration and try again." };
  }
}
