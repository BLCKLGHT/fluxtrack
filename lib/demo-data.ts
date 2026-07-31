import type { IssueCategory, Sample, SampleIssue, Tray, TrayStatus, TrayTemplate } from "@/lib/domain";

const operators = ["Ava Chen", "Noah Williams", "Mia Patel", "Jack Thompson"];
const statuses: TrayStatus[] = ["created", "received", "in_progress", "completed", "received"];

function uuid(value: number) {
  return `d0000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function ago(days: number, hours = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(9 + hours, 10, 0, 0);
  return date.toISOString();
}

function categoryAt(categories: IssueCategory[], index: number) {
  return categories[index % Math.max(categories.length, 1)] ?? {
    id: uuid(900 + index), code: "TOO_CRUMBLY", name: "Too crumbly for X-ray analysis",
    description: null, default_stage: "xray_analysis" as const, ownership: "potrooms" as const,
    requires_comment: false, active: true, display_order: 1,
  };
}

export function buildDemoData(categories: IssueCategory[] = []) {
  const trays: Tray[] = [];
  const issues: SampleIssue[] = [];
  const templates: TrayTemplate[] = [];

  for (let trayIndex = 1; trayIndex <= 15; trayIndex += 1) {
    const templateId = uuid(1000 + trayIndex);
    const physicalCode = `DEMO-T${String(trayIndex).padStart(2, "0")}`;
    const sampleCount = 20 + (trayIndex % 6);
    const templateSamples = Array.from({ length: sampleCount }, (_, sampleIndex) => ({
      id: uuid(100000 + trayIndex * 100 + sampleIndex), template_id: templateId,
      sample_number: String(3000 + trayIndex * 100 + sampleIndex + 1),
      pot_cell_number: 3000 + trayIndex * 100 + sampleIndex + 1, display_order: sampleIndex + 1,
    }));
    const templateRuns: Tray[] = [];

    for (let runNumber = 1; runNumber <= 2; runNumber += 1) {
      const trayId = uuid(2000 + trayIndex * 10 + runNumber);
      const isLatest = runNumber === 2;
      const status: TrayStatus = isLatest ? statuses[(trayIndex - 1) % statuses.length]! : "completed";
      const daysAgo = (15 - trayIndex) + (isLatest ? 0 : 18);
      const receivedAt = status === "created" ? null : ago(daysAgo, 1);
      const completedAt = status === "completed" ? ago(daysAgo, 4) : null;
      const samples: Sample[] = templateSamples.map((configured, sampleIndex) => {
        const hasIssue = sampleIndex === (trayIndex % sampleCount) || (sampleIndex === 7 && trayIndex % 3 === 0);
        const sampleId = uuid(300000 + trayIndex * 1000 + runNumber * 100 + sampleIndex);
        const sampleIssues: SampleIssue[] = [];
        if (hasIssue && status !== "created") {
          const category = categoryAt(categories, trayIndex + sampleIndex);
          const issue: SampleIssue = {
            id: uuid(500000 + trayIndex * 1000 + runNumber * 100 + sampleIndex), sample_id: sampleId,
            category_id: category.id, processing_stage: category.default_stage ?? "pressing",
            comment: sampleIndex === 7 ? "Sample required a repeat check during processing." : null,
            ownership_snapshot: category.ownership, reported_at: ago(daysAgo, 2), reported_by: uuid(800),
            photo_storage_path: "", photo_mime_type: "image/jpeg", photo_size_bytes: 0, status: "active",
            issue_categories: { name: category.name, code: category.code },
            profiles: { display_name: operators[trayIndex % operators.length]! },
            samples: { sample_number: configured.sample_number }, trays: { tray_code: `${physicalCode}-R00${runNumber}` }, is_demo: true,
          };
          sampleIssues.push(issue); issues.push(issue);
        }
        return {
          id: sampleId, tray_id: trayId, sample_number: configured.sample_number,
          pot_cell_number: configured.pot_cell_number,
          status: hasIssue && status !== "created" ? "issue_reported" : status === "completed" ? "processed" : "pending",
          sample_issues: sampleIssues,
        };
      });
      const operator = operators[trayIndex % operators.length]!;
      const tray: Tray = {
        id: trayId, tray_code: `${physicalCode}-R00${runNumber}`, tray_name: `Cell samples ${trayIndex}`,
        source: trayIndex % 2 ? "Potroom North" : "Potroom South", status, created_at: ago(daysAgo),
        received_at: receivedAt, received_by: receivedAt ? uuid(800) : null,
        completed_at: completedAt, completed_by: completedAt ? uuid(800) : null,
        reopened_at: null, reopened_by: null, reopen_reason: null, version: 1,
        template_id: templateId, run_number: runNumber, processing_date: ago(daysAgo).slice(0, 10), samples,
        received_profile: receivedAt ? { display_name: operator } : null,
        completed_profile: completedAt ? { display_name: operator } : null, is_demo: true,
        tray_templates: { tray_code: physicalCode },
      };
      trays.push(tray); templateRuns.unshift(tray);
    }
    templates.push({
      id: templateId, tray_code: physicalCode, tray_name: `Cell samples ${trayIndex}`,
      source: trayIndex % 2 ? "Potroom North" : "Potroom South", active: true,
      created_at: ago(60 + trayIndex), tray_template_samples: templateSamples, trays: templateRuns, is_demo: true,
    });
  }
  return { trays, issues, templates };
}
