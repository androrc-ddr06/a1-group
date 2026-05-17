"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderOpen, ExternalLink, ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Asset = { id: string; label: string; url: string; submitted_by: string; created_at: string };

export default function AssetsPage() {
  const router = useRouter();
  const [adminAssets, setAdminAssets] = useState<Asset[]>([]);
  const [clientAssets, setClientAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState("");

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [meRes, assetsRes] = await Promise.all([
        fetch("/api/portal/me"),
        fetch("/api/portal/assets"),
      ]);
      if (!meRes.ok) { router.push("/portal/login"); return; }
      const me = await meRes.json();
      setCompany(me.company ?? "");

      if (assetsRes.ok) {
        const { assets } = await assetsRes.json();
        setAdminAssets((assets as Asset[]).filter((a) => a.submitted_by === "admin"));
        setClientAssets((assets as Asset[]).filter((a) => a.submitted_by === "client"));
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSubmit() {
    setError("");
    if (!label.trim() || !url.trim()) { setError("Please fill in both fields."); return; }
    if (!url.trim().startsWith("http")) { setError("Please enter a valid URL."); return; }
    setSubmitting(true);
    const res = await fetch("/api/portal/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), url: url.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to share file."); setSubmitting(false); return; }
    setClientAssets((prev) => [data.asset, ...prev]);
    setLabel("");
    setUrl("");
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/portal/assets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setClientAssets((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 size={28} className="text-[#0a1628]/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-[#0a1628] border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/logo-dark.svg" alt="A1 Group" className="h-8 w-auto" />
            </Link>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-white/50 text-sm">Client Portal</span>
          </div>
          <span className="text-white/50 text-sm hidden sm:block">{company}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link
            href="/portal/dashboard"
            className="flex items-center gap-1.5 text-[#0a1628]/40 hover:text-[#0a1628]/70 text-sm transition-colors"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-[#0a1628] rounded-xl flex items-center justify-center">
              <FolderOpen size={16} className="text-[#c9a84c]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0a1628]">My Assets</h1>
          </div>
          <p className="text-[#0a1628]/40 text-sm mt-1 ml-12">Files and deliverables between you and A1 Group</p>
        </div>

        {/* Section 1: Files from A1 Group */}
        <div className="mb-8">
          <h2 className="text-[#0a1628] font-bold text-base mb-4">Files from A1 Group</h2>
          {adminAssets.length === 0 ? (
            <div className="bg-white border border-[#0a1628]/8 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#f8fafc] border border-[#0a1628]/8 flex items-center justify-center mx-auto mb-3">
                <FolderOpen size={20} className="text-[#0a1628]/20" />
              </div>
              <p className="text-[#0a1628]/40 text-sm">
                Your deliverables will appear here as we complete work on your project.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {adminAssets.map((asset) => (
                <a
                  key={asset.id}
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between bg-white border border-[#0a1628]/8 hover:border-[#0a1628]/20 rounded-2xl px-6 py-4 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-[#f8fafc] group-hover:bg-[#0a1628] rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                      <FolderOpen size={15} className="text-[#0a1628] group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-[#0a1628] font-semibold text-sm">{asset.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#c9a84c] text-xs font-semibold">
                    Open <ExternalLink size={12} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Share files with A1 Group */}
        <div>
          <h2 className="text-[#0a1628] font-bold text-base mb-2">Share Files with A1 Group</h2>
          <p className="text-[#0a1628]/50 text-sm mb-5">
            Share your brand assets, photos, logos, or any project files with us via Google Drive.{" "}
            <span className="text-[#0a1628]/70 font-medium">Before sharing, open the file in Google Drive, click Share → change access to &quot;Anyone with the link can view&quot;, then copy and paste the link below.</span>
          </p>

          {/* Upload form */}
          <div className="bg-white border border-[#0a1628]/8 rounded-2xl p-6 mb-4">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="File name (e.g. Brand Logo, Product Photos)"
                className="w-full border border-[#0a1628]/12 rounded-xl px-4 py-3 text-[#0a1628] placeholder:text-[#0a1628]/30 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all bg-[#f8fafc]"
              />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Google Drive link (https://drive.google.com/...)"
                className="w-full border border-[#0a1628]/12 rounded-xl px-4 py-3 text-[#0a1628] placeholder:text-[#0a1628]/30 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all bg-[#f8fafc]"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={submitting || !label.trim() || !url.trim()}
                className="flex items-center justify-center gap-2 bg-[#0a1628] hover:bg-[#0a1628]/90 disabled:opacity-40 text-white font-semibold text-sm px-5 py-3 rounded-full transition-all self-start"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Share File
              </button>
            </div>
          </div>

          {/* Client's shared files */}
          {clientAssets.length > 0 && (
            <div className="space-y-2">
              <p className="text-[#0a1628]/40 text-xs font-semibold uppercase tracking-widest mb-3">Your Shared Files</p>
              {clientAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between bg-white border border-[#0a1628]/8 rounded-xl px-5 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 bg-[#f8fafc] rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderOpen size={13} className="text-[#0a1628]/40" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[#0a1628] text-sm font-semibold truncate">{asset.label}</div>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0a1628]/30 text-xs hover:text-[#c9a84c] truncate block max-w-xs transition-colors"
                      >
                        {asset.url}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="text-[#0a1628]/20 hover:text-red-400 transition-colors flex-shrink-0 ml-3"
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[#0a1628]/25 text-xs mt-10 text-center">
          Questions? <Link href="/#contact" className="text-[#c9a84c] hover:underline">Contact A1 Group</Link>
        </p>
      </main>
    </div>
  );
}
