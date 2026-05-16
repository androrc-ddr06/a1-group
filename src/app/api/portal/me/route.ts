import { NextResponse } from "next/server";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";

export async function GET() {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: client } = await admin
    .from("clients")
    .select("id, services, service_timeline, contracts(id, contract_status, contract_html_url, payment_split, client_feedback), payments(id, status, payment_type)")
    .eq("auth_user_id", user.id)
    .single();

  const resolved = client ?? await (async () => {
    const { data } = await admin
      .from("clients")
      .select("id, services, service_timeline, contracts(id, contract_status, contract_html_url, payment_split, client_feedback), payments(id, status, payment_type)")
      .eq("email", user.email)
      .single();
    return data;
  })();

  if (!resolved) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json(resolved);
}
