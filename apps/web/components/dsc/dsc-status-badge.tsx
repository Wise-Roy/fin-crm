"use client";

import type { DscStatus } from "@/lib/types";
import { getDscStatus, DSC_STATUS_CFG } from "@/lib/utils";

export function DscStatusBadge({ validTillDate }: { validTillDate: string }) {
  const status: DscStatus = getDscStatus(validTillDate);
  const cfg = DSC_STATUS_CFG[status];

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
