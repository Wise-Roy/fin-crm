"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar } from "lucide-react";

export type DateRangePreset = "today" | "last_7_days" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  startDate: Date;
  endDate: Date;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

export function getTodayRange(): DateRange {
  const now = new Date();
  return { preset: "today", startDate: startOfDay(now), endDate: endOfDay(now) };
}

export function getLast7DaysRange(): DateRange {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  return { preset: "last_7_days", startDate: startOfDay(start), endDate: endOfDay(now) };
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getLabel(range: DateRange): string {
  switch (range.preset) {
    case "today":
      return "Today";
    case "last_7_days":
      return "Last 7 Days";
    case "custom":
      return `${fmtShort(range.startDate)} – ${fmtShort(range.endDate)}`;
  }
}

export function DateRangeSelector({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(fmtInputDate(value.startDate));
  const [customEnd, setCustomEnd] = useState(fmtInputDate(value.endDate));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCustom(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const select = (preset: "today" | "last_7_days") => {
    onChange(preset === "today" ? getTodayRange() : getLast7DaysRange());
    setOpen(false);
    setShowCustom(false);
  };

  const applyCustom = () => {
    const s = new Date(customStart + "T00:00:00");
    const e = new Date(customEnd + "T23:59:59.999");
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return;
    if (s > e) return;
    onChange({ preset: "custom", startDate: s, endDate: e });
    setOpen(false);
    setShowCustom(false);
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) setShowCustom(false); }}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
      >
        <Calendar size={12} className="text-gray-400" />
        <span className="text-gray-700">{getLabel(value)}</span>
        <ChevronDown size={12} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[220px] overflow-hidden">
          {!showCustom ? (
            <div className="py-1">
              {(["today", "last_7_days"] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => select(preset)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                    value.preset === preset
                      ? "bg-gray-50 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {preset === "today" ? "Today" : "Last 7 Days"}
                </button>
              ))}
              <button
                onClick={() => {
                  setCustomStart(fmtInputDate(value.startDate));
                  setCustomEnd(fmtInputDate(value.endDate));
                  setShowCustom(true);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                  value.preset === "custom"
                    ? "bg-gray-50 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Custom Date
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Custom Range
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">From</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">To</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustom(false)}
                  className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={applyCustom}
                  className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors flex-1"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
