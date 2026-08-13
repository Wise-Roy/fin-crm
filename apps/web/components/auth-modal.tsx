"use client";

import { useState } from "react";
import {
  ListTodo,
  X,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import type { AuthMode } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { validateName, validateEmail } from "@/lib/validations";


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
    verifyOtp,
    error: authError,
    clearError,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const resetFields = () => {
    setName("");
    setEmail("");
    setPassword("");
    setOrgName("");
    setPhone("");
    setShowPw(false);
    setError("");
    setOtpStep(false);
    setOtpEmail("");
    setOtp(["", "", "", "", "", ""]);
    clearError();
  };

  const switchMode = (next: AuthMode) => {
    resetFields();
    setMode(next);
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

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

  const signupNameErr = mode === "signup" ? validateName(name).error : undefined;
  const signupEmailErr = mode === "signup" ? validateEmail(email).error : undefined;

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    clearError();
    if (signupNameErr || signupEmailErr) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const returnedEmail = await signUp(name, email, password, orgName, phone);
      setOtpEmail(returnedEmail);
      setOtpStep(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organisation");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      const lastInput = document.getElementById("otp-5");
      lastInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    setError("");
    clearError();
    setLoading(true);
    try {
      await verifyOtp(otpEmail, otpValue);
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
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
        onClick={handleClose}
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
                  <ListTodo size={16} className="text-white" />
                </div>
                <span className="text-base font-bold text-gray-900">
                  FinCRM
                </span>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {!otpStep && (
              <div className="flex gap-1 p-1.5 bg-gray-100 rounded-xl">
                <button
                  onClick={() => switchMode("login")}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg ${mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700 transition-colors"}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => switchMode("signup")}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg ${mode === "signup" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700 transition-colors"}`}
                >
                  Create Account
                </button>
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
                    <div className="flex justify-end mt-1.5">
                      <Link
                        href="/forgot-password"
                        onClick={handleClose}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Forgot Password?
                      </Link>
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

              {/* Signup form */}
              {mode === "signup" && !otpStep && (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleCreateOrg}
                  className="space-y-5"
                >
                  <p className="text-sm text-gray-500 bg-gray-100 rounded-lg px-3 py-2.5">
                    You will be the <strong className="text-gray-900">Owner</strong> with full control over your organisation.
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
                  <div className="flex items-center justify-center gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className={inputCls}
                    />
                    {signupNameErr && <p className="text-xs text-red-500 mt-1">{signupNameErr}</p>}
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
                    {signupEmailErr && <p className="text-xs text-red-500 mt-1">{signupEmailErr}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
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
                      "Create Account →"
                    )}
                  </button>
                </motion.form>
              )}

              {/* OTP verification */}
              {otpStep && (
                <motion.form
                  key="otp"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-5"
                >
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-600">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Verify your email</h3>
                    <p className="text-sm text-gray-500">
                      We sent a 6-digit code to <strong className="text-gray-700">{otpEmail}</strong>
                    </p>
                  </div>

                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-11 h-12 text-center text-xl font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  {displayError && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={11} />
                      {displayError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.join("").length !== 6}
                    className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-base font-semibold hover:bg-gray-800 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      "Verify & Continue"
                    )}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    Didn&apos;t receive the code? Check your spam folder.
                  </p>
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}
