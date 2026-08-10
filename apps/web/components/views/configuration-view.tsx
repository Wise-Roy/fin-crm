"use client";

import { useState } from "react";
import { Palette, Type, Save, RotateCcw, Monitor, PanelLeft, Navigation, Loader2 } from "lucide-react";
import { useTheme, type ThemeConfig } from "@/lib/theme-context";

const PRESET_PALETTES = [
  {
    name: "Midnight",
    colors: { sidebar: "#0A0A0A", sidebarText: "#FFFFFF", navbar: "#FFFFFF", navbarText: "#111111", page: "#F4F4F4", accent: "#0A0A0A" },
  },
  {
    name: "Ocean",
    colors: { sidebar: "#0F172A", sidebarText: "#E2E8F0", navbar: "#FFFFFF", navbarText: "#0F172A", page: "#F1F5F9", accent: "#3B82F6" },
  },
  {
    name: "Forest",
    colors: { sidebar: "#14532D", sidebarText: "#DCFCE7", navbar: "#FFFFFF", navbarText: "#14532D", page: "#F0FDF4", accent: "#16A34A" },
  },
  {
    name: "Royal",
    colors: { sidebar: "#312E81", sidebarText: "#E0E7FF", navbar: "#FFFFFF", navbarText: "#312E81", page: "#EEF2FF", accent: "#6366F1" },
  },
  {
    name: "Warm",
    colors: { sidebar: "#7C2D12", sidebarText: "#FED7AA", navbar: "#FFFBEB", navbarText: "#7C2D12", page: "#FFF7ED", accent: "#EA580C" },
  },
  {
    name: "Rose",
    colors: { sidebar: "#881337", sidebarText: "#FFE4E6", navbar: "#FFFFFF", navbarText: "#881337", page: "#FFF1F2", accent: "#E11D48" },
  },
];

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  icon: React.ElementType;
  description: string;
}

function ColorField({ label, value, onChange, icon: Icon, description }: ColorFieldProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 shrink-0">
        <Icon size={18} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg border-2 border-gray-200 cursor-pointer relative overflow-hidden"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-[90px] text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}

export function ConfigurationView() {
  const { theme, setTheme, saveTheme } = useTheme();
  const [draft, setDraft] = useState<ThemeConfig>({ ...theme, colors: { ...theme.colors } });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [orgName, setOrgName] = useState(draft.orgDisplayName || "");

  const updateColor = (key: keyof ThemeConfig["colors"], val: string) => {
    const next = { ...draft, colors: { ...draft.colors, [key]: val } };
    setDraft(next);
    setTheme(next); // live preview
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave = { ...draft, orgDisplayName: orgName || undefined };
      await saveTheme(toSave);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaults = PRESET_PALETTES[0]!;
    const reset: ThemeConfig = { colors: { ...defaults.colors }, orgDisplayName: "" };
    setDraft(reset);
    setOrgName("");
    setTheme(reset);
  };

  const applyPreset = (preset: typeof PRESET_PALETTES[number]) => {
    const next: ThemeConfig = { ...draft, colors: { ...preset.colors } };
    setDraft(next);
    setTheme(next);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Appearance & Branding</h2>
        <p className="text-sm text-gray-500 mt-1">
          Customize your workspace colors and branding. Changes preview live.
        </p>
      </div>

      {/* Organisation Branding */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Branding
        </h3>
        <div className="p-4 bg-white rounded-xl border border-gray-100">
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Organisation Display Name
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Shown in sidebar header. Leave empty to use "FinCRM".
          </p>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="w-full max-w-sm text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>
      </section>

      {/* Preset Palettes */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Quick Presets
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {PRESET_PALETTES.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-gray-300 transition-all bg-white"
            >
              <div className="flex gap-0.5">
                <div className="w-5 h-5 rounded-l-md" style={{ backgroundColor: p.colors.sidebar }} />
                <div className="w-5 h-5" style={{ backgroundColor: p.colors.accent }} />
                <div className="w-5 h-5 rounded-r-md" style={{ backgroundColor: p.colors.page }} />
              </div>
              <span className="text-xs font-medium text-gray-500 group-hover:text-gray-900 transition-colors">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Color Configuration */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Colors
        </h3>
        <div className="space-y-2">
          <ColorField
            label="Sidebar Background"
            value={draft.colors.sidebar}
            onChange={(v) => updateColor("sidebar", v)}
            icon={PanelLeft}
            description="Left navigation panel"
          />
          <ColorField
            label="Sidebar Text"
            value={draft.colors.sidebarText}
            onChange={(v) => updateColor("sidebarText", v)}
            icon={Type}
            description="Text and icons in sidebar"
          />
          <ColorField
            label="Navbar Background"
            value={draft.colors.navbar}
            onChange={(v) => updateColor("navbar", v)}
            icon={Navigation}
            description="Top header bar"
          />
          <ColorField
            label="Navbar Text"
            value={draft.colors.navbarText}
            onChange={(v) => updateColor("navbarText", v)}
            icon={Type}
            description="Text in top header"
          />
          <ColorField
            label="Page Background"
            value={draft.colors.page}
            onChange={(v) => updateColor("page", v)}
            icon={Monitor}
            description="Main content area"
          />
          <ColorField
            label="Accent Color"
            value={draft.colors.accent}
            onChange={(v) => updateColor("accent", v)}
            icon={Palette}
            description="Buttons and primary actions"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all shadow-sm hover:shadow disabled:opacity-60"
          style={{ backgroundColor: draft.colors.accent }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? "Saved!" : "Save Configuration"}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          <RotateCcw size={14} />
          Reset to Default
        </button>
      </div>
    </div>
  );
}
