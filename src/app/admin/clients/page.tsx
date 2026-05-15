"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

const ADMIN_SECRET = "a1group-admin-2026";

function generateCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

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
  created_at: string;
  projects: Project[];
};

const statusColors: Record<Client["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-amber-500/15 text-amber-400",
  onboarding: "bg-blue-500/15 text-blue-400",
};

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [newCode] = useState(generateCode);
  const [newClient, setNewClient] = useState({ name: "", company: "", email: "" });
  const [addError, setAddError] = useState("");

  const headers = {
    "Content-Type": "application/json",
    "x-admin-secret": ADMIN_SECRET,
  };

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/clients", { headers });
    if (res.ok) {
      const data = await res.json();
      setClients(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
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
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAddError(data.error || "Failed to create client.");
      return;
    }
    setShowNew(false);
    setNewClient({ name: "", company: "", email: "" });
    fetchClients();
  }

  async function updateProgress(projectId: string, progressPercent: number, daysRemaining: number) {
    setSaving(projectId);
    await fetch("/api/admin/progress", {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        project_id: projectId,
        progress_percent: progressPercent,
        days_remaining: daysRemaining,
      }),
    });
    setSaving(null);
  }

  function handleProgressChange(clientId: string, projectId: string, value: number) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, projects: c.projects.map((p) => p.id === projectId ? { ...p, progress_percent: value } : p) }
          : c
      )
    );
  }

  function handleDaysChange(clientId: string, projectId: string, value: number) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, projects: c.projects.map((p) => p.id === projectId ? { ...p, days_remaining: value } : p) }
          : c
      )
    );
  }

  return (
    <div className="min-h-screen bg-[#060e1a] text-white">
      <header className="bg-[#0a1628] border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/logo-dark.svg" alt="A1 Group" className="h-8 w-auto" />
            </Link>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-white/50 text-sm font-medium">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchClients}
              className="text-white/30 hover:text-white/70 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors"
            >
              <ExternalLink size={13} />
              View Site
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold">Clients</h1>
            <p className="text-white/40 text-sm mt-1">
              {clients.length} client{clients.length !== 1 && "s"}
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-sm px-5 py-2.5 rounded-full transition-all"
          >
            <Plus size={15} /> Add Client
          </button>
        </div>

        {/* New client modal */}
        {showNew && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
            <div className="bg-[#0f2040] border border-white/15 rounded-2xl p-8 w-full max-w-md">
              <h2 className="text-white font-bold text-xl mb-6">New Client</h2>
              <div className="space-y-4">
                {[
                  { label: "Client Name", key: "name", placeholder: "Jane Smith" },
                  { label: "Company", key: "company", placeholder: "Acme Co." },
                  { label: "Email", key: "email", placeholder: "client@business.com" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-white/50 text-xs uppercase tracking-wide block mb-1.5">
                      {f.label}
                    </label>
                    <input
                      type={f.key === "email" ? "email" : "text"}
                      value={newClient[f.key as keyof typeof newClient]}
                      onChange={(e) => setNewClient((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                    />
                  </div>
                ))}

                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-white/40 text-xs uppercase tracking-wide">Access Code</div>
                    <div className="text-[#c9a84c] font-mono font-bold tracking-widest text-lg mt-0.5">
                      {newCode}
                    </div>
                  </div>
                  <button onClick={() => copyCode(newCode)} className="text-white/30 hover:text-white/70 transition-colors">
                    {copied === newCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>

                {addError && (
                  <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
                    {addError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowNew(false); setAddError(""); }}
                  className="flex-1 py-3 rounded-full border border-white/15 text-white/50 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="flex-1 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-sm py-3 rounded-full transition-all"
                >
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

                    {/* Status + code */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusColors[client.status]}`}>
                        {client.status}
                      </span>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                        <span className="text-[#c9a84c] font-mono text-xs tracking-widest">
                          {client.access_code}
                        </span>
                        <button onClick={() => copyCode(client.access_code)} className="text-white/20 hover:text-white/60 transition-colors">
                          {copied === client.access_code ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Project progress */}
                  {project && (
                    <div className="mt-5 pt-4 border-t border-white/8">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white/40 text-xs uppercase tracking-wide">
                          {project.name}
                        </span>
                        <span className="text-[#c9a84c] text-xs font-bold">
                          {project.progress_percent}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#c9a84c] rounded-full transition-all duration-300"
                            style={{ width: `${project.progress_percent}%` }}
                          />
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={project.progress_percent}
                          onChange={(e) => handleProgressChange(client.id, project.id, Number(e.target.value))}
                          onMouseUp={(e) => updateProgress(project.id, Number((e.target as HTMLInputElement).value), project.days_remaining)}
                          onTouchEnd={(e) => updateProgress(project.id, Number((e.target as HTMLInputElement).value), project.days_remaining)}
                          className="w-32 accent-[#c9a84c]"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-white/30 text-xs">Days remaining:</label>
                        <input
                          type="number"
                          min={0}
                          value={project.days_remaining}
                          onChange={(e) => handleDaysChange(client.id, project.id, Number(e.target.value))}
                          onBlur={(e) => updateProgress(project.id, project.progress_percent, Number(e.target.value))}
                          className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none focus:border-[#c9a84c]/60"
                        />
                        {saving === project.id && (
                          <span className="text-white/30 text-xs">Saving...</span>
                        )}
                      </div>
                    </div>
                  )}

                  {!project && (
                    <div className="mt-4 pt-4 border-t border-white/8">
                      <p className="text-white/20 text-xs">No project assigned yet.</p>
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
