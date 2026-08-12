"use client";

import { useState, Fragment } from "react";
import { Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import type { Dsc, Role } from "@/lib/types";
import { fmtDate, can } from "@/lib/utils";
import { DscStatusBadge } from "./dsc-status-badge";

export function DscTable({
  entries,
  onDelete,
  userRole,
}: {
  entries: Dsc[];
  onDelete: (id: string) => void;
  userRole: Role;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visiblePw, setVisiblePw] = useState<Set<string>>(new Set());

  const togglePw = (id: string) => {
    setVisiblePw((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        No DSC entries found. Add one to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">PAN</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Related Company</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Issue Date</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Valid Till</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Authority</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-20"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((dsc) => {
            const isExpanded = expandedId === dsc.id;
            const customerName = dsc.client_group
              ? `${dsc.client?.name || ""} → ${dsc.client_group.group_name}`
              : dsc.client?.name || "—";

            return (
              <Fragment key={dsc.id}>
                <tr
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : dsc.id)}
                >
                  <td className="py-3 px-4 font-medium text-gray-900">{dsc.name}</td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-xs">{dsc.pan_number}</td>
                  <td className="py-3 px-4 text-gray-600">{dsc.related_company}</td>
                  <td className="py-3 px-4 text-gray-600">{customerName}</td>
                  <td className="py-3 px-4 text-gray-500">{fmtDate(dsc.issue_date)}</td>
                  <td className="py-3 px-4 text-gray-500">{fmtDate(dsc.valid_till_date)}</td>
                  <td className="py-3 px-4"><DscStatusBadge validTillDate={dsc.valid_till_date} /></td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{dsc.issuing_authority}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-gray-50/80">
                    <td colSpan={9} className="px-4 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-gray-400 uppercase tracking-wider block mb-1">Position</span>
                          <span className="text-gray-700">{dsc.position || "—"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 uppercase tracking-wider block mb-1">Mobile</span>
                          <span className="text-gray-700">{dsc.mobile_number || "—"}</span>
                        </div>
                        {userRole !== "EMPLOYEE" && (
                          <div>
                            <span className="text-gray-400 uppercase tracking-wider block mb-1">Password</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 font-mono">
                                {visiblePw.has(dsc.id) ? dsc.password : "••••••••"}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); togglePw(dsc.id); }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                {visiblePw.has(dsc.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400 uppercase tracking-wider block mb-1">Added By</span>
                          <span className="text-gray-700">{dsc.created_by_user?.name || "—"}</span>
                        </div>
                      </div>
                      {can(userRole, "add_client") && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(dsc.id); }}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

