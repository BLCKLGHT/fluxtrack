import { TRAY_STATUS_LABELS, SAMPLE_STATUS_LABELS, type TrayStatus, type SampleStatus } from "@/lib/domain";

export function TrayStatusBadge({ status }: { status: TrayStatus }) {
  return <span className={`status status-${status}`}>{TRAY_STATUS_LABELS[status]}</span>;
}

export function SampleStatusBadge({ status }: { status: SampleStatus }) {
  return <span className={`status status-${status}`}>{SAMPLE_STATUS_LABELS[status]}</span>;
}
