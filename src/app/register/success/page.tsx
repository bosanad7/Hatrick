"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const ref = params.get("ref");

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#000" }}>
      <div className="w-full max-w-md rounded-xl border p-8 text-center space-y-6"
        style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
        <Image src="/hattrick-logo.webp" alt="Hattrick" width={120} height={16} className="mx-auto logo-invert" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(34,197,94,0.15)" }}>
          <Check className="h-8 w-8" style={{ color: "#22c55e" }} />
        </div>
        <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          Your child has been registered at Hattrick Heroes Academy. We will contact you with training details.
        </p>
        {ref && (
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            Reference: {ref}
          </p>
        )}
        <div className="pt-4">
          <Link href="/register"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold"
            style={{ background: "#fff", color: "#000" }}>
            Register Another Player
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#000" }}>
      <p className="text-white">Loading...</p>
    </div>}>
      <SuccessContent />
    </Suspense>
  );
}
