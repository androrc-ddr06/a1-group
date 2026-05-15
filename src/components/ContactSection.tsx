"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Simulate submission — wire up Resend/API route later
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <section id="contact" className="bg-[#0a1628] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <span className="text-[#c9a84c] font-semibold text-sm uppercase tracking-widest mb-3 block">
              Let&apos;s Talk
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              Ready to Take Your
              <br />
              Brand to the Next Level?
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              Tell us about your business and we&apos;ll put together a custom
              strategy — no obligation, no fluff. Just a real conversation about
              how we can grow your brand.
            </p>
            <div className="space-y-4">
              {[
                "Free strategy consultation",
                "Custom growth plan for your business",
                "Response within 24 hours",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
                  <span className="text-white/70 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-[#c9a84c] mx-auto mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">
                  Message Received!
                </h3>
                <p className="text-white/50 text-sm">
                  We&apos;ll be in touch within 24 hours with your custom strategy.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-xs uppercase tracking-wide block mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Smith"
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/8 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs uppercase tracking-wide block mb-1.5">
                      Business Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Acme Co."
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wide block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@business.com"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/8 transition-all"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wide block mb-1.5">
                    What do you need help with?
                  </label>
                  <select
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50 transition-all appearance-none"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="" className="bg-[#0a1628]">Select a service...</option>
                    <option value="social" className="bg-[#0a1628]">Social Media Management</option>
                    <option value="content" className="bg-[#0a1628]">Content Production</option>
                    <option value="ads" className="bg-[#0a1628]">Paid Advertising</option>
                    <option value="branding" className="bg-[#0a1628]">Branding & Identity</option>
                    <option value="web" className="bg-[#0a1628]">Website Design</option>
                    <option value="ai" className="bg-[#0a1628]">AI Integration</option>
                    <option value="all" className="bg-[#0a1628]">Full-Service / Not Sure Yet</option>
                  </select>
                </div>

                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wide block mb-1.5">
                    Tell us about your business
                  </label>
                  <textarea
                    rows={4}
                    placeholder="What does your business do, and what's your main goal right now?"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/8 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] disabled:opacity-60 text-[#0a1628] font-bold text-sm px-6 py-4 rounded-full transition-all duration-200 hover:shadow-xl hover:shadow-[#c9a84c]/25"
                >
                  {loading ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Message
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
