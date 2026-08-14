"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  ListTodo,
  Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api, ApiError } from "@/lib/api";
import type { Role } from "@/lib/types";

type ImportType = "tasks" | "clients";

interface ImportResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  errors?: Array<{ row: number; column: string; message: string }>;
}

const IMPORT_CARDS: Array<{
  type: ImportType;
  label: string;
  description: string;
  icon: React.ElementType;
  columns: string[];
}> = [
  {
    type: "tasks",
    label: "Import Tasks",
    description: "Upload tasks with categories, subcategories, client assignments, and team assignments. Missing categories, subcategories, clients, and client groups will be auto-created.",
    icon: ListTodo,
    columns: [
      "title *",
      "description",
      "category",
      "subcategory",
      "client_name",
      "client_group_name",
      "assigned_to_email",
      "priority",
      "status",
      "due_date",
    ],
  },
  {
    type: "clients",
    label: "Import Clients",
    description: "Upload clients with KYC details and client groups. Existing clients (matched by name) will have their KYC fields updated. New groups are auto-created.",
    icon: Building2,
    columns: [
      "name *",
      "email",
      "phone",
      "group_name",
      "group_email",
      "group_phone",
      "business_pan",
      "address_line1",
      "address_line2",
      "city",
      "state",
      "country",
      "pincode",
      "llpin",
      "din",
      "cin",
      "gst_number",
      "gst_state_code",
      "gst_dest_address",
    ],
  },
];

export function DataImportView({ onImportComplete }: { userRole: Role; onImportComplete: () => void }) {
  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!selectedType) return;
      if (!file.name.endsWith(".xlsx")) {
        setResult({ success: false, message: "Only .xlsx files are supported." });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setResult({ success: false, message: "File too large. Maximum 5MB." });
        return;
      }

      setUploading(true);
      setResult(null);
      try {
        if (selectedType === "tasks") {
          const res = await api.import.tasks(file);
          setResult({ success: true, message: res.message, details: res as unknown as Record<string, unknown> });
        } else {
          const res = await api.import.clients(file);
          setResult({ success: true, message: res.message, details: res as unknown as Record<string, unknown> });
        }
        onImportComplete();
      } catch (err) {
        if (err instanceof ApiError) {
          const body = err.body || {};
          setResult({
            success: false,
            message: err.message,
            errors: body.details as ImportResult["errors"],
          });
        } else {
          setResult({ success: false, message: "Upload failed. Please try again." });
        }
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [selectedType, onImportComplete],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDownloadTemplate = (type: ImportType) => {
    const url = type === "tasks" ? api.import.templateTasks() : api.import.templateClients();
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_import_template.xlsx`;
    // Need auth header for template download
    const token = localStorage.getItem("fincrm_token");
    if (token) {
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          a.href = blobUrl;
          a.click();
          URL.revokeObjectURL(blobUrl);
        });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Data Import</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bulk import data from Excel files. Download a template, fill in your data, and upload.
        </p>
      </div>

      {/* Import type cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {IMPORT_CARDS.map((card) => {
          const active = selectedType === card.type;
          return (
            <button
              key={card.type}
              onClick={() => {
                setSelectedType(card.type);
                setResult(null);
              }}
              className={`text-left p-5 rounded-xl border-2 transition-all ${
                active
                  ? "border-gray-900 bg-gray-50 shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <card.icon size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{card.label}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected type details */}
      <AnimatePresence mode="wait">
        {selectedType && (
          <motion.div
            key={selectedType}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Template download + column info */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">Expected Columns</h3>
                  <p className="text-xs text-gray-400 mt-0.5">* = required</p>
                </div>
                <button
                  onClick={() => handleDownloadTemplate(selectedType)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download size={14} />
                  Download Template
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {IMPORT_CARDS.find((c) => c.type === selectedType)!.columns.map((col) => (
                  <span
                    key={col}
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      col.endsWith("*")
                        ? "bg-gray-900 text-white"
                        : "bg-gray-50 text-gray-600 border border-gray-100"
                    }`}
                  >
                    {col.replace(" *", "")}
                    {col.endsWith("*") && <span className="text-red-300 ml-0.5">*</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Upload zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              } ${uploading ? "pointer-events-none opacity-60" : ""}`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="animate-spin text-gray-400" />
                  <p className="text-sm text-gray-500">Uploading and processing...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
                    <Upload size={24} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Drop your .xlsx file here, or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Maximum 5MB, up to 1000 rows</p>
                  </div>
                </div>
              )}
            </div>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-xl border p-5 ${
                    result.success
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          result.success ? "text-emerald-800" : "text-red-800"
                        }`}
                      >
                        {result.message}
                      </p>

                      {/* Success details */}
                      {result.success && result.details && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(result.details)
                            .filter(([k]) => k !== "message")
                            .map(([k, v]) => (
                              <span
                                key={k}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium"
                              >
                                {k.replace(/_/g, " ")}: {String(v)}
                              </span>
                            ))}
                        </div>
                      )}

                      {/* Validation errors */}
                      {!result.success && result.errors && result.errors.length > 0 && (
                        <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
                          {result.errors.map((err, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                              <span className="shrink-0 font-mono bg-red-100 px-1.5 py-0.5 rounded">
                                Row {err.row}, {err.column}
                              </span>
                              <span>{err.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setResult(null)}
                      className="shrink-0 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info notes */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</h4>
              {selectedType === "tasks" ? (
                <ul className="text-xs text-gray-500 space-y-1.5 list-disc pl-4">
                  <li><strong>title</strong> is the only required field.</li>
                  <li><strong>category</strong> and <strong>subcategory</strong> are auto-created if they don't exist.</li>
                  <li><strong>client_name</strong> and <strong>client_group_name</strong> are auto-created if they don't exist.</li>
                  <li><strong>assigned_to_email</strong> must match an existing active team member's email.</li>
                  <li><strong>priority</strong>: LOW, MEDIUM (default), HIGH, URGENT.</li>
                  <li><strong>status</strong>: TODO (default), IN_PROGRESS, WAITING_CLIENT, REVIEW, COMPLETED, CANCELLED.</li>
                  <li><strong>due_date</strong>: YYYY-MM-DD format or Excel date.</li>
                </ul>
              ) : (
                <ul className="text-xs text-gray-500 space-y-1.5 list-disc pl-4">
                  <li><strong>name</strong> is the only required field.</li>
                  <li>If a client with the same name already exists, its KYC fields will be updated.</li>
                  <li>Multiple rows with the same <strong>name</strong> but different <strong>group_name</strong> will create multiple groups under one client.</li>
                  <li><strong>business_pan</strong>: 10-char PAN format (e.g., ABCDE1234F).</li>
                  <li><strong>gst_number</strong>: 15-char GST format (e.g., 27ABCDE1234F1Z5).</li>
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
