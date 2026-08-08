"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { AuthMode } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { LandingPage } from "@/components/landing-page";
import { AuthModal } from "@/components/auth-modal";
import { CRMShell } from "@/components/crm-shell";

export default function Home() {
  const { appUser, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const isAuthenticated = !!appUser;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 font-mono">Loading…</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    signOut();
  };

  const openLogin = () => {
    setAuthMode("login");
    setShowAuth(true);
  };
  const openSignup = () => {
    setAuthMode("signup");
    setShowAuth(true);
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {isAuthenticated ? (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CRMShell onLogout={handleLogout} />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage onLogin={openLogin} onSignup={openSignup} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuth && (
          <AuthModal
            initialMode={authMode}
            onClose={() => setShowAuth(false)}
            onLoginSuccess={() => setShowAuth(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
