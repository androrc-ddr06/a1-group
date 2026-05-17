"use client";

import { useRef, useCallback, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  FileText,
  MessageSquare,
  FolderOpen,
  Clock,
  Video,
} from "lucide-react";
import SignOutButton from "./SignOutButton";
import PortalTour from "./PortalTour";

type Project = {
  name: string;
  days_remaining: number;
  progress_percent: number;
  start_date: string | null;
  due_date: string | null;
};

type Update = { id: string; message: string; created_at: string };

type Props = {
  firstName: string;
  company: string;
  project: Project | null;
  updates: Update[];
  pendingContentCount: number;
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardClient({ firstName, company, project, updates, pendingContentCount }: Props) {
  const progressRef = useRef<HTMLDivElement>(null);
  const quicklinksRef = useRef<HTMLDivElement>(null);
  const updatesRef = useRef<HTMLDivElement>(null);
  const [restartTour, setRestartTour] = useState<(() => void) | null>(null);

  const handleTourReady = useCallback((restart: () => void) => {
    setRestartTour(() => restart);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top bar */}
      <header className="bg-[#0a1628] border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/logo-dark.svg" alt="A1 Group" className="h-8 w-auto" />
            </Link>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-white/50 text-sm">Client Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-sm hidden sm:block">{company}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#0a1628]">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-[#0a1628]/50 text-sm mt-1">{company}</p>
        </div>

        {/* Progress card — tour step 1 */}
        <div ref={progressRef}>
          {project ? (
            <div className="bg-[#0a1628] rounded-2xl p-8 mb-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <span className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest">
                    Active Project
                  </span>
                  <h2 className="text-xl font-bold mt-1">{project.name}</h2>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 self-start">
                  <Clock size={14} className="text-[#c9a84c]" />
                  <span className="text-sm font-semibold">
                    {project.days_remaining} days remaining
                  </span>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-white/50 mb-2">
                  <span>Progress</span>
                  <span className="font-bold text-white">{project.progress_percent}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#c9a84c] rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(2, project.progress_percent)}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-6 text-xs text-white/40 mt-4">
                <span>Started: {formatDate(project.start_date)}</span>
                <span>Due: {formatDate(project.due_date)}</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#0a1628] rounded-2xl p-8 mb-6 text-white text-center">
              <p className="text-white/50">Your project is being set up. Check back soon!</p>
            </div>
          )}
        </div>

        {/* Quick nav cards — tour step 2 */}
        <div ref={quicklinksRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: MessageSquare, label: "Updates", href: "#updates", badge: updates.length > 0 ? `${updates.length}` : null },
            { icon: Video, label: "Content", href: "/portal/content", badge: pendingContentCount > 0 ? `${pendingContentCount} pending` : null },
            { icon: FolderOpen, label: "My Assets", href: "/portal/assets", badge: null },
            { icon: TrendingUp, label: "Reports", href: "/portal/reports", badge: null },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group bg-white border border-[#0a1628]/8 hover:border-[#0a1628]/20 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md"
            >
              <div className="relative w-10 h-10 bg-[#f8fafc] group-hover:bg-[#0a1628] rounded-xl flex items-center justify-center transition-colors">
                <item.icon size={18} className="text-[#0a1628] group-hover:text-white transition-colors" />
                {item.badge && item.label === "Content" && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#c9a84c] rounded-full" />
                )}
              </div>
              <div>
                <div className="text-[#0a1628] font-semibold text-sm">{item.label}</div>
                {item.badge && (
                  <div className="text-[#0a1628]/40 text-xs mt-0.5">{item.badge}</div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Updates feed — tour step 3 */}
        <div ref={updatesRef} id="updates" className="bg-white border border-[#0a1628]/8 rounded-2xl p-6">
          <h3 className="text-[#0a1628] font-bold text-lg mb-5">
            Latest Updates from A1 Group
          </h3>
          {updates.length === 0 ? (
            <p className="text-[#0a1628]/30 text-sm">No updates yet. We'll post here as work progresses.</p>
          ) : (
            <div className="space-y-4">
              {updates.map((u) => (
                <div
                  key={u.id}
                  className="flex gap-4 pb-4 border-b border-[#0a1628]/6 last:border-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0a1628] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">A1</span>
                  </div>
                  <div>
                    <p className="text-[#0a1628]/80 text-sm leading-relaxed">{u.message}</p>
                    <span className="text-[#0a1628]/30 text-xs mt-1 block">
                      {formatDate(u.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8">
          <p className="text-[#0a1628]/30 text-xs">
            Questions? Reply to any of our emails or{" "}
            <Link href="/#contact" className="text-[#c9a84c] hover:underline">
              contact us here
            </Link>
            .
          </p>
          {restartTour && (
            <button
              onClick={restartTour}
              className="text-[#0a1628]/30 hover:text-[#0a1628]/60 text-xs underline underline-offset-2 transition-colors"
            >
              Take tour again
            </button>
          )}
        </div>
      </main>

      <PortalTour
        progressRef={progressRef}
        quicklinksRef={quicklinksRef}
        updatesRef={updatesRef}
        onReady={handleTourReady}
      />
    </div>
  );
}
