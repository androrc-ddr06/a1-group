import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { amount_cents, payment_type = "manual" } = await req.json();
  if (!amount_cents) return NextResponse.json({ error: "amount_cents required" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("payments")
    .insert({ client_id: id, amount_cents, status: "paid", payment_type })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payment: data });
}
