"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Notification } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function NotifPanel({
  open,
  onClose,
  notifications,
  onMarkAll,
  onMarkSelected,
  onViewRequests,
}: {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAll: () => void;
  onMarkSelected: (ids: string[]) => void;
  onViewRequests?: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarkSelected = () => {
    if (selected.size === 0) return;
    onMarkSelected(Array.from(selected));
    setSelected(new Set());
  };

  const handleMarkAll = () => {
    onMarkAll();
    setSelected(new Set());
  };

  const unread = notifications.filter((n) => !n.is_read);
  const hasNotifs = notifications.length > 0;
  const hasUnread = unread.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-12 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <span className="typo-card-title text-gray-900">
                Notifications
              </span>
              <div className="flex items-center gap-2">
                {selected.size > 0 && (
                  <button
                    onClick={handleMarkSelected}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Mark {selected.size} read
                  </button>
                )}
                {selected.size === 0 && hasUnread && (
                  <button
                    onClick={handleMarkAll}
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
            {onViewRequests && (
              <button
                onClick={onViewRequests}
                className="w-full px-4 py-2.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
              >
                You have pending join requests → Review in Team
              </button>
            )}
            <div className="max-h-72 overflow-auto divide-y divide-gray-50">
              {!hasNotifs && (
                <div className="px-4 py-6 text-center text-xs text-gray-400">
                  No notifications
                </div>
              )}
              {notifications.map((n) => (
                <label
                  key={n.id}
                  className={`flex items-start gap-2.5 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!n.is_read ? "bg-blue-50/40" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(n.id)}
                    onChange={() => toggle(n.id)}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20 shrink-0 cursor-pointer accent-gray-900"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                  )}
                </label>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
