"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, FileSignature, Search } from "lucide-react";
import { AnimatePresence } from "motion/react";
import type { Dsc, Client, Role, DscStatus } from "@/lib/types";
import type { DateRange } from "@/components/date-range-selector";
import { getDscStatus, DSC_STATUS_CFG, can } from "@/lib/utils";
import { DscTable } from "./dsc-table";
import { DscAddModal } from "./dsc-add-modal";

export function DscView({
  entries,
  clients,
  onAdd,
  onDelete,
  userRole,
  dateRange,
  externalShowAdd,
  onExternalShowAddChange,
}: {
  entries: Dsc[];
  clients: Client[];
  onAdd: (data: {
    pan_number: string; name: string; related_company: string;
    issue_date: string; valid_till_date: string; issuing_authority: string;
    password: string; client_id?: string; client_group_id?: string;
    position?: string; mobile_number?: string;
  }) => Promise<void>;
  onDelete: (id: string) => void;
  userRole: Role;
  dateRange?: DateRange;
  externalShowAdd?: boolean;
  onExternalShowAddChange?: (v: boolean) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DscStatus | "ALL">("ALL");

  useEffect(() => {
    if (externalShowAdd) {
      setShowAdd(true);
      onExternalShowAddChange?.(false);
    }
  }, [externalShowAdd, onExternalShowAddChange]);
  const [search, setSearch] = useState("");

  const dateFiltered = useMemo(() => {
    if (!dateRange) return entries;
    return entries.filter((d) => {
      const issued = new Date(d.issue_date);
      return issued >= dateRange.startDate && issued <= dateRange.endDate;
    });
  }, [entries, dateRange]);

  const filtered = useMemo(() => {
    let result = dateFiltered;
    if (statusFilter !== "ALL") {
      result = result.filter((d) => getDscStatus(d.valid_till_date) === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.pan_number.toLowerCase().includes(q) ||
          d.related_company.toLowerCase().includes(q) ||
          d.client?.name?.toLowerCase().includes(q) ||
          d.issuing_authority.toLowerCase().includes(q)
      );
    }
    return result;
  }, [dateFiltered, statusFilter, search]);

  const counts = useMemo(() => {
    const c = { ALL: dateFiltered.length, ACTIVE: 0, EXPIRING_SOON: 0, EXPIRED: 0 };
    dateFiltered.forEach((d) => { c[getDscStatus(d.valid_till_date)]++; });
    return c;
  }, [dateFiltered]);

  const statusTabs: Array<{ key: DscStatus | "ALL"; label: string }> = [
    { key: "ALL", label: "All" },
    { key: "ACTIVE", label: "Active" },
    { key: "EXPIRING_SOON", label: "Expiring Soon" },
    { key: "EXPIRED", label: "Expired" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <FileSignature size={18} className="text-gray-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">DSC Logs</h1>
            <p className="text-xs text-gray-400">{dateFiltered.length} digital signature certificates</p>
          </div>
        </div>
        {can(userRole, "add_dsc") && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
          >
            <Plus size={14} /> Add DSC
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                statusFilter === tab.key
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className="ml-1 text-gray-400">({counts[tab.key]})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search DSC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DscTable entries={filtered} onDelete={onDelete} userRole={userRole} />
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <DscAddModal
            open={showAdd}
            onClose={() => setShowAdd(false)}
            clients={clients}
            onAdd={onAdd}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
