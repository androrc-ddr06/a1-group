"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PaymentSplit = {
  upfront_cents: number;
  on_delivery_cents: number;
  monthly_cents: number;
};

type Payment = {
  id: string;
  status: string;
  payment_type: string;
  amount_cents: number;
  created_at: string;
};

type Contract = {
  payment_split: PaymentSplit | null;
};

type ClientData = {
  name: string;
  company: string;
  contracts: Contract[];
  payments: Payment[];
};

const fmt = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const fmtDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export default function InvoicePage() {
  const router = useRouter();
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/me")
      .then((r) => {
        if (r.status === 401) { router.push("/portal/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d) { setData(d); setLoading(false); } })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const paidPayment = data?.payments?.find((p) => p.status === "paid");
  const contract = data?.contracts?.[0];
  const split = contract?.payment_split;

  if (!paidPayment) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">No invoices yet.</p>
          <Link href="/portal/dashboard" className="text-[#c9a84c] text-sm hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const invoiceNumber = `INV-${paidPayment.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const paymentMethod = paidPayment.payment_type === "manual" ? "Zelle" : "Credit Card";

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar — hidden on print */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-[#0a1628] border-b border-white/10 px-6 py-3 flex items-center justify-between z-50">
        <Link href="/portal/dashboard" className="text-white/50 text-sm hover:text-white transition-colors">
          ← Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-sm px-5 py-2 rounded-full transition-all"
        >
          Download as PDF
        </button>
      </div>

      {/* Invoice body */}
      <div className="pt-16 print:pt-0 max-w-2xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="text-[#0a1628] font-extrabold text-2xl tracking-tight">A1 GROUP</div>
            <div className="text-[#0a1628]/40 text-xs mt-0.5">Marketing & Growth Agency</div>
          </div>
          <div className="text-right">
            <div className="text-[#0a1628] font-bold text-lg">{invoiceNumber}</div>
            <div className="text-[#0a1628]/40 text-xs mt-0.5">{fmtDate(paidPayment.created_at)}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#0a1628]/10 mb-8" />

        {/* Billed To / From */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <div className="text-[#0a1628]/40 text-xs uppercase tracking-widest font-semibold mb-2">Billed To</div>
            <div className="text-[#0a1628] font-bold text-sm">{data?.name}</div>
            <div className="text-[#0a1628]/60 text-sm">{data?.company}</div>
          </div>
          <div>
            <div className="text-[#0a1628]/40 text-xs uppercase tracking-widest font-semibold mb-2">From</div>
            <div className="text-[#0a1628] font-bold text-sm">A1 Group LLC</div>
            <div className="text-[#0a1628]/60 text-sm">a1group.it.com</div>
          </div>
        </div>

        {/* Services table */}
        <div className="mb-8">
          <div className="text-[#0a1628]/40 text-xs uppercase tracking-widest font-semibold mb-3">Services</div>
          <div className="border border-[#0a1628]/10 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="bg-[#0a1628]/4 px-5 py-3 grid grid-cols-2 text-xs font-semibold text-[#0a1628]/50 uppercase tracking-wide">
              <span>Description</span>
              <span className="text-right">Amount</span>
            </div>
            {/* Upfront / deposit */}
            {split?.upfront_cents ? (
              <div className="px-5 py-4 grid grid-cols-2 border-t border-[#0a1628]/8">
                <div>
                  <div className="text-[#0a1628] font-semibold text-sm">Deposit — Due Today</div>
                  <div className="text-[#0a1628]/40 text-xs mt-0.5">Per signed service agreement</div>
                </div>
                <div className="text-right text-[#0a1628] font-bold text-sm">{fmt(split.upfront_cents)}</div>
              </div>
            ) : null}
            {/* On delivery */}
            {split?.on_delivery_cents ? (
              <div className="px-5 py-4 grid grid-cols-2 border-t border-[#0a1628]/8 opacity-50">
                <div>
                  <div className="text-[#0a1628] font-semibold text-sm">Balance — On Delivery</div>
                  <div className="text-[#0a1628]/40 text-xs mt-0.5">Due upon project completion</div>
                </div>
                <div className="text-right text-[#0a1628] font-semibold text-sm">{fmt(split.on_delivery_cents)}</div>
              </div>
            ) : null}
            {/* Monthly */}
            {split?.monthly_cents ? (
              <div className="px-5 py-4 grid grid-cols-2 border-t border-[#0a1628]/8 opacity-50">
                <div>
                  <div className="text-[#0a1628] font-semibold text-sm">Monthly Retainer</div>
                  <div className="text-[#0a1628]/40 text-xs mt-0.5">Recurring — Month 2 onward</div>
                </div>
                <div className="text-right text-[#0a1628] font-semibold text-sm">{fmt(split.monthly_cents)}/mo</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Total paid */}
        <div className="bg-[#0a1628] rounded-xl px-5 py-4 flex items-center justify-between mb-8">
          <div>
            <div className="text-white/50 text-xs uppercase tracking-widest font-semibold">Total Paid Today</div>
            <div className="text-white/40 text-xs mt-0.5">Via {paymentMethod}</div>
          </div>
          <div className="text-[#c9a84c] font-extrabold text-2xl">
            {fmt(paidPayment.amount_cents)}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#0a1628]/10 mb-8" />

        {/* Footer */}
        <div className="text-center">
          <p className="text-[#0a1628]/40 text-sm">Thank you for choosing A1 Group.</p>
          <p className="text-[#0a1628]/25 text-xs mt-1">Questions? contact@a1group.it.com</p>
        </div>
      </div>
    </div>
  );
}
