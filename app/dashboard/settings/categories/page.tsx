import { setCategoryActive } from "@/app/actions/admin";
import { requireProfile } from "@/lib/auth";
import type { IssueCategory } from "@/lib/domain";
import { STAGE_LABELS } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  await requireProfile(["administrator"]);
  const supabase = await createClient();
  const { data } = await supabase.from("issue_categories").select("*").order("display_order");
  const categories = (data ?? []) as IssueCategory[];
  return (
    <main id="main">
      <p className="eyebrow">Configuration</p><h1 className="page-title mt-3">Issue categories</h1>
      <p className="muted mt-3">Operator choices and ownership are database-driven. Inactive categories remain on historical records.</p>
      <div className="table-wrap mt-7">
        <table className="data-table"><thead><tr><th>Order</th><th>Code</th><th>Name</th><th>Default stage</th><th>Ownership</th><th>Comment</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{categories.map((category) => <tr key={category.id}><td>{category.display_order}</td><td className="font-mono text-xs">{category.code}</td><td><strong>{category.name}</strong></td><td>{category.default_stage ? STAGE_LABELS[category.default_stage] : "Operator selects"}</td><td>{category.ownership}</td><td>{category.requires_comment ? "Required" : "Optional"}</td><td>{category.active ? "Active" : "Inactive"}</td><td><form action={setCategoryActive.bind(null, category.id, !category.active)}><button className="btn btn-secondary !min-h-10 !px-3 !py-2">{category.active ? "Deactivate" : "Activate"}</button></form></td></tr>)}</tbody>
        </table>
      </div>
    </main>
  );
}
