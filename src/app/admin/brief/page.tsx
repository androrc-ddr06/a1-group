"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BriefViewer() {
  const params = useSearchParams();
  const url = params.get("url");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!url) { setError("No brief URL provided."); setLoading(false); return; }
    fetch(url, { cache: "no-store" })
      .then((r) => r.text())
      .then((text) => { setHtml(text); setLoading(false); })
      .catch(() => { setError("Could not load brief."); setLoading(false); });
  }, [url]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading strategy brief...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-red-500">{error}</p>
    </div>
  );

  return (
    <div>
      <div className="print:hidden fixed top-0 left-0 right-0 bg-[#0a1628] border-b border-white/10 px-6 py-3 flex items-center justify-between z-50">
        <span className="text-white/60 text-sm font-medium">Strategy Brief</span>
        <button
          onClick={() => window.print()}
          className="bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-sm px-5 py-2 rounded-full transition-all"
        >
          Save as PDF
        </button>
      </div>
      <div className="pt-12" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default function BriefPage() {
  return (
    <Suspense>
      <BriefViewer />
    </Suspense>
  );
}
