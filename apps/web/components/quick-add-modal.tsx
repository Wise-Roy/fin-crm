"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Client, TeamMember, Priority, Category } from "@/lib/types";
import { api } from "@/lib/api";
import { Combobox } from "@/components/combobox";

// Flattened option for client dropdown: either a bare client or a client_group under a client
interface ClientOption {
  /** "client:<id>" or "group:<id>" */
  key: string;
  label: string;
  clientId: string;
  groupId?: string;
}

function buildClientOptions(clients: Client[]): ClientOption[] {
  const opts: ClientOption[] = [];
  for (const c of clients) {
    if (!c.is_active) continue;
    const groups = c.client_group?.filter((g) => g.is_active) ?? [];
    if (groups.length === 0) {
      // client with no groups — show as plain client
      opts.push({ key: `client:${c.id}`, label: c.name, clientId: c.id });
    } else {
      // show each group as "Group — Client"
      for (const g of groups) {
        opts.push({
          key: `group:${g.id}`,
          label: `${g.group_name} — ${c.name}`,
          clientId: c.id,
          groupId: g.id,
        });
      }
      // also show bare client option
      opts.push({ key: `client:${c.id}`, label: c.name, clientId: c.id });
    }
  }
  return opts;
}

export function QuickAddModal({
  open,
  onClose,
  clients,
  onClientsChange,
  teamMembers,
  categories,
  onCategoriesChange,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  onClientsChange: (c: Client[]) => void;
  teamMembers: TeamMember[];
  categories: Category[];
  onCategoriesChange: (cats: Category[]) => void;
  onAdd: (data: {
    title: string;
    client_id?: string;
    client_group_id?: string;
    assigned_to_employee_id?: string;
    priority: string;
    due_date: string;
    category_id?: string;
    subcategory_id?: string;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [clientKey, setClientKey] = useState(""); // "client:<id>" or "group:<id>"
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  // Category/subcategory: track selected ID OR pending-new name
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subcategories = selectedCategory?.sub_categories ?? [];

  const clientOptions = useMemo(() => buildClientOptions(clients), [clients]);

  const reset = () => {
    setTitle("");
    setClientKey("");
    setAssignedTo("");
    setPriority("MEDIUM");
    setDueDate("");
    setCategoryId("");
    setNewCategoryName("");
    setSubcategoryId("");
    setNewSubcategoryName("");
  };

  // Resolve client selection
  const resolveClient = () => {
    if (!clientKey) return { client_id: undefined, client_group_id: undefined };
    const opt = clientOptions.find((o) => o.key === clientKey);
    if (!opt) return { client_id: undefined, client_group_id: undefined };
    return {
      client_id: opt.clientId,
      client_group_id: opt.groupId,
    };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || submitting) return;
    setSubmitting(true);

    try {
      // Resolve category — create if new
      let finalCategoryId = categoryId || undefined;
      let finalSubcategoryId = subcategoryId || undefined;

      if (newCategoryName && !categoryId) {
        const { category } = await api.categories.create(newCategoryName);
        finalCategoryId = category.id;
        // Update parent categories list
        const exists = categories.some((c) => c.id === category.id);
        if (!exists) {
          onCategoriesChange([...categories, { ...category, sub_categories: category.sub_categories ?? [] }]);
        }
      }

      if (newSubcategoryName && !subcategoryId && finalCategoryId) {
        const { subcategory } = await api.categories.createSubcategory(finalCategoryId, newSubcategoryName);
        finalSubcategoryId = subcategory.id;
        // Update parent categories list
        onCategoriesChange(
          categories.map((c) =>
            c.id === finalCategoryId
              ? { ...c, sub_categories: [...c.sub_categories, subcategory] }
              : c
          )
        );
      }

      const { client_id, client_group_id } = resolveClient();

      onAdd({
        title,
        client_id,
        client_group_id,
        assigned_to_employee_id: assignedTo || undefined,
        priority,
        due_date: dueDate || undefined as any,
        category_id: finalCategoryId,
        subcategory_id: finalSubcategoryId,
      });
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  // Category combobox handlers — deferred creation
  const handleCategorySelect = (id: string) => {
    if (id === "__new__") return; // ignore — already handled by handleCategoryCreate
    setCategoryId(id);
    setNewCategoryName("");
    setSubcategoryId("");
    setNewSubcategoryName("");
  };

  const handleCategoryCreate = async (name: string) => {
    // Don't hit API — just store name for deferred creation
    setNewCategoryName(name);
    setCategoryId("");
    setSubcategoryId("");
    setNewSubcategoryName("");
    return { id: `__new__`, name };
  };

  const handleSubcategorySelect = (id: string) => {
    if (id === "__new__") return;
    setSubcategoryId(id);
    setNewSubcategoryName("");
  };

  const handleSubcategoryCreate = async (name: string) => {
    setNewSubcategoryName(name);
    setSubcategoryId("");
    return { id: `__new__`, name };
  };

  // Client combobox — adhoc create hits API immediately (client is reusable entity)
  const handleClientCreate = async (name: string) => {
    try {
      const { client } = await api.clients.quickCreate(name);
      const exists = clients.some((c) => c.id === client.id);
      if (!exists) {
        onClientsChange([client, ...clients]);
      }
      return { id: `client:${client.id}`, name: client.name };
    } catch {
      return null;
    }
  };

  // Determine display value for category combobox
  const categoryDisplayValue = newCategoryName ? "__new__" : categoryId;
  const categoryOptions = newCategoryName
    ? [...categories.map((c) => ({ id: c.id, name: c.name })), { id: "__new__", name: newCategoryName }]
    : categories.map((c) => ({ id: c.id, name: c.name }));

  const subcategoryDisplayValue = newSubcategoryName ? "__new__" : subcategoryId;
  const subcategoryOptions = newSubcategoryName
    ? [...subcategories.map((s) => ({ id: s.id, name: s.name })), { id: "__new__", name: newSubcategoryName }]
    : subcategories.map((s) => ({ id: s.id, name: s.name }));

  const hasCategorySelected = !!(categoryId || newCategoryName);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto border border-gray-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-50">
                <div>
                  <h2 className="typo-card-title text-gray-900">
                    Quick Add Task
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Create a new task and assign it
                  </p>
                </div>
                <button
                  onClick={() => { reset(); onClose(); }}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              </div>
              <form onSubmit={submit} className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
                    placeholder="e.g., ROC Annual Filing, Board Resolution…"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Category / Subcategory */}
                <div className="grid grid-cols-2 gap-3">
                  <Combobox
                    label="Category"
                    options={categoryOptions}
                    value={categoryDisplayValue}
                    onChange={handleCategorySelect}
                    onCreate={handleCategoryCreate}
                    placeholder="Select or create…"
                  />
                  <Combobox
                    label="Subcategory"
                    options={subcategoryOptions}
                    value={subcategoryDisplayValue}
                    onChange={handleSubcategorySelect}
                    onCreate={hasCategorySelected ? handleSubcategoryCreate : undefined}
                    placeholder={hasCategorySelected ? "Select or create…" : "Pick category first"}
                    disabled={!hasCategorySelected}
                  />
                </div>

                {/* Client */}
                <Combobox
                  label="Client"
                  options={clientOptions.map((o) => ({ id: o.key, name: o.label }))}
                  value={clientKey}
                  onChange={setClientKey}
                  onCreate={handleClientCreate}
                  placeholder="Search client or group…"
                />

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                    Assign To
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 appearance-none"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.position || m.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 appearance-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { reset(); onClose(); }}
                    className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Adding…
                      </>
                    ) : "Add Task"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
