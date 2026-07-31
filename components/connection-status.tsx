"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (online) return null;
  return (
    <div className="fixed inset-x-3 top-[calc(12px+env(safe-area-inset-top,0px))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-[#7e2525] px-4 py-3 text-sm font-bold text-white shadow-xl" role="status">
      <WifiOff size={20} aria-hidden />
      Offline — reconnect to submit photographic evidence.
    </div>
  );
}
