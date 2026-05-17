import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServerClient();
  const { data: batches } = await supabase
    .from("content_batches")
    .select("*, content_revisions(*)")
    .eq("client_id", id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ batches: batches ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { label, drive_url } = await req.json();
  if (!label?.trim() || !drive_url?.trim()) {
    return NextResponse.json({ error: "label and drive_url are required" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("content_batches")
    .insert({ client_id: id, label: label.trim(), drive_url: drive_url.trim() })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ batch: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { batch_id } = await req.json();
  if (!batch_id) return NextResponse.json({ error: "batch_id required" }, { status: 400 });
  const supabase = createServerClient();
  const { error } = await supabase
    .from("content_batches")
    .delete()
    .eq("id", batch_id)
    .eq("client_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
