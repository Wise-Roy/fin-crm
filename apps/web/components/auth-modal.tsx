"use client";

import { useState } from "react";
import {
  Shield,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Globe,
  Users,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { AuthMode } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

export function AuthModal({
  initialMode,
  onClose,
  onLoginSuccess,
}: {
  initialMode: AuthMode;
  onClose: () => void;
  onLoginSuccess: () => void;
}) {
  const {
    signIn,
    signUp,
    error: authError,
    clearError,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    clearError();
    setLoading(true);
    try {
      await signIn(email, password);
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    clearError();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await signUp(name, email, password, orgName);
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organisation");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    clearError();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await api.joinRequests.create({
        organizationName: orgName,
        name,
        email,
        password,
      });
      setMode("pending_approval" as AuthMode);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit join request");
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || authError || "";

  const inputCls =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-7 pb-6 border-b border-gray-50">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Shield size={16} className="text-white" />
                </div>
                <span className="text-base font-bold text-gray-900">
                  FinCRM
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {(mode === "login" || mode === "signup") && (
              <div className="flex gap-1 p-1.5 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setMode("login")}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg ${mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700 transition-colors"}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode("signup")}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg ${mode === "signup" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700 transition-colors"}`}
                >
                  Create Account
                </button>
              </div>
            )}
            {(mode === "create_org" || mode === "join_org") && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <button
                  onClick={() => setMode("signup")}
                  className="hover:text-gray-700 transition-colors"
                >
                  ← Back
                </button>
                <span className="text-gray-200">/</span>
                <span className="text-gray-600 font-medium">
                  {mode === "create_org" ? "Create Organisation" : "Join Organisation"}
                </span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            <AnimatePresence mode="wait">
              {/* Login form */}
              {mode === "login" && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputCls} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  {displayError && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={11} />
                      {displayError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-base font-semibold hover:bg-gray-800 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </motion.form>
              )}

              {/* Signup choice */}
              {mode === "signup" && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Get Started
                  </p>
                  <p className="text-xs text-gray-400 mb-5">
                    Create a new organisation to manage your firm.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setMode("create_org")}
                      className="w-full flex items-start gap-4 p-4 border-2 border-gray-200 hover:border-gray-900 rounded-xl transition-all group text-left"
                    >
                      <div className="w-9 h-9 bg-gray-100 group-hover:bg-gray-900 rounded-xl flex items-center justify-center transition-colors shrink-0">
                        <Globe
                          size={16}
                          className="text-gray-500 group-hover:text-white transition-colors"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Create New Organisation
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Start fresh. You become the Owner with full
                          control over your firm&apos;s workspace.
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setMode("join_org")}
                      className="w-full flex items-start gap-4 p-4 border-2 border-gray-200 hover:border-gray-900 rounded-xl transition-all group text-left"
                    >
                      <div className="w-9 h-9 bg-gray-100 group-hover:bg-gray-900 rounded-xl flex items-center justify-center transition-colors shrink-0">
                        <Users
                          size={16}
                          className="text-gray-500 group-hover:text-white transition-colors"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Join Existing Organisation
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Request to join your firm&apos;s workspace.
                          The owner will review and approve your access.
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Create org form */}
              {mode === "create_org" && (
                <motion.form
                  key="create_org"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleCreateOrg}
                  className="space-y-5"
                >
                  <p className="text-md text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
                    You will be granted{" "}
                    <strong className="text-gray-900">Owner</strong>{" "}
                    access — full control over your organisation.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Organisation Name
                    </label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Tech Secretariat LLP"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Pritesh Gadiya"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@yourfirm.in"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className={`${inputCls} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  {displayError && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={11} />
                      {displayError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-base font-semibold hover:bg-gray-800 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating…
                      </>
                    ) : (
                      "Create Organisation →"
                    )}
                  </button>
                </motion.form>
              )}

              {/* Join org form */}
              {mode === "join_org" && (
                <motion.form
                  key="join_org"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleJoinOrg}
                  className="space-y-5"
                >
                  <p className="text-md text-gray-500 bg-blue-50 rounded-lg px-3 py-2.5">
                    Your request will be sent to the organisation owner for approval.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Organisation Name
                    </label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Enter exact organisation name"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Set Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className={`${inputCls} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  {displayError && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={11} />
                      {displayError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-base font-semibold hover:bg-gray-800 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Request to Join →"
                    )}
                  </button>
                </motion.form>
              )}

              {/* Pending approval screen */}
              {(mode as string) === "pending_approval" && (
                <motion.div
                  key="pending_approval"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="text-center py-4"
                >
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock size={24} className="text-amber-500" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Request Submitted
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-xs mx-auto">
                    Your request to join <strong className="text-gray-700">{orgName}</strong> has been sent.
                    The organisation owner will review and approve your access.
                  </p>
                  <button
                    onClick={() => {
                      setMode("login");
                      setError("");
                      clearError();
                    }}
                    className="text-sm text-gray-900 font-medium hover:underline"
                  >
                    Back to Sign In
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}
