"use client";

import { useEffect, useState } from "react";

interface StatusInfo {
  status: "online" | "lunch" | "offline";
  label: string;
  sublabel: string;
}

const DOT_COLORS: Record<string, string> = {
  online: "bg-emerald-500",
  lunch: "bg-amber-400",
  offline: "bg-ink-300",
};

const LABEL_COLORS: Record<string, string> = {
  online: "text-emerald-700",
  lunch: "text-amber-600",
  offline: "text-ink-500",
};

export default function LinnéaStatusBadge({ className = "" }: { className?: string }) {
  const [info, setInfo] = useState<StatusInfo | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data = await res.json();
          setInfo(data.linnea);
        }
      } catch {
        // tyst fel — ingen status visas
      }
    }
    fetchStatus();
    const id = setInterval(fetchStatus, 60_000); // uppdatera varje minut
    return () => clearInterval(id);
  }, []);

  if (!info) return null;

  const isOnline = info.status === "online";

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative flex h-2 w-2">
        {isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${DOT_COLORS[info.status]}`} />
      </span>
      <span className={`text-xs font-medium ${LABEL_COLORS[info.status]}`}>
        {info.label}
        {info.sublabel ? ` · ${info.sublabel}` : ""}
      </span>
    </span>
  );
}
