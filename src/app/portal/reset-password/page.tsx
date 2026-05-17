"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase sets the session from the URL hash automatically on auth state change
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    router.push("/portal/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-10">
          <img src="/logo-dark.svg" alt="A1 Group" className="h-12 w-auto" />
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={16} className="text-[#c9a84c]" />
            <h1 className="text-white font-bold text-xl">Set New Password</h1>
          </div>

          {!ready ? (
            <div className="text-center py-8">
              <p className="text-white/50 text-sm">Verifying reset link…</p>
              <p className="text-white/30 text-xs mt-3">
                If nothing happens,{" "}
                <Link href="/portal/login" className="text-[#c9a84c] hover:underline">
                  request a new link
                </Link>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wide block mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    required
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

              <div>
                <label className="text-white/60 text-xs uppercase tracking-wide block mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                />
              </div>

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
                {loading ? "Saving…" : "Save New Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
