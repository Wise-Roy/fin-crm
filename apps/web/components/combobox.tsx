"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";

interface ComboboxOption {
  id: string;
  name: string;
}

export function Combobox({
  label,
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Select…",
  disabled = false,
}: {
  label: string;
  options: ComboboxOption[];
  value: string;
  onChange: (id: string) => void;
  onCreate?: (name: string) => Promise<ComboboxOption | null>;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = options.find((o) => o.id === value);
  const exactMatch = options.some(
    (o) => o.name.toLowerCase() === search.toLowerCase()
  );
  const showCreate = onCreate && search.trim() && !exactMatch;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleCreate = async () => {
    if (!onCreate || !search.trim() || creating) return;
    setCreating(true);
    try {
      const created = await onCreate(search.trim());
      if (created) {
        onChange(created.id);
        setSearch("");
        setOpen(false);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wider">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all text-left ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={12} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && showCreate) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="Search or type to create…"
              className="w-full text-xs px-2 py-1.5 border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900/10"
            />
          </div>
          <div className="max-h-40 overflow-auto">
            {/* Clear option */}
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setSearch("");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 transition-colors"
              >
                Clear selection
              </button>
            )}
            {filtered.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setSearch("");
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center justify-between ${opt.id === value ? "bg-gray-50 font-medium text-gray-900" : "text-gray-700"}`}
              >
                {opt.name}
                {opt.id === value && <Check size={11} className="text-gray-400" />}
              </button>
            ))}
            {filtered.length === 0 && !showCreate && (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">
                No matches
              </div>
            )}
          </div>
          {showCreate && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100 disabled:opacity-50"
            >
              <Plus size={11} />
              {creating ? "Creating…" : `Create "${search.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
