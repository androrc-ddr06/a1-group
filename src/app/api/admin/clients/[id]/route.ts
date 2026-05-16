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

  const [clientRes, tasksRes, callNotesRes, updatesRes] = await Promise.all([
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
  ]);

  if (clientRes.error || !clientRes.data) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...clientRes.data,
    tasks: tasksRes.data ?? [],
    call_notes: callNotesRes.data ?? null,
    updates: updatesRes.data ?? [],
  });
}
