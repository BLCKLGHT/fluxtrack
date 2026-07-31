import { IssueTable } from "@/components/issue-table";
import { getCategories, getIssues } from "@/lib/queries";

export default async function IssuesPage() {
  const [issues, categories] = await Promise.all([getIssues(), getCategories()]);
  return (
    <main id="main">
      <p className="eyebrow">Evidence register</p><h1 className="page-title mt-3">Sample issues</h1>
      <p className="muted mt-3">Filter records and export traceable issue data without photograph links.</p>
      <IssueTable issues={issues} categories={categories} />
    </main>
  );
}
