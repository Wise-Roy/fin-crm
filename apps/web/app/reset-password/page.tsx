"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ListTodo, ArrowLeft, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all";

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={22} className="text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Invalid reset link</h3>
        <p className="text-sm text-gray-500">
          This password reset link is invalid or malformed. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Request new link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword({ token, password });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={22} className="text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Password reset successful</h3>
        <p className="text-sm text-gray-500">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Link
          href="/"
          className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
          New Password
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
            autoFocus
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

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPw ? "text" : "password"}
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className={`${inputCls} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPw(!showConfirmPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle size={11} />
          {error}
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
            Resetting…
          </>
        ) : (
          "Reset Password"
        )}
      </button>

      <Link
        href="/"
        className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
        <div className="px-8 pt-7 pb-6 border-b border-gray-50">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
              <ListTodo size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">FinCRM</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Set new password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose a strong password for your account.
          </p>
        </div>

        <div className="px-8 py-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8">
                <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
