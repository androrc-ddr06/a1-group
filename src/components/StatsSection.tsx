"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 15, suffix: "+", label: "Clients Served" },
  { value: 240, suffix: "%", label: "Average Growth" },
  { value: 3, suffix: "+", label: "Years in Business" },
  { value: 6, suffix: "", label: "Core Services" },
];

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const step = target / (duration / 16);
          let current = 0;
          const timer = setInterval(() => {
            current = Math.min(current + step, target);
            setCount(Math.floor(current));
            if (current >= target) clearInterval(timer);
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section
      id="results"
      className="bg-[#1b2e4b] py-16 border-y border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-white/10">
          {stats.map((s) => (
            <div key={s.label} className="text-center py-4">
              <div className="text-4xl lg:text-5xl font-extrabold text-white mb-2">
                <CountUp target={s.value} suffix={s.suffix} />
              </div>
              <div className="text-white/40 text-sm uppercase tracking-widest font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
