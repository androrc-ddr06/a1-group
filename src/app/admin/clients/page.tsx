"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Copy, Check, RefreshCw, ExternalLink, FileText, ChevronDown, ChevronUp } from "lucide-react";

const ADMIN_SECRET = "Familiarc15$";

const ALL_SERVICES = ["Website", "Branding", "Social Media", "Content Creation", "Paid Ads", "AI Agents"];

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

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newCode] = useState(generateCode);
  const [addError, setAddError] = useState("");

  const [newClient, setNewClient] = useState({
    name: "", company: "", email: "",
    services: [] as string[],
    contract_months: 3,
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
      }),
    });
    const data = await res.json();
    if (!res.ok) { setAddError(data.error || "Failed to create client."); return; }
    setShowNew(false);
    setNewClient({ name: "", company: "", email: "", services: [], contract_months: 3 });
    setTimeline([]);
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
                  <button onClick={() => copyCode(newCode)} className="text-white/30 hover:text-white/70 transition-colors">
                    {copied === newCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
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
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-11 h-11 rounded-full bg-[#1b2e4b] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {client.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">{client.name}</div>
                        <div className="text-white/40 text-sm">{client.company}</div>
                        <div className="text-white/25 text-xs mt-0.5">{client.email}</div>
                      </div>
                    </div>

                    {/* Status + code + brief */}
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
                            <a href={latestBrief.ai_brief_url} target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] hover:text-[#d4af61] transition-colors" title="View Brief">
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
