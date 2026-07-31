import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { IssueCategory, SampleIssue, Tray } from "@/lib/domain";

export const getTray = cache(async (trayCode: string): Promise<Tray> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trays")
    .select(`
      *,
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
  if (error || !data) notFound();
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

export async function getTrays(statuses?: string[]): Promise<Tray[]> {
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
  return data as unknown as Tray[];
}

export async function getIssues(): Promise<SampleIssue[]> {
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
  return data as unknown as SampleIssue[];
}

export async function getDashboardData() {
  const [trays, issues] = await Promise.all([getTrays(), getIssues()]);
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
