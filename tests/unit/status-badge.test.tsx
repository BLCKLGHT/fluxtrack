import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SampleStatusBadge, TrayStatusBadge } from "@/components/status-badge";

describe("status badges", () => {
  it("always includes a readable tray label", () => {
    render(<TrayStatusBadge status="in_progress" />);
    expect(screen.getByText("In progress")).toBeVisible();
  });

  it("always includes a readable sample label", () => {
    render(<SampleStatusBadge status="issue_reported" />);
    expect(screen.getByText("Issue reported")).toBeVisible();
  });
});
