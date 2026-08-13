"use client";

import { useState } from "react";
import { ListTodo, ArrowLeft, AlertCircle, Mail } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all";

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
          <h1 className="text-xl font-semibold text-gray-900">Reset your password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="px-8 py-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail size={22} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
              <p className="text-sm text-gray-500">
                If an account with that email exists, we&apos;ve sent a password reset link. Check your spam folder too.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  autoFocus
                />
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
                    Sending…
                  </>
                ) : (
                  "Send Reset Link"
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
          )}
        </div>
      </div>
    </div>
  );
}
