import {
  Share2,
  Video,
  TrendingUp,
  Palette,
  Globe,
  Bot,
} from "lucide-react";

const services = [
  {
    icon: Share2,
    title: "Social Media Management",
    description:
      "We own your social presence. Strategy, scheduling, engagement, and growth across Instagram, TikTok, and Facebook.",
    highlight: "Full Account Takeover",
  },
  {
    icon: Video,
    title: "Content Production",
    description:
      "Photos, reels, videos, and graphics that stop the scroll. Professional creative assets tailored to your brand.",
    highlight: "Photos · Reels · Graphics",
  },
  {
    icon: TrendingUp,
    title: "Paid Advertising",
    description:
      "Meta Ads and Google Ads campaigns engineered for ROI. We don't run ads — we run results.",
    highlight: "Meta & Google Ads",
  },
  {
    icon: Palette,
    title: "Branding & Identity",
    description:
      "From logo to full rebrand, we craft visual identities that command attention and build trust instantly.",
    highlight: "Logo · Brand System",
  },
  {
    icon: Globe,
    title: "Website Design",
    description:
      "Fast, beautiful, conversion-optimized websites. From landing pages to full business platforms.",
    highlight: "Design · Development",
  },
  {
    icon: Bot,
    title: "AI Integration",
    description:
      "Chatbots, AI-powered automations, and intelligent tools that save time and scale your business without hiring.",
    highlight: "Chatbots · Automation",
  },
];

export default function ServicesGrid() {
  return (
    <section id="services" className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-[#c9a84c] font-semibold text-sm uppercase tracking-widest mb-3">
            What We Do
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0a1628] leading-tight">
            Everything Your Brand Needs
            <br />
            <span className="text-[#1e3a5f]">to Win Online</span>
          </h2>
          <p className="text-[#0a1628]/50 text-lg mt-4 max-w-xl mx-auto">
            Six core services, one unified strategy. We handle everything so you
            can focus on running your business.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div
              key={s.title}
              className="group relative bg-[#f8fafc] hover:bg-[#0a1628] border border-transparent hover:border-[#1e3a5f] rounded-2xl p-8 transition-all duration-300 cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-[#0a1628]/8 group-hover:bg-[#c9a84c]/15 flex items-center justify-center mb-5 transition-colors duration-300">
                <s.icon
                  size={22}
                  className="text-[#0a1628] group-hover:text-[#c9a84c] transition-colors duration-300"
                />
              </div>
              <span className="text-[#c9a84c] text-xs font-semibold tracking-widest uppercase">
                {s.highlight}
              </span>
              <h3 className="text-[#0a1628] group-hover:text-white font-bold text-xl mt-2 mb-3 transition-colors duration-300">
                {s.title}
              </h3>
              <p className="text-[#0a1628]/55 group-hover:text-white/60 text-sm leading-relaxed transition-colors duration-300">
                {s.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#1b2e4b] text-white font-semibold text-sm px-8 py-4 rounded-full transition-all duration-200 hover:shadow-lg"
          >
            Talk to Us About Your Brand →
          </a>
        </div>
      </div>
    </section>
  );
}
