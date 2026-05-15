import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ruben Prado",
    title: "Owner, Roosters Rolling Barbecue",
    quote:
      "A1 Group completely transformed our Instagram. Our followers grew, our engagement skyrocketed, and we started getting real customers through the door because of their content. Worth every penny.",
    stars: 5,
    initials: "RP",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#c9a84c] font-semibold text-sm uppercase tracking-widest mb-3 block">
            Client Stories
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0a1628]">
            Trusted by Real Businesses
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-[#f8fafc] border border-[#0a1628]/8 rounded-2xl p-10 text-center"
            >
              {/* Stars */}
              <div className="flex items-center justify-center gap-1 mb-6">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill="#c9a84c"
                    className="text-[#c9a84c]"
                  />
                ))}
              </div>

              <blockquote className="text-[#0a1628] text-xl font-medium leading-relaxed mb-8">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0a1628] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{t.initials}</span>
                </div>
                <div className="text-left">
                  <div className="text-[#0a1628] font-semibold text-sm">{t.name}</div>
                  <div className="text-[#0a1628]/50 text-xs">{t.title}</div>
                </div>
              </div>
            </div>
          ))}

          <p className="text-center text-[#0a1628]/30 text-sm mt-8">
            More client stories coming soon. Be part of the next success.
          </p>
        </div>
      </div>
    </section>
  );
}
