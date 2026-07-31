import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { IssueCategory, SampleIssue, Tray, TrayTemplate } from "@/lib/domain";
import { buildDemoData } from "@/lib/demo-data";

export const getTray = cache(async (trayCode: string, includeDemo = false): Promise<Tray> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trays")
    .select(`
      *,
      tray_templates(tray_code),
      samples (
        *,
        sample_issues (
          *,
          issue_categories (name, code),
          profiles:profiles!sample_issues_reported_by_fkey (display_name)
        )
      )
    `)
    .eq("tray_code", trayCode.toUpperCase())
    .order("sample_number", { referencedTable: "samples", ascending: true })
    .single();
  if (error || !data) {
    const demoTray = includeDemo ? buildDemoData().trays.find((item) => item.tray_code === trayCode.toUpperCase()) : null;
    if (demoTray) return demoTray;
    notFound();
  }
  return data as unknown as Tray;
});

export async function getCategories(): Promise<IssueCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issue_categories")
    .select("*")
    .eq("active", true)
    .order("display_order");
  if (error) throw new Error("Unable to load issue categories.");
  return data as IssueCategory[];
}

export async function getTrays(statuses?: string[], includeDemo = false): Promise<Tray[]> {
  const supabase = await createClient();
  let query = supabase
    .from("trays")
    .select(`
      *,
      received_profile:profiles!trays_received_by_fkey(display_name),
      completed_profile:profiles!trays_completed_by_fkey(display_name),
      samples(id, status, sample_issues(id, status))
    `)
    .order("created_at", { ascending: false });
  if (statuses?.length) query = query.in("status", statuses);
  const { data, error } = await query;
  if (error) throw new Error("Unable to load trays.");
  const real = data as unknown as Tray[];
  if (!includeDemo) return real;
  const demo = buildDemoData().trays.filter((tray) => !statuses?.length || statuses.includes(tray.status));
  return [...real, ...demo];
}

export async function getTrayTemplates(includeDemo = false): Promise<TrayTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tray_templates")
    .select(`
      *,
      tray_template_samples(*),
      trays(id, tray_code, status, run_number, processing_date, created_at, received_at, completed_at)
    `)
    .order("tray_code")
    .order("display_order", { referencedTable: "tray_template_samples", ascending: true })
    .order("created_at", { referencedTable: "trays", ascending: false });
  if (error) throw new Error("Unable to load the physical tray workflow.");
  const real = data as unknown as TrayTemplate[];
  return includeDemo ? [...real, ...buildDemoData().templates] : real;
}

export async function getOpenRunForPhysicalTray(trayCode: string): Promise<Pick<Tray, "id" | "tray_code" | "status"> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trays")
    .select("id, tray_code, status, tray_templates!inner(tray_code)")
    .eq("tray_templates.tray_code", trayCode.toUpperCase())
    .in("status", ["created", "received", "in_progress", "reopened"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Unable to resolve the physical tray.");
  return data as unknown as Pick<Tray, "id" | "tray_code" | "status"> | null;
}

export const getTrayTemplate = cache(async (trayCode: string, includeDemo = false): Promise<TrayTemplate> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tray_templates")
    .select(`
      *,
      tray_template_samples(*),
      trays(*, samples(id, status, sample_issues(id, sample_id, status)))
    `)
    .eq("tray_code", trayCode.toUpperCase())
    .order("display_order", { referencedTable: "tray_template_samples", ascending: true })
    .order("created_at", { referencedTable: "trays", ascending: false })
    .single();
  if (error || !data) {
    const demoTemplate = includeDemo ? buildDemoData().templates.find((item) => item.tray_code === trayCode.toUpperCase()) : null;
    if (demoTemplate) return demoTemplate;
    notFound();
  }
  return data as unknown as TrayTemplate;
});

export async function getIssues(includeDemo = false): Promise<SampleIssue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sample_issues")
    .select(`
      *,
      issue_categories (name, code),
      profiles:profiles!sample_issues_reported_by_fkey (display_name),
      samples (sample_number),
      trays (tray_code)
    `)
    .order("reported_at", { ascending: false });
  if (error) throw new Error("Unable to load issues.");
  const real = data as unknown as SampleIssue[];
  if (!includeDemo) return real;
  return [...real, ...buildDemoData(await getCategories()).issues];
}

export async function getDashboardData(includeDemo = false) {
  const [trays, issues] = await Promise.all([getTrays(undefined, includeDemo), getIssues(includeDemo)]);
  return { trays, issues };
}

export async function getAuditForEntity(entityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_events")
    .select("*, profiles:profiles!audit_events_actor_id_fkey(display_name)")
    .eq("entity_id", entityId)
    .order("occurred_at", { ascending: false });
  if (error) return [];
  return data;
}
