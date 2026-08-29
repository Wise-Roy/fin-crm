"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { X, AlertCircle, ChevronDown, Search } from "lucide-react";
import { motion } from "motion/react";
import type { Client } from "@/lib/types";
import { validatePAN, validatePhone } from "@/lib/validations";

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
    client_name?: string;
    client_group_id?: string;
    client_group_name?: string;
    position?: string;
    mobile_number?: string;
  }) => Promise<void>;
}

function FreeformCombobox({ selectedId, textValue, onChange, options, placeholder }: {
  selectedId: string;
  textValue: string;
  onChange: (id: string, name: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const displayValue = selectedId ? options.find((o) => o.value === selectedId)?.label || "" : textValue;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange("", e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => { setOpen(true); setQuery(displayValue); }}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
        />
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          {filtered.length > 0 ? (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value, ""); setQuery(""); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedId === o.value ? "bg-gray-50 font-medium text-gray-900" : "text-gray-700"}`}
              >
                {o.label}
              </button>
            ))
          ) : query.trim() ? (
            <div className="px-3 py-2">
              <div className="text-xs text-gray-400 mb-1">No matching client</div>
              <button
                type="button"
                onClick={() => { onChange("", query.trim()); setOpen(false); }}
                className="text-sm text-gray-900 font-medium hover:text-gray-700"
              >
                Use &quot;{query.trim()}&quot; as new client
              </button>
            </div>
          ) : (
            <div className="px-3 py-3 text-xs text-gray-400 text-center">Type to search or add new</div>
          )}
        </div>
      )}
    </div>
  );
}

function Combobox({ value, onChange, options, placeholder, disabled }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => { if (!disabled) { setOpen(!open); setQuery(""); setTimeout(() => inputRef.current?.focus(), 0); } }}
        className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-gray-900/10 focus-within:border-gray-400 transition-all flex items-center justify-between cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "bg-white"}`}
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </div>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search size={12} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full text-sm focus:outline-none"
              autoFocus
            />
          </div>
          <div className="overflow-auto flex-1">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); setQuery(""); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${!value ? "bg-gray-50 font-medium" : "text-gray-500"}`}
            >
              {placeholder}
            </button>
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); setQuery(""); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${value === o.value ? "bg-gray-50 font-medium text-gray-900" : "text-gray-700"}`}
              >
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
  const [clientName, setClientName] = useState("");
  const [clientGroupId, setClientGroupId] = useState("");
  const [clientGroupName, setClientGroupName] = useState("");
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
    setClientName("");
    setClientGroupId("");
    setClientGroupName("");
    setPosition("");
    setMobileNumber("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const panErr = validatePAN(panNumber).error;
  const phoneErr = validatePhone(mobileNumber).error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (panErr || phoneErr) return;

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
        ...(clientId ? { client_id: clientId } : clientName ? { client_name: clientName } : {}),
        ...(clientGroupId ? { client_group_id: clientGroupId } : clientGroupName ? { client_group_name: clientGroupName } : {}),
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
                {panErr && <p className="text-xs text-red-500 mt-0.5">{panErr}</p>}
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
                <FreeformCombobox
                  selectedId={clientId}
                  textValue={clientName}
                  onChange={(id, name) => { setClientId(id); setClientName(name); setClientGroupId(""); setClientGroupName(""); }}
                  options={clients.filter((c) => c.is_active).map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Type or select client"
                />
              </div>
              <div>
                <label className={labelCls}>Client Group</label>
                <FreeformCombobox
                  selectedId={clientGroupId}
                  textValue={clientGroupName}
                  onChange={(id, name) => { setClientGroupId(id); setClientGroupName(name); }}
                  options={groups.map((g) => ({ value: g.id, label: g.group_name }))}
                  placeholder="Type or select group"
                />
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
                <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))} placeholder="10-digit mobile" maxLength={10} className={inputCls} />
                {phoneErr && <p className="text-xs text-red-500 mt-0.5">{phoneErr}</p>}
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
                disabled={loading || !!panErr || !!phoneErr}
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
