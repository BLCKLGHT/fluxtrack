"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export function PhotoViewer({ url, alt }: { url: string; alt: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="relative h-28 w-36 overflow-hidden rounded-xl border border-[#d8dfda] bg-[#edf0ee]" onClick={() => setOpen(true)} aria-label={`View full photograph: ${alt}`}>
        <Image src={url} alt={alt} fill className="object-cover" unoptimized />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-5" role="dialog" aria-modal="true" aria-label={alt} onClick={() => setOpen(false)}>
          <button className="btn absolute right-5 top-5 bg-white" onClick={() => setOpen(false)}><X size={20} aria-hidden />Close</button>
          <div className="relative h-[80vh] w-[90vw]"><Image src={url} alt={alt} fill className="object-contain" unoptimized /></div>
        </div>
      )}
    </>
  );
}
