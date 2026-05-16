import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createClaudeClient } from "@/lib/claude";
import { generateAndSaveContract } from "@/lib/contract-generator";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { client_id } = await req.json();
  if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const supabase = createServerClient();

  const { data: onboarding } = await supabase
    .from("onboarding_responses")
    .select("*, clients(name, company, services, service_timeline, contract_months, admin_notes)")
    .eq("client_id", client_id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .single();

  if (!onboarding) return NextResponse.json({ error: "No onboarding found for this client" }, { status: 404 });

  const claude = createClaudeClient();
  const result = await generateAndSaveContract(supabase, claude, onboarding, onboarding.clients, onboarding.id);

  return NextResponse.json({ success: true, contract_url: result.contractUrl });
}
