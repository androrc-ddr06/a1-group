"use client";

import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "a1_portal_tour_done";

type Step = {
  headline: string;
  body: string;
  tooltipClass: string; // fixed positioning for the tooltip card
  ringClass: string | null; // ring overlay on target, null = no ring
};

const STEPS: Step[] = [
  {
    headline: "Your project, live",
    body: "This card updates in real time as we complete work on your project. You'll always know exactly where things stand.",
    tooltipClass: "top-[260px] left-1/2 -translate-x-1/2",
    ringClass: "top-[120px] left-1/2 -translate-x-1/2 w-full max-w-6xl px-6 h-[120px]",
  },
  {
    headline: "Quick links",
    body: "Jump to your assets, reports, or revisit your onboarding answers any time from these cards.",
    tooltipClass: "top-[54%] left-1/2 -translate-x-1/2",
    ringClass: "top-[43%] left-1/2 -translate-x-1/2 w-full max-w-6xl px-6 h-[104px]",
  },
  {
    headline: "Updates from A1 Group",
    body: "We post here every time there's news on your project. You'll get notified as work progresses.",
    tooltipClass: "bottom-[200px] left-1/2 -translate-x-1/2",
    ringClass: "bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-6xl px-6 h-[120px]",
  },
  {
    headline: "You're all set",
    body: "That's your portal. We'll take it from here — expect updates as we get to work on your project.",
    tooltipClass: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    ringClass: null,
  },
];

export default function PortalTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

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
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={dismiss} />

      {/* Spotlight ring */}
      {current.ringClass && (
        <div className={`absolute pointer-events-none ${current.ringClass}`}>
          <div className="w-full h-full rounded-2xl ring-2 ring-[#c9a84c]" />
        </div>
      )}

      {/* Tooltip card */}
      <div className={`absolute pointer-events-auto w-full max-w-sm px-4 ${current.tooltipClass}`}>
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
