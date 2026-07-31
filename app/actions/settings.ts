"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { DEMO_COOKIE } from "@/lib/demo-mode";

export async function setDemoMode(enabled: boolean) {
  await requireProfile(["administrator"]);
  (await cookies()).set(DEMO_COOKIE, enabled ? "1" : "0", {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: enabled ? 60 * 60 * 8 : 0,
  });
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/settings?demo=${enabled ? "on" : "off"}`);
}
