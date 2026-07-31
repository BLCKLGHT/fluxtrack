"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { trayCodeSchema } from "@/lib/validation";
import type { ActionState } from "@/app/actions/trays";

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { error: "Server administration credentials are not configured." };
  const admin = createAdminClient(url, serviceKey, { auth: { persistSession: false } });
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

export async function setCategoryActive(categoryId: string, active: boolean) {
  await requireProfile(["administrator"]);
  const supabase = await createClient();
  await supabase.from("issue_categories").update({ active }).eq("id", categoryId);
  revalidatePath("/dashboard/settings/categories");
}

const traySchema = z.object({
  trayCode: trayCodeSchema,
  trayName: z.string().trim().min(2).max(120),
  source: z.string().trim().min(2).max(120),
  startSample: z.coerce.number().int().positive(),
  endSample: z.coerce.number().int().positive(),
}).refine((data) => data.endSample >= data.startSample && data.endSample - data.startSample <= 200, {
  message: "Choose a valid sample range of no more than 201 samples.",
});

export async function createTray(_: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await requireProfile(["administrator"]);
  const parsed = traySchema.safeParse({
    trayCode: formData.get("trayCode"), trayName: formData.get("trayName"),
    source: formData.get("source"), startSample: formData.get("startSample"),
    endSample: formData.get("endSample"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the tray details." };
  const supabase = await createClient();
  const { data: tray, error } = await supabase.from("trays").insert({
    tray_code: parsed.data.trayCode, tray_name: parsed.data.trayName,
    source: parsed.data.source, created_by: profile.id,
  }).select("id").single();
  if (error || !tray) return { error: "The tray could not be created. Check that the code is unique." };
  const samples = Array.from({ length: parsed.data.endSample - parsed.data.startSample + 1 }, (_, index) => {
    const number = parsed.data.startSample + index;
    return { tray_id: tray.id, sample_number: String(number), pot_cell_number: number };
  });
  const { error: samplesError } = await supabase.from("samples").insert(samples);
  if (samplesError) return { error: "The tray was created but its samples require administrator attention." };
  revalidatePath("/dashboard/trays");
  return { success: "Tray and samples created." };
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
