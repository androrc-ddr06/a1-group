"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "a1_portal_tour_done";

type Rect = { top: number; left: number; width: number; height: number };

const STEPS = [
  {
    id: "progress",
    headline: "Your project progress",
    body: "This card updates in real time as we complete work on your project. You'll always know exactly where things stand.",
  },
  {
    id: "quicklinks",
    headline: "Quick links",
    body: "Jump to your assets, reports, or revisit your onboarding answers any time from these cards.",
  },
  {
    id: "updates",
    headline: "Updates from A1 Group",
    body: "We post here every time there's news on your project. You'll get notified as work progresses.",
  },
  {
    id: "done",
    headline: "You're all set",
    body: "That's your portal. We'll take it from here — expect updates as we get to work on your project.",
  },
];

const GAP = 12; // px between ring and tooltip

export function useTourRefs() {
  const progressRef = useRef<HTMLDivElement>(null);
  const quicklinksRef = useRef<HTMLDivElement>(null);
  const updatesRef = useRef<HTMLDivElement>(null);
  return { progressRef, quicklinksRef, updatesRef };
}

type TourProps = {
  progressRef: React.RefObject<HTMLDivElement | null>;
  quicklinksRef: React.RefObject<HTMLDivElement | null>;
  updatesRef: React.RefObject<HTMLDivElement | null>;
};

export default function PortalTour({ progressRef, quicklinksRef, updatesRef }: TourProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const getRef = useCallback((stepId: string) => {
    if (stepId === "progress") return progressRef.current;
    if (stepId === "quicklinks") return quicklinksRef.current;
    if (stepId === "updates") return updatesRef.current;
    return null;
  }, [progressRef, quicklinksRef, updatesRef]);

  const measureStep = useCallback((stepIndex: number) => {
    const el = getRef(STEPS[stepIndex].id);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [getRef]);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Small delay so the page has painted before we measure
      setTimeout(() => {
        setVisible(true);
        measureStep(0);
      }, 400);
    }
  }, [measureStep]);

  useEffect(() => {
    if (visible) measureStep(step);
  }, [step, visible, measureStep]);

  // Re-measure on resize
  useEffect(() => {
    if (!visible) return;
    const handler = () => measureStep(step);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [visible, step, measureStep]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = current.id === "done";

  // Tooltip placement: prefer below the target, fall back to above if too close to bottom
  function getTooltipStyle(): React.CSSProperties {
    if (!rect || isLast) return {};
    const viewportH = window.innerHeight;
    const below = rect.top + rect.height + GAP;
    const above = rect.top - GAP - 200; // approx tooltip height
    const useBelow = below + 220 < viewportH || rect.top < viewportH / 2;
    const top = useBelow ? below : Math.max(8, above);
    // Center the tooltip over the target, clamped to viewport
    const tooltipW = Math.min(384, window.innerWidth - 32);
    const left = Math.max(16, Math.min(
      rect.left + rect.width / 2 - tooltipW / 2,
      window.innerWidth - tooltipW - 16
    ));
    return { position: "fixed", top, left, width: tooltipW };
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Full backdrop */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={dismiss} />

      {/* Spotlight cutout — renders a transparent hole over the target */}
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

      {/* Tooltip */}
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
              <button onClick={dismiss} className="text-white/30 text-xs hover:text-white/60">
                Skip tour
              </button>
              <div className="flex items-center gap-3">
                <span className="text-white/30 text-xs">{step + 1} / {STEPS.length}</span>
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
