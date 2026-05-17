"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  FileText,
  MessageSquare,
  FolderOpen,
  Clock,
  Video,
  CreditCard,
  Lock,
} from "lucide-react";
import SignOutButton from "./SignOutButton";
import PortalTour from "./PortalTour";
import { OnboardingTour } from "./PortalTour";

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
  contractPending: boolean;
  contractStatus: string | null;
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardClient({
  firstName, company, project, updates, pendingContentCount,
  contractPending, contractStatus,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const progressRef = useRef<HTMLDivElement>(null);
  const quicklinksRef = useRef<HTMLDivElement>(null);
  const updatesRef = useRef<HTMLDivElement>(null);
  const contractCardRef = useRef<HTMLDivElement>(null);
  const paymentCardRef = useRef<HTMLDivElement>(null);
  const [restartTour, setRestartTour] = useState<(() => void) | null>(null);
  const [forceWelcomeTour, setForceWelcomeTour] = useState(false);

  const handleTourReady = useCallback((restart: () => void) => {
    setRestartTour(() => restart);
  }, []);

  // Auto-launch welcome tour after payment via ?welcome=1
  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      localStorage.removeItem("a1_portal_tour_done");
      setForceWelcomeTour(true);
      router.replace("/portal/dashboard");
    }
  }, [searchParams, router]);

  const bannerMessage = contractStatus === "changes_requested"
    ? "Your revised contract is on its way — we'll email you as soon as it's ready to sign."
    : "Your service agreement is being prepared — we'll email you as soon as it's ready to sign.";

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
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#0a1628]">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-[#0a1628]/50 text-sm mt-1">{company}</p>
        </div>

        {/* Contract pending banner */}
        {contractPending && (
          <div className="flex items-start gap-3 bg-[#c9a84c]/8 border border-[#c9a84c]/25 rounded-xl px-4 py-3 mb-6">
            <FileText size={15} className="text-[#c9a84c] flex-shrink-0 mt-0.5" />
            <p className="text-[#0a1628]/70 text-sm leading-relaxed">{bannerMessage}</p>
          </div>
        )}

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

        {/* Nav cards — 6 cards: Contract, Payment, Updates, Content, Assets, Reports */}
        <div ref={quicklinksRef} className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

          {/* Contract card */}
          <div ref={contractCardRef}>
            {contractPending ? (
              <div className="bg-white border border-[#0a1628]/8 rounded-2xl p-5 flex flex-col gap-3 opacity-60 cursor-default select-none">
                <div className="relative w-10 h-10 bg-[#f8fafc] rounded-xl flex items-center justify-center">
                  <Lock size={16} className="text-[#0a1628]/40" />
                </div>
                <div>
                  <div className="text-[#0a1628] font-semibold text-sm">Contract</div>
                  <div className="text-[#0a1628]/35 text-xs mt-0.5">Pending — coming soon</div>
                </div>
              </div>
            ) : (
              <Link
                href="/portal/contract"
                className="group bg-white border border-[#0a1628]/8 hover:border-[#0a1628]/20 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md"
              >
                <div className="w-10 h-10 bg-[#f8fafc] group-hover:bg-[#0a1628] rounded-xl flex items-center justify-center transition-colors">
                  <FileText size={18} className="text-[#0a1628] group-hover:text-white transition-colors" />
                </div>
                <div className="text-[#0a1628] font-semibold text-sm">Contract</div>
              </Link>
            )}
          </div>

          {/* Payment card */}
          <div ref={paymentCardRef}>
            {contractPending ? (
              <div className="bg-white border border-[#0a1628]/8 rounded-2xl p-5 flex flex-col gap-3 opacity-60 cursor-default select-none">
                <div className="relative w-10 h-10 bg-[#f8fafc] rounded-xl flex items-center justify-center">
                  <Lock size={16} className="text-[#0a1628]/40" />
                </div>
                <div>
                  <div className="text-[#0a1628] font-semibold text-sm">Payment</div>
                  <div className="text-[#0a1628]/35 text-xs mt-0.5">Unlocks after signing</div>
                </div>
              </div>
            ) : (
              <Link
                href="/portal/payment"
                className="group bg-white border border-[#0a1628]/8 hover:border-[#0a1628]/20 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md"
              >
                <div className="w-10 h-10 bg-[#f8fafc] group-hover:bg-[#0a1628] rounded-xl flex items-center justify-center transition-colors">
                  <CreditCard size={18} className="text-[#0a1628] group-hover:text-white transition-colors" />
                </div>
                <div className="text-[#0a1628] font-semibold text-sm">Payment</div>
              </Link>
            )}
          </div>

          {/* Updates */}
          <Link
            href="#updates"
            className="group bg-white border border-[#0a1628]/8 hover:border-[#0a1628]/20 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md"
          >
            <div className="w-10 h-10 bg-[#f8fafc] group-hover:bg-[#0a1628] rounded-xl flex items-center justify-center transition-colors">
              <MessageSquare size={18} className="text-[#0a1628] group-hover:text-white transition-colors" />
            </div>
            <div>
              <div className="text-[#0a1628] font-semibold text-sm">Updates</div>
              {updates.length > 0 && (
                <div className="text-[#0a1628]/40 text-xs mt-0.5">{updates.length} update{updates.length !== 1 ? "s" : ""}</div>
              )}
            </div>
          </Link>

          {/* Content */}
          <Link
            href="/portal/content"
            className="group bg-white border border-[#0a1628]/8 hover:border-[#0a1628]/20 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md"
          >
            <div className="relative w-10 h-10 bg-[#f8fafc] group-hover:bg-[#0a1628] rounded-xl flex items-center justify-center transition-colors">
              <Video size={18} className="text-[#0a1628] group-hover:text-white transition-colors" />
              {pendingContentCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#c9a84c] rounded-full" />
              )}
            </div>
            <div>
              <div className="text-[#0a1628] font-semibold text-sm">Content</div>
              {pendingContentCount > 0 && (
                <div className="text-[#0a1628]/40 text-xs mt-0.5">{pendingContentCount} pending</div>
              )}
            </div>
          </Link>

          {/* Assets */}
          <Link
            href="/portal/assets"
            className="group bg-white border border-[#0a1628]/8 hover:border-[#0a1628]/20 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md"
          >
            <div className="w-10 h-10 bg-[#f8fafc] group-hover:bg-[#0a1628] rounded-xl flex items-center justify-center transition-colors">
              <FolderOpen size={18} className="text-[#0a1628] group-hover:text-white transition-colors" />
            </div>
            <div className="text-[#0a1628] font-semibold text-sm">My Assets</div>
          </Link>

          {/* Reports */}
          <Link
            href="/portal/reports"
            className="group bg-white border border-[#0a1628]/8 hover:border-[#0a1628]/20 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md"
          >
            <div className="w-10 h-10 bg-[#f8fafc] group-hover:bg-[#0a1628] rounded-xl flex items-center justify-center transition-colors">
              <TrendingUp size={18} className="text-[#0a1628] group-hover:text-white transition-colors" />
            </div>
            <div className="text-[#0a1628] font-semibold text-sm">Reports</div>
          </Link>
        </div>

        {/* Updates feed */}
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
          {restartTour && !contractPending && (
            <button
              onClick={restartTour}
              className="text-[#0a1628]/30 hover:text-[#0a1628]/60 text-xs underline underline-offset-2 transition-colors"
            >
              Take tour again
            </button>
          )}
        </div>
      </main>

      {/* Show onboarding tour when contract is pending, welcome tour when fully active */}
      {contractPending ? (
        <OnboardingTour
          progressRef={progressRef}
          contractCardRef={contractCardRef}
          paymentCardRef={paymentCardRef}
          quicklinksRef={quicklinksRef}
        />
      ) : (
        <PortalTour
          progressRef={progressRef}
          quicklinksRef={quicklinksRef}
          updatesRef={updatesRef}
          onReady={handleTourReady}
          forceStart={forceWelcomeTour}
        />
      )}
    </div>
  );
}
