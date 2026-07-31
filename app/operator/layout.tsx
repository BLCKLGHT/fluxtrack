import { Brand } from "@/components/brand";
import { ConnectionStatus } from "@/components/connection-status";
import { OperatorNav } from "@/components/operator-nav";
import { requireProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  await requireProfile();
  return (
    <>
      <ConnectionStatus />
      <header className="operator-shell operator-safe-header !pb-0">
        <Brand href="/operator" />
      </header>
      {children}
      <OperatorNav />
    </>
  );
}
