import Image from "next/image";
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
      <header className="operator-shell operator-safe-header flex items-center justify-between !pb-0">
        <Brand href="/operator" />
        <Image src="/hayes-icon.png" alt="Hayes Industries" width={350} height={349} className="h-7 w-7 opacity-50" priority />
      </header>
      {children}
      <OperatorNav />
    </>
  );
}
