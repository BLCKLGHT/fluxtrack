"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseSampleNumbers, physicalTrayCodeSchema } from "@/lib/validation";
import type { ActionState } from "@/app/actions/trays";
import { SUPABASE_URL } from "@/lib/config";

const userSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(12).max(128),
  role: z.enum(["process_operator", "team_viewer", "administrator"]),
});

export async function createUser(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireProfile(["administrator"]);
  const parsed = userSchema.safeParse({
    displayName: formData.get("displayName"), email: formData.get("email"),
    password: formData.get("password"), role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the user details." };
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return { error: "Server administration credentials are not configured." };
  const admin = createAdminClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { display_name: parsed.data.displayName },
  });
  if (error || !data.user) return { error: "The user could not be created. The email may already exist." };
  const { error: profileError } = await admin.from("profiles").update({ role: parsed.data.role }).eq("id", data.user.id);
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "The user profile could not be created." };
  }
  revalidatePath("/dashboard/users");
  return { success: "User created. Share the temporary password through an approved secure channel." };
}

export async function setUserActive(userId: string, active: boolean) {
  await requireProfile(["administrator"]);
  const supabase = await createClient();
  await supabase.from("profiles").update({ active }).eq("id", userId);
  revalidatePath("/dashboard/users");
}

const accessSchema = z.object({
  role: z.enum(["process_operator", "team_viewer", "administrator"]),
  active: z.boolean(),
  issueEmailEnabled: z.boolean(),
});

export async function updateUserAccess(userId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireProfile(["administrator"]);
  if (!z.string().uuid().safeParse(userId).success) return { error: "Invalid user." };
  const parsed = accessSchema.safeParse({
    role: formData.get("role"), active: formData.get("active") === "on",
    issueEmailEnabled: formData.get("issueEmailEnabled") === "on",
  });
  if (!parsed.success) return { error: "Check the access settings." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_user_access", {
    p_profile_id: userId, p_role: parsed.data.role, p_active: parsed.data.active,
    p_issue_email_enabled: parsed.data.issueEmailEnabled,
  });
  if (error) return { error: error.message.includes("own account") ? error.message : "The user settings could not be updated." };
  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${userId}`);
  return { success: "User access and notifications updated." };
}

export async function setCategoryActive(categoryId: string, active: boolean) {
  await requireProfile(["administrator"]);
  const supabase = await createClient();
  await supabase.from("issue_categories").update({ active }).eq("id", categoryId);
  revalidatePath("/dashboard/settings/categories");
}

const traySchema = z.object({
  trayCode: physicalTrayCodeSchema,
  trayName: z.string().trim().min(2).max(120),
  source: z.string().trim().min(2).max(120),
  samples: z.string().trim().min(1),
});

export async function createTray(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireProfile(["administrator"]);
  const parsed = traySchema.safeParse({
    trayCode: formData.get("trayCode"), trayName: formData.get("trayName"),
    source: formData.get("source"), samples: formData.get("samples"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the tray details." };
  let sampleNumbers: string[];
  try {
    sampleNumbers = parseSampleNumbers(parsed.data.samples);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Check the sample numbers." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_tray_template", {
    p_tray_code: parsed.data.trayCode,
    p_tray_name: parsed.data.trayName,
    p_source: parsed.data.source,
    p_sample_numbers: sampleNumbers,
  });
  if (error) return { error: "The physical tray could not be created. Check that its code and sample numbers are unique." };
  revalidatePath("/dashboard/trays");
  revalidatePath("/dashboard/workflow");
  revalidatePath("/dashboard/labels");
  return { success: "Physical tray created. Its permanent QR label is ready to print." };
}

export async function voidIssue(issueId: string, trayCode: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireProfile(["administrator"]);
  const reason = z.string().trim().min(5).max(1000).safeParse(formData.get("reason"));
  if (!reason.success) return { error: "Enter a reason of at least 5 characters." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_issue", { p_issue_id: issueId, p_reason: reason.data });
  if (error) return { error: "The issue could not be voided. It may already be inactive." };
  revalidatePath(`/dashboard/trays/${trayCode}`);
  return { success: "Issue voided. The original record and photograph are preserved." };
}
