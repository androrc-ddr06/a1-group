"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight, X } from "lucide-react";

const TOUR_KEY = "a1_portal_tour_done";
const ONBOARDING_TOUR_KEY = "a1_onboarding_tour_done";

type Rect = { top: number; left: number; width: number; height: number };

const GAP = 12;

// ─── Shared tooltip/spotlight UI ────────────────────────────────────────────

function TourOverlay({
  steps,
  storageKey,
  getRectForStep,
  forceStart,
}: {
  steps: { id: string; headline: string; body: string }[];
  storageKey: string;
  getRectForStep: (id: string) => HTMLElement | null;
  forceStart?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const measureStep = useCallback((idx: number) => {
    const el = getRectForStep(steps[idx].id);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [getRectForStep, steps]);

  useEffect(() => {
    const shouldStart = forceStart || !localStorage.getItem(storageKey);
    if (shouldStart) {
      setTimeout(() => { setVisible(true); measureStep(0); }, 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (visible) measureStep(step);
  }, [step, visible, measureStep]);

  useEffect(() => {
    if (!visible) return;
    const handler = () => measureStep(step);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [visible, step, measureStep]);

  function dismiss() {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
  }

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else dismiss();
  }

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  function getTooltipStyle(): React.CSSProperties {
    if (!rect || isLast) return {};
    const viewportH = window.innerHeight;
    const below = rect.top + rect.height + GAP;
    const above = rect.top - GAP - 200;
    const useBelow = below + 220 < viewportH || rect.top < viewportH / 2;
    const top = useBelow ? below : Math.max(8, above);
    const tooltipW = Math.min(384, window.innerWidth - 32);
    const left = Math.max(16, Math.min(
      rect.left + rect.width / 2 - tooltipW / 2,
      window.innerWidth - tooltipW - 16
    ));
    return { position: "fixed", top, left, width: tooltipW };
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={dismiss} />
      {rect && !isLast && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            borderRadius: "16px",
            border: "2px solid #c9a84c",
          }}
        />
      )}
      <div
        className="pointer-events-auto"
        style={isLast
          ? { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: Math.min(384, window.innerWidth - 32) }
          : getTooltipStyle()
        }
      >
        {isLast ? (
          <div className="bg-[#0a1628] border border-white/15 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/30 flex items-center justify-center mx-auto mb-5">
              <span className="text-[#c9a84c] text-xl">✓</span>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">{current.headline}</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-7">{current.body}</p>
            <button
              onClick={dismiss}
              className="inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-sm px-6 py-3 rounded-full transition-colors"
            >
              Got it <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="bg-[#0a1628] border border-white/15 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-white font-bold text-base">{current.headline}</h3>
              <button onClick={dismiss} className="text-white/30 hover:text-white/60 ml-3 flex-shrink-0 mt-0.5">
                <X size={14} />
              </button>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-5">{current.body}</p>
            <div className="flex items-center justify-between">
              <button onClick={dismiss} className="text-white/30 text-xs hover:text-white/60">Skip tour</button>
              <div className="flex items-center gap-3">
                <span className="text-white/30 text-xs">{step + 1} / {steps.length}</span>
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-xs px-4 py-2 rounded-full transition-colors"
                >
                  Next <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tour A: Onboarding tour (contract pending) ──────────────────────────────

const ONBOARDING_STEPS = [
  {
    id: "progress",
    headline: "Your project tracker",
    body: "This card updates in real time as we work. You'll always know the % complete and days remaining.",
  },
  {
    id: "contract",
    headline: "Your contract",
    body: "Your service agreement will appear here once it's ready — usually within a few hours. We'll email you the moment it's ready to sign.",
  },
  {
    id: "payment",
    headline: "Your first payment",
    body: "After signing, your deposit will be due here within 24 hours to lock in your start date. This unlocks your full portal access.",
  },
  {
    id: "quicklinks",
    headline: "Your tools",
    body: "Updates, content approval, assets, and reports all live here. They'll be fully unlocked once you've signed and paid.",
  },
  {
    id: "done",
    headline: "You're all set for now",
    body: "Keep an eye on your email — we'll send you a notification the moment your contract is ready to review and sign.",
  },
];

type OnboardingTourProps = {
  progressRef: React.RefObject<HTMLDivElement | null>;
  contractCardRef: React.RefObject<HTMLDivElement | null>;
  paymentCardRef: React.RefObject<HTMLDivElement | null>;
  quicklinksRef: React.RefObject<HTMLDivElement | null>;
};

export function OnboardingTour({ progressRef, contractCardRef, paymentCardRef, quicklinksRef }: OnboardingTourProps) {
  const getRectForStep = useCallback((id: string): HTMLElement | null => {
    if (id === "progress") return progressRef.current;
    if (id === "contract") return contractCardRef.current;
    if (id === "payment") return paymentCardRef.current;
    if (id === "quicklinks") return quicklinksRef.current;
    return null;
  }, [progressRef, contractCardRef, paymentCardRef, quicklinksRef]);

  return (
    <TourOverlay
      steps={ONBOARDING_STEPS}
      storageKey={ONBOARDING_TOUR_KEY}
      getRectForStep={getRectForStep}
    />
  );
}

// ─── Tour B: Welcome tour (after payment, full access) ───────────────────────

const WELCOME_STEPS = [
  {
    id: "progress",
    headline: "Your project progress",
    body: "This card updates in real time as we complete work on your project. You'll always know exactly where things stand.",
  },
  {
    id: "quicklinks",
    headline: "Your tools are unlocked",
    body: "Content approval, assets, reports — everything is live. Jump to any section from these cards.",
  },
  {
    id: "updates",
    headline: "Updates from A1 Group",
    body: "We post here every time there's news on your project. Check back often as work progresses.",
  },
  {
    id: "done",
    headline: "Welcome to your portal",
    body: "That's everything. We'll keep this dashboard updated as we get to work — expect your first update soon.",
  },
];

type PortalTourProps = {
  progressRef: React.RefObject<HTMLDivElement | null>;
  quicklinksRef: React.RefObject<HTMLDivElement | null>;
  updatesRef: React.RefObject<HTMLDivElement | null>;
  onReady?: (restart: () => void) => void;
  forceStart?: boolean;
};

export default function PortalTour({ progressRef, quicklinksRef, updatesRef, onReady, forceStart }: PortalTourProps) {
  const restartRef = useRef<(() => void) | null>(null);

  const getRectForStep = useCallback((id: string): HTMLElement | null => {
    if (id === "progress") return progressRef.current;
    if (id === "quicklinks") return quicklinksRef.current;
    if (id === "updates") return updatesRef.current;
    return null;
  }, [progressRef, quicklinksRef, updatesRef]);

  // Expose restart to parent via onReady
  useEffect(() => {
    if (onReady && restartRef.current) onReady(restartRef.current);
  });

  return (
    <TourOverlayWithRestart
      steps={WELCOME_STEPS}
      storageKey={TOUR_KEY}
      getRectForStep={getRectForStep}
      onReady={onReady}
      forceStart={forceStart}
    />
  );
}

function TourOverlayWithRestart({
  steps,
  storageKey,
  getRectForStep,
  onReady,
  forceStart,
}: {
  steps: { id: string; headline: string; body: string }[];
  storageKey: string;
  getRectForStep: (id: string) => HTMLElement | null;
  onReady?: (restart: () => void) => void;
  forceStart?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const measureStep = useCallback((idx: number) => {
    const el = getRectForStep(steps[idx].id);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [getRectForStep, steps]);

  function startTour() {
    setStep(0);
    setVisible(true);
    setTimeout(() => measureStep(0), 50);
  }

  useEffect(() => {
    onReady?.(startTour);
    const shouldStart = forceStart || !localStorage.getItem(storageKey);
    if (shouldStart) {
      setTimeout(() => { setVisible(true); measureStep(0); }, 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceStart]);

  useEffect(() => {
    if (visible) measureStep(step);
  }, [step, visible, measureStep]);

  useEffect(() => {
    if (!visible) return;
    const handler = () => measureStep(step);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [visible, step, measureStep]);

  function dismiss() {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
  }

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else dismiss();
  }

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  function getTooltipStyle(): React.CSSProperties {
    if (!rect || isLast) return {};
    const viewportH = window.innerHeight;
    const below = rect.top + rect.height + GAP;
    const above = rect.top - GAP - 200;
    const useBelow = below + 220 < viewportH || rect.top < viewportH / 2;
    const top = useBelow ? below : Math.max(8, above);
    const tooltipW = Math.min(384, window.innerWidth - 32);
    const left = Math.max(16, Math.min(
      rect.left + rect.width / 2 - tooltipW / 2,
      window.innerWidth - tooltipW - 16
    ));
    return { position: "fixed", top, left, width: tooltipW };
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={dismiss} />
      {rect && !isLast && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            borderRadius: "16px",
            border: "2px solid #c9a84c",
          }}
        />
      )}
      <div
        className="pointer-events-auto"
        style={isLast
          ? { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: Math.min(384, window.innerWidth - 32) }
          : getTooltipStyle()
        }
      >
        {isLast ? (
          <div className="bg-[#0a1628] border border-white/15 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/30 flex items-center justify-center mx-auto mb-5">
              <span className="text-[#c9a84c] text-xl">✓</span>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">{current.headline}</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-7">{current.body}</p>
            <button
              onClick={dismiss}
              className="inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-sm px-6 py-3 rounded-full transition-colors"
            >
              Got it <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="bg-[#0a1628] border border-white/15 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-white font-bold text-base">{current.headline}</h3>
              <button onClick={dismiss} className="text-white/30 hover:text-white/60 ml-3 flex-shrink-0 mt-0.5">
                <X size={14} />
              </button>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-5">{current.body}</p>
            <div className="flex items-center justify-between">
              <button onClick={dismiss} className="text-white/30 text-xs hover:text-white/60">Skip tour</button>
              <div className="flex items-center gap-3">
                <span className="text-white/30 text-xs">{step + 1} / {steps.length}</span>
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-xs px-4 py-2 rounded-full transition-colors"
                >
                  Next <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
