"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Copy, Check, RefreshCw, FileText, ExternalLink,
  CheckSquare, Square, Plus, Trash2, Send, ChevronRight,
} from "lucide-react";

const ADMIN_SECRET = "Familiarc15$";

type OnboardingResponse = {
  id: string;
  ai_brief_status: string;
  ai_brief_url: string | null;
  submitted_at: string;
  company_name: string | null;
  industry: string | null;
  website: string | null;
  description: string | null;
  main_goal: string | null;
  target_audience: string | null;
  top_competitors: string | null;
  brand_colors: string | null;
  font_preferences: string | null;
  monthly_budget: string | null;
  website_purpose: string | null;
  website_pages: string | null;
  website_features: string | null;
  ad_spend_budget: string | null;
  automation_tasks: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  other_socials: string | null;
};

type Contract = {
  id: string;
  contract_status: "draft" | "approved" | "signed" | "changes_requested";
  contract_html_url: string | null;
  total_amount: number;
  payment_split: { upfront_cents: number; on_delivery_cents: number; monthly_cents: number } | null;
  client_feedback: string | null;
  admin_feedback: string | null;
  approved_at: string | null;
  signed_at: string | null;
  created_at: string;
};

type Payment = {
  id: string;
  amount_cents: number;
  status: string;
  payment_type: string;
  created_at: string;
};

type Project = {
  id: string;
  name: string;
  progress_percent: number;
  days_remaining: number;
  start_date: string | null;
  due_date: string | null;
  status: string;
};

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  sort_order: number;
};

type Update = {
  id: string;
  message: string;
  created_at: string;
};

type CallNote = {
  id: string;
  notes: string;
  updated_at: string;
};

type ClientAsset = { id: string; label: string; url: string; submitted_by: string; created_at: string };

type FullClient = {
  id: string;
  name: string;
  company: string;
  email: string;
  access_code: string;
  status: "active" | "pending" | "onboarding";
  services: string[];
  service_timeline: { month: number; service: string; status: "active" | "upcoming" }[];
  contract_months: number;
  admin_notes: string | null;
  created_at: string;
  projects: Project[];
  onboarding_responses: OnboardingResponse[];
  contracts: Contract[];
  payments: Payment[];
  tasks: Task[];
  updates: Update[];
  call_notes: CallNote | null;
  client_assets: ClientAsset[];
};

type ContentRevision = {
  id: string;
  video_title: string;
  description: string;
  image_urls: string[];
  created_at: string;
};

type ContentBatch = {
  id: string;
  label: string;
  drive_url: string;
  status: "pending" | "approved";
  approved_at: string | null;
  created_at: string;
  content_revisions: ContentRevision[];
};

type Tab = "overview" | "brief" | "contract" | "checklist" | "assets" | "content";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-amber-500/15 text-amber-400",
  onboarding: "bg-blue-500/15 text-blue-400",
};

const contractStatusColors: Record<string, string> = {
  draft: "bg-white/10 text-white/40",
  approved: "bg-blue-500/15 text-blue-400",
  signed: "bg-emerald-500/15 text-emerald-400",
  changes_requested: "bg-amber-500/15 text-amber-400",
};

const paymentStatusColors: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-amber-500/15 text-amber-400",
  failed: "bg-red-500/15 text-red-400",
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<FullClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);

  // Brief / call notes
  const [callNotes, setCallNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [generatingChecklist, setGeneratingChecklist] = useState(false);

  // Checklist
  const [addTaskTitle, setAddTaskTitle] = useState("");
  const [addTaskDue, setAddTaskDue] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [togglingTask, setTogglingTask] = useState<string | null>(null);

  // Updates
  const [updateMessage, setUpdateMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [postingUpdate, setPostingUpdate] = useState(false);

  // Assets
  const [assetLabel, setAssetLabel] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [savingAssets, setSavingAssets] = useState(false);

  // Delete
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Content
  const [contentBatches, setContentBatches] = useState<ContentBatch[]>([]);
  const [contentLabel, setContentLabel] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [sendingContent, setSendingContent] = useState(false);

  // Contract
  const [isDraftingContract, setIsDraftingContract] = useState(false);
  const [declineModal, setDeclineModal] = useState(false);
  const [declineFeedback, setDeclineFeedback] = useState("");
  const [declining, setDeclining] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const headers = { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET };

  const fetchClient = useCallback(async () => {
    const res = await fetch(`/api/admin/clients/${id}`, { headers });
    if (!res.ok) { router.push("/admin/clients"); return; }
    const data: FullClient = await res.json();
    setClient(data);
    // Only update callNotes state if we haven't started editing
    return data;
  }, [id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchClient();
      if (data) {
        const notes = data.call_notes?.notes ?? "";
        setCallNotes(notes);
        setNotesSaved(!!data.call_notes);
      }
      setLoading(false);
    })();
  }, [fetchClient]);

  useEffect(() => {
    if (activeTab === "content") fetchContentBatches();
  }, [activeTab]);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    await fetch(`/api/admin/clients/${id}/call-notes`, {
      method: "POST",
      headers,
      body: JSON.stringify({ notes: callNotes }),
    });
    setSavingNotes(false);
    setNotesSaved(true);
  }

  async function handleGenerateChecklist() {
    setGeneratingChecklist(true);
    const res = await fetch(`/api/admin/clients/${id}/checklist/generate`, {
      method: "POST",
      headers,
    });
    if (res.ok) {
      await fetchClient();
      setActiveTab("checklist");
    }
    setGeneratingChecklist(false);
  }

  async function handleToggleTask(taskId: string) {
    setTogglingTask(taskId);
    const res = await fetch(`/api/admin/clients/${id}/tasks`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ action: "toggle", task_id: taskId }),
    });
    if (res.ok) {
      const { tasks } = await res.json();
      setClient((prev) => prev ? { ...prev, tasks } : prev);
      // Refresh to get updated project progress
      fetchClient();
    }
    setTogglingTask(null);
  }

  async function handleAddTask() {
    if (!addTaskTitle.trim()) return;
    setAddingTask(true);
    const res = await fetch(`/api/admin/clients/${id}/tasks`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ action: "add", title: addTaskTitle.trim(), due_date: addTaskDue || undefined }),
    });
    if (res.ok) {
      const { tasks } = await res.json();
      setClient((prev) => prev ? { ...prev, tasks } : prev);
      setAddTaskTitle("");
      setAddTaskDue("");
    }
    setAddingTask(false);
  }

  async function handleDeleteTask(taskId: string) {
    const res = await fetch(`/api/admin/clients/${id}/tasks`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ action: "delete", task_id: taskId }),
    });
    if (res.ok) {
      const { tasks } = await res.json();
      setClient((prev) => prev ? { ...prev, tasks } : prev);
      fetchClient();
    }
  }

  async function handlePostUpdate() {
    if (!updateMessage.trim()) return;
    setPostingUpdate(true);
    const res = await fetch(`/api/admin/clients/${id}/updates`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: updateMessage.trim(), send_email: sendEmail }),
    });
    if (res.ok) {
      setUpdateMessage("");
      setSendEmail(false);
      await fetchClient();
    }
    setPostingUpdate(false);
  }

  async function handleApproveContract(contractId: string) {
    await fetch("/api/admin/contracts", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ contract_id: contractId, action: "approve" }),
    });
    fetchClient();
  }

  async function handleAddAsset() {
    if (!assetLabel.trim() || !assetUrl.trim()) return;
    setSavingAssets(true);
    await fetch(`/api/admin/clients/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ action: "add_asset", label: assetLabel.trim(), url: assetUrl.trim() }),
    });
    setAssetLabel("");
    setAssetUrl("");
    await fetchClient();
    setSavingAssets(false);
  }

  async function fetchContentBatches() {
    const res = await fetch(`/api/admin/clients/${id}/content`, { headers });
    if (res.ok) {
      const { batches } = await res.json();
      setContentBatches(batches);
    }
  }

  async function handleSendContent() {
    if (!contentLabel.trim() || !contentUrl.trim()) return;
    setSendingContent(true);
    const res = await fetch(`/api/admin/clients/${id}/content`, {
      method: "POST",
      headers,
      body: JSON.stringify({ label: contentLabel.trim(), drive_url: contentUrl.trim() }),
    });
    if (res.ok) {
      setContentLabel("");
      setContentUrl("");
      await fetchContentBatches();
    }
    setSendingContent(false);
  }

  async function handleDeleteBatch(batchId: string) {
    await fetch(`/api/admin/clients/${id}/content`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ batch_id: batchId }),
    });
    await fetchContentBatches();
  }

  async function handleDeleteClient() {
    setDeleting(true);
    const res = await fetch(`/api/admin/clients/${id}`, { method: "DELETE", headers });
    if (res.ok) {
      router.push("/admin/clients");
    } else {
      setDeleting(false);
      setDeleteModal(false);
    }
  }

  async function handleDeleteAsset(assetId: string) {
    setSavingAssets(true);
    await fetch(`/api/admin/clients/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ action: "delete_asset", asset_id: assetId }),
    });
    await fetchClient();
    setSavingAssets(false);
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

  async function openEditModal() {
    const contract = client?.contracts?.[0];
    if (!contract?.contract_html_url) return;
    setEditModal(true);
    setEditLoading(true);
    const text = await loadContractText(contract.contract_html_url);
    setEditContent(text);
    setEditLoading(false);
  }

  async function handleEditSave(approveAfter: boolean) {
    const contract = client?.contracts?.[0];
    if (!contract) return;
    setEditSaving(true);
    await fetch("/api/admin/contracts", {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        contract_id: contract.id,
        action: approveAfter ? "edit_and_approve" : "save_draft",
        new_content: editContent,
      }),
    });
    setEditSaving(false);
    setEditModal(false);
    setEditContent("");
    fetchClient();
  }

  async function handleDecline() {
    const contract = client?.contracts?.[0];
    if (!contract || !declineFeedback.trim()) return;
    setDeclining(true);
    const originalContractId = contract.id;
    await fetch("/api/admin/contracts", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ contract_id: originalContractId, action: "decline", feedback: declineFeedback.trim() }),
    });
    setDeclining(false);
    setDeclineModal(false);
    setDeclineFeedback("");
    setIsDraftingContract(true);

    pollingRef.current = setInterval(async () => {
      const res = await fetch(`/api/admin/clients/${id}`, { headers });
      if (!res.ok) return;
      const data: FullClient = await res.json();
      const newContract = data.contracts?.[0];
      if (newContract && newContract.id !== originalContractId) {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setClient(data);
        setIsDraftingContract(false);
      }
    }, 4000);

    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setIsDraftingContract(false);
      fetchClient();
    }, 180000);
  }

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060e1a] flex items-center justify-center">
        <RefreshCw size={28} className="text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  if (!client) return null;

  const contract = client.contracts?.[0] ?? null;
  const project = client.projects?.[0] ?? null;
  const onboarding = client.onboarding_responses?.[0] ?? null;
  const completedTasks = client.tasks.filter((t) => t.completed).length;
  const totalTasks = client.tasks.length;
  const canGenerateChecklist = onboarding && callNotes.trim() && notesSaved;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "brief", label: "Brief & Onboarding" },
    { key: "contract", label: "Contract" },
    { key: "checklist", label: `Checklist${totalTasks > 0 ? ` (${completedTasks}/${totalTasks})` : ""}` },
    { key: "assets", label: `Assets${(client.client_assets?.length ?? 0) > 0 ? ` (${client.client_assets.length})` : ""}` },
    { key: "content", label: `Content${contentBatches.length > 0 ? ` (${contentBatches.length})` : ""}` },
  ];

  return (
    <div className="min-h-screen bg-[#060e1a] text-white">
      {/* Header */}
      <header className="bg-[#0a1628] border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><img src="/logo-dark.svg" alt="A1 Group" className="h-8 w-auto" /></Link>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-white/50 text-sm font-medium">Admin Panel</span>
          </div>
          <Link href="/admin/clients" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
            <ArrowLeft size={14} /> All Clients
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Client header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-[#1b2e4b] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">
              {client.name.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-white">{client.name}</h1>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusColors[client.status] ?? "bg-white/10 text-white/40"}`}>
                {client.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-white/50 text-sm">{client.company}</span>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-white/40 text-sm">{client.email}</span>
              <span className="text-white/20 text-xs">·</span>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5">
                <span className="text-[#c9a84c] font-mono text-xs tracking-widest">{client.access_code}</span>
                <button onClick={() => copyCode(client.access_code)} className="text-white/20 hover:text-white/60 transition-colors">
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-white/10 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-[#c9a84c] text-[#c9a84c]"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client details */}
              <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white/40 text-xs uppercase tracking-wide mb-4">Client Details</h3>
                <div className="space-y-3">
                  {[
                    { label: "Name", value: client.name },
                    { label: "Company", value: client.company },
                    { label: "Email", value: client.email },
                    { label: "Contract", value: `${client.contract_months} month${client.contract_months !== 1 ? "s" : ""}` },
                    { label: "Member since", value: formatDate(client.created_at) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-white/40 text-sm">{label}</span>
                      <span className="text-white text-sm text-right">{value}</span>
                    </div>
                  ))}
                </div>
                {client.admin_notes && (
                  <div className="mt-4 pt-4 border-t border-white/8">
                    <p className="text-white/30 text-xs uppercase tracking-wide mb-1">Admin Notes</p>
                    <p className="text-white/60 text-sm leading-relaxed">{client.admin_notes}</p>
                  </div>
                )}
              </div>

              {/* Project progress */}
              <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white/40 text-xs uppercase tracking-wide mb-4">Project Progress</h3>
                {project ? (
                  <>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">{project.name}</span>
                      <span className="text-[#c9a84c] font-bold">{project.progress_percent}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-[#c9a84c] rounded-full transition-all duration-500"
                        style={{ width: `${project.progress_percent}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-white/30">
                      <span>Started: {formatDate(project.start_date)}</span>
                      <span>Due: {formatDate(project.due_date)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-white/40 text-xs">{project.days_remaining} days remaining</span>
                    </div>
                    {totalTasks > 0 && (
                      <p className="text-white/25 text-xs mt-3">Progress updates automatically as tasks are completed</p>
                    )}
                  </>
                ) : (
                  <p className="text-white/30 text-sm">No project assigned yet.</p>
                )}
              </div>
            </div>

            {/* Services */}
            {client.services?.length > 0 && (
              <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white/40 text-xs uppercase tracking-wide mb-4">Services & Timeline</h3>
                <div className="flex flex-wrap gap-2">
                  {(client.service_timeline ?? []).map((entry) => (
                    <span key={entry.service} className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
                      entry.status === "active"
                        ? "bg-[#c9a84c]/15 text-[#c9a84c] border-[#c9a84c]/30"
                        : "bg-white/5 text-white/30 border-white/10"
                    }`}>
                      Month {entry.month} · {entry.service}
                      {entry.status === "active" && " ✓"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Payments */}
            <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white/40 text-xs uppercase tracking-wide mb-4">Payments</h3>
              {client.payments?.length > 0 ? (
                <div className="space-y-3">
                  {client.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${paymentStatusColors[p.status] ?? "bg-white/10 text-white/40"}`}>
                          {p.status}
                        </span>
                        <span className="text-white/50 text-sm capitalize">{p.payment_type.replace("_", " ")}</span>
                      </div>
                      <span className="text-white font-semibold text-sm">{fmtCents(p.amount_cents)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-sm">No payments recorded yet.</p>
              )}
              {contract?.payment_split && (
                <div className="mt-4 pt-4 border-t border-white/8">
                  <p className="text-white/30 text-xs uppercase tracking-wide mb-2">Contract Payment Split</p>
                  <div className="space-y-1.5">
                    {contract.payment_split.upfront_cents > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Upfront</span>
                        <span className="text-[#c9a84c] font-semibold">{fmtCents(contract.payment_split.upfront_cents)}</span>
                      </div>
                    )}
                    {contract.payment_split.on_delivery_cents > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">On delivery</span>
                        <span className="text-white/70">{fmtCents(contract.payment_split.on_delivery_cents)}</span>
                      </div>
                    )}
                    {contract.payment_split.monthly_cents > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Monthly</span>
                        <span className="text-white/70">{fmtCents(contract.payment_split.monthly_cents)}/mo</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Danger zone */}
            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6">
              <h3 className="text-red-400/70 text-xs uppercase tracking-wide mb-3">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Delete Client</p>
                  <p className="text-white/30 text-xs mt-0.5">Permanently deletes this client and all associated data.</p>
                </div>
                <button
                  onClick={() => setDeleteModal(true)}
                  className="flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold text-sm px-4 py-2 rounded-full transition-all border border-red-500/20"
                >
                  <Trash2 size={14} /> Delete Client
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── BRIEF & ONBOARDING TAB ─── */}
        {activeTab === "brief" && (
          <div className="space-y-6">
            {/* AI Brief */}
            <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white/40 text-xs uppercase tracking-wide mb-4">AI Brief</h3>
              {onboarding?.ai_brief_status === "ready" && onboarding.ai_brief_url ? (
                <a
                  href={`/admin/brief?url=${encodeURIComponent(onboarding.ai_brief_url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#c9a84c]/15 hover:bg-[#c9a84c]/25 text-[#c9a84c] font-semibold text-sm px-4 py-2.5 rounded-full transition-all"
                >
                  <FileText size={14} /> View AI Brief <ExternalLink size={12} />
                </a>
              ) : onboarding?.ai_brief_status === "generating" ? (
                <div className="flex items-center gap-2 text-blue-400 text-sm">
                  <RefreshCw size={14} className="animate-spin" /> Generating brief...
                </div>
              ) : (
                <p className="text-white/30 text-sm">
                  {onboarding ? "Brief not yet generated." : "Client has not submitted their onboarding form yet."}
                </p>
              )}
            </div>

            {/* Onboarding answers */}
            {onboarding && (
              <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white/40 text-xs uppercase tracking-wide mb-4">Onboarding Answers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { label: "Company Name", value: onboarding.company_name },
                    { label: "Industry", value: onboarding.industry },
                    { label: "Website", value: onboarding.website },
                    { label: "Main Goal", value: onboarding.main_goal },
                    { label: "Website Purpose", value: onboarding.website_purpose },
                    { label: "Website Pages", value: onboarding.website_pages },
                    { label: "Website Features", value: onboarding.website_features },
                    { label: "Target Audience", value: onboarding.target_audience },
                    { label: "Top Competitors", value: onboarding.top_competitors },
                    { label: "Brand Colors", value: onboarding.brand_colors },
                    { label: "Font Preferences", value: onboarding.font_preferences },
                    { label: "Monthly Budget", value: onboarding.monthly_budget },
                    { label: "Ad Spend Budget", value: onboarding.ad_spend_budget },
                    { label: "Automation Tasks", value: onboarding.automation_tasks },
                    { label: "Instagram", value: onboarding.instagram },
                    { label: "Facebook", value: onboarding.facebook },
                    { label: "TikTok", value: onboarding.tiktok },
                    { label: "Other Socials", value: onboarding.other_socials },
                    { label: "Description", value: onboarding.description },
                  ]
                    .filter(({ value }) => value)
                    .map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-white/30 text-xs uppercase tracking-wide mb-0.5">{label}</p>
                        <p className="text-white/80 text-sm leading-relaxed">{value}</p>
                      </div>
                    ))}
                </div>
                <p className="text-white/20 text-xs mt-5">Submitted {formatDate(onboarding.submitted_at)}</p>
              </div>
            )}

            {/* Call notes */}
            <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white/40 text-xs uppercase tracking-wide mb-1">Onboarding Call Notes</h3>
              <p className="text-white/30 text-xs mb-4">
                Notes from your kickoff call with the client. These are used to generate the AI task checklist.
              </p>
              <textarea
                rows={6}
                value={callNotes}
                onChange={(e) => { setCallNotes(e.target.value); setNotesSaved(false); }}
                placeholder="e.g. Client wants luxury feel. Discussed $1,500 website with booking system. Hard deadline July 1. Prefers minimal design with gold accents. Very responsive via email..."
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all resize-none mb-4"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-4 py-2.5 rounded-full transition-all disabled:opacity-40"
                >
                  {savingNotes ? <><RefreshCw size={13} className="animate-spin" /> Saving...</> : notesSaved ? <><Check size={13} className="text-emerald-400" /> Saved</> : "Save Notes"}
                </button>

                {canGenerateChecklist && (
                  <button
                    onClick={handleGenerateChecklist}
                    disabled={generatingChecklist}
                    className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-sm px-5 py-2.5 rounded-full transition-all disabled:opacity-50"
                  >
                    {generatingChecklist
                      ? <><RefreshCw size={13} className="animate-spin" /> Generating...</>
                      : <><ChevronRight size={14} /> Generate Checklist with AI</>
                    }
                  </button>
                )}
              </div>
              {!onboarding && (
                <p className="text-amber-400/60 text-xs mt-3">The client must submit their onboarding form before you can generate a checklist.</p>
              )}
              {onboarding && !notesSaved && callNotes.trim() && (
                <p className="text-white/30 text-xs mt-3">Save your notes first to enable checklist generation.</p>
              )}
            </div>
          </div>
        )}

        {/* ─── CONTRACT TAB ─── */}
        {activeTab === "contract" && (
          <div className="space-y-6">
            {isDraftingContract ? (
              <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-8 flex items-center gap-3">
                <RefreshCw size={16} className="text-[#c9a84c] animate-spin" />
                <span className="text-[#c9a84c] font-semibold">Drafting revised contract... This takes about 30 seconds.</span>
              </div>
            ) : !contract ? (
              <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-8 text-center">
                <FileText size={32} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No contract yet for this client.</p>
              </div>
            ) : (
              <>
                {/* Contract status */}
                <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 flex-wrap mb-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${contractStatusColors[contract.contract_status] ?? "bg-white/10 text-white/40"}`}>
                      {contract.contract_status.replace("_", " ")}
                    </span>
                    {contract.contract_html_url && (
                      <a
                        href={`/admin/brief?url=${encodeURIComponent(contract.contract_html_url)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
                      >
                        <FileText size={13} /> View Contract <ExternalLink size={11} />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                    {contract.total_amount > 0 && (
                      <div>
                        <p className="text-white/30 text-xs uppercase tracking-wide mb-0.5">Total</p>
                        <p className="text-white font-semibold">{fmtCents(contract.total_amount)}</p>
                      </div>
                    )}
                    {contract.approved_at && (
                      <div>
                        <p className="text-white/30 text-xs uppercase tracking-wide mb-0.5">Approved</p>
                        <p className="text-white/70">{formatDate(contract.approved_at)}</p>
                      </div>
                    )}
                    {contract.signed_at && (
                      <div>
                        <p className="text-white/30 text-xs uppercase tracking-wide mb-0.5">Signed</p>
                        <p className="text-emerald-400">{formatDate(contract.signed_at)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-white/30 text-xs uppercase tracking-wide mb-0.5">Created</p>
                      <p className="text-white/50">{formatDate(contract.created_at)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {contract.contract_status === "draft" && (
                      <button
                        onClick={() => handleApproveContract(contract.id)}
                        className="text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold px-4 py-2 rounded-full transition-all"
                      >
                        Approve
                      </button>
                    )}
                    {(contract.contract_status === "draft" || contract.contract_status === "changes_requested") && contract.contract_html_url && (
                      <button
                        onClick={openEditModal}
                        className="text-sm bg-white/10 hover:bg-white/20 text-white/60 font-semibold px-4 py-2 rounded-full transition-all"
                      >
                        Edit
                      </button>
                    )}
                    {(contract.contract_status === "draft" || contract.contract_status === "changes_requested") && (
                      <button
                        onClick={() => setDeclineModal(true)}
                        className="text-sm bg-white/10 hover:bg-white/20 text-white/60 font-semibold px-4 py-2 rounded-full transition-all"
                      >
                        Revise with AI
                      </button>
                    )}
                  </div>

                  {/* Client feedback */}
                  {contract.contract_status === "changes_requested" && contract.client_feedback && (
                    <div className="mt-5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                      <p className="text-amber-400 text-xs font-semibold mb-1">Client Feedback</p>
                      <p className="text-amber-300/80 text-sm leading-relaxed">{contract.client_feedback}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── CHECKLIST + UPDATES TAB ─── */}
        {activeTab === "checklist" && (
          <div className="space-y-6">
            {/* Progress summary */}
            {project && totalTasks > 0 && (
              <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/50">Overall Progress</span>
                  <span className="text-[#c9a84c] font-bold">{project.progress_percent}%</span>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#c9a84c] rounded-full transition-all duration-500" style={{ width: `${project.progress_percent}%` }} />
                </div>
                <p className="text-white/25 text-xs mt-2">{completedTasks} of {totalTasks} tasks complete</p>
              </div>
            )}

            {/* Task list */}
            <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-5">Tasks</h3>
              {client.tasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare size={28} className="text-white/15 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">No tasks yet.</p>
                  <button
                    onClick={() => setActiveTab("brief")}
                    className="text-[#c9a84c] text-xs mt-2 hover:underline"
                  >
                    Generate a checklist from the Brief & Onboarding tab →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 mb-5">
                  {client.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${task.completed ? "bg-white/3 opacity-60" : "bg-white/5 hover:bg-white/8"}`}
                    >
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        disabled={togglingTask === task.id}
                        className="flex-shrink-0 text-white/40 hover:text-[#c9a84c] transition-colors disabled:opacity-40"
                      >
                        {togglingTask === task.id
                          ? <RefreshCw size={16} className="animate-spin" />
                          : task.completed
                          ? <CheckSquare size={16} className="text-emerald-400" />
                          : <Square size={16} />
                        }
                      </button>
                      <span className={`flex-1 text-sm ${task.completed ? "line-through text-white/30" : "text-white/80"}`}>
                        {task.title}
                      </span>
                      {task.due_date && (
                        <span className={`text-xs flex-shrink-0 ${task.completed ? "text-white/20" : "text-white/35"}`}>
                          {formatDate(task.due_date)}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="flex-shrink-0 text-white/15 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add task */}
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={addTaskTitle}
                  onChange={(e) => setAddTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Add a task..."
                  className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                />
                <input
                  type="date"
                  value={addTaskDue}
                  onChange={(e) => setAddTaskDue(e.target.value)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-white/60 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                  style={{ colorScheme: "dark" }}
                />
                <button
                  onClick={handleAddTask}
                  disabled={addingTask || !addTaskTitle.trim()}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white/70 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-40"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {/* Post update */}
            <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-1">Post Update to Client</h3>
              <p className="text-white/30 text-xs mb-4">This will appear on {client.name.split(" ")[0]}&apos;s portal dashboard feed.</p>
              <textarea
                rows={4}
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                placeholder="e.g. Your website wireframes are ready for review! We're on track for the July 1 deadline..."
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all resize-none mb-3"
              />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${sendEmail ? "bg-[#c9a84c] border-[#c9a84c]" : "border-white/30 bg-white/5"}`}>
                      {sendEmail && <Check size={10} className="text-[#0a1628]" />}
                    </div>
                  </div>
                  <span className="text-white/50 text-sm">Also send email to {client.email}</span>
                </label>
                <button
                  onClick={handlePostUpdate}
                  disabled={postingUpdate || !updateMessage.trim()}
                  className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-sm px-5 py-2.5 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {postingUpdate ? <><RefreshCw size={13} className="animate-spin" /> Posting...</> : <><Send size={13} /> Post Update</>}
                </button>
              </div>
            </div>

            {/* Updates feed */}
            {client.updates.length > 0 && (
              <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-5">Update History</h3>
                <div className="space-y-4">
                  {client.updates.map((u) => (
                    <div key={u.id} className="flex gap-3 pb-4 border-b border-white/6 last:border-0 last:pb-0">
                      <div className="w-7 h-7 rounded-full bg-[#1b2e4b] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">A1</span>
                      </div>
                      <div>
                        <p className="text-white/70 text-sm leading-relaxed">{u.message}</p>
                        <span className="text-white/25 text-xs mt-1 block">{formatDate(u.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── ASSETS TAB ─── */}
        {activeTab === "assets" && (
          <div className="space-y-6">
            {/* Files from admin to client */}
            <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-1">Files You&apos;ve Shared with {client.name.split(" ")[0]}</h3>
              <p className="text-white/30 text-xs mb-5">These appear on {client.name.split(" ")[0]}&apos;s portal under &quot;Files from A1 Group&quot;.</p>

              {(client.client_assets ?? []).filter((a) => a.submitted_by === "admin").length === 0 ? (
                <p className="text-white/25 text-sm text-center py-4">No files shared yet.</p>
              ) : (
                <div className="space-y-2 mb-5">
                  {client.client_assets.filter((a) => a.submitted_by === "admin").map((asset) => (
                    <div key={asset.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{asset.label}</div>
                        <div className="text-white/30 text-xs truncate">{asset.url}</div>
                      </div>
                      <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-[#c9a84c]/60 hover:text-[#c9a84c] transition-colors flex-shrink-0">
                        <ExternalLink size={13} />
                      </a>
                      <button onClick={() => handleDeleteAsset(asset.id)} disabled={savingAssets} className="text-white/15 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-40">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={assetLabel}
                  onChange={(e) => setAssetLabel(e.target.value)}
                  placeholder="Label (e.g. Website Wireframes)"
                  className="flex-1 min-w-[180px] bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                />
                <input
                  type="url"
                  value={assetUrl}
                  onChange={(e) => setAssetUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddAsset()}
                  placeholder="Google Drive or Dropbox URL"
                  className="flex-1 min-w-[200px] bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                />
                <button
                  onClick={handleAddAsset}
                  disabled={savingAssets || !assetLabel.trim() || !assetUrl.trim()}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white/70 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-40"
                >
                  <Plus size={14} /> Share
                </button>
              </div>
            </div>

            {/* Files from client to admin */}
            <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-1">Files {client.name.split(" ")[0]} Shared with You</h3>
              <p className="text-white/30 text-xs mb-5">Google Drive links the client submitted from their portal.</p>

              {(client.client_assets ?? []).filter((a) => a.submitted_by === "client").length === 0 ? (
                <p className="text-white/25 text-sm text-center py-4">No files shared by client yet.</p>
              ) : (
                <div className="space-y-2">
                  {client.client_assets.filter((a) => a.submitted_by === "client").map((asset) => (
                    <div key={asset.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{asset.label}</div>
                        <div className="text-white/30 text-xs truncate">{asset.url}</div>
                      </div>
                      <a href={asset.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#c9a84c] text-xs font-semibold hover:text-[#d4af61] transition-colors flex-shrink-0">
                        Open <ExternalLink size={11} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── CONTENT TAB ─── */}
        {activeTab === "content" && (
          <div className="space-y-6">
            {/* Send for approval form */}
            <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-1">Send Content for Approval</h3>
              <p className="text-white/30 text-xs mb-5">Paste a Google Drive link with this week&apos;s videos. {client.name.split(" ")[0]} will see it on their portal and can approve or request edits.</p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={contentLabel}
                  onChange={(e) => setContentLabel(e.target.value)}
                  placeholder='e.g. "Week 3 — May Content"'
                  className="flex-1 min-w-[180px] bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                />
                <input
                  type="text"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="flex-1 min-w-[240px] bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all"
                />
                <button
                  onClick={handleSendContent}
                  disabled={sendingContent || !contentLabel.trim() || !contentUrl.trim()}
                  className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] disabled:opacity-50 text-[#0a1628] font-bold text-sm px-5 py-2.5 rounded-full transition-all"
                >
                  {sendingContent ? "Sending…" : "Send for Approval"}
                </button>
              </div>
            </div>

            {/* Batches list */}
            <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white/40 text-xs uppercase tracking-wide mb-4">Sent Batches</h3>
              {contentBatches.length === 0 ? (
                <p className="text-white/25 text-sm text-center py-4">No content batches sent yet.</p>
              ) : (
                <div className="space-y-4">
                  {contentBatches.map((batch) => (
                    <div key={batch.id} className="bg-white/5 border border-white/8 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              batch.status === "approved"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-amber-500/15 text-amber-400"
                            }`}>
                              {batch.status === "approved" ? "Approved" : "Pending"}
                            </span>
                            <span className="text-white/25 text-xs">{formatDate(batch.created_at)}</span>
                          </div>
                          <p className="text-white font-semibold text-sm">{batch.label}</p>
                          <a href={batch.drive_url} target="_blank" rel="noopener noreferrer" className="text-[#c9a84c]/60 hover:text-[#c9a84c] text-xs flex items-center gap-1 mt-0.5 transition-colors">
                            <ExternalLink size={11} /> Drive link
                          </a>
                        </div>
                        <button
                          onClick={() => handleDeleteBatch(batch.id)}
                          className="text-white/15 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Revision requests */}
                      {batch.content_revisions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/8 space-y-3">
                          <p className="text-white/30 text-xs uppercase tracking-wide">
                            {batch.content_revisions.length} revision request{batch.content_revisions.length !== 1 ? "s" : ""}
                          </p>
                          {batch.content_revisions.map((rev) => (
                            <div key={rev.id} className="bg-white/5 rounded-lg p-3">
                              <p className="text-[#c9a84c] text-xs font-semibold mb-1">{rev.video_title}</p>
                              <p className="text-white/60 text-sm leading-relaxed">{rev.description}</p>
                              {rev.image_urls?.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {rev.image_urls.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#c9a84c]/60 hover:text-[#c9a84c] text-xs transition-colors">
                                      <ExternalLink size={10} /> Reference image {i + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                              <p className="text-white/20 text-xs mt-1.5">{formatDate(rev.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── DECLINE MODAL ─── */}
      {declineModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-[#0f2040] border border-white/15 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-2">Revise Contract with AI</h2>
            <p className="text-white/40 text-sm mb-5">
              Describe what to change. The AI will immediately draft a revised contract using your feedback.
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
                onClick={() => { setDeclineModal(false); setDeclineFeedback(""); }}
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
                {declining ? <><RefreshCw size={13} className="animate-spin" /> Submitting...</> : "Submit & Regenerate →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT CONTRACT MODAL ─── */}
      {editModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col">
          <div className="bg-[#0f2040] border-b border-white/15 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-white font-bold text-base">Edit Contract</h2>
              <p className="text-white/40 text-xs mt-0.5">{client.name} — use markdown formatting</p>
            </div>
            <div className="flex items-center gap-4">
              {contract?.contract_html_url && (
                <a
                  href={`/admin/brief?url=${encodeURIComponent(contract.contract_html_url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 hover:text-white/70 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={12} /> Preview Current
                </a>
              )}
              <button onClick={() => { setEditModal(false); setEditContent(""); }} className="text-white/30 hover:text-white/70 text-sm transition-colors">
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

      {/* ─── DELETE CLIENT MODAL ─── */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-[#0f2040] border border-red-500/20 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-2">Delete Client?</h2>
            <p className="text-white/50 text-sm mb-1">
              This will permanently delete <span className="text-white font-semibold">{client.name}</span> and all their data:
            </p>
            <ul className="text-white/30 text-xs space-y-0.5 mb-6 list-disc list-inside">
              <li>Projects, tasks, and progress</li>
              <li>Contracts and payments</li>
              <li>Onboarding responses and AI brief</li>
              <li>Updates and assets</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-full border border-white/15 text-white/50 hover:text-white text-sm font-medium transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-sm py-3 rounded-full transition-all disabled:opacity-40"
              >
                {deleting ? "Deleting..." : "Yes, Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
