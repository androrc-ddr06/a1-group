"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  }

  return (
    <button
      onClick={signOut}
      className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
    >
      <LogOut size={14} />
      <span className="hidden sm:block">Sign Out</span>
    </button>
  );
}
