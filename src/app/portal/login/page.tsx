"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function PortalLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

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

    const supabase = createClient();

    if (mode === "signup") {
      if (form.accessCode.length < 6) {
        setError("Please enter your access code from A1 Group.");
        setLoading(false);
        return;
      }

      // Validate code + create account via API route
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          accessCode: form.accessCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // Sign in after account is created
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        setError("Account created! Please sign in below.");
        setMode("login");
        setLoading(false);
        return;
      }

      router.push("/portal/dashboard");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Incorrect email or password. Please try again.");
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      router.push("/portal/dashboard");
    }

    setLoading(false);
  }

  async function handleForgotPassword() {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    const supabase = createClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://a1group.it.com";
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${baseUrl}/auth/callback?next=/portal/reset-password`,
    });
    setForgotSent(true);
    setForgotLoading(false);
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

          {/* Forgot password mode */}
          {forgotMode && (
            <div>
              {forgotSent ? (
                <div className="text-center py-4">
                  <p className="text-white font-semibold mb-2">Check your email</p>
                  <p className="text-white/50 text-sm mb-5">We sent a password reset link to <span className="text-white">{forgotEmail}</span>.</p>
                  <button onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(""); }} className="text-[#c9a84c] text-sm hover:underline">
                    Back to sign in
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-white/60 text-sm">Enter your email and we&apos;ll send you a reset link.</p>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                    placeholder="you@business.com"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                  />
                  <button
                    onClick={handleForgotPassword}
                    disabled={forgotLoading || !forgotEmail.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] disabled:opacity-60 text-[#0a1628] font-bold text-sm px-6 py-4 rounded-full transition-all"
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                  <button onClick={() => setForgotMode(false)} className="w-full text-white/30 text-xs hover:text-white/60 transition-colors">
                    Back to sign in
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode toggle */}
          {!forgotMode && (<>
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
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
                  placeholder="Code from A1 Group"
                  maxLength={10}
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
            <div className="flex items-center justify-between mt-1">
              <p className="text-white/30 text-xs">
                New client?{" "}
                <button
                  onClick={() => { setMode("signup"); setError(""); }}
                  className="text-[#c9a84c] hover:text-[#d4af61] font-medium"
                >
                  Create your account
                </button>
              </p>
              <button
                onClick={() => { setForgotMode(true); setError(""); }}
                className="text-white/30 text-xs hover:text-[#c9a84c] transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}
          </>)}

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
