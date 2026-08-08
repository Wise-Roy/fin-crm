"use client";

import { FileCheck, Building2, Users, Receipt, Shield, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    icon: FileCheck,
    title: "Task Pipeline",
    desc: "ROC filings, board minutes, DIN updates — manage every compliance task from intake to completion with status tracking and deadlines.",
  },
  {
    icon: Building2,
    title: "Client Registry",
    desc: "Add clients instantly from a phone call. No CIN? No problem. Adhoc entries first, full onboarding later. Every client's history in one profile.",
  },
  {
    icon: Users,
    title: "Team Operations",
    desc: "Assign tasks to the right person, track individual workload, get notified on progress, and keep your entire team aligned without micromanaging.",
  },
  {
    icon: Receipt,
    title: "Reimbursements",
    desc: "Employees capture government fees and courier charges on-site. Managers approve with one click. Nothing gets lost in WhatsApp messages.",
  },
];

export function LandingPage({
  onLogin,
  onSignup,
}: {
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-gray-900 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              FinCRM
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              aria-label="Sign in"
              className="px-6 py-3 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20 rounded-lg"
            >
              Sign In
            </button>
            <button
              onClick={onSignup}
              aria-label="Get started"
              className="px-6 py-3 bg-gray-900 text-white text-base font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/40 focus-visible:ring-offset-2"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 bg-[#0A0A0A] relative overflow-hidden min-h-screen flex items-center">
        {/* Dotted grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Subtle radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-[0.06]"
          style={{
            background:
              "radial-gradient(ellipse at center, white 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-0 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            >

             <h1 className="font-semibold text-white leading-[1.05] tracking-tight">
  <span className="block text-6xl sm:text-7xl lg:text-[5rem]">
    Every deadline.
  </span>

  <span className="block text-5xl sm:text-6xl lg:text-[4rem]">
    Every client.
  </span>

  <span className="block text-4xl sm:text-5xl lg:text-[4rem] text-white/30">
    One platform.
  </span>
</h1>
              <p className="text-[#8B8B8B] text-base sm:text-lg mt-7 max-w-md leading-relaxed">
                FinCRM is purpose-built for CS firms — manage ROC filings,
                client relationships, team workload, and on-the-spot
                reimbursements without spreadsheet chaos.
              </p>

              <div className="flex items-center gap-3 mt-9">
                <button
                  onClick={onSignup}
                  aria-label="Start free trial"
                  className="group flex items-center gap-2.5 bg-white text-gray-900 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all shadow-lg shadow-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
                >
                  Start Free Trial
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
                <button
                  onClick={onLogin}
                  aria-label="Sign in to your account"
                  className="flex items-center gap-1.5 px-5 py-3 text-white/50 text-sm font-medium hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] rounded-xl"
                >
                  Sign In <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>

            {/* Right — Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.25,
                duration: 0.8,
                ease: [0.23, 1, 0.32, 1],
              }}
              className="relative"
            >
              <div className="rounded-2xl border border-white/[0.08] bg-[#111111] shadow-2xl shadow-black/60 overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white/[0.04] rounded-md px-8 py-1">
                      <span className="text-[10px] text-white/20 font-mono">
                        app.fincrm.io
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex">
                  {/* Mini sidebar */}
                  <div className="w-[120px] shrink-0 border-r border-white/[0.06] p-2.5 space-y-0.5">
                    {[
                      "Dashboard",
                      "Tasks",
                      "Clients",
                      "Team",
                      "Reimb.",
                      "Analytics",
                    ].map((n, i) => (
                      <div
                        key={n}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${i === 0 ? "bg-white text-[#0A0A0A]" : "text-white/25 hover:text-white/40"}`}
                      >
                        {n}
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-3 space-y-3 min-w-0">
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["10", "Active Tasks", "text-white"],
                          ["2", "Overdue", "text-red-400"],
                          ["₹17.3L", "Revenue", "text-white"],
                          ["₹3.5K", "Pending Reimb", "text-amber-400"],
                        ] as const
                      ).map(([v, l, c]) => (
                        <div
                          key={l}
                          className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-2.5"
                        >
                          <div
                            className={`text-sm font-mono font-semibold ${c}`}
                          >
                            {v}
                          </div>
                          <div className="text-white/25 text-[9px] mt-0.5 font-medium">
                            {l}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Task list */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg overflow-hidden">
                      <div className="px-3 py-2 border-b border-white/[0.05]">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                          Recent Tasks
                        </span>
                      </div>
                      <div className="divide-y divide-white/[0.04]">
                        {(
                          [
                            [
                              "ROC Annual Filing",
                              "TCS Ltd",
                              "In Progress",
                              "bg-blue-400",
                            ],
                            [
                              "GST Return Filing",
                              "Infosys Ltd",
                              "Pending",
                              "bg-gray-400",
                            ],
                            [
                              "Board Meeting Minutes",
                              "Wipro",
                              "Review",
                              "bg-amber-400",
                            ],
                            [
                              "Director Appointment",
                              "Mahindra",
                              "Completed",
                              "bg-emerald-400",
                            ],
                          ] as const
                        ).map(([task, client, status, dot]) => (
                          <div
                            key={task}
                            className="flex items-center gap-2.5 px-3 py-2"
                          >
                            <div
                              className={`w-1 h-5 rounded-full ${dot} shrink-0`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-medium text-white/60 truncate">
                                {task}
                              </div>
                              <div className="text-[9px] text-white/25 mt-0.5">
                                {client}
                              </div>
                            </div>
                            <span className="text-[9px] text-white/30 font-mono shrink-0">
                              {status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mini chart placeholder */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
                      <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
                        Team Workload
                      </div>
                      <div className="space-y-2">
                        {[
                          ["RM", 72],
                          ["PS", 55],
                          ["AK", 40],
                          ["PV", 28],
                        ].map(([initials, pct]) => (
                          <div
                            key={initials as string}
                            className="flex items-center gap-2"
                          >
                            <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center">
                              <span className="text-[7px] font-mono font-semibold text-white/40">
                                {initials}
                              </span>
                            </div>
                            <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-white/20 rounded-full"
                                style={{
                                  width: `${pct}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow effect behind card */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent -z-10 blur-sm" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-[#F4F4F4]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl font-semibold text-gray-900">
              Everything a CS firm needs to run smoothly
            </h2>
            <p className="text-gray-500 mt-2 text-lg leading-relaxed max-w-2xl mx-auto">
              No bloat. No learning curve. Purpose-built for how your practice
              actually works.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={16} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* RBAC Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-md font-medium text-gray-400 uppercase tracking-widest mb-3">
                Role-Based Access
              </div>
              <h2 className="text-5xl font-semibold text-gray-900 mb-4">
                Everyone sees exactly what they need to
              </h2>
              <p className="text-gray-500 text-md leading-relaxed mb-6">
                Super Admin sets up the firm, approves new members, and has
                complete visibility. Managers oversee all tasks. CS Executives
                manage their own pipeline. Trainees stay focused on assigned
                work.
              </p>
              <div className="space-y-3">
                {[
                  {
                    role: "Super Admin",
                    desc: "Full access — manage team, approve members, view everything",
                    color: "bg-gray-900 text-white",
                  },
                  {
                    role: "Manager",
                    desc: "Assign tasks, approve reimbursements, view full analytics",
                    color: "bg-blue-50 text-blue-700",
                  },
                  {
                    role: "CS Executive",
                    desc: "Own task pipeline, clients, and reimbursement submissions",
                    color: "bg-purple-50 text-purple-700",
                  },
                  {
                    role: "CS Trainee",
                    desc: "Assigned tasks only — focused, no distractions",
                    color: "bg-amber-50 text-amber-700",
                  },
                ].map((r) => (
                  <div key={r.role} className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium px-2.5 py-1 rounded-full shrink-0 ${r.color}`}
                    >
                      {r.role}
                    </span>
                    <span className="text-xs text-gray-500">{r.desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#0A0A0A] rounded-2xl p-6 text-white space-y-4"
            >
              <div className="text-xs text-white/40 font-mono mb-2">
                New member request
              </div>
              {[
                { n: "Arjun Kapoor", e: "arjun@example.com", t: "2h ago" },
                { n: "Meena Iyer", e: "meena@example.com", t: "5h ago" },
              ].map((m) => (
                <div
                  key={m.n}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-mono">
                      {m.n
                        .split(" ")
                        .map((x) => x[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{m.n}</div>
                      <div className="text-xs text-white/40 font-mono">
                        {m.e}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-medium">
                      Approve
                    </div>
                    <div className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded font-medium">
                      Reject
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-xs text-white/30 text-center pt-1">
                Approvals happen right from the dashboard
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0A0A0A]">
        <div className="max-w-2xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-semibold text-white mb-3">
              Ready to streamline your Finance practice?
            </h2>
            <p className="text-gray-500 text-lg mb-8">
              Set up your organisation in under 2 minutes. No credit card
              required.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onSignup}
                className="flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all shadow-lg shadow-white/10"
              >
                Create Organisation <ArrowRight size={14} />
              </button>
              <button
                onClick={onLogin}
                className="px-6 py-3 text-white/50 text-sm font-medium hover:text-white transition-colors"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="bg-white border-t border-white/5 py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-black" />
            <span className="text-md text-black font-mono">
              FinCRM — Company Secretary Suite
            </span>
          </div>
          <span className="text-md text-black font-mono">© 2024</span>
        </div>
      </footer>
    </div>
  );
}
