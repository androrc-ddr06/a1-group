import { redirect } from "next/navigation";
import Link from "next/link";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";
import {
  TrendingUp,
  FileText,
  MessageSquare,
  FolderOpen,
  Clock,
} from "lucide-react";
import SignOutButton from "./SignOutButton";
import PortalTour from "./PortalTour";

async function getClientData() {
  const supabase = await createSessionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Use service client to query client record by auth user id
  const admin = createServerClient();

  const { data: client } = await admin
    .from("clients")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  // Fallback: match by email (for Ruben whose record predates auth)
  const resolvedClient = client ?? await (async () => {
    const { data } = await admin
      .from("clients")
      .select("*")
      .eq("email", user.email)
      .single();
    return data;
  })();

  if (!resolvedClient) return null;

  const { data: project } = await admin
    .from("projects")
    .select("*")
    .eq("client_id", resolvedClient.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: updates } = await admin
    .from("client_updates")
    .select("*")
    .eq("client_id", resolvedClient.id)
    .order("created_at", { ascending: false });

  const { data: onboarding } = await admin
    .from("onboarding_responses")
    .select("id")
    .eq("client_id", resolvedClient.id)
    .limit(1)
    .single();

  const { data: contract } = await admin
    .from("contracts")
    .select("id, contract_status, contract_html_url, payment_split, client_feedback")
    .eq("client_id", resolvedClient.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: paidPayment } = await admin
    .from("payments")
    .select("id, status")
    .eq("client_id", resolvedClient.id)
    .eq("status", "paid")
    .limit(1)
    .single();

  return {
    client: resolvedClient,
    project,
    updates: updates ?? [],
    hasOnboarded: !!onboarding,
    contract: contract ?? null,
    hasPaid: !!paidPayment,
  };
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ClientDashboard() {
  const data = await getClientData();

  if (!data) {
    redirect("/portal/login");
  }

  const { client, project, updates, hasOnboarded, contract, hasPaid } = data;

  // Not yet onboarded — send to onboarding form
  if (!hasOnboarded) {
    redirect("/portal/onboarding");
  }

  // Onboarded but no contract yet, draft, or changes_requested — show holding page
  if (!contract || contract.contract_status === "draft" || contract.contract_status === "changes_requested") {
    const firstName = client.name.split(" ")[0];
    const isChangesRequested = contract?.contract_status === "changes_requested";
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center mx-auto mb-6">
            <FileText size={28} className="text-[#c9a84c]" />
          </div>
          {isChangesRequested ? (
            <>
              <h1 className="text-2xl font-extrabold text-white mb-3">Revision in Progress</h1>
              <p className="text-white/50 text-sm leading-relaxed">
                Your feedback has been received. Alejandro is preparing a revised contract for you. You&apos;ll get an email once it&apos;s ready to review.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-white mb-3">Got it, {firstName}!</h1>
              <p className="text-white/50 text-sm leading-relaxed mb-3">
                We&apos;ve received your answers and are getting things prepared on our end. Alejandro will reach out within the next 12 hours to schedule a meeting and walk you through next steps.
              </p>
              <p className="text-white/30 text-sm leading-relaxed">
                Once your service agreement is ready, you&apos;ll get an email with a link to review and sign it right here.
              </p>
            </>
          )}
          <p className="text-white/25 text-xs mt-6">Questions? <a href="/#contact" className="text-[#c9a84c] hover:underline">Contact A1 Group</a></p>
        </div>
      </div>
    );
  }

  // Contract approved but not signed
  if (contract.contract_status === "approved") {
    redirect("/portal/contract");
  }

  // Signed but not paid
  if (contract.contract_status === "signed" && !hasPaid) {
    redirect("/portal/payment");
  }

  const firstName = client.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top bar */}
      <header className="bg-[#0a1628] border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/logo-dark.svg" alt="A1 Group" className="h-8 w-auto" />
            </Link>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-white/50 text-sm">Client Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-sm hidden sm:block">
              {client.company}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#0a1628]">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-[#0a1628]/50 text-sm mt-1">{client.company}</p>
        </div>

        {/* Progress card */}
        {project ? (
          <div className="bg-[#0a1628] rounded-2xl p-8 mb-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <span className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest">
                  Active Project
                </span>
                <h2 className="text-xl font-bold mt-1">{project.name}</h2>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 self-start">
                <Clock size={14} className="text-[#c9a84c]" />
                <span className="text-sm font-semibold">
                  {project.days_remaining} days remaining
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-white/50 mb-2">
                <span>Progress</span>
                <span className="font-bold text-white">{project.progress_percent}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c9a84c] rounded-full transition-all duration-700"
                  style={{ width: `${project.progress_percent}%` }}
                />
              </div>
            </div>

            <div className="flex gap-6 text-xs text-white/40 mt-4">
              <span>Started: {formatDate(project.start_date)}</span>
              <span>Due: {formatDate(project.due_date)}</span>
            </div>
          </div>
        ) : (
          <div className="bg-[#0a1628] rounded-2xl p-8 mb-6 text-white text-center">
            <p className="text-white/50">Your project is being set up. Check back soon!</p>
          </div>
        )}

        {/* Quick nav cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: MessageSquare, label: "Updates", href: "#updates", count: updates.length },
            { icon: FolderOpen, label: "My Assets", href: "/portal/assets", count: null },
            { icon: TrendingUp, label: "Reports", href: "/portal/reports", count: null },
            { icon: FileText, label: "Onboarding", href: "/portal/onboarding", count: null },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group bg-white border border-[#0a1628]/8 hover:border-[#0a1628]/20 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md"
            >
              <div className="w-10 h-10 bg-[#f8fafc] group-hover:bg-[#0a1628] rounded-xl flex items-center justify-center transition-colors">
                <item.icon size={18} className="text-[#0a1628] group-hover:text-white transition-colors" />
              </div>
              <div>
                <div className="text-[#0a1628] font-semibold text-sm">{item.label}</div>
                {item.count !== null && (
                  <div className="text-[#0a1628]/40 text-xs mt-0.5">{item.count} updates</div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Updates feed */}
        <div id="updates" className="bg-white border border-[#0a1628]/8 rounded-2xl p-6">
          <h3 className="text-[#0a1628] font-bold text-lg mb-5">
            Latest Updates from A1 Group
          </h3>
          {updates.length === 0 ? (
            <p className="text-[#0a1628]/30 text-sm">No updates yet. We'll post here as work progresses.</p>
          ) : (
            <div className="space-y-4">
              {updates.map((u: { id: string; message: string; created_at: string }) => (
                <div
                  key={u.id}
                  className="flex gap-4 pb-4 border-b border-[#0a1628]/6 last:border-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0a1628] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">A1</span>
                  </div>
                  <div>
                    <p className="text-[#0a1628]/80 text-sm leading-relaxed">{u.message}</p>
                    <span className="text-[#0a1628]/30 text-xs mt-1 block">
                      {formatDate(u.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[#0a1628]/30 text-xs text-center mt-8">
          Questions? Reply to any of our emails or{" "}
          <Link href="/#contact" className="text-[#c9a84c] hover:underline">
            contact us here
          </Link>
          .
        </p>
      </main>
      <PortalTour />
    </div>
  );
}
