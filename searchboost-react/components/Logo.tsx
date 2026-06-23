"use client";

import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const widths: Record<string, number> = { sm: 208, md: 160, lg: 200 };
  const w = widths[size];

  return (
    <Link href="/" className="inline-block flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-white.png"
        alt="Searchboost"
        style={{
          width: w,
          maxWidth: "100%",
          height: "auto",
        }}
      />
    </Link>
  );
}
