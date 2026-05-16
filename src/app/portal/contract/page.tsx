"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, FileText, MessageSquare, ExternalLink } from "lucide-react";
import Link from "next/link";

type Contract = {
  id: string;
  contract_status: string;
  contract_html_url: string | null;
  payment_split: { upfront_cents: number; on_delivery_cents: number; monthly_cents: number };
  client_feedback?: string | null;
};

export default function ContractPage() {
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [showRequestChanges, setShowRequestChanges] = useState(false);
  const [changesFeedback, setChangesFeedback] = useState("");
  const [submittingChanges, setSubmittingChanges] = useState(false);
  const [changesSubmitted, setChangesSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/portal/me");
      if (!res.ok) { router.push("/portal/login"); return; }
      const data = await res.json();

      const contracts: Contract[] = data.contracts ?? [];
      const viewable = contracts.find(
        (c) => c.contract_status === "approved" || c.contract_status === "changes_requested"
      );

      if (!viewable) { router.push("/portal/dashboard"); return; }
      setContract(viewable);

      if (viewable.contract_status === "changes_requested") {
        setChangesSubmitted(true);
      }

      if (viewable.contract_html_url) {
        const htmlRes = await fetch(viewable.contract_html_url);
        setHtml(await htmlRes.text());
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSign() {
    if (!contract || !agreed) return;
    setSigning(true);
    setError("");

    const res = await fetch("/api/portal/contract/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contract_id: contract.id }),
    });

    if (res.ok) {
      router.push("/portal/payment");
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong. Please try again.");
      setSigning(false);
    }
  }

  async function handleRequestChanges() {
    if (!contract || !changesFeedback.trim()) return;
    setSubmittingChanges(true);
    setError("");
    const res = await fetch("/api/portal/contract/request-changes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contract_id: contract.id, feedback: changesFeedback.trim() }),
    });
    if (res.ok) {
      setChangesSubmitted(true);
      setShowRequestChanges(false);
    } else {
      const data = await res.json();
      setError(data.error || "Could not submit changes. Please try again.");
    }
    setSubmittingChanges(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 size={32} className="text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  if (!html) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6">
        <div className="text-center">
          <FileText size={48} className="text-[#c9a84c] mx-auto mb-4" />
          <p className="text-white/60">Contract document could not be loaded.</p>
          <Link href="/portal/dashboard" className="text-[#c9a84c] text-sm mt-4 block hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const split = contract?.payment_split;
  const fmt = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="bg-[#0a1628] border-b border-white/10 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <img src="/logo-dark.svg" alt="A1 Group" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-sm hidden sm:block">Review & Sign Your Contract</span>
            {contract?.contract_html_url && (
              <button
                onClick={() => window.open(contract.contract_html_url!, "_blank")}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
              >
                <ExternalLink size={13} /> Download / Print
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Intro */}
        <div className="mb-6">
          <h1 className="text-white font-extrabold text-2xl mb-2">Your Service Agreement</h1>
          <p className="text-white/50 text-sm">Please read through your contract carefully, then sign below to proceed to payment.</p>
        </div>

        {/* Contract viewer */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl mb-6" style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        {/* Payment summary */}
        {split && (split.upfront_cents > 0 || split.on_delivery_cents > 0 || split.monthly_cents > 0) && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-4">Payment Summary</h3>
            <div className="space-y-2">
              {split.upfront_cents > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Due today (deposit)</span>
                  <span className="text-[#c9a84c] font-bold">{fmt(split.upfront_cents)}</span>
                </div>
              )}
              {split.on_delivery_cents > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Due on delivery</span>
                  <span className="text-white font-semibold">{fmt(split.on_delivery_cents)}</span>
                </div>
              )}
              {split.monthly_cents > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Monthly (month 2+)</span>
                  <span className="text-white font-semibold">{fmt(split.monthly_cents)}/mo</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sign block or changes submitted */}
        {changesSubmitted ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={20} className="text-amber-400" />
            </div>
            <h3 className="text-amber-400 font-bold mb-2">Feedback Sent!</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Your feedback has been sent to Alejandro. He&apos;ll review your notes and send you a revised contract shortly.
            </p>
            <Link href="/portal/dashboard" className="text-[#c9a84c] text-sm mt-4 block hover:underline">
              ← Back to dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${agreed ? "bg-[#c9a84c] border-[#c9a84c]" : "border-white/30 bg-white/5"}`}>
                    {agreed && <CheckCircle size={12} className="text-[#0a1628]" />}
                  </div>
                </div>
                <span className="text-white/70 text-sm leading-relaxed">
                  I have read and agree to the terms of this Service Agreement. I understand the scope of work, payment terms, and my responsibilities as outlined above.
                </span>
              </label>

              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2 mb-4">{error}</p>
              )}

              <button
                onClick={handleSign}
                disabled={!agreed || signing}
                className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a1628] font-bold py-4 rounded-full transition-all text-sm"
              >
                {signing ? <><Loader2 size={16} className="animate-spin" /> Signing...</> : "Sign Contract & Continue to Payment →"}
              </button>
              <p className="text-white/25 text-xs text-center mt-3">Your digital signature is legally binding and timestamped.</p>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={() => setShowRequestChanges(true)}
                className="text-white/30 hover:text-white/60 text-sm transition-colors underline underline-offset-4"
              >
                Something doesn&apos;t look right? Request changes
              </button>
            </div>
          </>
        )}

        {/* Request changes modal */}
        {showRequestChanges && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-6">
            <div className="bg-[#0f2040] border border-white/15 rounded-2xl p-8 w-full max-w-md">
              <h2 className="text-white font-bold text-lg mb-2">Request Changes</h2>
              <p className="text-white/40 text-sm mb-5">
                Describe what you&apos;d like changed and Alejandro will send you a revised contract.
              </p>
              <textarea
                rows={5}
                value={changesFeedback}
                onChange={(e) => setChangesFeedback(e.target.value)}
                placeholder="e.g. Can you adjust the timeline for the website to 6 weeks? Also, I'd like to remove the social media package..."
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all resize-none mb-5"
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2 mb-4">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRequestChanges(false); setChangesFeedback(""); setError(""); }}
                  disabled={submittingChanges}
                  className="flex-1 py-3 rounded-full border border-white/15 text-white/50 hover:text-white text-sm font-medium transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestChanges}
                  disabled={submittingChanges || !changesFeedback.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] disabled:opacity-40 text-[#0a1628] font-bold text-sm py-3 rounded-full transition-all disabled:cursor-not-allowed"
                >
                  {submittingChanges
                    ? <><Loader2 size={14} className="animate-spin" /> Sending...</>
                    : "Send Feedback →"
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
