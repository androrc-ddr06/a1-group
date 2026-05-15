"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Copy,
  Check,
  Users,
  RefreshCw,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

function generateCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  accessCode: string;
  status: "active" | "pending" | "onboarding";
  progress: number;
  joined: string;
};

const initialClients: Client[] = [
  {
    id: "1",
    name: "Ruben Prado",
    company: "Roosters Rolling Barbecue",
    email: "ruben@roostersrollingbbq.com",
    accessCode: "A1RUBEN8",
    status: "active",
    progress: 65,
    joined: "May 1, 2026",
  },
];

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [showNew, setShowNew] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({
    name: "",
    company: "",
    email: "",
  });
  const [newCode] = useState(generateCode);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleAdd() {
    if (!newClient.name || !newClient.email) return;
    setClients((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        ...newClient,
        accessCode: newCode,
        status: "pending",
        progress: 0,
        joined: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      },
    ]);
    setShowNew(false);
    setNewClient({ name: "", company: "", email: "" });
  }

  function updateProgress(id: string, value: number) {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, progress: value } : c))
    );
  }

  const statusColors: Record<Client["status"], string> = {
    active: "bg-emerald-500/15 text-emerald-400",
    pending: "bg-amber-500/15 text-amber-400",
    onboarding: "bg-blue-500/15 text-blue-400",
  };

  return (
    <div className="min-h-screen bg-[#060e1a] text-white">
      {/* Sidebar + top bar layout */}
      <header className="bg-[#0a1628] border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold">A1</span>
              <span className="text-[#c9a84c] font-extrabold text-xl">▲</span>
            </Link>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-white/50 text-sm font-medium">Admin Panel</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors"
          >
            <ExternalLink size={13} />
            View Site
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold">Clients</h1>
            <p className="text-white/40 text-sm mt-1">
              {clients.length} active client{clients.length !== 1 && "s"}
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
                  { label: "Client Name", key: "name", placeholder: "Ruben Prado" },
                  { label: "Company", key: "company", placeholder: "Roosters BBQ" },
                  { label: "Email", key: "email", placeholder: "client@business.com" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-white/50 text-xs uppercase tracking-wide block mb-1.5">
                      {f.label}
                    </label>
                    <input
                      type={f.key === "email" ? "email" : "text"}
                      value={newClient[f.key as keyof typeof newClient]}
                      onChange={(e) =>
                        setNewClient((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                      placeholder={f.placeholder}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                    />
                  </div>
                ))}

                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-white/40 text-xs uppercase tracking-wide">
                      Generated Access Code
                    </div>
                    <div className="text-[#c9a84c] font-mono font-bold tracking-widest text-lg mt-0.5">
                      {newCode}
                    </div>
                  </div>
                  <button
                    onClick={() => copyCode(newCode)}
                    className="text-white/30 hover:text-white/70 transition-colors"
                  >
                    {copied === newCode ? (
                      <Check size={16} className="text-emerald-400" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNew(false)}
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

        {/* Client table */}
        <div className="space-y-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-[#0a1628] border border-white/10 rounded-2xl p-6"
            >
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
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusColors[client.status]}`}
                  >
                    {client.status}
                  </span>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                    <span className="text-[#c9a84c] font-mono text-xs tracking-widest">
                      {client.accessCode}
                    </span>
                    <button
                      onClick={() => copyCode(client.accessCode)}
                      className="text-white/20 hover:text-white/60 transition-colors"
                    >
                      {copied === client.accessCode ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                  <span className="text-white/20 text-xs hidden lg:block">
                    Since {client.joined}
                  </span>
                </div>
              </div>

              {/* Progress control */}
              <div className="mt-5 pt-4 border-t border-white/8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-xs uppercase tracking-wide">
                    Project Progress
                  </span>
                  <span className="text-[#c9a84c] text-xs font-bold">
                    {client.progress}%
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#c9a84c] rounded-full transition-all duration-300"
                      style={{ width: `${client.progress}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={client.progress}
                    onChange={(e) =>
                      updateProgress(client.id, Number(e.target.value))
                    }
                    className="w-32 accent-[#c9a84c]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
