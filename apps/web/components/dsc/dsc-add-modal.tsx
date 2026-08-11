"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import type { Client } from "@/lib/types";

interface DscAddModalProps {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  onAdd: (data: {
    pan_number: string;
    name: string;
    related_company: string;
    issue_date: string;
    valid_till_date: string;
    issuing_authority: string;
    password: string;
    client_id?: string;
    client_group_id?: string;
    position?: string;
    mobile_number?: string;
  }) => Promise<void>;
}

export function DscAddModal({ open, onClose, clients, onAdd }: DscAddModalProps) {
  const [panNumber, setPanNumber] = useState("");
  const [name, setName] = useState("");
  const [relatedCompany, setRelatedCompany] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [validTillDate, setValidTillDate] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [password, setPassword] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientGroupId, setClientGroupId] = useState("");
  const [position, setPosition] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientId);
  const groups = selectedClient?.client_group?.filter((g) => g.is_active) || [];

  const reset = () => {
    setPanNumber("");
    setName("");
    setRelatedCompany("");
    setIssueDate("");
    setValidTillDate("");
    setIssuingAuthority("");
    setPassword("");
    setClientId("");
    setClientGroupId("");
    setPosition("");
    setMobileNumber("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber.toUpperCase())) {
      setError("Invalid PAN number format (e.g. ABCDE1234F)");
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        pan_number: panNumber.toUpperCase(),
        name,
        related_company: relatedCompany,
        issue_date: issueDate,
        valid_till_date: validTillDate,
        issuing_authority: issuingAuthority,
        password,
        ...(clientId ? { client_id: clientId } : {}),
        ...(clientGroupId ? { client_group_id: clientGroupId } : {}),
        ...(position ? { position } : {}),
        ...(mobileNumber ? { mobile_number: mobileNumber } : {}),
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add DSC");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all";
  const labelCls = "block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h2 className="text-base font-semibold text-gray-900">Add DSC Entry</h2>
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Row 1: PAN + Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>PAN Number *</label>
                <input
                  type="text"
                  required
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className={`${inputCls} font-mono uppercase`}
                />
              </div>
              <div>
                <label className={labelCls}>Name (on DSC) *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Certificate holder name" className={inputCls} />
              </div>
            </div>

            {/* Row 2: Related Company + Issuing Authority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Related Company *</label>
                <input type="text" required value={relatedCompany} onChange={(e) => setRelatedCompany(e.target.value)} placeholder="Company name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Issuing Authority *</label>
                <input type="text" required value={issuingAuthority} onChange={(e) => setIssuingAuthority(e.target.value)} placeholder="e.g. eMudhra, Sify" className={inputCls} />
              </div>
            </div>

            {/* Row 3: Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Issue Date *</label>
                <input type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Valid Till Date *</label>
                <input type="date" required value={validTillDate} onChange={(e) => setValidTillDate(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Row 4: Customer + Client Group */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Customer (Client)</label>
                <select
                  value={clientId}
                  onChange={(e) => { setClientId(e.target.value); setClientGroupId(""); }}
                  className={inputCls}
                >
                  <option value="">— Select Client —</option>
                  {clients.filter((c) => c.is_active).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Client Group</label>
                <select
                  value={clientGroupId}
                  onChange={(e) => setClientGroupId(e.target.value)}
                  className={inputCls}
                  disabled={!clientId || groups.length === 0}
                >
                  <option value="">— Select Group —</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.group_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 5: Password + Position */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>DSC Password *</label>
                <input type="text" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="DSC token password" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Position</label>
                <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Director, Partner" className={inputCls} />
              </div>
            </div>

            {/* Row 6: Mobile */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Mobile Number</label>
                <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="10-digit mobile" maxLength={10} className={inputCls} />
              </div>
              <div />
            </div>

            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle size={11} /> {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? "Adding..." : "Add DSC"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
