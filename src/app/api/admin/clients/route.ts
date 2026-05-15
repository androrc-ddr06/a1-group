import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

function isAdmin(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

// GET /api/admin/clients — list all clients with their active project
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*, projects(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(clients);
}

// POST /api/admin/clients — create new client with access code
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, company, email, access_code } = body;

  if (!name || !email || !access_code) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ name, company, email, access_code, status: "pending" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
