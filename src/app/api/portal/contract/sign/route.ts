import { NextRequest, NextResponse } from "next/server";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contract_id } = await req.json();
  if (!contract_id) return NextResponse.json({ error: "contract_id required" }, { status: 400 });

  const admin = createServerClient();

  // Verify contract belongs to this client and is approved
  const { data: client } = await admin
    .from("clients")
    .select("id")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { data: contract } = await admin
    .from("contracts")
    .select("id, contract_status")
    .eq("id", contract_id)
    .eq("client_id", client.id)
    .single();

  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (contract.contract_status !== "approved") {
    return NextResponse.json({ error: "Contract is not yet approved" }, { status: 400 });
  }

  const { error } = await admin
    .from("contracts")
    .update({ contract_status: "signed", signed_at: new Date().toISOString() })
    .eq("id", contract_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
