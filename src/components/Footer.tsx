import Link from "next/link";
import { Share2, Globe, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#060e1a] text-white/70 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-extrabold text-white">A1</span>
              <span className="text-[#c9a84c] font-extrabold text-2xl">▲</span>
              <span className="text-white/70 font-semibold tracking-[0.2em] text-xs uppercase mt-0.5">
                GROUP
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Full-service marketing agency helping businesses dominate their
              market through content, strategy, and cutting-edge AI integration.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-white/40 hover:text-[#c9a84c] transition-colors"
              >
                <Share2 size={18} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-white/40 hover:text-[#c9a84c] transition-colors"
              >
                <Globe size={18} />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">
              Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                "Social Media Management",
                "Content Production",
                "Paid Advertising",
                "Brand Strategy",
                "Web Design",
                "AI Integration",
              ].map((s) => (
                <li key={s}>
                  <a href="#services" className="hover:text-white transition-colors">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">
              Contact
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[#c9a84c]" />
                <a href="mailto:hello@a1groupagency.com" className="hover:text-white transition-colors">
                  hello@a1groupagency.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[#c9a84c]" />
                <span>Schedule a Call</span>
              </li>
            </ul>
            <div className="mt-6">
              <Link
                href="/portal/login"
                className="text-[#c9a84c] hover:text-[#d4af61] text-sm font-medium transition-colors"
              >
                Client Portal →
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>© {new Date().getFullYear()} A1 Group. All rights reserved.</span>
          <span>Built with precision. Driven by results.</span>
        </div>
      </div>
    </footer>
  );
}
