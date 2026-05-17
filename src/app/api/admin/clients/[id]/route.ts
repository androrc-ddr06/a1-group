import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const supabase = createServerClient();

  if (body.action === "add_asset") {
    const { label, url } = body;
    if (!label?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "label and url required" }, { status: 400 });
    }
    const { error } = await supabase
      .from("client_assets")
      .insert({ client_id: id, label: label.trim(), url: url.trim(), submitted_by: "admin" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete_asset") {
    const { asset_id } = body;
    if (!asset_id) return NextResponse.json({ error: "asset_id required" }, { status: 400 });
    const { error } = await supabase
      .from("client_assets")
      .delete()
      .eq("id", asset_id)
      .eq("client_id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "No recognized action" }, { status: 400 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerClient();

  const [clientRes, tasksRes, callNotesRes, updatesRes, assetsRes] = await Promise.all([
    supabase
      .from("clients")
      .select("*, projects(*), onboarding_responses(*), contracts(*), payments(*)")
      .eq("id", id)
      .single(),
    supabase
      .from("client_tasks")
      .select("*")
      .eq("client_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("call_notes")
      .select("*")
      .eq("client_id", id)
      .single(),
    supabase
      .from("client_updates")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("client_assets")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (clientRes.error || !clientRes.data) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...clientRes.data,
    tasks: tasksRes.data ?? [],
    call_notes: callNotesRes.data ?? null,
    updates: updatesRes.data ?? [],
    client_assets: assetsRes.data ?? [],
  });
}
