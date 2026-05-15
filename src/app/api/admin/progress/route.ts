import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

function isAdmin(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

// PATCH /api/admin/progress — update project progress + days remaining
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { project_id, progress_percent, days_remaining } = body;

  if (!project_id) {
    return NextResponse.json({ error: "project_id required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ progress_percent, days_remaining })
    .eq("id", project_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
