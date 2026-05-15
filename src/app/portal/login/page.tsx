"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Lock } from "lucide-react";

export default function PortalLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    accessCode: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Placeholder — will wire to Supabase auth
    await new Promise((r) => setTimeout(r, 800));

    if (mode === "signup") {
      // Validate access code before creating account
      if (form.accessCode.length !== 8) {
        setError("Please enter your 8-character access code.");
        setLoading(false);
        return;
      }
      router.push("/portal/onboarding");
    } else {
      router.push("/portal/dashboard");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-10">
          <img src="/logo-dark.svg" alt="A1 Group" className="h-12 w-auto" />
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={16} className="text-[#c9a84c]" />
            <h1 className="text-white font-bold text-xl">Client Portal</h1>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? "bg-[#c9a84c] text-[#0a1628]"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {m === "login" ? "Sign In" : "New Client"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wide block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@business.com"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
              />
            </div>

            <div>
              <label className="text-white/60 text-xs uppercase tracking-wide block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 pr-11 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wide block mb-1.5">
                  Access Code
                  <span className="text-[#c9a84c] ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="accessCode"
                  value={form.accessCode}
                  onChange={handleChange}
                  placeholder="8-character code from A1 Group"
                  maxLength={8}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all font-mono tracking-widest uppercase"
                />
                <p className="text-white/30 text-xs mt-1.5">
                  You received this code from Alejandro when you signed on.
                </p>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] disabled:opacity-60 text-[#0a1628] font-bold text-sm px-6 py-4 rounded-full transition-all duration-200 mt-2"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          {mode === "login" && (
            <p className="text-white/30 text-xs text-center mt-4">
              New client?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-[#c9a84c] hover:text-[#d4af61] font-medium"
              >
                Create your account
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Don&apos;t have an access code?{" "}
          <Link href="/#contact" className="text-[#c9a84c]/60 hover:text-[#c9a84c]">
            Contact A1 Group
          </Link>
        </p>
      </div>
    </div>
  );
}
