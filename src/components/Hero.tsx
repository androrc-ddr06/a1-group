"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import { GooeyText } from "@/components/ui/gooey-text-morphing";

const rotatingWords = ["Dominate.", "Convert.", "Grow.", "Stand Out.", "Win."];

export default function Hero() {

  return (
    <section className="relative min-h-screen bg-[#0a1628] flex items-center justify-center overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#1e3a5f]/30 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-[#c9a84c]/5 blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8"
          style={{ animation: "fade-up 0.6s ease-out forwards" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
          <span className="text-white/60 text-xs font-medium tracking-wide uppercase">
            Full-Service Marketing Agency
          </span>
        </div>

        {/* Headline */}
        <div
          className="mb-4"
          style={{ animation: "fade-up 0.7s ease-out 0.1s both" }}
        >
          <div className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-white leading-[1.05] tracking-tight mb-10">
            We Build Brands
          </div>
          <div className="relative flex items-center justify-center h-[1.15em]">
            <span className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-[#c9a84c] leading-none tracking-tight whitespace-nowrap">
              That&nbsp;
            </span>
            <GooeyText
              texts={rotatingWords}
              morphTime={1.2}
              cooldownTime={2}
              className="h-full w-[280px] sm:w-[380px] lg:w-[520px]"
              textClassName="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-white tracking-tight whitespace-nowrap"
            />
          </div>
        </div>

        {/* Subheadline */}
        <p
          className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mt-6 leading-relaxed"
          style={{ animation: "fade-up 0.7s ease-out 0.2s both" }}
        >
          Content production, paid ads, brand strategy, web design, and AI
          integration — everything your business needs to grow, in one agency.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          style={{ animation: "fade-up 0.7s ease-out 0.3s both" }}
        >
          <a
            href="#contact"
            className="group flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-base px-8 py-4 rounded-full transition-all duration-200 hover:shadow-xl hover:shadow-[#c9a84c]/25"
          >
            Get a Free Strategy Call
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#work"
            className="flex items-center gap-2 text-white/70 hover:text-white font-medium text-base transition-colors border border-white/20 hover:border-white/40 px-8 py-4 rounded-full"
          >
            View Our Work
          </a>
        </div>

        {/* Stats strip */}
        <div
          className="flex flex-wrap items-center justify-center gap-8 mt-16 pt-12 border-t border-white/10"
          style={{ animation: "fade-up 0.7s ease-out 0.4s both" }}
        >
          {[
            { value: "15+", label: "Clients Served" },
            { value: "240%", label: "Avg. Growth" },
            { value: "3+", label: "Years of Excellence" },
            { value: "100%", label: "Results-Focused" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-white/40 text-xs uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#services"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 hover:text-white/60 transition-colors animate-bounce"
        aria-label="Scroll to services"
      >
        <ChevronDown size={24} />
      </a>
    </section>
  );
}
