import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

function isAdmin(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*, projects(*), onboarding_responses(id, ai_brief_status, ai_brief_url, submitted_at), contracts(id, contract_status, contract_html_url, total_amount, created_at)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, company, email, access_code, services, service_timeline, contract_months, admin_notes } = body;

  if (!name || !email || !access_code) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      company,
      email,
      access_code,
      status: "pending",
      services: services ?? [],
      service_timeline: service_timeline ?? [],
      contract_months: contract_months ?? 1,
      admin_notes: admin_notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { client_id, services, service_timeline, contract_months, admin_notes } = body;

  if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .update({ services, service_timeline, contract_months, admin_notes })
    .eq("id", client_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
