import { redirect } from "next/navigation";
import Link from "next/link";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";
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

  const { data: pendingBatches } = await admin
    .from("content_batches")
    .select("id")
    .eq("client_id", resolvedClient.id)
    .eq("status", "pending");

  return {
    client: resolvedClient,
    project,
    updates: updates ?? [],
    hasOnboarded: !!onboarding,
    contract: contract ?? null,
    hasPaid: !!paidPayment,
    pendingContentCount: pendingBatches?.length ?? 0,
  };
}

export default async function ClientDashboard() {
  const data = await getClientData();

  if (!data) {
    redirect("/portal/login");
  }

  const { client, project, updates, hasOnboarded, contract, hasPaid, pendingContentCount } = data;

  // Not yet onboarded — send to onboarding form
  if (!hasOnboarded) {
    redirect("/portal/onboarding");
  }

  const contractPending = !contract || contract.contract_status === "draft" || contract.contract_status === "changes_requested";

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
      pendingContentCount={pendingContentCount}
      contractPending={contractPending}
      contractStatus={contract?.contract_status ?? null}
    />
  );
}
