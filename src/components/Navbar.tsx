"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#services", label: "Services" },
  { href: "#work", label: "Our Work" },
  { href: "#results", label: "Results" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#0a1628]/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-dark.svg" alt="A1 Group" className="h-9 w-9" />
            <span className="text-white font-bold tracking-[0.18em] text-sm uppercase">
              Group
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-white/70 hover:text-white text-sm font-medium transition-colors duration-200"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/portal/login"
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Client Login
            </Link>
            <a
              href="#contact"
              className="bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-[#c9a84c]/25"
            >
              Get Started
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0a1628] border-t border-white/10 px-6 py-6 flex flex-col gap-5">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white text-base font-medium"
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
            <Link
              href="/portal/login"
              onClick={() => setOpen(false)}
              className="text-white/70 text-sm font-medium"
            >
              Client Login
            </Link>
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="bg-[#c9a84c] text-[#0a1628] font-semibold text-sm px-5 py-3 rounded-full text-center"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
