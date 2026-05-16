import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createClaudeClient } from "@/lib/claude";
import { generateAndSaveContract, regenerateContractFromText } from "@/lib/contract-generator";

export const maxDuration = 300;

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

const VALID_ACTIONS = ["approve", "decline", "save_draft", "edit_and_approve"];

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contract_id, action, feedback, new_content } = await req.json();

  if (!contract_id || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "contract_id and valid action required" }, { status: 400 });
  }

  const supabase = createServerClient();

  if (action === "approve") {
    const { data, error } = await supabase
      .from("contracts")
      .update({ contract_status: "approved", approved_at: new Date().toISOString() })
      .eq("id", contract_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === "decline") {
    if (!feedback?.trim()) {
      return NextResponse.json({ error: "feedback required for decline" }, { status: 400 });
    }

    // Reset to draft BEFORE calling generateAndSaveContract — its delete targets draft status
    await supabase
      .from("contracts")
      .update({ contract_status: "draft", admin_feedback: feedback.trim() })
      .eq("id", contract_id);

    const { data: contract } = await supabase
      .from("contracts")
      .select("id, onboarding_id, client_id")
      .eq("id", contract_id)
      .single();

    if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

    const { data: onboarding } = await supabase
      .from("onboarding_responses")
      .select("*, clients(name, company, services, service_timeline, contract_months, admin_notes)")
      .eq("id", contract.onboarding_id)
      .single();

    if (!onboarding) return NextResponse.json({ error: "Onboarding not found" }, { status: 404 });

    const claude = createClaudeClient();
    await generateAndSaveContract(
      supabase,
      claude,
      onboarding,
      onboarding.clients,
      contract.onboarding_id,
      feedback.trim()
    );

    return NextResponse.json({ success: true });
  }

  if (action === "save_draft" || action === "edit_and_approve") {
    if (!new_content?.trim()) {
      return NextResponse.json({ error: "new_content required" }, { status: 400 });
    }

    const { data: contract } = await supabase
      .from("contracts")
      .select("id, onboarding_id, client_id, clients(name, company)")
      .eq("id", contract_id)
      .single();

    if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

    await regenerateContractFromText(
      supabase,
      contract_id,
      contract.onboarding_id,
      new_content.trim(),
      contract.clients as unknown as Record<string, unknown> | null
    );

    if (action === "edit_and_approve") {
      await supabase
        .from("contracts")
        .update({ contract_status: "approved", approved_at: new Date().toISOString() })
        .eq("id", contract_id);
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
