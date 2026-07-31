export type UserRole = "process_operator" | "team_viewer" | "administrator";
export type TrayStatus = "created" | "received" | "in_progress" | "completed" | "reopened";
export type SampleStatus = "pending" | "issue_reported" | "processed";
export type ProcessingStage = "pressing" | "xray_analysis" | "other";
export type IssueOwnership = "potrooms" | "laboratory" | "equipment" | "unclassified";

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface IssueCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  default_stage: ProcessingStage | null;
  ownership: IssueOwnership;
  requires_comment: boolean;
  active: boolean;
  display_order: number;
}

export interface SampleIssue {
  id: string;
  sample_id: string;
  category_id: string;
  processing_stage: ProcessingStage;
  comment: string | null;
  ownership_snapshot: IssueOwnership;
  reported_at: string;
  reported_by: string;
  photo_storage_path: string;
  photo_mime_type: string;
  photo_size_bytes: number;
  status: "active" | "superseded" | "voided";
  issue_categories?: Pick<IssueCategory, "name" | "code"> | null;
  profiles?: Pick<Profile, "display_name"> | null;
  samples?: { sample_number: string } | null;
  trays?: { tray_code: string } | null;
}

export interface Sample {
  id: string;
  tray_id: string;
  sample_number: string;
  pot_cell_number: number | null;
  status: SampleStatus;
  sample_issues?: SampleIssue[];
}

export interface Tray {
  id: string;
  tray_code: string;
  tray_name: string;
  source: string;
  status: TrayStatus;
  created_at: string;
  received_at: string | null;
  received_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
  reopened_at: string | null;
  reopened_by: string | null;
  reopen_reason: string | null;
  version: number;
  samples?: Sample[];
  received_profile?: Pick<Profile, "display_name"> | null;
  completed_profile?: Pick<Profile, "display_name"> | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  process_operator: "Process operator",
  team_viewer: "Team viewer",
  administrator: "Administrator",
};

export const TRAY_STATUS_LABELS: Record<TrayStatus, string> = {
  created: "Awaiting receipt",
  received: "Received",
  in_progress: "In progress",
  completed: "Completed",
  reopened: "Reopened",
};

export const SAMPLE_STATUS_LABELS: Record<SampleStatus, string> = {
  pending: "No issue recorded",
  issue_reported: "Issue reported",
  processed: "Processed",
};

export const STAGE_LABELS: Record<ProcessingStage, string> = {
  pressing: "Pressing",
  xray_analysis: "X-ray analysis",
  other: "Other processing stage",
};
