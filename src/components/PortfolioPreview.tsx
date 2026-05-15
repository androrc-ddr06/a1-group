const projects = [
  {
    client: "Roosters Rolling Barbecue",
    category: "Web Design · Social Media · Content",
    result: "+180% Follower Growth",
    description:
      "Full content production, social media management, and a custom website for a mobile BBQ business. Built the brand's entire digital presence from the ground up.",
    color: "#c9a84c",
    url: "https://roostersrollingbbq.com/",
  },
  {
    client: "Brand Identity Project",
    category: "Branding · Web Design",
    result: "Full Rebrand Delivered",
    description:
      "End-to-end brand refresh including logo, color system, and a conversion-optimized website that doubled inbound leads.",
    color: "#1e3a5f",
    url: null,
  },
  {
    client: "E-Commerce Growth Campaign",
    category: "Paid Ads · Strategy",
    result: "3.8× ROAS on Meta Ads",
    description:
      "Structured Meta Ads campaign with creative testing and retargeting sequences that turned ad spend into predictable revenue.",
    color: "#0a1628",
    url: null,
  },
];

export default function PortfolioPreview() {
  return (
    <section id="work" className="bg-[#0a1628] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-[#c9a84c] font-semibold text-sm uppercase tracking-widest mb-3 block">
              Our Work
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Results Speak
              <br />
              Louder Than Promises
            </h2>
          </div>
          <a
            href="#contact"
            className="text-white/50 hover:text-white text-sm font-medium border border-white/20 hover:border-white/40 px-6 py-3 rounded-full transition-all duration-200 whitespace-nowrap self-start md:self-auto"
          >
            Work With Us →
          </a>
        </div>

        {/* Project cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((p, i) => (
            <div
              key={p.client}
              className="group relative bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-2xl p-8 transition-all duration-300 overflow-hidden"
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ backgroundColor: p.color }}
              />

              <span className="text-white/40 text-xs font-medium uppercase tracking-widest">
                {p.category}
              </span>
              <h3 className="text-white font-bold text-xl mt-3 mb-2 leading-snug">
                {p.client}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                {p.description}
              </p>

              {/* Result badge + link */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#c9a84c]/15 text-[#c9a84c] font-semibold text-sm px-4 py-1.5 rounded-full">
                  {p.result}
                </span>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white text-xs border border-white/15 hover:border-white/30 px-3 py-1.5 rounded-full transition-all"
                  >
                    Visit Site →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
