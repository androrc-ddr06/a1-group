"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Copy, Check, RefreshCw, ExternalLink, FileText, ChevronDown, ChevronUp } from "lucide-react";

const ADMIN_SECRET = "Familiarc15$";

const ALL_SERVICES = ["Website", "Branding", "Social Media", "Content Creation", "Paid Ads", "AI Agents"];

const CLIENT_TYPES = [
  { value: "business", label: "Business / Brand", description: "Companies, restaurants, shops" },
  { value: "artist", label: "Artist / Creator", description: "Musicians, influencers, personal brands" },
  { value: "nonprofit", label: "Nonprofit / School", description: "Schools, charities, community orgs" },
];

function generateCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

type TimelineEntry = { month: number; service: string; status: "active" | "upcoming" };

type OnboardingResponse = {
  id: string;
  ai_brief_status: string;
  ai_brief_url: string | null;
  submitted_at: string;
};

type Project = {
  id: string;
  name: string;
  progress_percent: number;
  days_remaining: number;
  status: string;
};

type Contract = {
  id: string;
  contract_status: "draft" | "approved" | "signed" | "changes_requested";
  contract_html_url: string | null;
  total_amount: number;
  created_at: string;
  client_feedback?: string | null;
};

type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  access_code: string;
  status: "active" | "pending" | "onboarding";
  services: string[];
  service_timeline: TimelineEntry[];
  contract_months: number;
  created_at: string;
  projects: Project[];
  onboarding_responses: OnboardingResponse[];
  contracts: Contract[];
};

const statusColors: Record<Client["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-amber-500/15 text-amber-400",
  onboarding: "bg-blue-500/15 text-blue-400",
};

const briefStatusColors: Record<string, string> = {
  pending: "bg-white/10 text-white/40",
  generating: "bg-blue-500/15 text-blue-400",
  ready: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-red-500/15 text-red-400",
};

const contractStatusColors: Record<string, string> = {
  draft: "bg-white/10 text-white/40",
  approved: "bg-blue-500/15 text-blue-400",
  signed: "bg-emerald-500/15 text-emerald-400",
  changes_requested: "bg-amber-500/15 text-amber-400",
};

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newCode, setNewCode] = useState(generateCode);
  const [addError, setAddError] = useState("");

  const [draftingContracts, setDraftingContracts] = useState<Set<string>>(new Set());
  const [declineModal, setDeclineModal] = useState<{ contractId: string; clientName: string } | null>(null);
  const [declineFeedback, setDeclineFeedback] = useState("");
  const [declining, setDeclining] = useState(false);
  const [editModal, setEditModal] = useState<{ contractId: string; contractUrl: string; clientName: string } | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [newClient, setNewClient] = useState({
    name: "", company: "", email: "", notes: "",
    services: [] as string[],
    contract_months: 3,
    client_type: "business",
  });
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  const headers = { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET };

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/clients", { headers });
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Auto-build timeline when services or months change
  useEffect(() => {
    if (newClient.services.length === 0) { setTimeline([]); return; }
    const entries: TimelineEntry[] = newClient.services.map((service, i) => ({
      service,
      month: i + 1,
      status: i === 0 ? "active" : "upcoming",
    }));
    setTimeline(entries);
  }, [newClient.services, newClient.contract_months]);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleService(service: string) {
    setNewClient((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  }

  function updateTimelineMonth(service: string, month: number) {
    setTimeline((prev) => prev.map((e) => e.service === service ? { ...e, month } : e));
  }

  function updateTimelineStatus(service: string, status: "active" | "upcoming") {
    setTimeline((prev) => prev.map((e) => e.service === service ? { ...e, status } : e));
  }

  async function handleAdd() {
    if (!newClient.name || !newClient.email) return;
    setAddError("");
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: newClient.name,
        company: newClient.company,
        email: newClient.email,
        access_code: newCode,
        services: newClient.services,
        service_timeline: timeline,
        contract_months: newClient.contract_months,
        admin_notes: newClient.notes,
        client_type: newClient.client_type,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setAddError(data.error || "Failed to create client."); return; }
    setShowNew(false);
    setNewClient({ name: "", company: "", email: "", notes: "", services: [], contract_months: 3, client_type: "business" });
    setTimeline([]);
    fetchClients();
  }

  async function handleApproveContract(contractId: string) {
    await fetch("/api/admin/contracts", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ contract_id: contractId, action: "approve" }),
    });
    fetchClients();
  }

  async function handleRegenerateContract(clientId: string) {
    await fetch("/api/admin/contracts/regenerate", {
      method: "POST",
      headers,
      body: JSON.stringify({ client_id: clientId }),
    });
    fetchClients();
  }

  async function loadContractText(url: string): Promise<string> {
    const res = await fetch(url);
    const html = await res.text();
    const contentMatch = html.match(/<div class="content">([\s\S]*?)<div class="signature-block">/);
    const raw = contentMatch ? contentMatch[1] : html;
    return raw
      .replace(/<h1>/g, "# ").replace(/<\/h1>/g, "\n")
      .replace(/<h2>/g, "## ").replace(/<\/h2>/g, "\n")
      .replace(/<h3>/g, "### ").replace(/<\/h3>/g, "\n")
      .replace(/<strong>/g, "**").replace(/<\/strong>/g, "**")
      .replace(/<li>/g, "- ").replace(/<\/li>/g, "\n")
      .replace(/<\/?(ul|ol|p|div)[^>]*>/g, "\n")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n").trim();
  }

  async function openEditModal(contract: Contract, clientName: string) {
    setEditModal({ contractId: contract.id, contractUrl: contract.contract_html_url!, clientName });
    setEditLoading(true);
    const text = await loadContractText(contract.contract_html_url!);
    setEditContent(text);
    setEditLoading(false);
  }

  async function handleDecline() {
    if (!declineModal || !declineFeedback.trim()) return;
    setDeclining(true);
    const clientId = clients.find(c => c.contracts?.[0]?.id === declineModal.contractId)?.id;
    const originalContractId = declineModal.contractId;
    await fetch("/api/admin/contracts", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ contract_id: originalContractId, action: "decline", feedback: declineFeedback.trim() }),
    });
    setDeclining(false);
    setDeclineModal(null);
    setDeclineFeedback("");
    if (!clientId) return;

    // Show drafting spinner and poll until a new contract appears (old one gets deleted + replaced)
    setDraftingContracts(prev => new Set(prev).add(clientId));
    const poll = async () => {
      const res = await fetch("/api/admin/clients", { headers });
      if (!res.ok) return false;
      const data: Client[] = await res.json();
      const updatedClient = data.find(c => c.id === clientId);
      const newContract = updatedClient?.contracts?.[0];
      // New contract is ready when it's a fresh record (different id from what we declined)
      if (newContract && newContract.id !== originalContractId) {
        setClients(data);
        return true;
      }
      return false;
    };

    const interval = setInterval(async () => {
      const done = await poll();
      if (done) {
        clearInterval(interval);
        setDraftingContracts(prev => { const s = new Set(prev); s.delete(clientId); return s; });
      }
    }, 4000);

    // Safety timeout: stop polling after 3 minutes and refresh anyway
    setTimeout(() => {
      clearInterval(interval);
      setDraftingContracts(prev => { const s = new Set(prev); s.delete(clientId); return s; });
      fetchClients();
    }, 180000);
  }

  async function handleEditSave(approveAfter: boolean) {
    if (!editModal) return;
    setEditSaving(true);
    await fetch("/api/admin/contracts", {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        contract_id: editModal.contractId,
        action: approveAfter ? "edit_and_approve" : "save_draft",
        new_content: editContent,
      }),
    });
    setEditSaving(false);
    setEditModal(null);
    setEditContent("");
    fetchClients();
  }

  async function updateProgress(projectId: string, progressPercent: number, daysRemaining: number) {
    setSaving(projectId);
    await fetch("/api/admin/progress", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ project_id: projectId, progress_percent: progressPercent, days_remaining: daysRemaining }),
    });
    setSaving(null);
  }

  function handleProgressChange(clientId: string, projectId: string, value: number) {
    setClients((prev) => prev.map((c) => c.id === clientId
      ? { ...c, projects: c.projects.map((p) => p.id === projectId ? { ...p, progress_percent: value } : p) }
      : c
    ));
  }

  function handleDaysChange(clientId: string, projectId: string, value: number) {
    setClients((prev) => prev.map((c) => c.id === clientId
      ? { ...c, projects: c.projects.map((p) => p.id === projectId ? { ...p, days_remaining: value } : p) }
      : c
    ));
  }

  return (
    <div className="min-h-screen bg-[#060e1a] text-white">
      <header className="bg-[#0a1628] border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><img src="/logo-dark.svg" alt="A1 Group" className="h-8 w-auto" /></Link>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-white/50 text-sm font-medium">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchClients} className="text-white/30 hover:text-white/70 transition-colors" title="Refresh">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <Link href="/" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
              <ExternalLink size={13} /> View Site
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold">Clients</h1>
            <p className="text-white/40 text-sm mt-1">{clients.length} client{clients.length !== 1 && "s"}</p>
          </div>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-sm px-5 py-2.5 rounded-full transition-all">
            <Plus size={15} /> Add Client
          </button>
        </div>

        {/* New client modal */}
        {showNew && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center px-6 py-8 overflow-y-auto">
            <div className="bg-[#0f2040] border border-white/15 rounded-2xl p-8 w-full max-w-lg my-auto">
              <h2 className="text-white font-bold text-xl mb-6">New Client</h2>
              <div className="space-y-4">
                {[
                  { label: "Client Name", key: "name", placeholder: "Jane Smith" },
                  { label: "Company", key: "company", placeholder: "Acme Co." },
                  { label: "Email", key: "email", placeholder: "client@business.com" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-white/50 text-xs uppercase tracking-wide block mb-1.5">{f.label}</label>
                    <input
                      type={f.key === "email" ? "email" : "text"}
                      value={newClient[f.key as keyof typeof newClient] as string}
                      onChange={(e) => setNewClient((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                    />
                  </div>
                ))}

                {/* Admin Notes */}
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide block mb-1.5">Admin Notes <span className="text-white/20 normal-case font-normal">(context for AI brief & contract)</span></label>
                  <textarea
                    rows={3}
                    value={newClient.notes}
                    onChange={(e) => setNewClient((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="e.g. Client wants luxury feel, discussed $1,500 website, needs booking system, tight 3-week deadline..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all resize-none"
                  />
                </div>

                {/* Client Type */}
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide block mb-2">Client Type</label>
                  <div className="space-y-2">
                    {CLIENT_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => setNewClient((p) => ({ ...p, client_type: ct.value }))}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border ${
                          newClient.client_type === ct.value
                            ? "bg-[#c9a84c]/15 border-[#c9a84c] text-[#c9a84c]"
                            : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${newClient.client_type === ct.value ? "border-[#c9a84c] bg-[#c9a84c]" : "border-white/30"}`} />
                        <div>
                          <div className="text-xs font-semibold">{ct.label}</div>
                          <div className={`text-xs ${newClient.client_type === ct.value ? "text-[#c9a84c]/60" : "text-white/30"}`}>{ct.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contract length */}
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide block mb-1.5">Contract Length</label>
                  <select
                    value={newClient.contract_months}
                    onChange={(e) => setNewClient((p) => ({ ...p, contract_months: Number(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                    style={{ colorScheme: "dark" }}
                  >
                    {[1,2,3,4,5,6,9,12].map((m) => (
                      <option key={m} value={m} className="bg-[#0f2040]">{m} month{m !== 1 && "s"}</option>
                    ))}
                  </select>
                </div>

                {/* Services */}
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide block mb-2">Services (select all that apply)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_SERVICES.map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border ${
                          newClient.services.includes(service)
                            ? "bg-[#c9a84c]/20 border-[#c9a84c] text-[#c9a84c]"
                            : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30"
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeline builder */}
                {timeline.length > 0 && (
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-wide block mb-2">Service Timeline</label>
                    <div className="space-y-2">
                      {timeline.map((entry) => (
                        <div key={entry.service} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                          <span className="text-white text-xs font-medium flex-1">{entry.service}</span>
                          <select
                            value={entry.month}
                            onChange={(e) => updateTimelineMonth(entry.service, Number(e.target.value))}
                            className="bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                            style={{ colorScheme: "dark" }}
                          >
                            {Array.from({ length: newClient.contract_months }, (_, i) => i + 1).map((m) => (
                              <option key={m} value={m} className="bg-[#0f2040]">Month {m}</option>
                            ))}
                          </select>
                          <select
                            value={entry.status}
                            onChange={(e) => updateTimelineStatus(entry.service, e.target.value as "active" | "upcoming")}
                            className="bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none"
                            style={{ colorScheme: "dark" }}
                          >
                            <option value="active" className="bg-[#0f2040] text-emerald-400">Active Now</option>
                            <option value="upcoming" className="bg-[#0f2040] text-white">Upcoming</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <p className="text-white/30 text-xs mt-2">Active services will show in the client's onboarding form immediately.</p>
                  </div>
                )}

                {/* Access code */}
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-white/40 text-xs uppercase tracking-wide">Access Code</div>
                    <div className="text-[#c9a84c] font-mono font-bold tracking-widest text-lg mt-0.5">{newCode}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setNewCode(generateCode())} className="text-white/30 hover:text-white/70 transition-colors" title="Generate new code">
                      <RefreshCw size={15} />
                    </button>
                    <button onClick={() => copyCode(newCode)} className="text-white/30 hover:text-white/70 transition-colors" title="Copy code">
                      {copied === newCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {addError && (
                  <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{addError}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowNew(false); setAddError(""); }} className="flex-1 py-3 rounded-full border border-white/15 text-white/50 hover:text-white text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handleAdd} className="flex-1 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-sm py-3 rounded-full transition-all">
                  Create Client →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Decline modal */}
        {declineModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-6">
            <div className="bg-[#0f2040] border border-white/15 rounded-2xl p-8 w-full max-w-md">
              <h2 className="text-white font-bold text-lg mb-2">Revise Contract with AI</h2>
              <p className="text-white/40 text-sm mb-5">
                Describe what to change for <span className="text-white">{declineModal.clientName}</span>. The AI will immediately draft a revised contract using your feedback.
              </p>
              <textarea
                rows={5}
                value={declineFeedback}
                onChange={(e) => setDeclineFeedback(e.target.value)}
                placeholder="e.g. Reduce the website price to $1,200. Remove the branding section. Extend the timeline by 2 weeks..."
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all resize-none mb-5"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeclineModal(null); setDeclineFeedback(""); }}
                  disabled={declining}
                  className="flex-1 py-3 rounded-full border border-white/15 text-white/50 hover:text-white text-sm font-medium transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecline}
                  disabled={declining || !declineFeedback.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-sm py-3 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {declining
                    ? <><RefreshCw size={13} className="animate-spin" /> Submitting...</>
                    : "Submit & Regenerate →"
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col">
            <div className="bg-[#0f2040] border-b border-white/15 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-white font-bold text-base">Edit Contract</h2>
                <p className="text-white/40 text-xs mt-0.5">{editModal.clientName} — use markdown formatting</p>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href={`/admin/brief?url=${encodeURIComponent(editModal.contractUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 hover:text-white/70 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={12} /> Preview Current
                </a>
                <button
                  onClick={() => { setEditModal(null); setEditContent(""); }}
                  className="text-white/30 hover:text-white/70 text-sm transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-6">
              {editLoading ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw size={24} className="text-white/30 animate-spin" />
                </div>
              ) : (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full bg-white/5 border border-white/15 rounded-xl px-5 py-4 text-white/90 text-sm font-mono leading-relaxed focus:outline-none focus:border-[#c9a84c]/60 transition-all resize-none"
                  placeholder="Contract content in markdown..."
                />
              )}
            </div>
            <div className="bg-[#0f2040] border-t border-white/15 px-6 py-4 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => handleEditSave(false)}
                disabled={editSaving || editLoading}
                className="px-6 py-3 rounded-full border border-white/20 text-white/70 hover:text-white text-sm font-medium transition-colors disabled:opacity-40"
              >
                {editSaving ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={() => handleEditSave(true)}
                disabled={editSaving || editLoading}
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold text-sm py-3 rounded-full transition-all disabled:opacity-40"
              >
                {editSaving ? "Saving..." : "Approve & Send →"}
              </button>
            </div>
          </div>
        )}

        {/* Client list */}
        {loading ? (
          <div className="text-white/30 text-sm text-center py-20">Loading clients...</div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => {
              const project = client.projects?.[0];
              const latestBrief = client.onboarding_responses?.[0];
              const isExpanded = expanded === client.id;

              return (
                <div key={client.id} className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                    {/* Client info */}
                    <Link href={`/admin/clients/${client.id}`} className="flex items-center gap-4 flex-1 group hover:opacity-80 transition-opacity">
                      <div className="w-11 h-11 rounded-full bg-[#1b2e4b] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {client.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-semibold group-hover:text-[#c9a84c] transition-colors">{client.name}</div>
                        <div className="text-white/40 text-sm">{client.company}</div>
                        <div className="text-white/25 text-xs mt-0.5">{client.email}</div>
                      </div>
                    </Link>

                    {/* Status + code + brief + expand */}
                    <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusColors[client.status]}`}>
                        {client.status}
                      </span>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                        <span className="text-[#c9a84c] font-mono text-xs tracking-widest">{client.access_code}</span>
                        <button onClick={() => copyCode(client.access_code)} className="text-white/20 hover:text-white/60 transition-colors">
                          {copied === client.access_code ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                      {latestBrief && (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${briefStatusColors[latestBrief.ai_brief_status] ?? "bg-white/10 text-white/40"}`}>
                            Brief: {latestBrief.ai_brief_status}
                          </span>
                          {latestBrief.ai_brief_status === "ready" && latestBrief.ai_brief_url && (
                            <a href={`/admin/brief?url=${encodeURIComponent(latestBrief.ai_brief_url)}`} target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] hover:text-[#d4af61] transition-colors" title="View Brief">
                              <FileText size={14} />
                            </a>
                          )}
                        </div>
                      )}
                      <button onClick={() => setExpanded(isExpanded ? null : client.id)} className="text-white/30 hover:text-white/60 transition-colors ml-1">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Contract controls — own row */}
                  {(client.contracts?.[0] || draftingContracts.has(client.id)) && (() => {
                    if (draftingContracts.has(client.id)) {
                      return (
                        <div className="mt-4 pt-4 border-t border-white/8 flex items-center gap-2">
                          <RefreshCw size={13} className="text-[#c9a84c] animate-spin" />
                          <span className="text-[#c9a84c] text-xs font-semibold">Drafting revised contract...</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {client.contracts?.[0] && !draftingContracts.has(client.id) && (() => {
                    const contract = client.contracts[0];
                    const isDraftLike = contract.contract_status === "draft" || contract.contract_status === "changes_requested";
                    return (
                      <div className="mt-4 pt-4 border-t border-white/8 flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${contractStatusColors[contract.contract_status] ?? "bg-white/10 text-white/40"}`}>
                            Contract: {contract.contract_status.replace("_", " ")}
                          </span>
                          {contract.contract_html_url && (
                            <a href={`/admin/brief?url=${encodeURIComponent(contract.contract_html_url)}`} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/70 transition-colors" title="View Contract">
                              <FileText size={14} />
                            </a>
                          )}
                          {contract.contract_status === "draft" && (
                            <button
                              onClick={() => handleApproveContract(contract.id)}
                              className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold px-3 py-1 rounded-full transition-all"
                            >
                              Approve
                            </button>
                          )}
                          {isDraftLike && contract.contract_html_url && (
                            <button
                              onClick={() => openEditModal(contract, client.name)}
                              className="text-xs bg-white/10 hover:bg-white/20 text-white/60 font-semibold px-3 py-1 rounded-full transition-all"
                            >
                              Edit
                            </button>
                          )}
                          {isDraftLike && (
                            <button
                              onClick={() => setDeclineModal({ contractId: contract.id, clientName: client.name })}
                              className="text-xs bg-white/10 hover:bg-white/20 text-white/60 font-semibold px-3 py-1 rounded-full transition-all"
                            >
                              Revise with AI
                            </button>
                          )}
                          {contract.contract_status === "draft" && (
                            <button
                              onClick={() => handleRegenerateContract(client.id)}
                              className="text-white/30 hover:text-white/70 transition-colors"
                              title="Regenerate contract"
                            >
                              <RefreshCw size={13} />
                            </button>
                          )}
                        </div>
                        {contract.contract_status === "changes_requested" && contract.client_feedback && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 max-w-sm">
                            <p className="text-amber-400 text-xs font-semibold mb-0.5">Client Feedback</p>
                            <p className="text-amber-300/80 text-xs leading-relaxed">{contract.client_feedback}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Services tags */}
                  {client.services?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(client.service_timeline ?? []).map((entry) => (
                        <span key={entry.service} className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          entry.status === "active"
                            ? "bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30"
                            : "bg-white/5 text-white/30 border border-white/10"
                        }`}>
                          M{entry.month} · {entry.service}
                          {entry.status === "active" && " ✓"}
                        </span>
                      ))}
                      <span className="text-white/20 text-xs px-2.5 py-1">{client.contract_months} mo. contract</span>
                    </div>
                  )}

                  {/* Expanded: project progress */}
                  {isExpanded && (
                    <div className="mt-5 pt-4 border-t border-white/8">
                      {project ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-white/40 text-xs uppercase tracking-wide">{project.name}</span>
                            <span className="text-[#c9a84c] text-xs font-bold">{project.progress_percent}%</span>
                          </div>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-[#c9a84c] rounded-full transition-all duration-300" style={{ width: `${project.progress_percent}%` }} />
                            </div>
                            <input
                              type="range" min={0} max={100} value={project.progress_percent}
                              onChange={(e) => handleProgressChange(client.id, project.id, Number(e.target.value))}
                              onMouseUp={(e) => updateProgress(project.id, Number((e.target as HTMLInputElement).value), project.days_remaining)}
                              onTouchEnd={(e) => updateProgress(project.id, Number((e.target as HTMLInputElement).value), project.days_remaining)}
                              className="w-32 accent-[#c9a84c]"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="text-white/30 text-xs">Days remaining:</label>
                            <input
                              type="number" min={0} value={project.days_remaining}
                              onChange={(e) => handleDaysChange(client.id, project.id, Number(e.target.value))}
                              onBlur={(e) => updateProgress(project.id, project.progress_percent, Number(e.target.value))}
                              className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none focus:border-[#c9a84c]/60"
                            />
                            {saving === project.id && <span className="text-white/30 text-xs">Saving...</span>}
                          </div>
                        </>
                      ) : (
                        <p className="text-white/20 text-xs">No project assigned yet.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
