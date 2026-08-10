"use client";

import { motion, AnimatePresence } from "motion/react";
import type { Notification } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export function NotifPanel({
  open,
  onClose,
  notifications,
  onMarkAll,
  onViewRequests,
}: {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAll: () => void;
  onViewRequests?: () => void;
}) {
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
              <button
                onClick={onMarkAll}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Mark all read
              </button>
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
              {notifications.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-gray-400">
                  No notifications
                </div>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!n.is_read ? "bg-blue-50/40" : ""}`}
                >
                  <p className="text-xs text-gray-800 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 ">
                    {fmtDate(n.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
