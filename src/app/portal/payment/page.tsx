"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CreditCard, CheckCircle, Smartphone, Lock } from "lucide-react";
import Link from "next/link";

type PaymentSplit = {
  upfront_cents: number;
  on_delivery_cents: number;
  monthly_cents: number;
};

function PaymentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const success = params.get("success") === "true";
  const sessionId = params.get("session_id");

  const [split, setSplit] = useState<PaymentSplit | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(success && !!sessionId);
  const [zelleSent, setZelleSent] = useState(false);
  const [zelleSending, setZelleSending] = useState(false);

  useEffect(() => {
    async function load() {
      if (success && sessionId) {
        setVerifying(true);
        const verifyRes = await fetch(`/api/portal/payment?session_id=${sessionId}`);
        const verifyData = await verifyRes.json();
        if (verifyData.paid) {
          window.location.href = "/portal/dashboard?welcome=1";
          return;
        }
        setVerifying(false);
      }

      const res = await fetch("/api/portal/me");
      if (!res.ok) { router.push("/portal/login"); return; }
      const data = await res.json();

      const contracts = data.contracts ?? [];
      const signed = contracts.find((c: { contract_status: string }) => c.contract_status === "signed");
      if (signed?.payment_split) setSplit(signed.payment_split);

      const payments = data.payments ?? [];
      const paid = payments.find((p: { status: string }) => p.status === "paid");
      if (paid) {
        window.location.href = "/portal/dashboard";
        return;
      }

      setLoading(false);
    }
    load();
  }, [router, success, sessionId]);

  async function handleZelleNotify() {
    setZelleSending(true);
    await fetch("/api/portal/payment/zelle-notify", { method: "POST" });
    setZelleSent(true);
    setZelleSending(false);
  }

  const fmt = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  if (verifying || loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          {verifying ? (
            <>
              <div className="w-16 h-16 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={28} className="text-[#c9a84c]" />
              </div>
              <h1 className="text-2xl font-extrabold text-white mb-3">Payment Received!</h1>
              <p className="text-white/50 text-sm mb-6">Confirming your deposit and setting up your dashboard…</p>
              <Loader2 size={20} className="text-[#c9a84c] animate-spin mx-auto" />
            </>
          ) : (
            <Loader2 size={32} className="text-[#c9a84c] animate-spin" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <header className="bg-[#0a1628] border-b border-white/10 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/"><img src="/logo-dark.svg" alt="A1 Group" className="h-8 w-auto" /></Link>
          <span className="text-white/50 text-sm">Secure Payment</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-white font-extrabold text-2xl mb-2">Complete Your Payment</h1>
          <p className="text-white/50 text-sm">Your contract is signed. Complete your deposit to get full portal access.</p>
        </div>

        {/* Payment breakdown */}
        {split && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 space-y-3">
            <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-4">Payment Breakdown</h3>
            {split.upfront_cents > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-white/8">
                <div>
                  <div className="text-white font-semibold text-sm">Due Today</div>
                  <div className="text-white/40 text-xs">Deposit per signed agreement</div>
                </div>
                <span className="text-[#c9a84c] font-bold text-lg">{fmt(split.upfront_cents)}</span>
              </div>
            )}
            {split.on_delivery_cents > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-white/8">
                <div>
                  <div className="text-white/60 text-sm">Due on Delivery</div>
                  <div className="text-white/30 text-xs">Paid when project is complete</div>
                </div>
                <span className="text-white/60 font-semibold">{fmt(split.on_delivery_cents)}</span>
              </div>
            )}
            {split.monthly_cents > 0 && (
              <div className="flex justify-between items-center py-2">
                <div>
                  <div className="text-white/60 text-sm">Monthly (Month 2+)</div>
                  <div className="text-white/30 text-xs">Recurring monthly services</div>
                </div>
                <span className="text-white/60 font-semibold">{fmt(split.monthly_cents)}/mo</span>
              </div>
            )}
          </div>
        )}

        <p className="text-white/40 text-xs uppercase tracking-wide font-semibold mb-3">Choose a payment method</p>

        <div className="space-y-4">
          {/* Zelle — active */}
          <div className="bg-white/5 border-2 border-[#c9a84c]/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/15 flex items-center justify-center flex-shrink-0">
                <Smartphone size={18} className="text-[#c9a84c]" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">Zelle</div>
                <div className="text-[#c9a84c] text-xs font-semibold">Available now</div>
              </div>
            </div>
            <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-white/50 text-xs mb-1">Send to phone number</p>
              <p className="text-white font-bold text-lg tracking-wide">707-564-8658</p>
            </div>
            <p className="text-white/40 text-xs mb-5 leading-relaxed">
              Once you&apos;ve sent the payment, tap the button below. We&apos;ll confirm receipt and unlock your portal within a few hours.
            </p>
            {zelleSent ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                <p className="text-emerald-400 text-sm font-semibold">Thanks! We&apos;ll verify and unlock your portal shortly.</p>
              </div>
            ) : (
              <button
                onClick={handleZelleNotify}
                disabled={zelleSending}
                className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] disabled:opacity-60 text-[#0a1628] font-bold py-3.5 rounded-full transition-all"
              >
                {zelleSending ? <Loader2 size={15} className="animate-spin" /> : null}
                {zelleSending ? "Notifying…" : "I've sent my Zelle payment →"}
              </button>
            )}
          </div>

          {/* Stripe — locked/coming soon */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 opacity-50 cursor-not-allowed select-none">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
                <CreditCard size={18} className="text-white/30" />
              </div>
              <div>
                <div className="text-white/50 font-bold text-sm">Credit / Debit Card</div>
                <div className="flex items-center gap-1 text-white/30 text-xs">
                  <Lock size={10} /> Coming soon
                </div>
              </div>
            </div>
            <p className="text-white/25 text-xs">Online card payments will be available shortly.</p>
          </div>
        </div>

        <p className="text-white/20 text-xs text-center mt-6">
          Questions? <Link href="/#contact" className="text-[#c9a84c]/60 hover:text-[#c9a84c]">Contact A1 Group</Link>
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return <Suspense><PaymentContent /></Suspense>;
}
