import { redirect } from "next/navigation";
import Link from "next/link";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";
import { FileText } from "lucide-react";
import DashboardClient from "./DashboardClient";

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
    <DashboardClient
      firstName={firstName}
      company={client.company}
      project={project ?? null}
      updates={updates}
    />
  );
}
