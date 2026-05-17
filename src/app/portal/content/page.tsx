"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Check, ChevronDown, ChevronUp, Plus, X } from "lucide-react";

type Revision = {
  id: string;
  video_title: string;
  description: string;
  image_urls: string[];
  created_at: string;
};

type Batch = {
  id: string;
  label: string;
  drive_url: string;
  status: "pending" | "approved";
  approved_at: string | null;
  created_at: string;
  content_revisions: Revision[];
};

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ContentPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Revision form state per batch
  const [revisionForms, setRevisionForms] = useState<Record<string, {
    open: boolean;
    videoTitle: string;
    description: string;
    imageUrls: string[];
  }>>({});

  useEffect(() => {
    fetch("/api/portal/content")
      .then((r) => r.json())
      .then((d) => { setBatches(d.batches ?? []); setLoading(false); });
  }, []);

  function getForm(batchId: string) {
    return revisionForms[batchId] ?? { open: false, videoTitle: "", description: "", imageUrls: [""] };
  }

  function setForm(batchId: string, updates: Partial<ReturnType<typeof getForm>>) {
    setRevisionForms((prev) => ({ ...prev, [batchId]: { ...getForm(batchId), ...updates } }));
  }

  async function handleApprove(batchId: string) {
    setApproving(batchId);
    const res = await fetch("/api/portal/content/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch_id: batchId }),
    });
    if (res.ok) {
      setBatches((prev) =>
        prev.map((b) => b.id === batchId ? { ...b, status: "approved", approved_at: new Date().toISOString() } : b)
      );
    }
    setApproving(null);
  }

  async function handleSubmitRevision(batchId: string) {
    const form = getForm(batchId);
    if (!form.videoTitle.trim() || !form.description.trim()) return;
    setSubmitting(batchId);
    const res = await fetch("/api/portal/content/revisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batch_id: batchId,
        video_title: form.videoTitle,
        description: form.description,
        image_urls: form.imageUrls.filter((u) => u.trim()),
      }),
    });
    if (res.ok) {
      const { revision } = await res.json();
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? { ...b, content_revisions: [...b.content_revisions, revision] }
            : b
        )
      );
      setForm(batchId, { open: false, videoTitle: "", description: "", imageUrls: [""] });
    }
    setSubmitting(null);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-[#0a1628] border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/portal/dashboard" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-white font-bold text-lg">Content Approval</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {loading ? (
          <div className="text-[#0a1628]/30 text-sm">Loading…</div>
        ) : batches.length === 0 ? (
          <div className="bg-white border border-[#0a1628]/8 rounded-2xl p-10 text-center">
            <p className="text-[#0a1628]/40 text-sm">No content batches yet.</p>
            <p className="text-[#0a1628]/25 text-xs mt-2">A1 Group will share content here for your review before it gets posted.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {batches.map((batch) => {
              const form = getForm(batch.id);
              const isPending = batch.status === "pending";
              return (
                <div key={batch.id} className="bg-white border border-[#0a1628]/8 rounded-2xl overflow-hidden">
                  {/* Batch header */}
                  <div className="p-6 border-b border-[#0a1628]/6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            isPending
                              ? "bg-[#c9a84c]/15 text-[#c9a84c]"
                              : "bg-emerald-500/15 text-emerald-600"
                          }`}>
                            {isPending ? "Pending Approval" : "Approved"}
                          </span>
                          <span className="text-[#0a1628]/30 text-xs">{formatDate(batch.created_at)}</span>
                        </div>
                        <h2 className="text-[#0a1628] font-bold text-base">{batch.label}</h2>
                      </div>
                      <a
                        href={batch.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-[#0a1628] hover:bg-[#0a1628]/80 text-white text-xs font-semibold px-3 py-2 rounded-full transition-colors flex-shrink-0"
                      >
                        View in Drive <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>

                  {/* Actions (only if pending) */}
                  {isPending && (
                    <div className="px-6 py-4 bg-[#0a1628]/2 border-b border-[#0a1628]/6 flex flex-wrap gap-3">
                      <button
                        onClick={() => handleApprove(batch.id)}
                        disabled={!!approving}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-full transition-all"
                      >
                        <Check size={14} />
                        {approving === batch.id ? "Approving…" : "Approve Content"}
                      </button>
                      <button
                        onClick={() => setForm(batch.id, { open: !form.open })}
                        className="flex items-center gap-2 bg-white border border-[#0a1628]/15 hover:border-[#0a1628]/30 text-[#0a1628] font-semibold text-sm px-5 py-2.5 rounded-full transition-all"
                      >
                        {form.open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        Request Edit
                      </button>
                    </div>
                  )}

                  {/* Revision form */}
                  {form.open && isPending && (
                    <div className="px-6 py-5 border-b border-[#0a1628]/6 bg-amber-50/50">
                      <p className="text-[#0a1628]/60 text-xs font-semibold uppercase tracking-wide mb-4">Request an Edit</p>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[#0a1628]/50 text-xs uppercase tracking-wide block mb-1.5">Video Title</label>
                          <input
                            type="text"
                            value={form.videoTitle}
                            onChange={(e) => setForm(batch.id, { videoTitle: e.target.value })}
                            placeholder='e.g. "Reel 1 — Product showcase"'
                            className="w-full border border-[#0a1628]/15 rounded-xl px-4 py-3 text-[#0a1628] placeholder:text-[#0a1628]/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[#0a1628]/50 text-xs uppercase tracking-wide block mb-1.5">What to Change</label>
                          <textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm(batch.id, { description: e.target.value })}
                            placeholder="Describe what you'd like changed on this video…"
                            className="w-full border border-[#0a1628]/15 rounded-xl px-4 py-3 text-[#0a1628] placeholder:text-[#0a1628]/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all bg-white resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-[#0a1628]/50 text-xs uppercase tracking-wide block mb-1.5">
                            Reference Images <span className="normal-case text-[#0a1628]/30">(optional — paste Google Drive links)</span>
                          </label>
                          <div className="space-y-2">
                            {form.imageUrls.map((url, i) => (
                              <div key={i} className="flex gap-2">
                                <input
                                  type="text"
                                  value={url}
                                  onChange={(e) => {
                                    const updated = [...form.imageUrls];
                                    updated[i] = e.target.value;
                                    setForm(batch.id, { imageUrls: updated });
                                  }}
                                  placeholder="https://drive.google.com/..."
                                  className="flex-1 border border-[#0a1628]/15 rounded-xl px-4 py-2.5 text-[#0a1628] placeholder:text-[#0a1628]/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all bg-white"
                                />
                                {form.imageUrls.length > 1 && (
                                  <button
                                    onClick={() => setForm(batch.id, { imageUrls: form.imageUrls.filter((_, j) => j !== i) })}
                                    className="text-[#0a1628]/30 hover:text-red-400 transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => setForm(batch.id, { imageUrls: [...form.imageUrls, ""] })}
                              className="flex items-center gap-1.5 text-[#0a1628]/40 hover:text-[#0a1628]/70 text-xs transition-colors"
                            >
                              <Plus size={13} /> Add another image
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => handleSubmitRevision(batch.id)}
                            disabled={!form.videoTitle.trim() || !form.description.trim() || submitting === batch.id}
                            className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] disabled:opacity-50 text-[#0a1628] font-bold text-sm px-5 py-2.5 rounded-full transition-all"
                          >
                            {submitting === batch.id ? "Submitting…" : "Submit Revision"}
                          </button>
                          <button
                            onClick={() => setForm(batch.id, { open: false })}
                            className="text-[#0a1628]/40 text-sm hover:text-[#0a1628]/60 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Past revisions */}
                  {batch.content_revisions.length > 0 && (
                    <div className="px-6 py-4">
                      <button
                        onClick={() => setExpandedRevision(expandedRevision === batch.id ? null : batch.id)}
                        className="flex items-center gap-2 text-[#0a1628]/50 hover:text-[#0a1628]/80 text-xs font-semibold uppercase tracking-wide transition-colors"
                      >
                        {expandedRevision === batch.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {batch.content_revisions.length} revision request{batch.content_revisions.length !== 1 ? "s" : ""} submitted
                      </button>
                      {expandedRevision === batch.id && (
                        <div className="mt-3 space-y-3">
                          {batch.content_revisions.map((rev) => (
                            <div key={rev.id} className="bg-[#f8fafc] border border-[#0a1628]/8 rounded-xl p-4">
                              <p className="text-[#0a1628] font-semibold text-sm mb-1">{rev.video_title}</p>
                              <p className="text-[#0a1628]/60 text-sm leading-relaxed mb-2">{rev.description}</p>
                              {rev.image_urls?.length > 0 && (
                                <div className="space-y-1">
                                  {rev.image_urls.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#c9a84c] text-xs hover:underline">
                                      <ExternalLink size={11} /> Reference image {i + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                              <p className="text-[#0a1628]/25 text-xs mt-2">{formatDate(rev.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
